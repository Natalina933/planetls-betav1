import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const CONCIERGE_MISSION_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

const round2 = (value: number): number => Math.round(value * 100) / 100;
const isSchemaDriftError = (code: string | undefined): boolean =>
  code === "42P01" || code === "42703";

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (!CONCIERGE_MISSION_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { data: missions, error: missionError } = await db
      .from("missions")
      .select("status, response_time_minutes")
      .eq("concierge_profile_id", auth.userId);

    let missionRows = (missions ?? []) as Array<{
      status: string;
      response_time_minutes: number | null;
    }>;

    if (missionError?.code === "42703") {
      const { data: fallbackMissions, error: fallbackMissionsError } = await db
        .from("missions")
        .select("status")
        .eq("concierge_profile_id", auth.userId);

      if (fallbackMissionsError) {
        console.error("[GET /api/missions/kpis] fallback missions DB error:", fallbackMissionsError);
        return NextResponse.json({ error: "Erreur DB missions" }, { status: 500 });
      }

      missionRows = ((fallbackMissions ?? []) as Array<{ status: string }>).map((mission) => ({
        ...mission,
        response_time_minutes: null,
      }));
    } else if (missionError?.code === "42P01") {
      console.warn("[GET /api/missions/kpis] missions table missing, returning empty KPI payload");
      missionRows = [];
    } else if (missionError) {
      console.error("[GET /api/missions/kpis] missions DB error:", missionError);
      return NextResponse.json({ error: "Erreur DB missions" }, { status: 500 });
    }

    const { data: reviews, error: reviewsError } = await db
      .from("mission_reviews")
      .select("rating")
      .eq("reviewed_profile_id", auth.userId);

    if (reviewsError && !isSchemaDriftError(reviewsError.code)) {
      console.error("[GET /api/missions/kpis] reviews DB error:", reviewsError);
      return NextResponse.json({ error: "Erreur DB avis" }, { status: 500 });
    }

    if (reviewsError && isSchemaDriftError(reviewsError.code)) {
      console.warn(
        `[GET /api/missions/kpis] mission_reviews unavailable (code=${reviewsError.code}), ratings defaulted to empty`,
      );
    }

    const reviewRows =
      ((reviewsError && isSchemaDriftError(reviewsError.code) ? [] : reviews) ?? []) as Array<{
        rating: number | null;
      }>;

    const totalMissions = missionRows.length;
    const inProgress = missionRows.filter(
      (m) => m.status === "accepted" || m.status === "in_progress",
    ).length;
    const completed = missionRows.filter((m) => m.status === "completed").length;
    const canceled = missionRows.filter((m) => m.status === "canceled").length;

    const assignmentBase = missionRows.filter((m) =>
      ["assigned", "accepted", "in_progress", "completed", "canceled"].includes(m.status),
    ).length;
    const acceptedOrBeyond = missionRows.filter((m) =>
      ["accepted", "in_progress", "completed"].includes(m.status),
    ).length;
    const acceptanceRate = assignmentBase > 0 ? round2((acceptedOrBeyond / assignmentBase) * 100) : 0;

    const responseTimes = missionRows
      .map((m) => m.response_time_minutes)
      .filter((v): v is number => typeof v === "number");
    const avgResponseMinutes =
      responseTimes.length > 0
        ? round2(responseTimes.reduce((sum, v) => sum + v, 0) / responseTimes.length)
        : null;

    const ratings = reviewRows
      .map((r) => r.rating)
      .filter((v): v is number => typeof v === "number");
    const avgRating = ratings.length > 0 ? round2(ratings.reduce((sum, v) => sum + v, 0) / ratings.length) : null;

    return NextResponse.json({
      total_missions: totalMissions,
      in_progress: inProgress,
      completed,
      canceled,
      acceptance_rate: acceptanceRate,
      avg_response_minutes: avgResponseMinutes,
      avg_rating: avgRating,
      ratings_count: ratings.length,
    });
  } catch (err) {
    console.error("[GET /api/missions/kpis] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
