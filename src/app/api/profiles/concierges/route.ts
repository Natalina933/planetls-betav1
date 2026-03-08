import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { normalizeProfileLocationFields } from "../../../lib/profileLocation.ts";
import {
  applyConciergeSearchFilters,
  buildAvailableConciergeFilters,
  buildConciergeSearchFilters,
  mapPropertyTypesByProfile,
  isProfileAvailableNow,
  normalizeSearchValue,
  parseProfileServices,
} from "./shared";

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
const isSchemaDriftError = (code: string | undefined): boolean =>
  code === "42P01" || code === "42703";

type ConciergeProfileRow = {
  id: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  company_name: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  service_area: string | null;
  location: string | null;
  service_radius_km: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  experience_level: string | null;
  years_experience: number | null;
  option: string | null;
  availability_hours: string | null;
  emergency_service: boolean | null;
  role: string | null;
};

type ConciergeReviewRow = {
  reviewed_profile_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

type PricingPackageRow = {
  profile_id: string;
  property_type: string | null;
};

type ServiceCatalogRow = {
  category: string | null;
  service: string | null;
};

async function loadConciergeProfiles(limit: number, proOnly: boolean): Promise<ConciergeProfileRow[]> {
  const targetRoles = proOnly ? ["concierge_pro"] : ["concierge", "concierge_pro"];
  const { data: profiles, error: profilesError } = await db
    .from("profiles")
    .select(
    "id, avatar_url, first_name, last_name, username, company_name, city, postal_code, country, service_area, location, service_radius_km, hourly_rate, monthly_rate, experience_level, years_experience, option, availability_hours, emergency_service, role",
    )
    .in("role", targetRoles)
    .limit(limit);

  if (!profilesError) {
    return (profiles ?? []) as ConciergeProfileRow[];
  }

  if (!isSchemaDriftError(profilesError.code)) {
    console.error("[GET /api/profiles/concierges] profiles error:", profilesError);
    throw new Error("Erreur chargement concierges.");
  }

  const { data: fallbackProfiles, error: fallbackError } = await db
    .from("profiles")
    .select(
      "id, avatar_url, first_name, last_name, username, company_name, city, country, service_area, service_radius_km, hourly_rate, monthly_rate, years_experience, option, role",
    )
    .in("role", targetRoles)
    .limit(limit);

  if (fallbackError) {
    console.error("[GET /api/profiles/concierges] fallback profiles error:", fallbackError);
    throw new Error("Erreur chargement concierges.");
  }

  return ((fallbackProfiles ?? []) as Array<{
    id: string;
    avatar_url?: string | null;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    company_name: string | null;
    city: string | null;
    country: string | null;
    service_area: string | null;
    service_radius_km: number | null;
    hourly_rate: number | null;
    monthly_rate: number | null;
    years_experience: number | null;
    option: string | null;
    role: string | null;
  }>).map((profile) => ({
    ...profile,
    avatar_url: profile.avatar_url ?? null,
    postal_code: null,
    location: null,
    experience_level: null,
    availability_hours: null,
    emergency_service: null,
  }));
}

async function loadPricingPackages(profileIds: string[]): Promise<PricingPackageRow[]> {
  const safeIds =
    profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"];

  const { data: pricingPackages, error: pricingPackagesError } = await db
    .from("pricing_packages")
    .select("profile_id, property_type")
    .in("profile_id", safeIds);

  if (!pricingPackagesError) {
    return (pricingPackages ?? []) as PricingPackageRow[];
  }

  if (isSchemaDriftError(pricingPackagesError.code)) {
    console.warn(
      `[GET /api/profiles/concierges] pricing_packages unavailable (code=${pricingPackagesError.code}), continuing without property types`,
    );
    return [];
  }

  console.error("[GET /api/profiles/concierges] pricing packages error:", pricingPackagesError);
  throw new Error("Erreur chargement specialites logements.");
}

async function loadConciergeReviews(profileIds: string[]): Promise<ConciergeReviewRow[]> {
  const safeIds =
    profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"];

  const { data: reviews, error: reviewsError } = await db
    .from("mission_reviews")
    .select("reviewed_profile_id, rating, comment, created_at")
    .in("reviewed_profile_id", safeIds);

  if (!reviewsError) {
    return (reviews ?? []) as ConciergeReviewRow[];
  }

  if (isSchemaDriftError(reviewsError.code)) {
    console.warn(
      `[GET /api/profiles/concierges] mission_reviews unavailable (code=${reviewsError.code}), continuing without reviews`,
    );
    return [];
  }

  console.error("[GET /api/profiles/concierges] reviews error:", reviewsError);
  throw new Error("Erreur chargement avis concierges.");
}

async function loadServiceCatalog(): Promise<ServiceCatalogRow[]> {
  const { data, error } = await db.from("services_catalog").select("category, service");
  if (error) {
    console.error("[GET /api/profiles/concierges] services_catalog error:", error);
    throw new Error("Erreur chargement catalogue services.");
  }

  return (data ?? []) as ServiceCatalogRow[];
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!OWNER_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const filters = buildConciergeSearchFilters(url.searchParams);

    const conciergeRows = await loadConciergeProfiles(filters.limit * 3, filters.proOnly);
    const profileIds = conciergeRows.map((profile) => profile.id);

    const reviews = await loadConciergeReviews(profileIds);
    const pricingPackages = await loadPricingPackages(profileIds);
    const serviceCatalog = await loadServiceCatalog();
    const categoryByService = new Map<string, string>();
    serviceCatalog.forEach((entry) => {
      const category = typeof entry.category === "string" ? entry.category.trim() : "";
      const service = typeof entry.service === "string" ? entry.service.trim() : "";
      if (!category || !service) return;
      categoryByService.set(normalizeSearchValue(service), category);
    });

    const ratingsByProfile = new Map<string, number[]>();
    const latestReviewByProfile = new Map<string, { comment: string | null; created_at: string | null }>();
    reviews.forEach((review) => {
      if (typeof review.reviewed_profile_id !== "string" || typeof review.rating !== "number") return;
      if (!ratingsByProfile.has(review.reviewed_profile_id)) {
        ratingsByProfile.set(review.reviewed_profile_id, []);
      }
      ratingsByProfile.get(review.reviewed_profile_id)?.push(review.rating);

      const existing = latestReviewByProfile.get(review.reviewed_profile_id);
      const currentTime = review.created_at ? new Date(review.created_at).getTime() : 0;
      const existingTime = existing?.created_at ? new Date(existing.created_at).getTime() : 0;
      if (!existing || currentTime >= existingTime) {
        latestReviewByProfile.set(review.reviewed_profile_id, {
          comment: review.comment ?? null,
          created_at: review.created_at ?? null,
        });
      }
    });

    const propertyTypesByProfile = mapPropertyTypesByProfile(pricingPackages);

    const enrichedResults = conciergeRows
      .map((profile) => {
        const normalizedProfile = normalizeProfileLocationFields({
          city: profile.city,
          service_area: profile.service_area,
          location: profile.location,
        });
        const displayName =
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
          profile.company_name ||
          profile.username ||
          "Concierge";
        const services = parseProfileServices(profile.option, profile.availability_hours);
        const isAvailableNow = isProfileAvailableNow({
          availabilityHours: profile.availability_hours,
          emergencyService: profile.emergency_service,
        });
        const ratings = ratingsByProfile.get(profile.id) ?? [];
        const averageRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
            : null;
        const latestReview = latestReviewByProfile.get(profile.id);

        return {
          id: profile.id,
          avatar_url: profile.avatar_url ?? null,
          display_name: displayName,
          city: normalizedProfile.city,
          postal_code: profile.postal_code,
          country: profile.country,
          service_area: normalizedProfile.service_area,
          location: normalizedProfile.location,
          service_radius_km: profile.service_radius_km,
          hourly_rate: profile.hourly_rate,
          monthly_rate: profile.monthly_rate,
          experience_level: profile.experience_level,
          years_experience: profile.years_experience,
          services,
          property_types: propertyTypesByProfile.get(profile.id) ?? [],
          is_pro: profile.role === "concierge_pro",
          is_available_now: isAvailableNow,
          average_rating: averageRating,
          reviews_count: ratings.length,
          latest_review_comment: latestReview?.comment ?? null,
          latest_review_at: latestReview?.created_at ?? null,
        };
      });

    const results = applyConciergeSearchFilters(enrichedResults, filters, categoryByService);
    const availableFilters = buildAvailableConciergeFilters(enrichedResults, categoryByService);

    return NextResponse.json({
      filters: {
        region: filters.region || null,
        city: filters.city || null,
        categories: filters.categories,
        services: filters.services,
        pro_only: filters.proOnly,
        available_only: filters.availableOnly,
        property_type: filters.propertyType || null,
        budget_max: filters.budgetMax,
        radius_km: filters.radiusKm,
      },
      total: results.length,
      available_filters: availableFilters,
      items: results,
    });
  } catch (err) {
    console.error("[GET /api/profiles/concierges] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
