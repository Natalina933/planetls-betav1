import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { buildTravelerStayDashboard } from "@/app/lib/travelerStayCenter";
import {
  isRecord,
  stringValue,
  workflowsAndMissionsToTravelerStays,
  type TravelerStayMissionRow,
  type TravelerStayReservationWorkflow,
} from "@/app/lib/travelerStaySupabase";
import { requireApiRole } from "@/server/auth/roleGuards";

const STAY_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const dbAny = asLooseSupabaseClient(db);

function toMissionRow(value: Record<string, unknown>): TravelerStayMissionRow {
  return {
    id: String(value.id ?? ""),
    title: stringValue(value.title),
    description: stringValue(value.description),
    status: stringValue(value.status),
    priority: stringValue(value.priority),
    amount: typeof value.amount === "number" ? value.amount : null,
    currency: stringValue(value.currency),
    scheduled_start: stringValue(value.scheduled_start),
    scheduled_end: stringValue(value.scheduled_end),
    metadata: isRecord(value.metadata) ? value.metadata : {},
    created_at: stringValue(value.created_at),
    updated_at: stringValue(value.updated_at),
  };
}

function groupReservationWorkflows(missions: TravelerStayMissionRow[]): TravelerStayReservationWorkflow[] {
  const workflows = new Map<string, TravelerStayReservationWorkflow>();
  for (const mission of missions) {
    const metadata = isRecord(mission.metadata) ? mission.metadata : {};
    const workflowId = stringValue(metadata.reservation_workflow_id) ?? stringValue(metadata.reservation_id);
    if (!workflowId) continue;
    const current = workflows.get(workflowId) ?? {
      id: workflowId,
      reservation: {
        property_label: metadata.property_label ?? null,
        guest_name: metadata.guest_name ?? null,
        check_in: metadata.check_in ?? null,
        check_out: metadata.check_out ?? null,
      },
      missions: [],
    };
    current.missions?.push(mission);
    workflows.set(workflowId, current);
  }
  return Array.from(workflows.values());
}

function metadataPatchForAction(body: Record<string, unknown>, actorProfileId: string) {
  const action = stringValue(body.action) ?? "";
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    traveler_stay_last_action: action,
    traveler_stay_last_action_at: now,
    traveler_stay_last_actor_profile_id: actorProfileId,
  };

  if (action === "confirm_arrival_time") {
    patch.arrival_time_confirmed = true;
    patch.estimated_arrival_time = stringValue(body.estimated_arrival_time) ?? stringValue(body.arrival_time) ?? now;
  } else if (action === "mark_access_ready") {
    patch.access_instructions_ready = true;
    if (stringValue(body.access_code)) patch.access_code = stringValue(body.access_code);
  } else if (action === "mark_linen_ready") {
    patch.linen_ready = true;
    patch.consumables_ready = true;
  } else if (action === "mark_equipment_checked") {
    patch.equipment_checked = true;
  } else if (action === "mark_departure_ready") {
    patch.departure_instructions_ready = true;
    patch.deposit_reviewed = true;
  } else if (action === "override_preparation") {
    const reason = stringValue(body.reason);
    if (!reason) {
      return { error: "Une raison est requise pour tracer l'override." };
    }
    patch.preparation_override = true;
    patch.preparation_override_reason = reason;
  } else {
    return { error: "Action sejour inconnue." };
  }

  return { patch, action };
}

async function loadStayMissions(stayId: string, userId: string, role: string) {
  let query = dbAny
    .from("missions")
    .select("id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at")
    .or(`metadata->>reservation_workflow_id.eq.${stayId},metadata->>reservation_id.eq.${stayId},id.eq.${stayId}`)
    .order("scheduled_start", { ascending: true })
    .limit(80);

  if (role !== "admin" && role !== "super_admin") {
    query = query.eq("concierge_profile_id", userId);
  }

  const { data, error } = await query;
  return { missions: ((data ?? []) as Record<string, unknown>[]).map(toMissionRow), error };
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, STAY_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "160");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 240) : 160;

    let query = dbAny
      .from("missions")
      .select("id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at")
      .order("scheduled_start", { ascending: true })
      .limit(limit);

    if (role !== "admin" && role !== "super_admin") {
      query = query.eq("concierge_profile_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/concierge/stays] DB error:", error);
      return NextResponse.json({ error: "Erreur chargement sejours" }, { status: 500 });
    }

    const missions = ((data ?? []) as Record<string, unknown>[]).map(toMissionRow);
    const workflows = groupReservationWorkflows(missions);
    const stays = workflowsAndMissionsToTravelerStays({ workflows, missions });

    return NextResponse.json({
      stays,
      dashboard: buildTravelerStayDashboard(stays),
    });
  } catch (error) {
    console.error("[GET /api/concierge/stays] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, STAY_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const body = (await req.json()) as Record<string, unknown>;
    const stayId = stringValue(body.stay_id) ?? stringValue(body.id);
    if (!stayId) {
      return NextResponse.json({ error: "stay_id requis" }, { status: 400 });
    }

    const actionPatch = metadataPatchForAction(body, userId);
    if ("error" in actionPatch) {
      return NextResponse.json({ error: actionPatch.error }, { status: 400 });
    }

    const { missions, error } = await loadStayMissions(stayId, userId, role);
    if (error) {
      console.error("[PATCH /api/concierge/stays] load error:", error);
      return NextResponse.json({ error: "Erreur chargement sejour" }, { status: 500 });
    }
    if (missions.length === 0) {
      return NextResponse.json({ error: "Sejour introuvable" }, { status: 404 });
    }

    const updated: TravelerStayMissionRow[] = [];
    for (const mission of missions) {
      const metadata = isRecord(mission.metadata) ? mission.metadata : {};
      const nextMetadata = { ...metadata, ...actionPatch.patch };
      const { data, error: updateError } = await dbAny
        .from("missions")
        .update({ metadata: nextMetadata })
        .eq("id", mission.id)
        .select("id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at")
        .single<Record<string, unknown>>();

      if (updateError || !data) {
        console.error("[PATCH /api/concierge/stays] update error:", updateError);
        return NextResponse.json({ error: "Erreur mise a jour sejour" }, { status: 500 });
      }

      await dbAny.from("mission_events").insert({
        mission_id: mission.id,
        actor_profile_id: userId,
        event_type: `traveler_stay_${actionPatch.action}`,
        payload: {
          stay_id: stayId,
          action: actionPatch.action,
          patch: actionPatch.patch,
        },
      });

      updated.push(toMissionRow(data));
    }

    const workflows = groupReservationWorkflows(updated);
    const stays = workflowsAndMissionsToTravelerStays({ workflows, missions: updated });
    return NextResponse.json({ stay: stays[0] ?? null, updated_missions: updated });
  } catch (error) {
    console.error("[PATCH /api/concierge/stays] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
