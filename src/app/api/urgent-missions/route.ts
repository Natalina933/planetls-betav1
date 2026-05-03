import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import {
  type ConciergeMatchCandidate,
  buildUrgentMissionMatches,
  buildUrgentMissionMetadata,
  type ConciergeProfileRow,
  deriveUrgentMissionTitle,
  normalizeUrgentMissionType,
  type ReviewRow,
  sanitizeUrgentMissionPayload,
} from "@/app/lib/urgentMissions";

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
// Legacy Supabase typing is incomplete on urgent mission tables in this project.
const dbAny = asLooseSupabaseClient(db);

type UrgentMissionRow = {
  property_address: string;
  mission_type: string;
  [key: string]: unknown;
};

async function loadConciergeMatches(
  propertyAddress: string,
  missionType: "check-in" | "check-out",
): Promise<ConciergeMatchCandidate[]> {
  const { data: profiles, error: profilesError } = await dbAny
    .from("profiles")
    .select(
      "id, first_name, last_name, username, company_name, city, country, service_area, service_radius_km, hourly_rate, emergency_service, is_available_for_urgent, max_radius_km, response_time_avg, availability_hours, role",
    )
    .in("role", ["concierge", "concierge_pro"]);

  if (profilesError) {
    throw new Error("Impossible de charger les concierges compatibles.");
  }

  const profileIds = (profiles ?? []).map((profile: ConciergeProfileRow) => profile.id);
  const { data: reviews, error: reviewsError } = await dbAny
    .from("mission_reviews")
    .select("reviewed_profile_id, rating")
    .in(
      "reviewed_profile_id",
      profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"],
    );

  if (reviewsError) {
    throw new Error("Impossible de charger les avis concierge.");
  }

  return buildUrgentMissionMatches({
    address: propertyAddress,
    missionType,
    profiles: (profiles ?? []) as ConciergeProfileRow[],
    reviews: (reviews ?? []) as ReviewRow[],
  });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") ?? "owner";
    const horizon = url.searchParams.get("horizon") ?? "today";
    const radiusFilter = Number(url.searchParams.get("radius") ?? "0");

    if (scope === "opportunities") {
      if (!CONCIERGE_ROLES.has(auth.role)) {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 });
      }

      const { data: conciergeProfile, error: conciergeError } = await dbAny
        .from("profiles")
        .select(
          "id, first_name, last_name, username, company_name, city, country, service_area, service_radius_km, hourly_rate, emergency_service, is_available_for_urgent, max_radius_km, response_time_avg, availability_hours, role",
        )
        .eq("id", auth.userId)
        .single();

      if (conciergeError || !conciergeProfile) {
        return NextResponse.json({ error: "Profil concierge introuvable" }, { status: 404 });
      }

      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() + (horizon === "tomorrow" ? 2 : 1));

      const { data: missions, error: missionsError } = await dbAny
        .from("urgent_missions")
        .select("*")
        .eq("status", "open")
        .gte("scheduled_at", now.toISOString())
        .lt("scheduled_at", end.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(40);

      if (missionsError) {
        return NextResponse.json({ error: "Erreur chargement missions urgentes" }, { status: 500 });
      }

      const items = (missions ?? [])
        .map((mission: UrgentMissionRow) => {
          const matches = buildUrgentMissionMatches({
            address: mission.property_address,
            missionType: normalizeUrgentMissionType(mission.mission_type),
            profiles: [conciergeProfile],
            reviews: [],
          });
          const ownMatch = matches[0];
          if (!ownMatch) return null;
          if (radiusFilter > 0 && ownMatch.distance_km > radiusFilter) return null;
          return {
            ...mission,
            own_match: ownMatch,
          };
        })
        .filter(Boolean);

      return NextResponse.json({ items });
    }

    if (!OWNER_ROLES.has(auth.role) && !CONCIERGE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const column = scope === "concierge" ? "accepted_by" : "owner_id";
    const { data, error } = await dbAny
      .from("urgent_missions")
      .select("*")
      .eq(column, auth.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: "Erreur chargement missions urgentes" }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("[GET /api/urgent-missions] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    const body = await req.json();
    const payload = sanitizeUrgentMissionPayload(body);
    const matches: ConciergeMatchCandidate[] = await loadConciergeMatches(
      payload.property_address,
      payload.mission_type,
    );

    const estimatedPrice =
      matches.length > 0
        ? Math.round(
            matches
              .map((item) => item.estimated_price)
              .filter((value): value is number => typeof value === "number")
              .slice(0, 3)
              .reduce((sum, value, _, array) => sum + value / array.length, 0),
          )
        : null;

    const metadata = buildUrgentMissionMetadata({
      matches,
      ownerAuthenticated: Boolean(auth.userId),
    });

    const { data: createdMission, error: createError } = await dbAny
      .from("urgent_missions")
      .insert({
        title: deriveUrgentMissionTitle(payload.mission_type, payload.property_address),
        property_address: payload.property_address,
        mission_type: payload.mission_type,
        scheduled_at: payload.scheduled_at,
        owner_id: auth.userId ?? null,
        status: "open",
        accepted_by: null,
        price: estimatedPrice,
        payment_status: "pending",
        traveler_count: payload.traveler_count,
        spoken_language: payload.spoken_language,
        special_instructions: payload.special_instructions,
        key_handover_type: payload.key_handover_type,
        contact_phone: payload.contact_phone,
        contact_email: payload.contact_email,
        broadcast_sent_at: new Date().toISOString(),
        metadata,
      })
      .select("*")
      .single();

    if (createError || !createdMission) {
      console.error("[POST /api/urgent-missions] DB error:", createError);
      return NextResponse.json({ error: "Impossible de creer la mission urgente" }, { status: 500 });
    }

    return NextResponse.json(
      {
        mission: createdMission,
        matches,
        broadcast_count: matches.length,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
