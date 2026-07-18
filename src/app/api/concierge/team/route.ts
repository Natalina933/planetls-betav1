import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const TEAM_ROLES = new Set(["manager", "lead", "employee", "collaborator", "provider"]);
const AVAILABILITIES = new Set(["available", "busy", "offline"]);

function schemaMissing(error: { code?: string; message?: string } | null) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("concierge_team_members");
}

function mapMember(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name ?? "Membre"),
    role: typeof row.role === "string" ? row.role : "collaborator",
    title: typeof row.title === "string" ? row.title : null,
    availability: typeof row.availability === "string" ? row.availability : "available",
    dailyCapacityMinutes: Number(row.daily_capacity_minutes ?? 480),
    skills: Array.isArray(row.skills) ? row.skills.filter((value): value is string => typeof value === "string") : [],
    permissions: Array.isArray(row.permissions) ? row.permissions.filter((value): value is string => typeof value === "string") : [],
    workingHours: row.working_hours && typeof row.working_hours === "object" ? row.working_hours : {},
    linkedProfileId: typeof row.linked_profile_id === "string" ? row.linked_profile_id : null,
  };
}

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId, role } = guard.auth;
  let query = dbAny.from("concierge_team_members").select("*").eq("is_active", true);
  if (role !== "admin" && role !== "super_admin") query = query.eq("concierge_profile_id", userId);
  const { data, error } = await query.order("name", { ascending: true });
  if (error) {
    if (schemaMissing(error)) return NextResponse.json({ items: [], schema_ready: false });
    return NextResponse.json({ error: "Chargement équipe impossible." }, { status: 500 });
  }
  return NextResponse.json({ items: (data ?? []).map((row: Record<string, unknown>) => mapMember(row)), schema_ready: true });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { userId } = guard.auth;
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = typeof body.role === "string" && TEAM_ROLES.has(body.role) ? body.role : "collaborator";
  const availability = typeof body.availability === "string" && AVAILABILITIES.has(body.availability)
    ? body.availability
    : "available";
  const capacity = Number(body.dailyCapacityMinutes ?? 480);
  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Nom d'équipe invalide." }, { status: 400 });
  if (!Number.isInteger(capacity) || capacity < 60 || capacity > 1440) {
    return NextResponse.json({ error: "Capacité quotidienne invalide." }, { status: 400 });
  }
  const { data, error } = await dbAny.from("concierge_team_members").insert({
    concierge_profile_id: userId,
    linked_profile_id: typeof body.linkedProfileId === "string" ? body.linkedProfileId : null,
    name,
    role,
    title: typeof body.title === "string" ? body.title.trim() || null : null,
    availability,
    daily_capacity_minutes: capacity,
    skills: Array.isArray(body.skills) ? body.skills.filter((value: unknown) => typeof value === "string").slice(0, 30) : [],
    permissions: Array.isArray(body.permissions) ? body.permissions.filter((value: unknown) => typeof value === "string").slice(0, 30) : [],
    working_hours: body.workingHours && typeof body.workingHours === "object" ? body.workingHours : {},
  }).select("*").single<Record<string, unknown>>();
  if (error || !data) {
    if (schemaMissing(error)) return NextResponse.json({ error: "Migration équipe non appliquée.", schema_ready: false }, { status: 503 });
    return NextResponse.json({ error: "Création du membre impossible." }, { status: 500 });
  }
  return NextResponse.json(mapMember(data), { status: 201 });
}