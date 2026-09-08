import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { PROVIDER_ROLES } from "@/app/api/provider/shared";

// Liste des champs éditables pour un profil artisan/provider
const PROFILE_EDITABLE_FIELDS = [
  "first_name",
  "last_name",
  "username",
  "email",
  "phone",
  "company_name",
  "city",
  "postal_code",
  "country",
  "street_address",
  "service_area",
  "service_radius_km",
  "availability_hours",
  "category",
  "skills",
  "experience_level",
  "years_experience",
  "hourly_rate",
  "monthly_rate",
  "travel_fee",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "emergency_service",
  "certifications",
  "certification_date",
  "certification_expires_at",
  "certification_level",
  "certification_metadata",
  "legal_form",
  "siren",
  "siret",
  "vat_number",
  "bic",
  "iban",
  "insurance_company",
  "insurance_number",
  "additional_info",
] as const;

type ProfileEditableField = typeof PROFILE_EDITABLE_FIELDS[number];

// Champs requis pour le calcul de complétude
const COMPLETENESS_REQUIRED_FIELDS: ProfileEditableField[] = [
  "first_name",
  "last_name",
  "phone",
  "city",
  "service_area",
  "category",
  "skills",
  "experience_level",
];

const COMPLETENESS_OPTIONAL_FIELDS: ProfileEditableField[] = [
  "company_name",
  "postal_code",
  "country",
  "street_address",
  "service_radius_km",
  "availability_hours",
  "years_experience",
  "hourly_rate",
  "website",
  "certifications",
  "insurance_company",
  "insurance_number",
  "legal_form",
  "siren",
];

// Calcul de la complétude du profil
function calculateProfileCompleteness(profile: Record<string, unknown>): {
  required: number;
  optional: number;
  total: number;
  percentage: number;
} {
  const requiredFilled = COMPLETENESS_REQUIRED_FIELDS.filter(
    (field) => profile[field] !== null && profile[field] !== undefined && profile[field] !== ""
  ).length;

  const optionalFilled = COMPLETENESS_OPTIONAL_FIELDS.filter(
    (field) => profile[field] !== null && profile[field] !== undefined && profile[field] !== ""
  ).length;

  const totalFields = COMPLETENESS_REQUIRED_FIELDS.length + COMPLETENESS_OPTIONAL_FIELDS.length;
  const filledFields = requiredFilled + optionalFilled;

  return {
    required: requiredFilled,
    optional: optionalFilled,
    total: totalFields,
    percentage: Math.round((filledFields / totalFields) * 100),
  };
}

export async function GET(req: NextRequest) {
  const { userId, role } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!PROVIDER_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[provider/profile GET] DB error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Calculer la complétude
  const completeness = calculateProfileCompleteness(profile);

  return NextResponse.json(
    {
      profile,
      completeness,
      summary: {
        display_name:
          `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
          profile.company_name ||
          profile.username ||
          "Artisan",
        location: [profile.postal_code, profile.city].filter(Boolean).join(" ") ||
          profile.service_area ||
          null,
        is_pro: profile.role === "provider_pro" || profile.role === "artisan_pro",
        is_complete: completeness.percentage >= 80,
      },
    },
    { status: 200 }
  );
}

export async function PATCH(req: NextRequest) {
  const { userId, role } = await getApiAuthContext(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!PROVIDER_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // Filtrer uniquement les champs autorisés
    for (const field of PROFILE_EDITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide fourni pour la mise à jour" },
        { status: 400 }
      );
    }

    // Mettre à jour le profil
    const { data: updatedProfile, error } = await db
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        // Si on met à jour des champs requis, vérifier si l'onboarding est complet
        onboarding_complete: 
          COMPLETENESS_REQUIRED_FIELDS.every(
            (f) => updates[f] !== undefined || (body[f] !== null && body[f] !== undefined && body[f] !== "")
          ) ? true : undefined,
      })
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[provider/profile PATCH] DB error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Calculer la nouvelle complétude
    const completeness = calculateProfileCompleteness(updatedProfile);

    return NextResponse.json(
      {
        profile: updatedProfile,
        completeness,
        message: "Profil mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[provider/profile PATCH] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
