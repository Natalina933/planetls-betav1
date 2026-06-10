import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { canAccessMissionForRole, CONCIERGE_MISSION_ROLES } from "@/app/lib/missionPermissions";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { Json } from "@/types/supabase";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);

async function loadMission(id: string) {
  return dbAny
    .from("missions")
    .select("id, title, description, owner_profile_id, concierge_profile_id, scheduled_start, scheduled_end, amount, currency, metadata")
    .eq("id", id)
    .maybeSingle();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  const { id } = await params;
  if (!isUuidLike(id)) return NextResponse.json({ error: "Mission invalide" }, { status: 400 });

  const { data: mission } = await loadMission(id);
  if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  if (!canAccessMissionForRole({ role, userId, ownerProfileId: mission.owner_profile_id, conciergeProfileId: mission.concierge_profile_id })) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { data, error } = await dbAny
    .from("provider_interventions")
    .select("*")
    .contains("metadata", { mission_id: id })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Erreur chargement interventions" }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  const { id } = await params;
  if (!isUuidLike(id)) return NextResponse.json({ error: "Mission invalide" }, { status: 400 });
  if (!CONCIERGE_MISSION_ROLES.has(role)) {
    return NextResponse.json({ error: "Intervention artisan reservee a la conciergerie" }, { status: 403 });
  }

  const { data: mission } = await loadMission(id);
  if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  if (!canAccessMissionForRole({ role, userId, ownerProfileId: mission.owner_profile_id, conciergeProfileId: mission.concierge_profile_id })) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await req.json();
  const providerProfileId = typeof body?.provider_profile_id === "string" ? body.provider_profile_id.trim() : "";
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : `Intervention - ${mission.title || "mission"}`;
  if (!isUuidLike(providerProfileId)) {
    return NextResponse.json({ error: "provider_profile_id requis" }, { status: 400 });
  }

  const { data: provider, error: providerError } = await dbAny
    .from("profiles")
    .select("id, role")
    .eq("id", providerProfileId)
    .in("role", ["provider", "provider_pro", "artisan", "artisan_pro"])
    .maybeSingle();
  if (providerError) return NextResponse.json({ error: "Erreur verification artisan" }, { status: 500 });
  if (!provider) return NextResponse.json({ error: "Artisan introuvable" }, { status: 404 });

  const { data, error } = await dbAny
    .from("provider_interventions")
    .insert({
      provider_profile_id: providerProfileId,
      owner_profile_id: mission.owner_profile_id,
      title,
      description: typeof body?.description === "string" ? body.description : mission.description,
      service_label: typeof body?.service_label === "string" ? body.service_label : null,
      status: "pending",
      priority: typeof body?.priority === "string" ? body.priority : "normal",
      scheduled_start: typeof body?.scheduled_start === "string" ? body.scheduled_start : mission.scheduled_start,
      scheduled_end: typeof body?.scheduled_end === "string" ? body.scheduled_end : mission.scheduled_end,
      budget_amount: typeof body?.budget_amount === "number" ? body.budget_amount : mission.amount,
      currency: mission.currency ?? "EUR",
      location_label: typeof body?.location_label === "string" ? body.location_label : null,
      metadata: {
        mission_id: id,
        created_from: "mission_detail",
        concierge_profile_id: mission.concierge_profile_id,
      } as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[POST /api/missions/:id/provider-interventions] create error:", error);
    return NextResponse.json({ error: "Erreur creation intervention artisan" }, { status: 500 });
  }

  const missionMetadata =
    mission.metadata && typeof mission.metadata === "object" && !Array.isArray(mission.metadata)
      ? (mission.metadata as Record<string, unknown>)
      : {};
  await dbAny
    .from("missions")
    .update({
      metadata: {
        ...missionMetadata,
        provider_intervention_status: "pending",
        provider_intervention_id: data.id,
      } as Json,
    })
    .eq("id", id);

  await dbAny.from("mission_events").insert({
    mission_id: id,
    actor_profile_id: userId,
    event_type: "updated",
    payload: {
      action: "provider_intervention_created",
      provider_intervention_id: data.id,
      provider_profile_id: providerProfileId,
    },
  });

  await dbAny.from("provider_alerts").insert({
    provider_profile_id: providerProfileId,
    intervention_id: data.id,
    alert_type: "deadline",
    severity: data.priority === "urgent" ? "urgent" : "normal",
    title: "Nouvelle intervention liee a une mission",
    body: title,
    status: "open",
  });

  return NextResponse.json(data, { status: 201 });
}

