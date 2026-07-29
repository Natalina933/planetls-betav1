import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const RESERVATION_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const dbAny = asLooseSupabaseClient(db);

type MissionRow = {
  id: string;
  concierge_profile_id: string | null;
  reservation_id?: string | null;
  status: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata: unknown;
};

const isUuidLike = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getStep(metadata: unknown) {
  const record = toRecord(metadata);
  return typeof record.reservation_step === "string" ? record.reservation_step : null;
}

function addMinutes(value: string | null, deltaMinutes: number) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Date(date.getTime() + deltaMinutes * 60 * 1000).toISOString();
}

function normalizeMissionStatus(status: unknown) {
  switch (status) {
    case "planned":
      return "scheduled";
    case "assigned":
      return "assigned";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "canceled":
      return "canceled";
    default:
      return null;
  }
}

function isMissingMissionReservationIdColumn(error: { code?: string; message?: string; details?: string } | null) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    (error?.code === "PGRST204" || error?.code === "42703" || message.includes("could not find") || message.includes("column")) &&
    message.includes("reservation_id")
  );
}

async function loadWorkflowMissions(workflowId: string, userId: string, role: string) {
  const run = async (useReservationLink: boolean) => {
    let query = dbAny
      .from("missions")
      .select(
        useReservationLink
          ? "id, concierge_profile_id, reservation_id, status, scheduled_start, scheduled_end, metadata"
          : "id, concierge_profile_id, status, scheduled_start, scheduled_end, metadata",
      )
      .order("scheduled_start", { ascending: true });

    query = useReservationLink
      ? query.or(`reservation_id.eq.${workflowId},metadata->>reservation_id.eq.${workflowId},metadata->>reservation_workflow_id.eq.${workflowId}`)
      : query.contains("metadata", { reservation_workflow_id: workflowId });

    if (role !== "admin" && role !== "super_admin") {
      query = query.eq("concierge_profile_id", userId);
    }

    return query;
  };

  const firstAttempt = await run(true);
  if (isMissingMissionReservationIdColumn(firstAttempt.error)) {
    const fallback = await run(false);
    return { missions: (fallback.data ?? []) as MissionRow[], error: fallback.error };
  }

  return { missions: (firstAttempt.data ?? []) as MissionRow[], error: firstAttempt.error };
}

async function recordActionEvent(input: {
  mission: MissionRow;
  actorProfileId: string;
  eventType: string;
  reservationId: string | null;
  payload: Record<string, unknown>;
}) {
  await dbAny.from("mission_events").insert({
    mission_id: input.mission.id,
    actor_profile_id: input.actorProfileId,
    event_type: input.eventType,
    payload: {
      reservation_id: input.reservationId,
      ...input.payload,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, RESERVATION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const { id } = await params;
    const workflowId = decodeURIComponent(id);
    const body = (await req.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "follow";
    const { missions, error } = await loadWorkflowMissions(workflowId, userId, role);

    if (error) {
      console.error("[PATCH /api/concierge/reservations/[id]] load error:", error);
      return NextResponse.json({ error: "Erreur chargement workflow" }, { status: 500 });
    }
    if (missions.length === 0) {
      return NextResponse.json({ error: "Reservation introuvable" }, { status: 404 });
    }

    const stepId = typeof body.step === "string" ? body.step : null;
    const targetMissions = stepId ? missions.filter((mission) => getStep(mission.metadata) === stepId) : missions;
    if (targetMissions.length === 0) {
      return NextResponse.json({ error: "Etape introuvable" }, { status: 404 });
    }

    const updated: MissionRow[] = [];

    for (const mission of targetMissions) {
      const metadata = toRecord(mission.metadata);
      const patch: Record<string, unknown> = {};
      const nextMetadata: Record<string, unknown> = {
        ...metadata,
        reservation_last_action: action,
        reservation_last_action_at: new Date().toISOString(),
      };

      if (action === "move") {
        const deltaMinutes = Number(body.delta_minutes ?? 0);
        if (!Number.isFinite(deltaMinutes) || deltaMinutes === 0) {
          return NextResponse.json({ error: "delta_minutes requis" }, { status: 400 });
        }
        patch.scheduled_start = addMinutes(mission.scheduled_start, deltaMinutes);
        patch.scheduled_end = addMinutes(mission.scheduled_end, deltaMinutes);
        nextMetadata.moved_by_minutes = Number(metadata.moved_by_minutes ?? 0) + deltaMinutes;
      } else if (action === "replan") {
        const scheduledStart = typeof body.scheduled_start === "string" ? body.scheduled_start : null;
        const scheduledEnd = typeof body.scheduled_end === "string" ? body.scheduled_end : null;
        if (!stepId || !scheduledStart) {
          return NextResponse.json({ error: "step et scheduled_start requis" }, { status: 400 });
        }
        patch.scheduled_start = scheduledStart;
        patch.scheduled_end = scheduledEnd;
        nextMetadata.replanned_at = new Date().toISOString();
      } else if (action === "assign") {
        const assignedProfileId = typeof body.assigned_profile_id === "string" ? body.assigned_profile_id : null;
        if (!stepId || !isUuidLike(assignedProfileId)) {
          return NextResponse.json({ error: "step et assigned_profile_id requis" }, { status: 400 });
        }
        patch.status = "assigned";
        nextMetadata.assigned_profile_id = assignedProfileId;
        nextMetadata.assigned_at = new Date().toISOString();
      } else if (action === "follow") {
        const nextStatus = normalizeMissionStatus(body.status);
        if (!stepId || !nextStatus) {
          return NextResponse.json({ error: "step et status valides requis" }, { status: 400 });
        }
        patch.status = nextStatus;
        nextMetadata.followed_status = nextStatus;
        nextMetadata.followed_at = new Date().toISOString();
      } else if (action === "delete") {
        patch.status = "canceled";
        nextMetadata.deleted_at = new Date().toISOString();
        nextMetadata.delete_reason = typeof body.reason === "string" ? body.reason : null;
      } else {
        return NextResponse.json({ error: "Action reservation inconnue" }, { status: 400 });
      }

      patch.metadata = nextMetadata;
      const { data, error: updateError } = await dbAny
        .from("missions")
        .update(patch)
        .eq("id", mission.id)
        .select("id, concierge_profile_id, status, scheduled_start, scheduled_end, metadata")
        .single<MissionRow>();

      if (updateError || !data) {
        console.error("[PATCH /api/concierge/reservations/[id]] update error:", updateError);
        return NextResponse.json({ error: "Erreur mise a jour workflow" }, { status: 500 });
      }

      await recordActionEvent({
        mission: data,
        actorProfileId: userId,
        eventType: `reservation_${action}`,
        reservationId: mission.reservation_id ?? null,
        payload: {
          reservation_workflow_id: workflowId,
          reservation_step: getStep(data.metadata),
          action,
          patch,
        },
      });

      updated.push(data);
    }

    if (action === "delete" && !stepId) {
      const invoiceMissionIds = targetMissions.map((mission) => mission.id).filter((value) => typeof value === "string" && value.length > 0);
      await dbAny
        .from("invoices")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .in("mission_id", invoiceMissionIds);
    }

    return NextResponse.json({ id: workflowId, action, updated_missions: updated });
  } catch (error) {
    console.error("[PATCH /api/concierge/reservations/[id]] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
