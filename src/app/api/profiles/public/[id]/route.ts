import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select(
        "id, first_name, last_name, username, avatar_url, company_name, city, country, service_area, service_radius_km, experience_level, years_experience, hourly_rate, monthly_rate, availability_hours, additional_info, role",
      )
      .eq("id", id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Erreur lecture profil public." }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    if (profile.role !== "concierge" && profile.role !== "concierge_pro") {
      return NextResponse.json({ error: "Profil non disponible publiquement." }, { status: 404 });
    }

    const { data: reviews, error: reviewsError } = await db
      .from("mission_reviews")
      .select("id, rating, comment, created_at")
      .eq("reviewed_profile_id", id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (reviewsError) {
      return NextResponse.json({ error: "Erreur lecture avis." }, { status: 500 });
    }

    const ratingValues = (reviews ?? [])
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));

    const averageRating =
      ratingValues.length > 0
        ? Math.round((ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length) * 10) / 10
        : null;

    const displayName =
      `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
      profile.company_name ||
      profile.username ||
      "Concierge";

    return NextResponse.json({
      profile: {
        id: profile.id,
        display_name: displayName,
        avatar_url: profile.avatar_url,
        company_name: profile.company_name,
        city: profile.city,
        country: profile.country,
        service_area: profile.service_area,
        service_radius_km: profile.service_radius_km,
        experience_level: profile.experience_level,
        years_experience: profile.years_experience,
        hourly_rate: profile.hourly_rate,
        monthly_rate: profile.monthly_rate,
        role: profile.role,
      },
      reviews: reviews ?? [],
      stats: {
        average_rating: averageRating,
        reviews_count: ratingValues.length,
      },
    });
  } catch (err) {
    console.error("[GET /api/profiles/public/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
