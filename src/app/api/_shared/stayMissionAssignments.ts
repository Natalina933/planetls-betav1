import { insertMissionWithOptionalMetadata } from "@/app/api/_shared/missionInsert";
import { cleanString, isRecord, type ReservationRow } from "@/app/api/_shared/reservations";
import { normalizeStayNeed, SERVICE_CODES, type NeedKey } from "@/app/api/_shared/stayNeeds";
import type { LooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { getHousingReferenceId } from "@/app/lib/listingReferences";
import { commercialObjectId } from "@/features/concierge-commercial/server/requestCommercialGuard";
import { agreedServiceSlugs, isContinuousCollaboration } from "./continuousCollaboration.ts";
import { STAY_NEED_SERVICE_SLUGS } from "./stayNeeds.ts";
import { stayOperationTiming } from "./stayOperationTiming.ts";
import { collaborationLifecycle } from "./collaborationLifecycle.ts";

// Canonical vocabulary lives in stayNeeds.ts (shared with stay service requests).
export { normalizeStayNeed };

type CollaborationRow = {
  id: string;
  housing_id: number | string;
  owner_profile_id: string;
  concierge_profile_id: string;
  status: string;
  scope?: Record<string, unknown> | null;
  ends_on?: string | null;
  quote_id?: string | null;
  service_request_id?: string | null;
};
type ContractRow = { id: string; collaboration_id: string };
type ContractVersionRow = {
  id: string;
  contract_id: string;
  status: string;
  version_number?: number | null;
  conditions?: unknown;
};

export type StayMissionAssignmentRow = {
  id: string;
  reservation_id?: string | null;
  title?: string | null;
  status?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: unknown;
};

export type StayMissionAssignmentResult =
  | { ok: true; missions: StayMissionAssignmentRow[]; status: 201 }
  | { ok: false; error: string; status: number };

export function readStayMissionAssignments(body: Record<string, unknown>) {
  const rawAssignments = Array.isArray(body.assignments) ? body.assignments : [];
  return rawAssignments
    .filter(isRecord)
    .map((item) => ({
      need: normalizeStayNeed(item.need ?? item.service ?? item.service_code),
      collaborationId: cleanString(item.collaboration_id),
    }))
    .filter((item): item is { need: NeedKey; collaborationId: string } => Boolean(item.need && item.collaborationId));
}

function defaultAssignmentsFromReservation(reservation: ReservationRow) {
  const metadata = isRecord(reservation.metadata) ? reservation.metadata : {};
  const collaborationId = cleanString(metadata.collaboration_id);
  const actions = Array.isArray(metadata.requested_actions) ? metadata.requested_actions : [];
  if (!collaborationId) return [];

  return actions
    .map((action) => ({ need: normalizeStayNeed(action), collaborationId }))
    .filter((item): item is { need: NeedKey; collaborationId: string } => Boolean(item.need));
}

function explicitNeedsFromReservation(reservation: ReservationRow) {
  const metadata = isRecord(reservation.metadata) ? reservation.metadata : {};
  const actions = Array.isArray(metadata.requested_actions) ? metadata.requested_actions : [];
  return new Set(actions.map(normalizeStayNeed).filter((item): item is NeedKey => Boolean(item)));
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

function missionTiming(reservation: ReservationRow, need: NeedKey) {
  return stayOperationTiming(reservation, need)!;
}

function missionTitle(need: NeedKey) {
  if (need === "checkin") return "Check-in";
  if (need === "checkout") return "Check-out";
  if (need === "cleaning") return "Ménage";
  if (need === "linen") return "Linge";
  return "Courses / préparation";
}

export async function createOrReuseStayMissions(input: {
  db: LooseSupabaseClient;
  reservation: ReservationRow;
  body?: Record<string, unknown>;
}): Promise<StayMissionAssignmentResult> {
  const assignments = readStayMissionAssignments(input.body ?? {});
  const resolvedAssignments = assignments.length > 0 ? assignments : defaultAssignmentsFromReservation(input.reservation);

  if (resolvedAssignments.length === 0) {
    return { ok: false, error: "Aucune prestation exploitable pour ce séjour.", status: 400 };
  }

  const housingId = getHousingReferenceId({
    propertyId: input.reservation.property_id ?? null,
    metadata: input.reservation.metadata ?? null,
  });
  if (!housingId) return { ok: false, error: "Logement de la réservation non résolu.", status: 400 };

  const uniqueCollaborationIds = Array.from(new Set(resolvedAssignments.map((item) => item.collaborationId)));
  const { data: collaborationData, error: collaborationError } = await input.db
    .from("housing_collaborations")
    .select("id,housing_id,owner_profile_id,concierge_profile_id,status,scope,ends_on,quote_id,service_request_id")
    .in("id", uniqueCollaborationIds);

  if (collaborationError) return { ok: false, error: "Impossible de vérifier les collaborations.", status: 500 };

  const collaborations = new Map(((collaborationData ?? []) as CollaborationRow[]).map((item) => [item.id, item]));
  const invalidCollaboration = resolvedAssignments.find((assignment) => {
    const collaboration = collaborations.get(assignment.collaborationId);
    return (
      !collaboration ||
      (collaboration.status !== "active" || !collaborationLifecycle(collaboration).canCreateInterventions) ||
      collaboration.owner_profile_id !== input.reservation.owner_profile_id ||
      collaboration.concierge_profile_id !== input.reservation.concierge_profile_id ||
      String(collaboration.housing_id) !== housingId
    );
  });

  if (invalidCollaboration) {
    return { ok: false, error: "Collaboration active invalide pour ce séjour.", status: 400 };
  }

  const { data: contractData, error: contractError } = await input.db
    .from("services_contracts")
    .select("id,collaboration_id")
    .in("collaboration_id", uniqueCollaborationIds);

  if (contractError) return { ok: false, error: "Impossible de vérifier les contrats.", status: 500 };

  const contracts = new Map(((contractData ?? []) as ContractRow[]).map((item) => [item.collaboration_id, item]));
  const contractIds = Array.from(new Set((contractData ?? []).map((item: ContractRow) => item.id)));

  const { data: versionData, error: versionError } = contractIds.length
    ? await input.db
        .from("services_contract_versions")
        .select("id,contract_id,status,version_number,conditions")
        .in("contract_id", contractIds)
        .in("status", ["signed", "ready_to_sign", "signing"])
    : { data: [], error: null };

  if (versionError) return { ok: false, error: "Impossible de vérifier les conditions contractuelles.", status: 500 };

  const versionByContract = new Map<string, ContractVersionRow>();
  for (const version of (versionData ?? []) as ContractVersionRow[]) {
    const current = versionByContract.get(version.contract_id);
    if (!current || (version.version_number ?? 0) > (current.version_number ?? 0)) {
      versionByContract.set(version.contract_id, version);
    }
  }

  const explicitNeeds = explicitNeedsFromReservation(input.reservation);
  const createdOrReused: StayMissionAssignmentRow[] = [];
  const states = new Map<string, string>();

  for (const assignment of resolvedAssignments) {
    const collaboration = collaborations.get(assignment.collaborationId)!;
    const contract = contracts.get(collaboration.id);
    const version = contract ? versionByContract.get(contract.id) ?? null : null;
    let serviceState = getServiceState(version, assignment.need);
    if (!contract && collaboration.scope?.continuous_collaboration === true) {
      const quoteResult = await input.db.from("quotes").select("id,status,owner_profile_id,concierge_profile_id,service_request_id")
        .eq("id", collaboration.quote_id).maybeSingle();
      const requestResult = await input.db.from("service_requests").select("id,owner_profile_id,requested_services,metadata")
        .eq("id", collaboration.service_request_id).maybeSingle();
      const quote = quoteResult.data;
      const request = requestResult.data;
      if (quoteResult.error || requestResult.error) return { ok: false, error: "Accord commercial indisponible.", status: 500 };
      if (quote?.status === "accepted" && quote.owner_profile_id === collaboration.owner_profile_id
        && quote.concierge_profile_id === collaboration.concierge_profile_id
        && quote.service_request_id === request?.id && request?.owner_profile_id === collaboration.owner_profile_id
        && request?.metadata?.selected_quote_id === quote.id && isContinuousCollaboration(request)
        && agreedServiceSlugs(request).includes(STAY_NEED_SERVICE_SLUGS[assignment.need])
        && Array.isArray(collaboration.scope.operational_service_slugs)
        && collaboration.scope.operational_service_slugs.includes(STAY_NEED_SERVICE_SLUGS[assignment.need])) {
        // Scope alone never grants automatic interventions or signs a contract.
        serviceState = "SUR_DEMANDE";
      }
    }

    if (!serviceIsAllowed(serviceState, assignment.need, explicitNeeds)) {
      return { ok: false, error: `Service ${assignment.need} non autorisé par cette collaboration.`, status: 400 };
    }
    states.set(`${collaboration.id}:${assignment.need}`, serviceState!);
  }

  for (const assignment of resolvedAssignments) {
    const collaboration = collaborations.get(assignment.collaborationId)!;
    const serviceState = states.get(`${collaboration.id}:${assignment.need}`)!;
    if (!collaborationLifecycle(collaboration).canCreateInterventions) {
      return { ok: false, error: "La résiliation de la collaboration a pris effet.", status: 409 };
    }
    const idempotencyKey = `${input.reservation.id}:${assignment.need}:${collaboration.id}`;
    const { data: existing, error: existingError } = await input.db
      .from("missions")
      .select("id,reservation_id,title,status,scheduled_start,scheduled_end,metadata")
      .eq("reservation_id", input.reservation.id)
      .contains("metadata", { stay_assignment_key: idempotencyKey })
      .maybeSingle();
    if (existingError) return { ok: false, error: "Vérification des interventions impossible.", status: 500 };

    if (existing) {
      createdOrReused.push(existing as StayMissionAssignmentRow);
      continue;
    }

    const timing = missionTiming(input.reservation, assignment.need);
    const title = `${missionTitle(assignment.need)} - séjour`;
    const { data, error } = await insertMissionWithOptionalMetadata<StayMissionAssignmentRow>(
      input.db,
      {
        id: commercialObjectId(`stay-intervention:${idempotencyKey}`),
        reservation_id: input.reservation.id,
        concierge_profile_id: collaboration.concierge_profile_id,
        owner_profile_id: input.reservation.owner_profile_id,
        property_id: input.reservation.property_id,
        title,
        description: `Mission ${missionTitle(assignment.need)} créée depuis l'attribution explicite du séjour.`,
        status: "scheduled",
        priority: assignment.need === "checkin" ? "high" : "normal",
        scheduled_start: timing.start,
        scheduled_end: timing.end,
        metadata: {
          reservation_id: input.reservation.id,
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
      ["metadata", "reservation_id"],
    );

    if (error?.code === "23505") {
      const retry = await input.db.from("missions").select("id,reservation_id,title,status,scheduled_start,scheduled_end,metadata")
        .eq("id", commercialObjectId(`stay-intervention:${idempotencyKey}`)).single();
      if (!retry.error && retry.data) { createdOrReused.push(retry.data as StayMissionAssignmentRow); continue; }
    }
    if (error || !data) {
      console.error("[stayMissionAssignments] mission insert error:", error);
      return { ok: false, error: "Création de mission impossible.", status: 500 };
    }

    createdOrReused.push(data);
  }

  return { ok: true, missions: createdOrReused, status: 201 };
}
