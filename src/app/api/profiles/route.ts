import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { db } from "@/server/db/dbServer";
import {
  getProfilePatchPolicy,
  sanitizeProfilePatchBody,
} from "./pure";
import { normalizeProfileLocationFields } from "../../lib/profileLocation.ts";
import { fetchCurrentProfile } from "@/server/profiles/currentProfile";
import { mergeOwnerPreferencesIntoAvailabilityHours } from "@/features/owner-preferences/profilePreferences";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatFirstName = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'-])([\p{L}])/gu, (match, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase("fr-FR")}`
    );

const formatLastName = (value: string) => value.trim().toLocaleUpperCase("fr-FR");

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role, isAdmin } = await getApiAuthContext(req);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const policy = getProfilePatchPolicy(role, isAdmin);
    const {
      ignoredFields,
      invalidNumberFields,
      onboardingCompleteInput,
      ownerPreferencesInput,
      updateData,
    } = sanitizeProfilePatchBody(body, policy);
    let onboardingWasComplete = false;
    let currentProfileForMerge:
      | {
          availability_hours?: string | null;
          onboarding_complete?: boolean | null;
        }
      | null
      | undefined;

    if (ignoredFields.length > 0) {
      console.info("[PATCH /api/profiles] ignored fields:", ignoredFields);
    }
    if (invalidNumberFields.length > 0) {
      console.info("[PATCH /api/profiles] invalid numeric fields ignored:", invalidNumberFields);
    }

    if (
      "location" in updateData ||
      "service_area" in updateData ||
      "city" in updateData
    ) {
      Object.assign(updateData, normalizeProfileLocationFields(updateData));
    }

    if (
      typeof body.role === "string" &&
      policy.allowRoleMutation &&
      VALID_PROFILE_ROLES.has(body.role)
    ) {
      updateData.role = body.role;
    }

    if (policy.allowExperienceLevel && body.experience_level !== undefined) {
      const validLevels = ["debutant", "intermediaire", "experimente"];
      if (
        updateData.experience_level === null ||
        (typeof updateData.experience_level === "string" &&
          validLevels.includes(updateData.experience_level))
      ) {
        updateData.experience_level = updateData.experience_level;
      } else {
        delete updateData.experience_level;
      }
    }

    if (typeof updateData.first_name === "string") {
      updateData.first_name = formatFirstName(updateData.first_name);
    }

    if (typeof updateData.last_name === "string") {
      updateData.last_name = formatLastName(updateData.last_name);
    }

    if (
      ownerPreferencesInput !== null ||
      (policy.booleanFields.has("onboarding_complete") && onboardingCompleteInput !== null)
    ) {
      const { data: currentProfile, error: onboardingReadError } = await db
        .from("profiles")
        .select("availability_hours, onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (onboardingReadError) {
        console.error("[PATCH /api/profiles] profile read error:", onboardingReadError);
        return NextResponse.json({ error: "Erreur lecture profil" }, { status: 500 });
      }

      currentProfileForMerge = currentProfile;
    }

    if (ownerPreferencesInput !== null) {
      updateData.availability_hours = mergeOwnerPreferencesIntoAvailabilityHours(
        currentProfileForMerge?.availability_hours ?? null,
        ownerPreferencesInput,
      );
    }

    if (policy.booleanFields.has("onboarding_complete") && onboardingCompleteInput !== null) {
      onboardingWasComplete = currentProfileForMerge?.onboarding_complete === true;
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
