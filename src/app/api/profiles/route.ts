import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { db } from "@/server/db/dbServer";
import { normalizeProfileLocationFields } from "../../lib/profileLocation.ts";
import { fetchCurrentProfile } from "@/server/profiles/currentProfile";

const VALID_PROFILE_ROLES = new Set([
  "owner",
  "owner_pro",
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
  "admin",
  "super_admin",
]);

type ProfileUpdateValue = string | number | boolean | null;
type ProfileUpdatePayload = Partial<Record<string, ProfileUpdateValue>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assignString = (
  source: Record<string, unknown>,
  target: ProfileUpdatePayload,
  key: string,
) => {
  const value = source[key];
  if (typeof value === "string" || value === null) {
    target[key] = value;
  }
};

const assignNumber = (
  source: Record<string, unknown>,
  target: ProfileUpdatePayload,
  key: string,
) => {
  const value = source[key];
  if ((typeof value === "number" && Number.isFinite(value)) || value === null) {
    target[key] = value;
  }
};

const assignBoolean = (
  source: Record<string, unknown>,
  target: ProfileUpdatePayload,
  key: string,
) => {
  const value = source[key];
  if (typeof value === "boolean" || value === null) {
    target[key] = value;
  }
};

export async function PATCH(req: NextRequest) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const updateData: ProfileUpdatePayload = {};
    let onboardingWasComplete = false;
    const onboardingCompleteInput =
      typeof body.onboarding_complete === "boolean" ? body.onboarding_complete : null;

    [
      "username",
      "first_name",
      "last_name",
      "phone",
      "avatar_url",
      "additional_info",
      "category",
      "location",
      "option",
      "search_target",
      "company_name",
      "legal_form",
      "siret",
      "siren",
      "vat_number",
      "street_address",
      "postal_code",
      "city",
      "country",
      "website",
      "linkedin",
      "instagram",
      "facebook",
      "insurance_number",
      "insurance_company",
      "certifications",
      "service_area",
      "availability_hours",
      "iban",
      "bic",
    ].forEach((key) => assignString(body, updateData, key));

    [
      "avatar_scale",
      "avatar_offset_x",
      "avatar_offset_y",
      "avatar_rotation",
      "travel_fee",
      "service_radius_km",
      "hourly_rate",
      "monthly_rate",
      "years_experience",
    ].forEach((key) => assignNumber(body, updateData, key));

    ["emergency_service"].forEach((key) => assignBoolean(body, updateData, key));

    if (
      "location" in updateData ||
      "service_area" in updateData ||
      "city" in updateData
    ) {
      Object.assign(updateData, normalizeProfileLocationFields(updateData));
    }

    if (typeof body.role === "string" && isAdmin && VALID_PROFILE_ROLES.has(body.role)) {
      updateData.role = body.role;
    }

    if (body.experience_level !== undefined) {
      const validLevels = ["debutant", "intermediaire", "experimente"];
      if (
        body.experience_level === null ||
        (typeof body.experience_level === "string" &&
          validLevels.includes(body.experience_level))
      ) {
        updateData.experience_level = body.experience_level;
      }
    }

    if (onboardingCompleteInput !== null) {
      const { data: currentProfile, error: onboardingReadError } = await db
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (onboardingReadError) {
        console.error("[PATCH /api/profiles] onboarding read error:", onboardingReadError);
        return NextResponse.json({ error: "Erreur lecture onboarding" }, { status: 500 });
      }

      onboardingWasComplete = currentProfile?.onboarding_complete === true;
      updateData.onboarding_complete = onboardingCompleteInput;
      updateData.onboarding_completed_at = onboardingCompleteInput
        ? new Date().toISOString()
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune donnee valide a mettre a jour" }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await db.from("profiles").update(updateData).eq("id", userId);
    if (error) {
      console.error("[PATCH /api/profiles] update error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    const { data: updatedProfile, error: selectError } = await fetchCurrentProfile(userId);

    if (selectError) {
      console.error("[PATCH /api/profiles] select error:", selectError);
      return NextResponse.json({ error: "Erreur recuperation profil" }, { status: 500 });
    }

    const shouldRefreshMatches =
      onboardingCompleteInput === true && onboardingWasComplete === false;

    if (shouldRefreshMatches) {
      try {
        const refreshUrl = new URL(
          "/api/concierge/match-owner-requests?limit=12",
          req.nextUrl.origin,
        );
        const refreshResponse = await fetch(refreshUrl.toString(), {
          method: "POST",
          headers: {
            cookie: req.headers.get("cookie") ?? "",
          },
          cache: "no-store",
        });

        if (!refreshResponse.ok) {
          console.error(
            "[PATCH /api/profiles] onboarding match refresh failed:",
            refreshResponse.status,
          );
        }
      } catch (refreshError) {
        console.error("[PATCH /api/profiles] onboarding match refresh error:", refreshError);
      }
    }

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[PATCH /api/profiles] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
