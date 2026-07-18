import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const dbAny = asLooseSupabaseClient(db);
const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const TEAM_ROLES = new Set(["manager", "lead", "employee", "collaborator", "provider"]);
const AVAILABILITIES = new Set(["available", "busy", "offline"]);

function updateScopedMember(id: string, userId: string, role: string, updates: Record<string, unknown>) {
  let query = dbAny.from("concierge_team_members").update(updates).eq("id", id);
  if (role !== "admin" && role !== "super_admin") query = query.eq("concierge_profile_id", userId);
  return query;
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Nom d'equipe invalide." }, { status: 400 });
    updates.name = name;
  }
  if (typeof body.role === "string") {
    if (!TEAM_ROLES.has(body.role)) return NextResponse.json({ error: "Role invalide." }, { status: 400 });
    updates.role = body.role;
  }
  if (typeof body.availability === "string") {
    if (!AVAILABILITIES.has(body.availability)) return NextResponse.json({ error: "Disponibilite invalide." }, { status: 400 });
    updates.availability = body.availability;
  }
  if (body.dailyCapacityMinutes !== undefined) {
    const capacity = Number(body.dailyCapacityMinutes);
    if (!Number.isInteger(capacity) || capacity < 60 || capacity > 1440) {
      return NextResponse.json({ error: "Capacite quotidienne invalide." }, { status: 400 });
    }
    updates.daily_capacity_minutes = capacity;
  }
  if (typeof body.title === "string" || body.title === null) updates.title = body.title?.trim() || null;
  if (Object.keys(updates).length === 1) return NextResponse.json({ error: "Aucune modification valide." }, { status: 400 });

  const { userId, role } = guard.auth;
  const { data, error } = await updateScopedMember(id, userId, role, updates).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Modification du membre impossible." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const { userId, role } = guard.auth;
  const { data, error } = await updateScopedMember(id, userId, role, {
    is_active: false,
    updated_at: new Date().toISOString(),
  })
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Desactivation du membre impossible." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
