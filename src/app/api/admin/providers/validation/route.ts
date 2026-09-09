import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";

const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);
const dbAny = asLooseSupabaseClient(db);

// Champs à sélectionner pour les profils providers
type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  legal_form: string | null;
  siret: string | null;
  city: string | null;
  postal_code: string | null;
  service_area: string | null;
  service_radius_km: number | null;
  category: string | null;
  experience_level: string | null;
  years_experience: number | null;
  hourly_rate: number | null;
  created_at: string | null;
  updated_at: string | null;
  onboarding_complete: boolean;
  role: string | null;
};

type ValidationFilter = "all" | "pending" | "partial" | "complete";

// Calculer la complétude d'un profil artisan
function calculateProfileCompleteness(profile: ProfileRow): number {
  const requiredFields = [
    "first_name", "last_name", "phone", "city", 
    "service_area", "category", "experience_level"
  ] as const satisfies readonly (keyof ProfileRow)[];
  
  const optionalFields = [
    "company_name", "postal_code", "service_radius_km", 
    "years_experience", "hourly_rate",
    "website", "legal_form", "siret",
  ] as const satisfies readonly (keyof ProfileRow)[];
  
  const totalFields = requiredFields.length + optionalFields.length;
  const filledFields = [
    ...requiredFields.filter((f) => {
      const val = profile[f];
      return val !== null && val !== undefined && val !== "";
    }),
    ...optionalFields.filter((f) => {
      const val = profile[f];
      return val !== null && val !== undefined && val !== "";
    })
  ].length;
  
  return Math.round((filledFields / totalFields) * 100);
}

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req, new Set(["admin", "super_admin"]));
  if (!guard.ok) return guard.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const filter = (searchParams.get("filter") as ValidationFilter) || "all";
    const search = searchParams.get("search")?.trim() || "";

    // Récupérer tous les profils provider/artisan
    const { data: profiles, error } = await db
      .from("profiles")
      .select("id, first_name, last_name, username, email, phone, company_name, website, legal_form, siret, city, postal_code, service_area, service_radius_km, category, experience_level, years_experience, hourly_rate, created_at, updated_at, onboarding_complete, role")
      .in("role", Array.from(PROVIDER_ROLES))
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/providers/validation] profiles error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ providers: [], density_by_zone: [] }, { status: 200 });
    }

    // Récupérer tous les documents pour ces profils
    const profileIds = profiles.map((p) => p.id);
    const { data: documents, error: docsError } = await dbAny
      .from("provider_profile_documents")
      .select("provider_profile_id, document_type, verification_status")
      .in("provider_profile_id", profileIds);

    if (docsError) {
      console.error("[admin/providers/validation] documents error:", docsError);
    }

    // Grouper les documents par provider
    const documentsByProvider = new Map<string, { verified: Set<string>; pending: Set<string> }>();
    if (documents) {
      for (const doc of documents) {
        const key = doc.provider_profile_id;
        if (!documentsByProvider.has(key)) {
          documentsByProvider.set(key, { verified: new Set(), pending: new Set() });
        }
        const entry = documentsByProvider.get(key)!;
        if (doc.verification_status === "verified") {
          entry.verified.add(doc.document_type);
        } else if (doc.verification_status === "pending") {
          entry.pending.add(doc.document_type);
        }
      }
    }

    // Enrichir les profils avec les infos de complétude et documents
    const enrichedProviders = profiles.map((profile) => {
      const profileId = profile.id;
      const docsInfo = documentsByProvider.get(profileId) ?? { verified: new Set<string>(), pending: new Set<string>() };
      
      const displayName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() 
        || profile.company_name 
        || profile.username 
        || "Artisan";

      const completeness = calculateProfileCompleteness(profile);
      const hasInsurance = docsInfo.verified.has("insurance");
      const hasIdentity = docsInfo.verified.has("identity");
      const hasCompany = docsInfo.verified.has("company");

      return {
        id: profileId,
        displayName,
        companyName: profile.company_name,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        service_area: profile.service_area,
        service_radius_km: profile.service_radius_km,
        category: profile.category,
        experience_level: profile.experience_level,
        years_experience: profile.years_experience,
        hourly_rate: profile.hourly_rate,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        onboarding_complete: profile.onboarding_complete,
        profile_completeness: completeness,
        pending_documents_count: docsInfo.pending.size,
        verified_documents_count: docsInfo.verified.size,
        has_insurance: hasInsurance,
        has_identity: hasIdentity,
        has_company: hasCompany,
      };
    });

    // Filtrer selon le filtre demandé
    let filteredProviders = enrichedProviders;
    if (filter === "pending") {
      filteredProviders = enrichedProviders.filter((p) => p.pending_documents_count > 0);
    } else if (filter === "partial") {
      filteredProviders = enrichedProviders.filter((p) => p.pending_documents_count > 0 && p.verified_documents_count > 0);
    } else if (filter === "complete") {
      filteredProviders = enrichedProviders.filter((p) => p.pending_documents_count === 0 && p.verified_documents_count > 0);
    }

    // Filtrer par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProviders = filteredProviders.filter((p) => 
        p.displayName.toLowerCase().includes(searchLower) ||
        (p.city?.toLowerCase().includes(searchLower) ?? false) ||
        (p.category?.toLowerCase().includes(searchLower) ?? false) ||
        (p.companyName?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Calculer la densité par zone
    const zoneDensity = new Map<string, { count: number; verified: number; pending: number }>();
    for (const p of enrichedProviders) {
      const zone = p.service_area || p.city || "Inconnu";
      if (!zoneDensity.has(zone)) {
        zoneDensity.set(zone, { count: 0, verified: 0, pending: 0 });
      }
      const entry = zoneDensity.get(zone)!;
      entry.count++;
      entry.verified += p.verified_documents_count;
      entry.pending += p.pending_documents_count;
    }

    // Convertir en tableau trié par nombre d'artisans
    const densityByZone = Array.from(zoneDensity.entries())
      .map(([zone, stats]) => ({ zone, ...stats }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      { 
        providers: filteredProviders,
        density_by_zone: densityByZone,
        total: enrichedProviders.length,
        pending: enrichedProviders.filter((p) => p.pending_documents_count > 0).length,
        partial: enrichedProviders.filter((p) => p.pending_documents_count > 0 && p.verified_documents_count > 0).length,
        complete: enrichedProviders.filter((p) => p.pending_documents_count === 0 && p.verified_documents_count > 0).length,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("[admin/providers/validation] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
