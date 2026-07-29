import { NextRequest, NextResponse } from "next/server";
import {
  cleanString,
  CONCIERGE_RESERVATION_ROLES,
  getReservationMissionKey,
  isRecord,
  profileDisplayName,
  reservationToTravelerStay,
  type ProfileMini,
  type PropertyMini,
  type ReservationRow,
} from "@/app/api/_shared/reservations";
import { insertMissionWithOptionalMetadata } from "@/app/api/_shared/missionInsert";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import type { TravelerStayMissionRow } from "@/app/lib/travelerStaySupabase";
import { buildReservationWorkflow, type ReservationWorkflowInput } from "@/app/lib/reservationPlanningEngine";
import { requireApiRole } from "@/server/auth/roleGuards";

const RESERVATION_ROLES = CONCIERGE_RESERVATION_ROLES;
const dbAny = asLooseSupabaseClient(db);
const isUuidLike = (value: string | null | undefined): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function toIsoString(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toPositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

type MissionInsertRow = {
  id: string;
  reservation_id?: string | null;
  title: string | null;
  status: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata?: unknown;
};

type MissionWorkflowRow = {
  id: string;
  reservation_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  amount?: number | null;
  currency?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

function isMissingMissionReservationIdColumn(error: { code?: string; message?: string; details?: string } | null) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    (error?.code === "PGRST204" || error?.code === "42703" || message.includes("could not find") || message.includes("column")) &&
    message.includes("reservation_id")
  );
}

async function loadWorkflowMissions(userId: string, role: string, limit: number) {
  const selectWithReservationId =
    "id, reservation_id, title, description, status, priority, amount, currency, concierge_profile_id, owner_profile_id, property_id, metadata, created_at, updated_at, scheduled_start, scheduled_end";
  const selectWithoutReservationId =
    "id, title, description, status, priority, amount, currency, concierge_profile_id, owner_profile_id, property_id, metadata, created_at, updated_at, scheduled_start, scheduled_end";

  const run = async (includeReservationId: boolean) => {
    let query = dbAny
      .from("missions")
      .select(includeReservationId ? selectWithReservationId : selectWithoutReservationId)
      .contains("metadata", { reservation_workflow: true })
      .order("scheduled_start", { ascending: true })
      .limit(Math.max(limit * 4, 120));

    if (role !== "admin" && role !== "super_admin") {
      query = query.eq("concierge_profile_id", userId);
    }

    return query;
  };

  const firstAttempt = await run(true);
  if (isMissingMissionReservationIdColumn(firstAttempt.error)) {
    const fallback = await run(false);
    return { data: (fallback.data ?? []) as MissionWorkflowRow[], error: fallback.error };
  }

  return { data: (firstAttempt.data ?? []) as MissionWorkflowRow[], error: firstAttempt.error };
}

function missionStatusFromPlan(status: string) {
  if (status === "assigned") return "assigned";
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "canceled") return "canceled";
  return "scheduled";
}

function toReservationInput(body: Record<string, unknown>, conciergeProfileId: string): ReservationWorkflowInput {
  const reservation = typeof body.reservation === "object" && body.reservation !== null
    ? (body.reservation as Record<string, unknown>)
    : body;

  return {
    reservationId: typeof reservation.reservation_id === "string" ? reservation.reservation_id : undefined,
    propertyId: typeof reservation.property_id === "string" ? reservation.property_id : null,
    propertyLabel: typeof reservation.property_label === "string" ? reservation.property_label : null,
    ownerProfileId: typeof reservation.owner_profile_id === "string" ? reservation.owner_profile_id : null,
    conciergeProfileId,
    guestName: typeof reservation.guest_name === "string" ? reservation.guest_name : null,
    checkIn: String(reservation.check_in ?? reservation.checkIn ?? ""),
    checkOut: String(reservation.check_out ?? reservation.checkOut ?? ""),
    currency: typeof reservation.currency === "string" ? reservation.currency : "EUR",
    accommodationAmount: typeof reservation.accommodation_amount === "number" ? reservation.accommodation_amount : null,
    cleaningAmount: typeof reservation.cleaning_amount === "number" ? reservation.cleaning_amount : null,
    maintenanceRequested: Boolean(reservation.maintenance_requested),
    source: typeof body.source === "string" ? body.source : "api_concierge_reservations",
  };
}

async function ensureCanonicalReservation(input: {
  body: Record<string, unknown>;
  conciergeProfileId: string;
  role: string;
}) {
  const payload = isRecord(input.body.reservation) ? input.body.reservation : input.body;
  const reservationId = cleanString(payload.reservation_id);
  const ownerProfileId = cleanString(payload.owner_profile_id);
  const propertyId = cleanString(payload.property_id);
  const propertyLabel = cleanString(payload.property_label);
  const checkInAt = toIsoString(payload.check_in_at ?? payload.check_in ?? payload.checkIn);
  const checkOutAt = toIsoString(payload.check_out_at ?? payload.check_out ?? payload.checkOut);

  if (reservationId) {
    const { data, error } = await dbAny.from("reservations").select("*").eq("id", reservationId).maybeSingle();
    if (error) return { reservation: null, error: "Erreur chargement réservation.", created: false };
    if (!data) return { reservation: null, error: "Réservation introuvable.", created: false };
    const reservation = data as ReservationRow;
    if (
      input.role !== "admin" &&
      input.role !== "super_admin" &&
      reservation.concierge_profile_id !== input.conciergeProfileId
    ) {
      return { reservation: null, error: "Cette réservation n'est pas rattachée à votre conciergerie.", created: false };
    }
    return { reservation, error: null, created: false };
  }

  if (!ownerProfileId || !checkInAt || !checkOutAt) {
    return {
      reservation: null,
      error: "owner_profile_id, check_in et check_out sont requis pour créer une réservation canonique.",
      created: false,
    };
  }

  if (new Date(checkOutAt).getTime() <= new Date(checkInAt).getTime()) {
    return { reservation: null, error: "La date de départ doit être postérieure à la date d'arrivée.", created: false };
  }

  if (input.role !== "admin" && input.role !== "super_admin") {
    const { data: collaboration, error: collaborationError } = await dbAny
      .from("concierge_owner_matches")
      .select("id")
      .eq("concierge_profile_id", input.conciergeProfileId)
      .eq("owner_profile_id", ownerProfileId)
      .in("match_status", ["new", "contacted"])
      .limit(1)
      .maybeSingle();

    if (collaborationError) return { reservation: null, error: "Impossible de vérifier la collaboration active.", created: false };
    if (!collaboration) {
      return { reservation: null, error: "Aucune collaboration active entre ce propriétaire et cette conciergerie.", created: false };
    }
  }

  const metadata = isRecord(payload.metadata) ? payload.metadata : {};
  const guestName = cleanString(payload.guest_name);
  const nameParts = guestName ? guestName.split(/\s+/).filter(Boolean) : [];
  const insertPayload = {
    owner_profile_id: ownerProfileId,
    concierge_profile_id: input.conciergeProfileId,
    property_id: isUuidLike(propertyId) ? propertyId : null,
    source: cleanString(input.body.source) ?? "api_concierge_reservations",
    external_reference: cleanString(payload.external_reference),
    channel: cleanString(payload.channel),
    traveler_first_name: cleanString(payload.traveler_first_name ?? payload.first_name) ?? nameParts[0] ?? null,
    traveler_last_name:
      cleanString(payload.traveler_last_name ?? payload.last_name) ?? (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null),
    traveler_phone: cleanString(payload.traveler_phone ?? payload.phone),
    traveler_email: cleanString(payload.traveler_email ?? payload.email),
    guest_count: toPositiveInteger(payload.guest_count),
    adults_count: toPositiveInteger(payload.adults_count ?? payload.guest_adults),
    children_count: toPositiveInteger(payload.children_count ?? payload.guest_children),
    infants_count: toPositiveInteger(payload.infants_count ?? payload.guest_baby_count),
    pets_count: toPositiveInteger(payload.pets_count ?? payload.guest_pets),
    check_in_at: checkInAt,
    check_out_at: checkOutAt,
    arrival_time_window: cleanString(payload.arrival_time_window),
    departure_time_window: cleanString(payload.departure_time_window),
    access_instructions: cleanString(payload.access_instructions),
    owner_notes: cleanString(payload.owner_notes ?? payload.notes),
    concierge_notes: cleanString(payload.concierge_notes),
    status: cleanString(payload.status) ?? "scheduled",
    created_by_profile_id: input.conciergeProfileId,
    metadata: {
      ...metadata,
      property_label: propertyLabel ?? cleanString(metadata.property_label),
      guest_name: guestName ?? cleanString(metadata.guest_name),
      created_from: "concierge_reservation_workflow",
    },
  };

  const { data, error } = await dbAny.from("reservations").insert(insertPayload).select("*").single();
  if (error || !data) {
    console.error("[POST /api/concierge/reservations] reservation insert error:", error);
    return { reservation: null, error: "Création de réservation impossible.", created: false };
  }

  return { reservation: data as ReservationRow, error: null, created: true };
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, RESERVATION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "80");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 80;

    let reservationQuery = dbAny.from("reservations").select("*").order("check_in_at", { ascending: true }).limit(limit);
    if (role !== "admin" && role !== "super_admin") {
      reservationQuery = reservationQuery.eq("concierge_profile_id", userId);
    }

    const [{ data: reservationData, error: reservationError }, { data: missionData, error: missionError }] = await Promise.all([
      reservationQuery,
      loadWorkflowMissions(userId, role, limit),
    ]);

    if (reservationError || missionError) {
      console.error("[GET /api/concierge/reservations] DB error:", reservationError ?? missionError);
      return NextResponse.json({ error: "Erreur chargement reservations" }, { status: 500 });
    }

    const reservations = (reservationData ?? []) as ReservationRow[];
    const missions = (missionData ?? []) as TravelerStayMissionRow[];
    const reservationIds = new Set(reservations.map((item) => item.id));
    const missionsByReservationId = new Map<string, TravelerStayMissionRow[]>();

    for (const mission of missions) {
      const reservationId = getReservationMissionKey(mission);
      if (!reservationId || !reservationIds.has(reservationId)) continue;
      missionsByReservationId.set(reservationId, [...(missionsByReservationId.get(reservationId) ?? []), mission]);
    }

    const profileIds = Array.from(
      new Set(reservations.flatMap((item) => [item.owner_profile_id, item.concierge_profile_id]).filter(Boolean)),
    );
    const propertyIds = Array.from(new Set(reservations.map((item) => item.property_id).filter(Boolean)));

    const [{ data: profiles }, { data: properties }] = await Promise.all([
      profileIds.length
        ? dbAny.from("profiles").select("id,first_name,last_name,company_name,username,email").in("id", profileIds)
        : Promise.resolve({ data: [] }),
      propertyIds.length
        ? dbAny.from("properties").select("id,name,city").in("id", propertyIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map<string, ProfileMini>(((profiles ?? []) as ProfileMini[]).map((item) => [item.id, item]));
    const propertyMap = new Map<string, PropertyMini>(((properties ?? []) as PropertyMini[]).map((item) => [item.id, item]));

    return NextResponse.json({
      workflows: reservations.map((reservation) => {
        const reservationMissions = missionsByReservationId.get(reservation.id) ?? [];
        const ownerName = profileDisplayName(profileMap.get(reservation.owner_profile_id), "Propriétaire");
        const conciergeName = profileDisplayName(profileMap.get(reservation.concierge_profile_id), "Conciergerie");
        const propertyLabel = reservation.property_id
          ? cleanString(propertyMap.get(reservation.property_id)?.name) ?? "Logement à renseigner"
          : cleanString(reservation.metadata?.property_label) ?? "Logement à renseigner";

        return {
          id: reservation.id,
          reservation: {
            ...reservation,
            owner_name: ownerName,
            concierge_name: conciergeName,
            property_label: propertyLabel,
          },
          stay: reservationToTravelerStay({
            reservation,
            ownerName,
            propertyLabel,
            missions: reservationMissions,
          }),
          missions: reservationMissions,
          status: cleanString(reservation.status) ?? "shared",
        };
      }),
    });
  } catch (error) {
    console.error("[GET /api/concierge/reservations] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, RESERVATION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const body = (await req.json()) as Record<string, unknown>;
    const canonicalReservation = await ensureCanonicalReservation({ body, conciergeProfileId: userId, role });
    if (canonicalReservation.error || !canonicalReservation.reservation) {
      return NextResponse.json({ error: canonicalReservation.error ?? "Réservation invalide." }, { status: 400 });
    }

    if (canonicalReservation.created) {
      await recordWorkflowEvent(dbAny, {
        actorProfileId: userId,
        ownerProfileId: canonicalReservation.reservation.owner_profile_id,
        conciergeProfileId: canonicalReservation.reservation.concierge_profile_id,
        reservationId: canonicalReservation.reservation.id,
        eventType: "reservation_created",
        title: "Reservation creee par la conciergerie",
        body: "La conciergerie a enregistre un nouveau sejour canonique partage.",
        metadata: {
          source: cleanString(body.source) ?? "api_concierge_reservations",
        },
      });
    }

    const workflow = buildReservationWorkflow(
      toReservationInput(
        {
          ...body,
          reservation: {
            ...(isRecord(body.reservation) ? body.reservation : body),
            reservation_id: canonicalReservation.reservation.id,
            owner_profile_id: canonicalReservation.reservation.owner_profile_id,
            property_id: canonicalReservation.reservation.property_id,
            property_label:
              cleanString(canonicalReservation.reservation.metadata?.property_label) ??
              cleanString((isRecord(body.reservation) ? body.reservation : body).property_label),
            check_in: canonicalReservation.reservation.check_in_at,
            check_out: canonicalReservation.reservation.check_out_at,
          },
        },
        userId,
      ),
    );
    const createdMissions: MissionInsertRow[] = [];

    for (const plan of workflow.missionPlans) {
      const { data, error } = await insertMissionWithOptionalMetadata<MissionInsertRow>(
        db,
        {
          concierge_profile_id: workflow.reservation.conciergeProfileId,
          owner_profile_id: workflow.reservation.ownerProfileId,
          property_id: isUuidLike(workflow.reservation.propertyId) ? workflow.reservation.propertyId : null,
          reservation_id: workflow.reservation.id,
          title: plan.title,
          description: plan.description,
          status: missionStatusFromPlan(plan.status),
          priority: plan.priority,
          amount: plan.amount,
          currency: plan.currency,
          scheduled_start: plan.scheduledStart,
          scheduled_end: plan.scheduledEnd,
          metadata: {
            ...plan.metadata,
            property_housing_id: !isUuidLike(workflow.reservation.propertyId) ? workflow.reservation.propertyId : null,
            assigned_profile_id: plan.assignedProfileId,
          },
        },
        "id, reservation_id, title, status, scheduled_start, scheduled_end, metadata",
        "id, title, status, scheduled_start, scheduled_end, metadata",
      );

      if (error || !data) {
        console.error("[POST /api/concierge/reservations] mission insert error:", error);
        return NextResponse.json(
          { error: "Creation partielle impossible", created_missions: createdMissions, details: error?.message },
          { status: 500 },
        );
      }
      createdMissions.push(data);

      await dbAny.from("mission_events").insert({
        mission_id: data.id,
        actor_profile_id: userId,
        event_type: "reservation_step_created",
        payload: {
          reservation_id: workflow.reservation.id,
          reservation_workflow_id: workflow.id,
          reservation_step: plan.stepId,
        },
      });
    }

    const billingMission = createdMissions.find((mission) => {
      const metadata = mission.metadata && typeof mission.metadata === "object" ? mission.metadata as Record<string, unknown> : {};
      return metadata.reservation_step === "billing";
    });

    const invoiceNumber = `RES-${workflow.id.slice(0, 12).toUpperCase()}-${Date.now().toString().slice(-5)}`;
    const { data: invoice, error: invoiceError } = await dbAny
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        concierge_profile_id: workflow.reservation.conciergeProfileId,
        owner_profile_id: workflow.reservation.ownerProfileId,
        mission_id: billingMission?.id ?? createdMissions[0]?.id ?? null,
        status: workflow.invoicePlan.status,
        issue_date: workflow.invoicePlan.issueDate,
        due_date: workflow.invoicePlan.dueDate,
        currency: workflow.invoicePlan.currency,
        subtotal: workflow.invoicePlan.subtotal,
        total_amount: workflow.invoicePlan.totalAmount,
        balance_amount: workflow.invoicePlan.balanceAmount,
        metadata: {
          ...workflow.invoicePlan.metadata,
          mission_ids: createdMissions.map((mission) => mission.id),
        },
      })
      .select("id, invoice_number, status, total_amount, balance_amount, metadata")
      .single();

    if (invoiceError) {
      console.error("[POST /api/concierge/reservations] invoice insert error:", invoiceError);
    }

    return NextResponse.json(
      { reservation: canonicalReservation.reservation, workflow, missions: createdMissions, invoice: invoice ?? null },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[POST /api/concierge/reservations] ERROR:", error);
    return NextResponse.json({ error: message }, { status: message.includes("invalide") ? 400 : 500 });
  }
}
