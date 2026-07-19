import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const TRANSITIONS: Record<string, Set<string>> = {
  reported: new Set(["qualified", "cancelled"]),
  qualified: new Set(["assigned", "cancelled"]),
  assigned: new Set(["quoted", "scheduled", "cancelled"]),
  quoted: new Set(["approved", "cancelled"]),
  approved: new Set(["scheduled", "cancelled"]),
  scheduled: new Set(["in_progress", "cancelled"]),
  in_progress: new Set(["resolved", "cancelled"]),
  resolved: new Set(["closed", "in_progress"]),
  closed: new Set(),
  cancelled: new Set(),
};

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapIncident(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    missionId: typeof row.mission_id === "string" ? row.mission_id : null,
    title: String(row.title ?? "Incident maintenance"),
    description: typeof row.description === "string" ? row.description : null,
    propertyLabel: typeof row.property_label === "string" ? row.property_label : null,
    priority: typeof row.priority === "string" ? row.priority : "normal",
    status: typeof row.status === "string" ? row.status : "reported",
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    artisan: typeof row.provider_profile_id === "string" ? { id: row.provider_profile_id, name: null, status: null } : null,
    photos: [],
    history: [],
  };
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  if (!validUuid(id)) return NextResponse.json({ error: "Identifiant incident invalide." }, { status: 400 });

  const { userId, role } = guard.auth;
  let currentQuery = dbAny.from("maintenance_incidents").select("*").eq("id", id);
  if (role !== "admin" && role !== "super_admin") currentQuery = currentQuery.eq("concierge_profile_id", userId);
  const { data: current, error: readError } = await currentQuery.maybeSingle<Record<string, unknown>>();
  if (readError) return NextResponse.json({ error: "Lecture incident impossible." }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Incident introuvable." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.status === "string") {
    const currentStatus = String(current.status ?? "reported");
    if (!TRANSITIONS[currentStatus]?.has(body.status)) {
      return NextResponse.json({ error: `Transition ${currentStatus} vers ${body.status} interdite.` }, { status: 409 });
    }
    updates.status = body.status;
  }
  if (typeof body.priority === "string") {
    if (!PRIORITIES.has(body.priority)) return NextResponse.json({ error: "Priorite invalide." }, { status: 400 });
    updates.priority = body.priority;
  }
  if (body.providerProfileId !== undefined) {
    if (body.providerProfileId !== null && !validUuid(body.providerProfileId)) {
      return NextResponse.json({ error: "Artisan invalide." }, { status: 400 });
    }
    if (body.providerProfileId !== null) {
      const { data: provider, error: providerError } = await dbAny
        .from("profiles")
        .select("id")
        .eq("id", body.providerProfileId)
        .in("role", ["provider", "provider_pro", "artisan", "artisan_pro"])
        .maybeSingle();
      if (providerError) return NextResponse.json({ error: "Verification artisan impossible." }, { status: 500 });
      if (!provider) return NextResponse.json({ error: "Profil artisan introuvable." }, { status: 400 });
    }
    updates.provider_profile_id = body.providerProfileId;
  }
  if (body.missionId !== undefined) {
    if (body.missionId !== null && !validUuid(body.missionId)) return NextResponse.json({ error: "Mission invalide." }, { status: 400 });
    updates.mission_id = body.missionId;
  }
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: "Aucune modification valide." }, { status: 400 });

  let updateQuery = dbAny.from("maintenance_incidents").update(updates).eq("id", id);
  if (role !== "admin" && role !== "super_admin") updateQuery = updateQuery.eq("concierge_profile_id", userId);
  const { data, error } = await updateQuery.select("*").single<Record<string, unknown>>();
  if (error || !data) return NextResponse.json({ error: "Modification incident impossible." }, { status: 500 });
  return NextResponse.json(mapIncident(data));
}