import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";

const ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const PROVIDER_ROLES = ["provider", "provider_pro", "artisan", "artisan_pro"];
const dbAny = asLooseSupabaseClient(db);

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
  const profileIds = (data ?? []).map((profile) => profile.id);
  const documentResult = profileIds.length
    ? await dbAny.from("provider_profile_documents")
        .select("provider_profile_id,document_type,verification_status,expires_at")
        .in("provider_profile_id", profileIds)
        .eq("verification_status", "verified")
    : { data: [], error: null };
  const documentSchemaUnavailable = Boolean(documentResult.error);
  const verifiedByProvider = new Map<string, Array<{ document_type: string; expires_at: string | null }>>();
  if (!documentResult.error) {
    ((documentResult.data ?? []) as Array<{ provider_profile_id: string; document_type: string; expires_at: string | null }>).forEach((document) => {
      verifiedByProvider.set(document.provider_profile_id, [...(verifiedByProvider.get(document.provider_profile_id) ?? []), document]);
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const items = (data ?? []).map((profile) => {
    const verifiedDocuments = (verifiedByProvider.get(profile.id) ?? []).filter((document) => !document.expires_at || document.expires_at >= today);
    return {
    id: profile.id,
    displayName: [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.company_name || profile.username || "Artisan",
    companyName: profile.company_name ?? null,
    category: profile.category ?? null,
    city: profile.city ?? null,
    serviceArea: profile.service_area ?? null,
    serviceRadiusKm: profile.service_radius_km ?? null,
    availability: profile.availability_hours ?? null,
    isPro: profile.role === "provider_pro" || profile.role === "artisan_pro",
    verification: {
      available: !documentSchemaUnavailable,
      verifiedDocumentCount: verifiedDocuments.length,
      verifiedTypes: [...new Set(verifiedDocuments.map((document) => document.document_type))],
      insuranceVerified: verifiedDocuments.some((document) => document.document_type === "insurance"),
      identityVerified: verifiedDocuments.some((document) => document.document_type === "identity"),
      companyVerified: verifiedDocuments.some((document) => document.document_type === "company"),
    },
  }; });
  return NextResponse.json({ items, verificationAvailable: !documentSchemaUnavailable });
}
