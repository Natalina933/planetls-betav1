import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

function schemaMissing(error: { code?: string; message?: string } | null) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("maintenance_incidents");
}

function optionalUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function mapIncident(row: Record<string, unknown>, media: Record<string, unknown>[] = []) {
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
    photos: media.map((item) => ({
      id: String(item.id),
      label: typeof item.label === "string" ? item.label : null,
      url: `/api/concierge/maintenance/${row.id}/media/${item.id}/download`,
      created_at: typeof item.created_at === "string" ? item.created_at : null,
    })),
    history: [],
  };
}

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  let query = dbAny.from("maintenance_incidents").select("*");
  if (role !== "admin" && role !== "super_admin") query = query.eq("concierge_profile_id", userId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) {
    if (schemaMissing(error)) return NextResponse.json({ items: [], schema_ready: false });
    return NextResponse.json({ error: "Chargement maintenance impossible." }, { status: 500 });
  }
  const rows = (data ?? []) as Record<string, unknown>[];
  const incidentIds = rows.map((row) => String(row.id));
  const { data: media, error: mediaError } = incidentIds.length > 0
    ? await dbAny.from("maintenance_incident_media").select("id, incident_id, label, created_at").in("incident_id", incidentIds).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (mediaError) return NextResponse.json({ error: "Chargement preuves maintenance impossible." }, { status: 500 });
  const mediaRows = (media ?? []) as Record<string, unknown>[];
  return NextResponse.json({
    items: rows.map((row) => mapIncident(row, mediaRows.filter((item) => item.incident_id === row.id))),
    schema_ready: true,
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const priority = typeof body.priority === "string" && PRIORITIES.has(body.priority) ? body.priority : "normal";
  if (title.length < 3 || title.length > 160) {
    return NextResponse.json({ error: "Titre incident invalide." }, { status: 400 });
  }
  if (description.length > 5000) return NextResponse.json({ error: "Description trop longue." }, { status: 400 });

  const { data, error } = await dbAny.from("maintenance_incidents").insert({
    concierge_profile_id: guard.auth.userId,
    owner_profile_id: optionalUuid(body.ownerProfileId),
    provider_profile_id: optionalUuid(body.providerProfileId),
    mission_id: optionalUuid(body.missionId),
    housing_id: optionalUuid(body.housingId),
    title,
    description: description || null,
    property_label: typeof body.propertyLabel === "string" ? body.propertyLabel.trim().slice(0, 240) || null : null,
    priority,
  }).select("*").single<Record<string, unknown>>();
  if (error || !data) {
    if (schemaMissing(error)) return NextResponse.json({ error: "Migration maintenance non appliquee.", schema_ready: false }, { status: 503 });
    return NextResponse.json({ error: "Creation incident impossible." }, { status: 500 });
  }
  return NextResponse.json(mapIncident(data), { status: 201 });
}