import { NextRequest, NextResponse } from "next/server";
import {
  cleanString,
  getReservationMissionKey,
  profileDisplayName,
  reservationToTravelerStay,
  type ProfileMini,
  type PropertyMini,
  type ReservationRow,
} from "@/app/api/_shared/reservations";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { buildTravelerStayDashboard } from "@/app/lib/travelerStayCenter";
import {
  isRecord,
  mergeDuplicateTravelerStays,
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
    reservation_id: stringValue(value.reservation_id),
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

function isMissingMissionReservationIdColumn(error: { code?: string; message?: string; details?: string } | null) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    (error?.code === "PGRST204" || error?.code === "42703" || message.includes("could not find") || message.includes("column")) &&
    message.includes("reservation_id")
  );
}

function groupReservationWorkflows(missions: TravelerStayMissionRow[]): TravelerStayReservationWorkflow[] {
  const workflows = new Map<string, TravelerStayReservationWorkflow>();
  for (const mission of missions) {
    const metadata = isRecord(mission.metadata) ? mission.metadata : {};
    const reservationId = mission.reservation_id ?? stringValue(metadata.reservation_id) ?? stringValue(metadata.reservation_workflow_id);
    if (!reservationId) continue;
    const current = workflows.get(reservationId) ?? {
      id: reservationId,
      reservation: {
        id: reservationId,
        property_label: metadata.property_label ?? null,
        guest_name: metadata.guest_name ?? null,
        check_in: metadata.check_in ?? null,
        check_out: metadata.check_out ?? null,
      },
      missions: [],
    };
    current.missions?.push(mission);
    workflows.set(reservationId, current);
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
    return { error: "Action séjour inconnue." };
  }

  return { patch, action };
}

async function loadStayMissions(stayId: string, userId: string, role: string) {
  const run = async (useReservationLink: boolean) => {
    let query = dbAny
      .from("missions")
      .select(
        useReservationLink
          ? "id, reservation_id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at"
          : "id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at",
      )
      .order("scheduled_start", { ascending: true })
      .limit(80);

    query = useReservationLink
      ? query.or(`reservation_id.eq.${stayId},metadata->>reservation_workflow_id.eq.${stayId},metadata->>reservation_id.eq.${stayId},id.eq.${stayId}`)
      : query.or(`metadata->>reservation_workflow_id.eq.${stayId},metadata->>reservation_id.eq.${stayId},id.eq.${stayId}`);

    if (role !== "admin" && role !== "super_admin") {
      query = query.eq("concierge_profile_id", userId);
    }

    return query;
  };

  const firstAttempt = await run(true);
  if (isMissingMissionReservationIdColumn(firstAttempt.error)) {
    const fallback = await run(false);
    return { missions: ((fallback.data ?? []) as Record<string, unknown>[]).map(toMissionRow), error: fallback.error };
  }

  return { missions: ((firstAttempt.data ?? []) as Record<string, unknown>[]).map(toMissionRow), error: firstAttempt.error };
}

async function loadReservationStay(stayId: string, userId: string, role: string) {
  let query = dbAny.from("reservations").select("*").eq("id", stayId).limit(1);

  if (role !== "admin" && role !== "super_admin") {
    query = query.eq("concierge_profile_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  return { reservation: (data ?? null) as ReservationRow | null, error };
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, STAY_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "160");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 240) : 160;

    const missionSelectWithReservationId =
      "id, reservation_id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at";
    const missionSelectWithoutReservationId =
      "id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, metadata, created_at, updated_at";
    const loadMissionList = async (includeReservationId: boolean) => {
      let missionQuery = dbAny
        .from("missions")
        .select(includeReservationId ? missionSelectWithReservationId : missionSelectWithoutReservationId)
        .order("scheduled_start", { ascending: true })
        .limit(limit);

      if (role !== "admin" && role !== "super_admin") {
        missionQuery = missionQuery.eq("concierge_profile_id", userId);
      }

      return missionQuery;
    };
    let reservationQuery = dbAny
      .from("reservations")
      .select("*")
      .order("check_in_at", { ascending: true })
      .limit(limit);

    if (role !== "admin" && role !== "super_admin") {
      reservationQuery = reservationQuery.eq("concierge_profile_id", userId);
    }

    const [{ data: missionData, error: missionError }, { data: reservationData, error: reservationError }] = await Promise.all([
      (async () => {
        const firstAttempt = await loadMissionList(true);
        if (isMissingMissionReservationIdColumn(firstAttempt.error)) return loadMissionList(false);
        return firstAttempt;
      })(),
      reservationQuery,
    ]);
    if (missionError || reservationError) {
      console.error("[GET /api/concierge/stays] DB error:", missionError ?? reservationError);
      return NextResponse.json({ error: "Erreur chargement séjours" }, { status: 500 });
    }

    const missions = ((missionData ?? []) as Record<string, unknown>[]).map(toMissionRow);
    const reservations = (reservationData ?? []) as ReservationRow[];
    const workflows = groupReservationWorkflows(missions);
    const missionsByReservationId = new Map<string, TravelerStayMissionRow[]>();

    for (const mission of missions) {
      const reservationId = getReservationMissionKey(mission);
      if (!reservationId) continue;
      missionsByReservationId.set(reservationId, [...(missionsByReservationId.get(reservationId) ?? []), mission]);
    }

    const profileIds = Array.from(new Set(reservations.flatMap((item) => [item.owner_profile_id, item.concierge_profile_id]).filter(Boolean)));
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

    const reservationStays = reservations.map((reservation) =>
      reservationToTravelerStay({
        reservation,
        ownerName: profileDisplayName(profileMap.get(reservation.owner_profile_id), "Propriétaire"),
        propertyLabel: reservation.property_id ? cleanString(propertyMap.get(reservation.property_id)?.name) : null,
        missions: missionsByReservationId.get(reservation.id) ?? [],
      }),
    );

    const stays = mergeDuplicateTravelerStays([
      ...reservationStays,
      ...workflowsAndMissionsToTravelerStays({ workflows, missions }),
    ]);

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

    const { reservation, error: reservationError } = await loadReservationStay(stayId, userId, role);
    if (reservationError) {
      console.error("[PATCH /api/concierge/stays] reservation load error:", reservationError);
      return NextResponse.json({ error: "Erreur chargement séjour" }, { status: 500 });
    }

    if (reservation) {
      const metadata = isRecord(reservation.metadata) ? reservation.metadata : {};
      const nextMetadata = { ...metadata, ...actionPatch.patch };
      const { data, error: updateError } = await dbAny
        .from("reservations")
        .update({ metadata: nextMetadata })
        .eq("id", stayId)
        .select("*")
        .single();

      if (updateError || !data) {
        console.error("[PATCH /api/concierge/stays] reservation update error:", updateError);
        return NextResponse.json({ error: "Erreur mise à jour séjour" }, { status: 500 });
      }

      return NextResponse.json({
        stay: reservationToTravelerStay({ reservation: data as ReservationRow, missions: [] }),
        reservation: data,
      });
    }

    const { missions, error } = await loadStayMissions(stayId, userId, role);
    if (error) {
      console.error("[PATCH /api/concierge/stays] load error:", error);
      return NextResponse.json({ error: "Erreur chargement séjour" }, { status: 500 });
    }
    if (missions.length === 0) {
      return NextResponse.json({ error: "Séjour introuvable" }, { status: 404 });
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
        return NextResponse.json({ error: "Erreur mise à jour séjour" }, { status: 500 });
      }

      await dbAny.from("mission_events").insert({
        mission_id: mission.id,
        actor_profile_id: userId,
        event_type: `traveler_stay_${actionPatch.action}`,
        payload: {
          stay_id: stayId,
          reservation_id: mission.reservation_id ?? null,
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
