import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";

const ALLOWED_REVIEW_ROLES = new Set([
  "owner",
  "owner_pro",
  "concierge",
  "concierge_pro",
  "admin",
  "super_admin",
]);

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const reviewedProfileId = url.searchParams.get("reviewedProfileId");
    const limitRaw = Number(url.searchParams.get("limit") ?? "12");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 12;

    let query = db
      .from("mission_reviews")
      .select("id, mission_id, reviewer_profile_id, reviewed_profile_id, rating, comment, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (reviewedProfileId) {
      query = query.eq("reviewed_profile_id", reviewedProfileId);
    } else {
      query = query.eq("reviewed_profile_id", auth.userId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Erreur chargement avis" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/reviews] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_REVIEW_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const missionId = typeof body?.mission_id === "string" ? body.mission_id.trim() : "";
    const reviewedProfileId =
      typeof body?.reviewed_profile_id === "string" ? body.reviewed_profile_id.trim() : "";
    const rating = Number(body?.rating);
    const comment =
      typeof body?.comment === "string" ? body.comment.trim() : null;

    if (!missionId || !reviewedProfileId) {
      return NextResponse.json(
        { error: "mission_id et reviewed_profile_id sont requis." },
        { status: 400 },
      );
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "La note doit etre comprise entre 1 et 5." }, { status: 400 });
    }

    const { data: mission, error: missionError } = await db
      .from("missions")
      .select("id, status, concierge_profile_id, owner_profile_id")
      .eq("id", missionId)
      .single();

    if (missionError || !mission) {
      return NextResponse.json({ error: "Mission introuvable." }, { status: 404 });
    }
    if (mission.status !== "completed") {
      return NextResponse.json(
        { error: "Un avis ne peut etre laisse que pour une mission terminee." },
        { status: 400 },
      );
    }

    const isMissionOwner = mission.owner_profile_id === auth.userId;
    const isMissionConcierge = mission.concierge_profile_id === auth.userId;
    if (!isMissionOwner && !isMissionConcierge && auth.role !== "admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "Acces refuse a cette mission." }, { status: 403 });
    }

    const expectedReviewedProfileId = isMissionOwner
      ? mission.concierge_profile_id
      : mission.owner_profile_id;

    if (expectedReviewedProfileId !== reviewedProfileId && auth.role !== "admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "Le profil cible ne correspond pas a la mission." }, { status: 400 });
    }

    const { data: existing } = await db
      .from("mission_reviews")
      .select("id")
      .eq("mission_id", missionId)
      .eq("reviewer_profile_id", auth.userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Vous avez deja laisse un avis pour cette mission." },
        { status: 409 },
      );
    }

    const { data, error } = await db
      .from("mission_reviews")
      .insert({
        mission_id: missionId,
        reviewer_profile_id: auth.userId,
        reviewed_profile_id: reviewedProfileId,
        rating,
        comment,
      })
      .select("id, mission_id, reviewer_profile_id, reviewed_profile_id, rating, comment, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Impossible de creer l'avis." }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
