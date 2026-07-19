import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const PROVIDER_ROLES = ["provider", "provider_pro", "artisan", "artisan_pro"];

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req, ROLES);
  if (!guard.ok) return guard.response;
  const limitInput = Number(req.nextUrl.searchParams.get("limit") ?? 80);
  const limit = Number.isInteger(limitInput) ? Math.max(1, Math.min(limitInput, 200)) : 80;
  const { data, error } = await db
    .from("profiles")
    .select("id, first_name, last_name, username, company_name, city, service_area, service_radius_km, availability_hours, role, category")
    .in("role", PROVIDER_ROLES)
    .limit(limit);
  if (error) return NextResponse.json({ error: "Chargement artisans impossible." }, { status: 500 });
  const items = (data ?? []).map((profile) => ({
    id: profile.id,
    displayName: [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.company_name || profile.username || "Artisan",
    companyName: profile.company_name ?? null,
    category: profile.category ?? null,
    city: profile.city ?? null,
    serviceArea: profile.service_area ?? null,
    serviceRadiusKm: profile.service_radius_km ?? null,
    availability: profile.availability_hours ?? null,
    isPro: profile.role === "provider_pro" || profile.role === "artisan_pro",
  }));
  return NextResponse.json({ items });
}