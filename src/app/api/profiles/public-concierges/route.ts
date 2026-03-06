import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { buildPublicConciergeRecommendations } from "./shared";

const isSchemaDriftError = (code: string | undefined): boolean =>
  code === "42P01" || code === "42703";

export async function GET() {
  try {
    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, company_name, city, service_area, hourly_rate, monthly_rate, option, availability_hours, role, years_experience",
      )
      .in("role", ["concierge", "concierge_pro"])
      .limit(18);

    let conciergeRows = (profiles ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      username: string | null;
      company_name: string | null;
      city: string | null;
      service_area: string | null;
      hourly_rate: number | null;
      monthly_rate: number | null;
      option: string | null;
      availability_hours: string | null;
      role: string | null;
      years_experience: number | null;
    }>;

    if (profilesError?.code === "42703") {
      const { data: fallbackProfiles, error: fallbackProfilesError } = await db
        .from("profiles")
        .select(
          "id, first_name, last_name, username, company_name, city, service_area, hourly_rate, monthly_rate, option, role",
        )
        .in("role", ["concierge", "concierge_pro"])
        .limit(18);

      if (fallbackProfilesError) {
        return NextResponse.json({ error: "Erreur lecture concierges." }, { status: 500 });
      }

      conciergeRows = ((fallbackProfiles ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        company_name: string | null;
        city: string | null;
        service_area: string | null;
        hourly_rate: number | null;
        monthly_rate: number | null;
        option: string | null;
        role: string | null;
      }>).map((profile) => ({
        ...profile,
        availability_hours: null,
        years_experience: null,
      }));
    } else if (profilesError?.code === "42P01") {
      console.warn(
        "[GET /api/profiles/public-concierges] profiles table missing, returning empty recommendations",
      );
      return NextResponse.json({ items: [] });
    } else if (profilesError) {
      return NextResponse.json({ error: "Erreur lecture concierges." }, { status: 500 });
    }
    const profileIds = conciergeRows.map((profile) => profile.id);

    const { data: reviews, error: reviewsError } = await db
      .from("mission_reviews")
      .select("reviewed_profile_id, rating, comment, created_at")
      .in(
        "reviewed_profile_id",
        profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"],
      );

    if (reviewsError && !isSchemaDriftError(reviewsError.code)) {
      return NextResponse.json({ error: "Erreur lecture avis." }, { status: 500 });
    }

    if (reviewsError && isSchemaDriftError(reviewsError.code)) {
      console.warn(
        `[GET /api/profiles/public-concierges] mission_reviews unavailable (code=${reviewsError.code}), returning recommendations without reviews`,
      );
    }

    const items = buildPublicConciergeRecommendations(
      conciergeRows,
      ((reviewsError && isSchemaDriftError(reviewsError.code) ? [] : reviews) ?? []) as Array<{
        reviewed_profile_id: string | null;
        rating: number | null;
        comment: string | null;
        created_at: string | null;
      }>,
    );

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[GET /api/profiles/public-concierges] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
