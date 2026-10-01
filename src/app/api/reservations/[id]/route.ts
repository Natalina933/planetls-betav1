import { NextRequest, NextResponse } from "next/server";
import {
  RESERVATION_PARTICIPANT_ROLES,
  cleanString,
  isRecord,
  profileDisplayName,
  reservationToTravelerStay,
  type ProfileMini,
  type PropertyMini,
  type ReservationRow,
} from "@/app/api/_shared/reservations";
import {
  buildReservationScheduleChangeSet,
  identifyImpactedStayMissions,
  type ImpactedStayMission,
  type LinkedStayMissionLike,
  type ReservationScheduleChange,
  type StayMissionStep,
} from "@/app/api/_shared/reservationScheduleChanges";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { createOrReuseStayMissions, type StayMissionAssignmentRow } from "@/app/api/_shared/stayMissionAssignments";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import type { TravelerStayMissionRow } from "@/app/lib/travelerStaySupabase";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const MISSING_WORKFLOW_EVENTS_CODES = new Set(["42P01", "PGRST204", "PGRST205"]);

type WorkflowEventRow = {
  id: string;
  actor_profile_id?: string | null;
  reservation_id?: string | null;
  mission_id?: string | null;
  quote_id?: string | null;
  service_request_id?: string | null;
  event_type?: string | null;
  title?: string | null;
  body?: string | null;
  action_href?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type MissionEventRow = {
  id: string;
  mission_id?: string | null;
  payload?: Record<string, unknown> | null;
};

type ReservationTimelineItem = {
  id: string;
  source: "reservation" | "workflow";
  created_at: string | null;
  event_type: string;
  title: string;
  body: string | null;
  action_href: string | null;
  actor_profile_id: string | null;
  mission_id: string | null;
  quote_id: string | null;
  service_request_id: string | null;
  metadata: Record<string, unknown>;
};

function canManageAsOwner(role: string) {
  return role === "owner" || role === "owner_pro" || role === "admin" || role === "super_admin";
}

function canManageAsConcierge(role: string) {
  return role === "concierge" || role === "concierge_pro" || role === "admin" || role === "super_admin";
}

function isMissingWorkflowEventsSource(error: { code?: string; message?: string; details?: string } | null) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return MISSING_WORKFLOW_EVENTS_CODES.has(error?.code ?? "") || message.includes("workflow_events");
}

function timelineEventFromWorkflow(row: WorkflowEventRow): ReservationTimelineItem {
  return {
    id: row.id,
    source: "workflow",
    created_at: row.created_at ?? null,
    event_type: cleanString(row.event_type) ?? "workflow_event",
    title: cleanString(row.title) ?? "Evenement reservation",
    body: cleanString(row.body),
    action_href: cleanString(row.action_href),
    actor_profile_id: cleanString(row.actor_profile_id),
    mission_id: cleanString(row.mission_id),
    quote_id: cleanString(row.quote_id),
    service_request_id: cleanString(row.service_request_id),
    metadata: isRecord(row.metadata) ? row.metadata : {},
  };
}

function buildReservationSyntheticTimeline(reservation: ReservationRow): ReservationTimelineItem[] {
  const items: ReservationTimelineItem[] = [];

  if (reservation.created_at) {
    items.push({
      id: `reservation-created-${reservation.id}`,
      source: "reservation",
      created_at: reservation.created_at,
      event_type: "reservation_created",
      title: "Reservation creee",
      body: "Le sejour partage a ete enregistre dans la reservation canonique.",
      action_href: null,
      actor_profile_id: cleanString(reservation.created_by_profile_id),
      mission_id: null,
      quote_id: null,
      service_request_id: null,
      metadata: {},
    });
  }

  if (reservation.acknowledged_at) {
    items.push({
      id: `reservation-acknowledged-${reservation.id}`,
      source: "reservation",
      created_at: reservation.acknowledged_at,
      event_type: "reservation_acknowledged",
      title: "Reservation accusee reception",
      body: "La conciergerie a confirme la prise en charge du sejour.",
      action_href: null,
      actor_profile_id: null,
      mission_id: null,
      quote_id: null,
      service_request_id: null,
      metadata: {},
    });
  }

  if (reservation.completed_at) {
    items.push({
      id: `reservation-completed-${reservation.id}`,
      source: "reservation",
      created_at: reservation.completed_at,
      event_type: "reservation_completed",
      title: "Sejour termine",
      body: "La reservation partagee a ete marquee comme terminee.",
      action_href: null,
      actor_profile_id: null,
      mission_id: null,
      quote_id: null,
      service_request_id: null,
      metadata: {},
    });
  }

  if (reservation.canceled_at) {
    items.push({
      id: `reservation-canceled-${reservation.id}`,
      source: "reservation",
      created_at: reservation.canceled_at,
      event_type: "reservation_canceled",
      title: "Reservation annulee",
      body: "Le sejour partage a ete annule.",
      action_href: null,
      actor_profile_id: null,
      mission_id: null,
      quote_id: null,
      service_request_id: null,
      metadata: {},
    });
  }

  return items;
}

function dedupeTimeline(items: ReservationTimelineItem[]) {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = `${item.event_type}:${item.created_at ?? "na"}:${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

function hasOwnPatchField(patch: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

const CANCELABLE_MISSION_STATUSES = new Set([
  "draft",
  "assigned",
  "to_schedule",
  "date_requested",
  "date_proposed",
  "date_confirmed",
  "scheduled",
  "accepted",
  "in_progress",
  "awaiting_owner_validation",
]);

function missionCanBeCanceled(status: unknown) {
  return typeof status === "string" && CANCELABLE_MISSION_STATUSES.has(status.trim().toLowerCase());
}

function missionWasCanceledFromReservation(mission: { status?: string | null; metadata?: unknown }, reservationId: string) {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  return (
    cleanString(mission.status) === "canceled" &&
    metadata.canceled_from_reservation === true &&
    (cleanString(metadata.reservation_id) === reservationId || cleanString(metadata.reservation_workflow_id) === reservationId)
  );
}

async function cancelLinkedReservationMissions(input: {
  reservationId: string;
  actorProfileId: string;
  reason: string | null;
}) {
  const loadLinkedMissions = async (useReservationLink: boolean) =>
    dbAny
      .from("missions")
      .select(
        useReservationLink
          ? "id,reservation_id,status,metadata"
          : "id,status,metadata",
      )
      .or(
        useReservationLink
          ? `reservation_id.eq.${input.reservationId},metadata->>reservation_id.eq.${input.reservationId},metadata->>reservation_workflow_id.eq.${input.reservationId}`
          : `metadata->>reservation_id.eq.${input.reservationId},metadata->>reservation_workflow_id.eq.${input.reservationId}`,
      );

  const isMissingReservationLinkColumn = (error: { code?: string; message?: string; details?: string } | null) => {
    const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
    return (
      (error?.code === "PGRST204" || error?.code === "42703" || message.includes("could not find") || message.includes("column")) &&
      message.includes("reservation_id")
    );
  };

  const firstAttempt = await loadLinkedMissions(true);
  const missionResult = isMissingReservationLinkColumn(firstAttempt.error) ? await loadLinkedMissions(false) : firstAttempt;
  if (missionResult.error) return { ok: false, error: missionResult.error, canceled: [], preserved: [], reconciledEvents: [] };

  const missions = ((missionResult.data ?? []) as Array<{ id: string; status?: string | null; metadata?: unknown }>);
  const cancelable = missions.filter((mission) => missionCanBeCanceled(mission.status));
  const preserved = missions.filter((mission) => !missionCanBeCanceled(mission.status));
  const canceled: Array<{ id: string; previous_status: string | null }> = [];
  const reconciledEvents: string[] = [];
  const missionIds = missions.map((mission) => mission.id).filter(Boolean);
  const existingEventMissionIds = new Set<string>();

  if (missionIds.length > 0) {
    const { data: existingEvents, error: existingEventError } = await dbAny
      .from("mission_events")
      .select("id,mission_id,payload")
      .in("mission_id", missionIds)
      .eq("event_type", "canceled")
      .contains("payload", { reservation_id: input.reservationId, source: "reservation_cancel" });

    if (existingEventError) return { ok: false, error: existingEventError, canceled, preserved, reconciledEvents };

    for (const event of (existingEvents ?? []) as MissionEventRow[]) {
      const missionId = cleanString(event.mission_id);
      if (missionId) existingEventMissionIds.add(missionId);
    }
  }

  const ensureCancellationEvent = async (mission: { id: string; status?: string | null }) => {
    if (existingEventMissionIds.has(mission.id)) return { ok: true as const };

    const { error } = await dbAny.from("mission_events").insert({
      mission_id: mission.id,
      actor_profile_id: input.actorProfileId,
      event_type: "canceled",
      payload: {
        reservation_id: input.reservationId,
        reason: input.reason,
        source: "reservation_cancel",
        previous_status: mission.status ?? null,
      },
    });

    if (error) return { ok: false as const, error };
    existingEventMissionIds.add(mission.id);
    reconciledEvents.push(mission.id);
    return { ok: true as const };
  };

  for (const mission of cancelable) {
    const metadata = isRecord(mission.metadata) ? mission.metadata : {};
    const canceledAt = new Date().toISOString();
    const patch = {
      status: "canceled",
      canceled_at: canceledAt,
      cancel_reason: input.reason,
      metadata: {
        ...metadata,
        canceled_from_reservation: true,
        reservation_canceled_at: canceledAt,
        reservation_canceled_by: input.actorProfileId,
        reservation_cancel_reason: input.reason,
      },
    };
    const { error } = await dbAny.from("missions").update(patch).eq("id", mission.id);
    if (error) return { ok: false, error, canceled, preserved, reconciledEvents };

    canceled.push({ id: mission.id, previous_status: mission.status ?? null });
    const eventResult = await ensureCancellationEvent(mission);
    if (!eventResult.ok) return { ok: false, error: eventResult.error, canceled, preserved, reconciledEvents };
  }

  for (const mission of preserved) {
    if (!missionWasCanceledFromReservation(mission, input.reservationId)) continue;
    const eventResult = await ensureCancellationEvent(mission);
    if (!eventResult.ok) return { ok: false, error: eventResult.error, canceled, preserved, reconciledEvents };
  }

  return {
    ok: true,
    canceled,
    preserved: preserved.map((mission) => ({ id: mission.id, status: mission.status ?? null })),
    reconciledEvents,
  };
}

async function loadScheduleImpactedMissions(reservationId: string, impactedSteps: StayMissionStep[]) {
  if (impactedSteps.length === 0) return [] as ImpactedStayMission[];

  const loadLinkedMissions = async (useReservationLink: boolean) =>
    dbAny
      .from("missions")
      .select(
        useReservationLink
          ? "id,reservation_id,title,status,scheduled_start,scheduled_end,metadata"
          : "id,title,status,scheduled_start,scheduled_end,metadata",
      )
      .or(
        useReservationLink
          ? `reservation_id.eq.${reservationId},metadata->>reservation_id.eq.${reservationId},metadata->>reservation_workflow_id.eq.${reservationId}`
          : `metadata->>reservation_id.eq.${reservationId},metadata->>reservation_workflow_id.eq.${reservationId}`,
      );

  const firstAttempt = await loadLinkedMissions(true);
  const message = `${firstAttempt.error?.message ?? ""} ${firstAttempt.error?.details ?? ""}`.toLowerCase();
  const missionResult =
    (firstAttempt.error?.code === "PGRST204" || firstAttempt.error?.code === "42703" || message.includes("reservation_id"))
      ? await loadLinkedMissions(false)
      : firstAttempt;

  if (missionResult.error) {
    console.error("[PATCH /api/reservations/[id]] impacted missions lookup error:", missionResult.error);
    return [] as ImpactedStayMission[];
  }

  return identifyImpactedStayMissions((missionResult.data ?? []) as LinkedStayMissionLike[], impactedSteps);
}

function scheduleFieldLabel(field: string) {
  if (field === "check_in_at") return "Arrivee";
  if (field === "check_out_at") return "Depart";
  if (field === "arrival_time_window") return "Fenetre arrivee";
  if (field === "departure_time_window") return "Fenetre depart";
  return field;
}

function scheduleValueLabel(value: string | null) {
  if (!value) return "non renseigne";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function scheduleChangeBody(changes: ReservationScheduleChange[], impactedMissions: ImpactedStayMission[]) {
  const summary = changes
    .map((change) => `${scheduleFieldLabel(change.field)} : ${scheduleValueLabel(change.previous)} -> ${scheduleValueLabel(change.next)}`)
    .join(" | ");
  const impacted =
    impactedMissions.length > 0
      ? `${impactedMissions.length} mission(s) peuvent necessiter une verification par la conciergerie.`
      : "Aucune mission existante n'a ete identifiee comme potentiellement impactee.";
  return `${summary}. ${impacted}`;
}

async function loadReservationContext(id: string) {
  const loadLinkedMissions = async (useReservationLink: boolean) => {
    return dbAny
      .from("missions")
      .select(
        useReservationLink
          ? "id,reservation_id,title,description,status,priority,amount,currency,scheduled_start,scheduled_end,metadata,created_at,updated_at"
          : "id,title,description,status,priority,amount,currency,scheduled_start,scheduled_end,metadata,created_at,updated_at",
      )
      .or(
        useReservationLink
          ? `reservation_id.eq.${id},metadata->>reservation_id.eq.${id},metadata->>reservation_workflow_id.eq.${id}`
          : `metadata->>reservation_id.eq.${id},metadata->>reservation_workflow_id.eq.${id}`,
      )
      .order("scheduled_start", { ascending: true });
  };

  const isMissingReservationLinkColumn = (error: { code?: string; message?: string; details?: string } | null) => {
    const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
    return (
      (error?.code === "PGRST204" || error?.code === "42703" || message.includes("could not find") || message.includes("column")) &&
      message.includes("reservation_id")
    );
  };

  const { data, error } = await dbAny.from("reservations").select("*").eq("id", id).maybeSingle();
  if (error || !data) return { reservation: null, error };

  const reservation = data as ReservationRow;
  const [{ data: profiles }, { data: property }, { data: missions }, workflowEventsRes] = await Promise.all([
    dbAny
      .from("profiles")
      .select("id,first_name,last_name,company_name,username,email")
      .in("id", [reservation.owner_profile_id, reservation.concierge_profile_id]),
    reservation.property_id
      ? dbAny.from("properties").select("id,name,city").eq("id", reservation.property_id).maybeSingle()
      : Promise.resolve({ data: null }),
    (async () => {
      const firstAttempt = await loadLinkedMissions(true);
      if (isMissingReservationLinkColumn(firstAttempt.error)) return loadLinkedMissions(false);
      return firstAttempt;
    })(),
    dbAny
      .from("workflow_events")
      .select("id, actor_profile_id, reservation_id, mission_id, quote_id, service_request_id, event_type, title, body, action_href, metadata, created_at")
      .eq("reservation_id", id)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const profileMap = new Map<string, ProfileMini>(((profiles ?? []) as ProfileMini[]).map((item) => [item.id, item]));
  const propertyLabel = property ? cleanString((property as PropertyMini).name) : null;
  const ownerName = profileDisplayName(profileMap.get(reservation.owner_profile_id), "Proprietaire");
  const workflowTimeline =
    !workflowEventsRes.error || isMissingWorkflowEventsSource(workflowEventsRes.error)
      ? ((workflowEventsRes.data ?? []) as WorkflowEventRow[]).map(timelineEventFromWorkflow)
      : [];

  return {
    reservation,
    stay: reservationToTravelerStay({
      reservation,
      ownerName,
      propertyLabel,
      missions: (missions ?? []) as TravelerStayMissionRow[],
    }),
    profiles: {
      owner_name: ownerName,
      concierge_name: profileDisplayName(profileMap.get(reservation.concierge_profile_id), "Conciergerie"),
    },
    property_label: propertyLabel,
    timeline: dedupeTimeline([...workflowTimeline, ...buildReservationSyntheticTimeline(reservation)]),
    error: null,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, RESERVATION_PARTICIPANT_ROLES);
    if (!guard.ok) return guard.response;

    const { userId, role } = guard.auth;
    const { id } = await params;
    const context = await loadReservationContext(decodeURIComponent(id));

    if (context.error) {
      console.error("[GET /api/reservations/[id]] load error:", context.error);
      return NextResponse.json({ error: "Erreur chargement reservation" }, { status: 500 });
    }
    if (!context.reservation) return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });

    if (
      role !== "admin" &&
      role !== "super_admin" &&
      context.reservation.owner_profile_id !== userId &&
      context.reservation.concierge_profile_id !== userId
    ) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    return NextResponse.json({
      reservation: {
        ...context.reservation,
        ...context.profiles,
        property_label: context.property_label,
      },
      stay: context.stay,
      timeline: context.timeline ?? [],
    });
  } catch (error) {
    console.error("[GET /api/reservations/[id]] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, RESERVATION_PARTICIPANT_ROLES);
    if (!guard.ok) return guard.response;

    const { userId, role } = guard.auth;
    const { id } = await params;
    const reservationId = decodeURIComponent(id);
    const body = (await req.json()) as Record<string, unknown>;
    const { reservation } = await loadReservationContext(reservationId);

    if (!reservation) return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });
    if (
      role !== "admin" &&
      role !== "super_admin" &&
      reservation.owner_profile_id !== userId &&
      reservation.concierge_profile_id !== userId
    ) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const action = cleanString(body.action);
    const metadata = isRecord(reservation.metadata) ? reservation.metadata : {};
    const patch = isRecord(body.patch) ? body.patch : body;
    const updatePayload: Record<string, unknown> = {};
    const nextMetadata: Record<string, unknown> = { ...metadata };
    const changedFields: string[] = [];
    let workflowEventType = "reservation_updated";
    let workflowEventTitle = "Reservation mise a jour";
    let workflowEventBody: string | null = null;
    let takeOverMissions: StayMissionAssignmentRow[] | null = null;
    let cancellationPropagation: Awaited<ReturnType<typeof cancelLinkedReservationMissions>> | null = null;
    let scheduleChanges: ReservationScheduleChange[] = [];
    let impactedMissions: ImpactedStayMission[] = [];

    if (action === "acknowledge" || action === "take_over") {
      if (!canManageAsConcierge(role)) {
        return NextResponse.json({ error: "Seule la conciergerie peut accuser reception." }, { status: 403 });
      }
      const alreadyAcknowledged = action === "take_over" && cleanString(reservation.status) === "acknowledged";
      if (action === "take_over") {
        const missionResult = await createOrReuseStayMissions({ db: dbAny, reservation, body });
        if (!missionResult.ok) {
          return NextResponse.json(
            {
              error: missionResult.error,
              take_over_status: "missions_failed",
              reservation_status: cleanString(reservation.status),
            },
            { status: missionResult.status },
          );
        }
        takeOverMissions = missionResult.missions;
      }
      if (takeOverMissions) {
        nextMetadata.take_over_missions_synced_at = new Date().toISOString();
        nextMetadata.take_over_mission_count = takeOverMissions.length;
      }
      if (!alreadyAcknowledged) {
        updatePayload.status = "acknowledged";
        updatePayload.acknowledged_at = new Date().toISOString();
        nextMetadata.last_acknowledged_by = userId;
        changedFields.push("status", "acknowledged_at");
      }
      workflowEventType = "reservation_acknowledged";
      workflowEventTitle = action === "take_over" ? "Séjour pris en charge" : "Reservation accusee reception";
      workflowEventBody = takeOverMissions
        ? `La conciergerie a confirme la prise en charge du sejour. Missions synchronisees: ${takeOverMissions.length}.`
        : "La conciergerie a confirme la prise en charge du sejour.";
    } else if (action === "report_unavailable") {
      if (!canManageAsConcierge(role)) {
        return NextResponse.json({ error: "Seule la conciergerie peut signaler une indisponibilité." }, { status: 403 });
      }
      nextMetadata.concierge_unavailable = true;
      nextMetadata.concierge_unavailable_at = new Date().toISOString();
      nextMetadata.concierge_unavailable_by = userId;
      nextMetadata.concierge_unavailable_reason = cleanString(body.reason) ?? cleanString(patch.reason);
      changedFields.push("metadata");
      workflowEventType = "reservation_concierge_unavailable";
      workflowEventTitle = "Conciergerie indisponible";
      workflowEventBody = cleanString(nextMetadata.concierge_unavailable_reason) ?? "La conciergerie a signalé une indisponibilité pour ce séjour.";
    } else if (action === "cancel") {
      updatePayload.status = "canceled";
      updatePayload.canceled_at = new Date().toISOString();
      nextMetadata.cancel_reason = cleanString(body.reason) ?? cleanString(patch.reason);
      nextMetadata.canceled_by = userId;
      changedFields.push("status", "canceled_at");
      workflowEventType = "reservation_canceled";
      workflowEventTitle = "Reservation annulee";
      workflowEventBody = cleanString(nextMetadata.cancel_reason) ?? "Le sejour partage a ete annule.";
    } else {
      const scheduleChangeSet = buildReservationScheduleChangeSet(reservation, patch);
      if (!scheduleChangeSet.ok) {
        return NextResponse.json({ error: scheduleChangeSet.error }, { status: 400 });
      }
      if (scheduleChangeSet.changedFields.length > 0) {
        Object.assign(updatePayload, scheduleChangeSet.updatePayload);
        changedFields.push(...scheduleChangeSet.changedFields);
        scheduleChanges = scheduleChangeSet.changes;
        impactedMissions = await loadScheduleImpactedMissions(reservationId, scheduleChangeSet.impactedSteps);
        workflowEventType = "reservation_schedule_updated";
        workflowEventTitle =
          scheduleChanges.some((change) => change.scope === "arrival") &&
          scheduleChanges.some((change) => change.scope === "departure")
            ? "Arrivee et depart modifies"
            : scheduleChanges.some((change) => change.scope === "arrival")
              ? "Arrivee modifiee"
              : "Depart modifie";
        workflowEventBody = scheduleChangeBody(scheduleChanges, impactedMissions);
      }

      if (hasOwnPatchField(patch, "access_instructions")) {
        const accessInstructions = cleanString(patch.access_instructions);
        if ((accessInstructions ?? null) !== cleanString(reservation.access_instructions)) {
          updatePayload.access_instructions = accessInstructions;
          changedFields.push("access_instructions");
        }
      }

      if (hasOwnPatchField(patch, "owner_notes")) {
        const nextOwnerNotes = cleanString(patch.owner_notes);
        if (!canManageAsOwner(role)) return NextResponse.json({ error: "Notes proprietaire non autorisees." }, { status: 403 });
        if ((nextOwnerNotes ?? null) !== cleanString(reservation.owner_notes)) {
          updatePayload.owner_notes = nextOwnerNotes;
          changedFields.push("owner_notes");
        }
      }

      if (hasOwnPatchField(patch, "concierge_notes")) {
        const nextConciergeNotes = cleanString(patch.concierge_notes);
        if (!canManageAsConcierge(role)) return NextResponse.json({ error: "Notes conciergerie non autorisees." }, { status: 403 });
        if ((nextConciergeNotes ?? null) !== cleanString(reservation.concierge_notes)) {
          updatePayload.concierge_notes = nextConciergeNotes;
          changedFields.push("concierge_notes");
        }
      }

      if (changedFields.includes("access_instructions") || changedFields.includes("owner_notes") || changedFields.includes("concierge_notes")) {
        if (scheduleChanges.length === 0) {
          workflowEventTitle = "Brief collaboratif mis a jour";
          workflowEventBody = "Les consignes ou notes partagees du sejour ont ete mises a jour.";
        }
      }

      if (cleanString(patch.status)) {
        const nextStatus = cleanString(patch.status);
        const allowed =
          role === "admin" || role === "super_admin"
            ? nextStatus
            : canManageAsConcierge(role)
              ? ["acknowledged", "scheduled", "in_stay", "completed", "canceled"].includes(nextStatus ?? "")
              : ["draft", "shared", "canceled"].includes(nextStatus ?? "");
        if (!allowed) return NextResponse.json({ error: "Statut non autorise." }, { status: 403 });
        updatePayload.status = nextStatus;
        if (nextStatus === "completed") updatePayload.completed_at = new Date().toISOString();
        if (nextStatus !== cleanString(reservation.status)) changedFields.push("status");
        workflowEventType = nextStatus === "completed" ? "reservation_completed" : "reservation_status_updated";
        workflowEventTitle = nextStatus === "completed" ? "Sejour termine" : "Statut de reservation mis a jour";
        workflowEventBody = nextStatus ? `Nouveau statut: ${nextStatus}.` : null;
      }

      if (isRecord(patch.metadata)) {
        Object.assign(nextMetadata, patch.metadata);
        changedFields.push("metadata");
      }
    }

    updatePayload.metadata = nextMetadata;

    const { data, error } = await dbAny
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[PATCH /api/reservations/[id]] update error:", error);
      return NextResponse.json(
        {
          error: "Mise a jour reservation impossible.",
          missions: takeOverMissions ?? undefined,
          take_over_status: takeOverMissions ? "reservation_update_failed_after_missions" : undefined,
        },
        { status: 500 },
      );
    }

    if (action === "cancel") {
      cancellationPropagation = await cancelLinkedReservationMissions({
        reservationId,
        actorProfileId: userId,
        reason: cleanString(nextMetadata.cancel_reason),
      });
      if (!cancellationPropagation.ok) {
        console.error("[PATCH /api/reservations/[id]] mission cancellation propagation error:", cancellationPropagation.error);
      }
    }

    if (changedFields.length > 0 || action === "acknowledge" || action === "cancel") {
      if (!workflowEventBody) {
        workflowEventBody = changedFields.length > 0 ? `Champs modifies: ${changedFields.join(", ")}.` : "Reservation mise a jour.";
      }

      await recordWorkflowEvent(dbAny, {
        actorProfileId: userId,
        ownerProfileId: reservation.owner_profile_id,
        conciergeProfileId: reservation.concierge_profile_id,
        reservationId,
        eventType: workflowEventType,
        title: workflowEventTitle,
        body: workflowEventBody,
        metadata: {
          action,
          changed_fields: changedFields,
          status: cleanString((data as ReservationRow).status),
          schedule_changes: scheduleChanges.length > 0 ? scheduleChanges : undefined,
          impacted_missions:
            scheduleChanges.length > 0
              ? impactedMissions.map((mission) => ({
                  id: mission.id,
                  title: mission.title,
                  status: mission.status,
                  step: mission.step,
                  impact_reason: mission.impact_reason,
                  scheduled_start: mission.scheduled_start,
                  scheduled_end: mission.scheduled_end,
                }))
              : undefined,
          take_over_mission_count: takeOverMissions?.length ?? undefined,
          canceled_mission_count:
            cancellationPropagation && cancellationPropagation.ok ? cancellationPropagation.canceled.length : undefined,
          preserved_mission_count:
            cancellationPropagation && cancellationPropagation.ok ? cancellationPropagation.preserved.length : undefined,
        },
      });
    }

    const context = await loadReservationContext(reservationId);
    const responsePayload = {
      reservation: context.reservation
        ? {
            ...context.reservation,
            ...context.profiles,
            property_label: context.property_label,
          }
        : data,
      stay: context.stay ?? null,
      timeline: context.timeline ?? [],
      changed_fields: changedFields,
      schedule_changes: scheduleChanges,
      impacted_missions: impactedMissions,
      take_over:
        action === "take_over"
          ? {
              status: "complete",
              missions: takeOverMissions ?? [],
            }
          : undefined,
      cancellation:
        action === "cancel"
          ? cancellationPropagation && cancellationPropagation.ok
            ? {
                status: "propagated",
                canceled_missions: cancellationPropagation.canceled,
                preserved_missions: cancellationPropagation.preserved,
                reconciled_event_mission_ids: cancellationPropagation.reconciledEvents,
              }
            : {
                status: "partial",
                error: "Le séjour est annulé mais la propagation aux missions a échoué.",
                canceled_missions: cancellationPropagation?.canceled ?? [],
                preserved_missions: cancellationPropagation?.preserved ?? [],
                reconciled_event_mission_ids: cancellationPropagation?.reconciledEvents ?? [],
              }
          : undefined,
    };

    return NextResponse.json(responsePayload, {
      status: action === "cancel" && cancellationPropagation && !cancellationPropagation.ok ? 207 : 200,
    });
  } catch (error) {
    console.error("[PATCH /api/reservations/[id]] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
