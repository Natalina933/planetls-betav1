import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import {
  applyConciergeSearchFilters,
  buildAvailableConciergeFilters,
  buildConciergeSearchFilters,
  mapPropertyTypesByProfile,
  parseProfileServices,
} from "./shared";

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);

type ConciergeProfileRow = {
  id: string;
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
  experience_level: string | null;
  years_experience: number | null;
  option: string | null;
  availability_hours: string | null;
  role: string | null;
};

type ConciergeReviewRow = {
  reviewed_profile_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

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

    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, company_name, city, country, service_area, service_radius_km, hourly_rate, monthly_rate, experience_level, years_experience, option, availability_hours, role",
      )
      .in("role", filters.proOnly ? ["concierge_pro"] : ["concierge", "concierge_pro"])
      .limit(filters.limit * 3);

    if (profilesError) {
      return NextResponse.json({ error: "Erreur chargement concierges." }, { status: 500 });
    }

    const conciergeRows = (profiles ?? []) as ConciergeProfileRow[];
    const profileIds = conciergeRows.map((profile) => profile.id);

    const { data: reviews, error: reviewsError } = await db
      .from("mission_reviews")
      .select("reviewed_profile_id, rating, comment, created_at")
      .in("reviewed_profile_id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

    if (reviewsError) {
      return NextResponse.json({ error: "Erreur chargement avis concierges." }, { status: 500 });
    }

    const { data: pricingPackages, error: pricingPackagesError } = await db
      .from("pricing_packages")
      .select("profile_id, property_type")
      .in(
        "profile_id",
        profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"],
      );

    if (pricingPackagesError) {
      return NextResponse.json(
        { error: "Erreur chargement specialites logements." },
        { status: 500 },
      );
    }

    const ratingsByProfile = new Map<string, number[]>();
    const latestReviewByProfile = new Map<string, { comment: string | null; created_at: string | null }>();
    (reviews as ConciergeReviewRow[] | null ?? []).forEach((review) => {
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

    const propertyTypesByProfile = mapPropertyTypesByProfile(pricingPackages ?? []);

    const enrichedResults = conciergeRows
      .map((profile) => {
        const displayName =
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
          profile.company_name ||
          profile.username ||
          "Concierge";
        const services = parseProfileServices(profile.option, profile.availability_hours);
        const ratings = ratingsByProfile.get(profile.id) ?? [];
        const averageRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
            : null;
        const latestReview = latestReviewByProfile.get(profile.id);

        return {
          id: profile.id,
          display_name: displayName,
          city: profile.city,
          country: profile.country,
          service_area: profile.service_area,
          service_radius_km: profile.service_radius_km,
          hourly_rate: profile.hourly_rate,
          monthly_rate: profile.monthly_rate,
          experience_level: profile.experience_level,
          years_experience: profile.years_experience,
          services,
          property_types: propertyTypesByProfile.get(profile.id) ?? [],
          is_pro: profile.role === "concierge_pro",
          average_rating: averageRating,
          reviews_count: ratings.length,
          latest_review_comment: latestReview?.comment ?? null,
          latest_review_at: latestReview?.created_at ?? null,
        };
      });

    const results = applyConciergeSearchFilters(enrichedResults, filters);
    const availableFilters = buildAvailableConciergeFilters(enrichedResults);

    return NextResponse.json({
      filters: {
        city: filters.city || null,
        services: filters.services,
        pro_only: filters.proOnly,
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
