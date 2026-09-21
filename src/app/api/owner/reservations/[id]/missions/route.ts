import { NextRequest, NextResponse } from "next/server";
import { insertMissionWithOptionalMetadata } from "@/app/api/_shared/missionInsert";
import { OWNER_RESERVATION_ROLES, cleanString, isRecord, type ReservationRow } from "@/app/api/_shared/reservations";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { getHousingReferenceId } from "@/app/lib/listingReferences";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);

const SERVICE_CODES = {
  checkin: "CHECK_IN",
  checkout: "CHECK_OUT",
  cleaning: "MENAGE",
  linen: "LINGE",
} as const;

type NeedKey = keyof typeof SERVICE_CODES;
type CollaborationRow = {
  id: string;
  housing_id: number | string;
  owner_profile_id: string;
  concierge_profile_id: string;
  status: string;
};
type ContractRow = { id: string; collaboration_id: string };
type ContractVersionRow = {
  id: string;
  contract_id: string;
  status: string;
  version_number?: number | null;
  conditions?: unknown;
};
type MissionRow = {
  id: string;
  reservation_id?: string | null;
  title?: string | null;
  status?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: unknown;
};

function normalizeNeed(value: unknown): NeedKey | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[_\s-]+/g, "");
  if (normalized === "checkin" || normalized === "arrival") return "checkin";
  if (normalized === "checkout" || normalized === "departure") return "checkout";
  if (normalized === "cleaning" || normalized === "menage" || normalized === "ménage") return "cleaning";
  if (normalized === "linen" || normalized === "linge") return "linen";
  return null;
}

function readAssignments(body: Record<string, unknown>) {
  const rawAssignments = Array.isArray(body.assignments) ? body.assignments : [];
  return rawAssignments
    .filter(isRecord)
    .map((item) => ({
      need: normalizeNeed(item.need ?? item.service ?? item.service_code),
      collaborationId: cleanString(item.collaboration_id),
    }))
    .filter((item): item is { need: NeedKey; collaborationId: string } => Boolean(item.need && item.collaborationId));
}

function explicitNeedsFromReservation(reservation: ReservationRow) {
  const metadata = isRecord(reservation.metadata) ? reservation.metadata : {};
  const actions = Array.isArray(metadata.requested_actions) ? metadata.requested_actions : [];
  return new Set(actions.map(normalizeNeed).filter((item): item is NeedKey => Boolean(item)));
}

function getServiceState(version: ContractVersionRow | null, need: NeedKey) {
  const conditions = isRecord(version?.conditions) ? version.conditions : {};
  const services = Array.isArray(conditions.services) ? conditions.services : [];
  const serviceCode = SERVICE_CODES[need];
  const service = services.find((item) => isRecord(item) && item.code === serviceCode);
  return isRecord(service) ? cleanString(service.state) : null;
}

function serviceIsAllowed(state: string | null, need: NeedKey, explicitNeeds: Set<NeedKey>) {
  if (state === "AUTOMATIQUE") return true;
  if (state === "SUR_DEMANDE" && explicitNeeds.has(need)) return true;
  return false;
}

function addMinutes(value: string, minutes: number) {
  return new Date(new Date(value).getTime() + minutes * 60 * 1000).toISOString();
}

function missionTiming(reservation: ReservationRow, need: NeedKey) {
  switch (need) {
    case "checkin":
      return { start: reservation.check_in_at, end: addMinutes(reservation.check_in_at, 45) };
    case "checkout":
      return { start: reservation.check_out_at, end: addMinutes(reservation.check_out_at, 45) };
    case "cleaning":
      return { start: addMinutes(reservation.check_out_at, 60), end: addMinutes(reservation.check_out_at, 180) };
    case "linen":
      return { start: addMinutes(reservation.check_out_at, 90), end: addMinutes(reservation.check_out_at, 150) };
  }
}

function missionTitle(need: NeedKey) {
  if (need === "checkin") return "Check-in";
  if (need === "checkout") return "Check-out";
  if (need === "cleaning") return "Ménage";
  return "Linge";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, OWNER_RESERVATION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const { id } = await params;
    const reservationId = decodeURIComponent(id);
    const body = (await req.json()) as Record<string, unknown>;
    const assignments = readAssignments(body);

    if (assignments.length === 0) {
      return NextResponse.json({ error: "Au moins une attribution explicite est requise." }, { status: 400 });
    }

    const { data: reservationData, error: reservationError } = await dbAny
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle();

    if (reservationError) return NextResponse.json({ error: "Erreur chargement réservation." }, { status: 500 });
    if (!reservationData) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

    const reservation = reservationData as ReservationRow;
    if (role !== "admin" && role !== "super_admin" && reservation.owner_profile_id !== userId) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const housingId = getHousingReferenceId({ propertyId: reservation.property_id ?? null, metadata: reservation.metadata ?? null });
    if (!housingId) return NextResponse.json({ error: "Logement de la réservation non résolu." }, { status: 400 });

    const uniqueCollaborationIds = Array.from(new Set(assignments.map((item) => item.collaborationId)));
    const { data: collaborationData, error: collaborationError } = await dbAny
      .from("housing_collaborations")
      .select("id,housing_id,owner_profile_id,concierge_profile_id,status")
      .in("id", uniqueCollaborationIds);

    if (collaborationError) return NextResponse.json({ error: "Impossible de vérifier les collaborations." }, { status: 500 });

    const collaborations = new Map(((collaborationData ?? []) as CollaborationRow[]).map((item) => [item.id, item]));
    const invalidCollaboration = assignments.find((assignment) => {
      const collaboration = collaborations.get(assignment.collaborationId);
      return (
        !collaboration ||
        collaboration.status !== "active" ||
        collaboration.owner_profile_id !== reservation.owner_profile_id ||
        String(collaboration.housing_id) !== housingId
      );
    });

    if (invalidCollaboration) {
      return NextResponse.json({ error: "Collaboration active invalide pour ce séjour." }, { status: 400 });
    }

    const { data: contractData, error: contractError } = await dbAny
      .from("services_contracts")
      .select("id,collaboration_id")
      .in("collaboration_id", uniqueCollaborationIds);

    if (contractError) return NextResponse.json({ error: "Impossible de vérifier les contrats." }, { status: 500 });

    const contracts = new Map(((contractData ?? []) as ContractRow[]).map((item) => [item.collaboration_id, item]));
    const contractIds = Array.from(new Set((contractData ?? []).map((item: ContractRow) => item.id)));

    const { data: versionData, error: versionError } = contractIds.length
      ? await dbAny
          .from("services_contract_versions")
          .select("id,contract_id,status,version_number,conditions")
          .in("contract_id", contractIds)
          .in("status", ["signed", "ready_to_sign", "signing"])
      : { data: [], error: null };

    if (versionError) return NextResponse.json({ error: "Impossible de vérifier les conditions contractuelles." }, { status: 500 });

    const versionByContract = new Map<string, ContractVersionRow>();
    for (const version of (versionData ?? []) as ContractVersionRow[]) {
      const current = versionByContract.get(version.contract_id);
      if (!current || (version.version_number ?? 0) > (current.version_number ?? 0)) {
        versionByContract.set(version.contract_id, version);
      }
    }

    const explicitNeeds = explicitNeedsFromReservation(reservation);
    const createdOrReused: MissionRow[] = [];

    for (const assignment of assignments) {
      const collaboration = collaborations.get(assignment.collaborationId)!;
      const contract = contracts.get(collaboration.id);
      const version = contract ? versionByContract.get(contract.id) ?? null : null;
      const serviceState = getServiceState(version, assignment.need);

      if (!serviceIsAllowed(serviceState, assignment.need, explicitNeeds)) {
        return NextResponse.json({ error: `Service ${assignment.need} non autorisé par cette collaboration.` }, { status: 400 });
      }

      const idempotencyKey = `${reservation.id}:${assignment.need}:${collaboration.id}`;
      const { data: existing } = await dbAny
        .from("missions")
        .select("id,reservation_id,title,status,scheduled_start,scheduled_end,metadata")
        .eq("reservation_id", reservation.id)
        .contains("metadata", { stay_assignment_key: idempotencyKey })
        .maybeSingle();

      if (existing) {
        createdOrReused.push(existing as MissionRow);
        continue;
      }

      const timing = missionTiming(reservation, assignment.need);
      const title = `${missionTitle(assignment.need)} - séjour`;
      const { data, error } = await insertMissionWithOptionalMetadata<MissionRow>(
        db,
        {
          reservation_id: reservation.id,
          concierge_profile_id: collaboration.concierge_profile_id,
          owner_profile_id: reservation.owner_profile_id,
          property_id: reservation.property_id,
          title,
          description: `Mission ${missionTitle(assignment.need)} créée depuis l'attribution explicite du séjour.`,
          status: "scheduled",
          priority: assignment.need === "checkin" ? "high" : "normal",
          scheduled_start: timing.start,
          scheduled_end: timing.end,
          metadata: {
            reservation_id: reservation.id,
            reservation_step: assignment.need,
            stay_need: assignment.need,
            contract_service_code: SERVICE_CODES[assignment.need],
            contract_service_state: serviceState,
            collaboration_id: collaboration.id,
            stay_assignment_key: idempotencyKey,
            created_from: "owner_explicit_stay_assignment",
            property_housing_id: housingId,
          },
        },
        "id,reservation_id,title,status,scheduled_start,scheduled_end,metadata",
        "id,title,status,scheduled_start,scheduled_end,metadata",
      );

      if (error || !data) {
        console.error("[POST /api/owner/reservations/[id]/missions] mission insert error:", error);
        return NextResponse.json({ error: "Création de mission impossible." }, { status: 500 });
      }

      createdOrReused.push(data);
    }

    return NextResponse.json({ reservation_id: reservation.id, missions: createdOrReused }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/owner/reservations/[id]/missions] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
