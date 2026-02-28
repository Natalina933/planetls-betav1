import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

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

const splitServices = (value: string): string[] =>
  value
    .split(/[;,|]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const parseServices = (optionValue: string | null, availabilityHours: string | null): string[] => {
  const values = new Set<string>();

  if (optionValue) {
    splitServices(optionValue).forEach((item) => values.add(item));
  }

  if (availabilityHours) {
    try {
      const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
      const missionProfile = parsed?.missionProfile as { missions?: Array<Record<string, unknown>> } | undefined;
      missionProfile?.missions?.forEach((mission) => {
        if (mission?.isActive === true && typeof mission.label === "string") {
          values.add(mission.label);
        }
      });
    } catch {
      // Ignore malformed legacy payloads.
    }
  }

  return Array.from(values);
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
    const city = (url.searchParams.get("city") ?? "").trim();
    const service = (url.searchParams.get("service") ?? "").trim();
    const proOnly =
      ["1", "true", "yes"].includes((url.searchParams.get("proOnly") ?? "").trim().toLowerCase());
    const limitRaw = Number(url.searchParams.get("limit") ?? "48");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 120) : 48;

    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, company_name, city, country, service_area, service_radius_km, hourly_rate, monthly_rate, experience_level, years_experience, option, availability_hours, role",
      )
      .in("role", proOnly ? ["concierge_pro"] : ["concierge", "concierge_pro"])
      .limit(limit * 2);

    if (profilesError) {
      return NextResponse.json({ error: "Erreur chargement concierges." }, { status: 500 });
    }

    const conciergeRows = (profiles ?? []) as ConciergeProfileRow[];
    const profileIds = conciergeRows.map((profile) => profile.id);

    const { data: reviews, error: reviewsError } = await db
      .from("mission_reviews")
      .select("reviewed_profile_id, rating")
      .in("reviewed_profile_id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

    if (reviewsError) {
      return NextResponse.json({ error: "Erreur chargement avis concierges." }, { status: 500 });
    }

    const ratingsByProfile = new Map<string, number[]>();
    (reviews ?? []).forEach((review) => {
      if (typeof review.reviewed_profile_id !== "string" || typeof review.rating !== "number") return;
      if (!ratingsByProfile.has(review.reviewed_profile_id)) {
        ratingsByProfile.set(review.reviewed_profile_id, []);
      }
      ratingsByProfile.get(review.reviewed_profile_id)?.push(review.rating);
    });

    const cityNormalized = normalize(city);
    const serviceNormalized = normalize(service);

    const results = conciergeRows
      .map((profile) => {
        const displayName =
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
          profile.company_name ||
          profile.username ||
          "Concierge";
        const services = parseServices(profile.option, profile.availability_hours);
        const ratings = ratingsByProfile.get(profile.id) ?? [];
        const averageRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
            : null;

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
          is_pro: profile.role === "concierge_pro",
          average_rating: averageRating,
          reviews_count: ratings.length,
        };
      })
      .filter((profile) => {
        if (cityNormalized) {
          const area = normalize(
            [profile.city, profile.service_area, profile.country].filter(Boolean).join(" "),
          );
          if (!area.includes(cityNormalized)) {
            return false;
          }
        }

        if (serviceNormalized) {
          const hasService = profile.services.some((item) => normalize(item).includes(serviceNormalized));
          if (!hasService) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const aRating = a.average_rating ?? -1;
        const bRating = b.average_rating ?? -1;
        if (bRating !== aRating) return bRating - aRating;
        if (b.is_pro !== a.is_pro) return Number(b.is_pro) - Number(a.is_pro);
        return a.display_name.localeCompare(b.display_name);
      })
      .slice(0, limit);

    return NextResponse.json({
      filters: {
        city: city || null,
        service: service || null,
        pro_only: proOnly,
      },
      total: results.length,
      items: results,
    });
  } catch (err) {
    console.error("[GET /api/profiles/concierges] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
