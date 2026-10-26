import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Database } from "@/types/supabase";

import {
  geocodeLocation,
  isGeocodingServiceError,
} from "@/server/location/geocodeLocation";

import { evaluateProfessionalCoverage } from "./coverage";
import { conciergePublication, isConciergeRole } from "../../../lib/conciergePublication";
import { isSearchPoint } from "@/features/owner-concierges/lib/geography";
import { applyConciergeSearchFilters, buildConciergeSearchFilters, buildAvailableConciergeFilters, mapPropertyTypesByProfile, parseProfileServices, isProfileAvailableNow } from "@/app/api/profiles/concierges/shared";

import {
  getProfessionalType,
  getProfessionalServices,
  professionalMatchesServices,
  professionalMatchesType,
  professionalIsSearchable,
} from "@/app/lib/professionalSearchMatching";

import {
  PROFESSIONAL_PAGE_SIZE,
  PROFESSIONAL_MAX_PAGES,
  getProfessionalPageRange,
  hasReachedProfessionalPageLimit,
} from "@/app/lib/professionalSearchPagination";

import type {
  ProfessionalSearchRow,
  ProfessionalSearchType,
} from "@/app/lib/professionalSearchTypes";

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);

const PROFESSIONAL_ROLES = [
  "concierge",
  "concierge_pro",
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
];

type ProfessionalProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "role" | "first_name" | "last_name" | "username" | "company_name" |
  "avatar_url" | "image" | "city" | "postal_code" | "country" | "service_area" |
  "location" | "latitude" | "longitude" | "service_radius_km" | "hourly_rate" |
  "monthly_rate" | "experience_level" | "years_experience" | "option" |
  "availability_hours" | "emergency_service" | "category" | "status">;

const PROFILE_SELECT = [
  "id",
  "role",
  "first_name",
  "last_name",
  "username",
  "company_name",
  "avatar_url",
  "image",
  "city",
  "postal_code",
  "country",
  "service_area",
  "location",
  "latitude",
  "longitude",
  "service_radius_km",
  "hourly_rate",
  "monthly_rate",
  "experience_level",
  "years_experience",
  "option",
  "availability_hours",
  "emergency_service",
  "category",
  "status",
].join(", ");

export async function GET(req: NextRequest) {
  try {
    // 1. Authentification
    const auth = await getApiAuthContext(req);

    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Autorisation
    if (!OWNER_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 3. Paramètres de recherche
    const params = req.nextUrl.searchParams;
    const requestedType = params.get("type") ?? "all";

    if (!["all", "concierge", "provider"].includes(requestedType)) {
      return NextResponse.json(
        { error: "Type de professionnel invalide" },
        { status: 400 },
      );
    }

    const type = requestedType as ProfessionalSearchType;

    const requestedServices = [
      ...new Set(
        (params.get("services") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    // 4. Paramètres géographiques
    const geographic = params.get("geographic") === "1";
    const city = params.get("city")?.trim() ?? "";

    const rawRadius = params.get("radiusKm");
    const parsedRadius = rawRadius === null ? 20 : Number(rawRadius);

    if (
      geographic &&
      (!city ||
        !Number.isFinite(parsedRadius) ||
        parsedRadius <= 0 ||
        parsedRadius > 200)
    ) {
      return NextResponse.json(
        { error: "Ville ou rayon de recherche invalide" },
        { status: 400 },
      );
    }

    const radiusKm = parsedRadius;
    const filters = buildConciergeSearchFilters(params);

    // 5. Détermination du centre géographique
    let center: {
      latitude: number;
      longitude: number;
    } | null = null;

    if (geographic) {
      try {
        center = await geocodeLocation(city);
      } catch (error) {
        if (!isGeocodingServiceError(error)) {
          throw error;
        }

        return NextResponse.json(
          {
            error: "Service de localisation temporairement indisponible",
          },
          { status: 503 },
        );
      }

      if (!isSearchPoint(center)) {
        return NextResponse.json(
          {
            error: "Ville introuvable. Choisissez une ville reconnue.",
          },
          { status: 422 },
        );
      }
    }

    // 6. Rôles recherchés
    const roles =
      type === "concierge"
        ? ["concierge", "concierge_pro"]
        : type === "provider"
          ? ["provider", "provider_pro", "artisan", "artisan_pro"]
          : PROFESSIONAL_ROLES;

    // 7. Chargement paginé des profils
    const allProfiles: ProfessionalProfileRow[] = [];

    let pageCount = 0;
    let lastPageSize = 0;

    while (pageCount < PROFESSIONAL_MAX_PAGES) {
      const { from, to } = getProfessionalPageRange(pageCount);

      const { data: page, error } = await db
        .from("profiles")
        .select(PROFILE_SELECT)
        .in("role", roles)
        .or("status.is.null,status.not.in.(suspended,deleted)")
        .order("id")
        .range(from, to);

      if (error) {
        console.error("[GET /api/search/professionals] profiles error:", error);

        return NextResponse.json(
          {
            error: "Recherche des professionnels impossible",
          },
          { status: 500 },
        );
      }

      const profiles = (page ?? []) as unknown as ProfessionalProfileRow[];

      allProfiles.push(...profiles);

      lastPageSize = profiles.length;
      pageCount += 1;

      if (lastPageSize < PROFESSIONAL_PAGE_SIZE) {
        break;
      }
    }

    // 8. Vérification de la limite de pagination
    if (hasReachedProfessionalPageLimit(pageCount, lastPageSize)) {
      const { from } = getProfessionalPageRange(pageCount);

      const { data: nextPage, error: nextPageError } = await db
        .from("profiles")
        .select("id")
        .in("role", roles)
        .or("status.is.null,status.not.in.(suspended,deleted)")
        .order("id")
        .range(from, from);

      if (nextPageError) {
        console.error(
          "[GET /api/search/professionals] pagination error:",
          nextPageError,
        );

        return NextResponse.json(
          {
            error: "Vérification de pagination impossible",
          },
          { status: 500 },
        );
      }

      if ((nextPage ?? []).length > 0) {
        return NextResponse.json(
          {
            error: "Recherche trop volumineuse. Affinez vos critères.",
          },
          { status: 422 },
        );
      }
    }

    // Préfiltrer les profils éligibles, sans géocoder leur adresse en couverture.
    const eligibleProfiles = allProfiles.filter((profile) =>
      professionalIsSearchable(profile.status) &&
      (!isConciergeRole(profile.role) || conciergePublication(profile).eligible) &&
      (!filters.proOnly || profile.role?.endsWith("_pro")) &&
      professionalMatchesServices(getProfessionalServices(profile.role, profile.option,
        parseProfileServices(profile.option, profile.availability_hours)), requestedServices));
    const pricingRows: Array<{ profile_id: string; property_type: string | null }> = [];
    if (filters.propertyType) {
      for (let offset = 0; offset < eligibleProfiles.length; offset += PROFESSIONAL_PAGE_SIZE) {
        const { data, error } = await db.from("pricing_packages")
          .select("profile_id, property_type")
          .in("profile_id", eligibleProfiles.slice(offset, offset + PROFESSIONAL_PAGE_SIZE).map((profile) => profile.id));
        if (error) throw new Error("Impossible de vérifier les types de biens");
        pricingRows.push(...(data ?? []));
      }
    }
    const propertyTypes = mapPropertyTypesByProfile(pricingRows);

    // 9. Qualifier séparément couverture et marqueur ; compter après les autres filtres.
    const coverage = geographic && center
      ? new Map(eligibleProfiles.map((profile) => [profile.id,
        evaluateProfessionalCoverage(profile, { center, radiusKm })]))
      : null;
    const candidateProfiles = eligibleProfiles;
    const reviewedProfiles = coverage
      ? candidateProfiles.filter((profile) => coverage.get(profile.id)?.state === "covered")
      : candidateProfiles;
    const reviews = new Map<string, Array<{ rating: number | null; comment: string | null; created_at: string | null }>>();
    for (let offset = 0; offset < reviewedProfiles.length; offset += PROFESSIONAL_PAGE_SIZE) {
      const { data, error } = await db.from("mission_reviews")
        .select("reviewed_profile_id, rating, comment, created_at")
        .in("reviewed_profile_id", reviewedProfiles.slice(offset, offset + PROFESSIONAL_PAGE_SIZE).map((profile) => profile.id))
        .order("created_at", { ascending: false });
      if (error) throw new Error("Impossible de charger les avis");
      for (const review of data ?? []) {
        if (!review.reviewed_profile_id) continue;
        const list = reviews.get(review.reviewed_profile_id) ?? [];
        list.push(review);
        reviews.set(review.reviewed_profile_id, list);
      }
    }

    // 10. Construction des résultats
    const items: ProfessionalSearchRow[] = candidateProfiles.flatMap(
      (profile) => {
        const professionalType = getProfessionalType(profile.role);

        if (!professionalMatchesType(profile.role, type) || !professionalType) {
          return [];
        }

        const services = getProfessionalServices(
          profile.role,
          profile.option,
          professionalType === "concierge"
            ? parseProfileServices(profile.option, profile.availability_hours)
            : [],
        );

        if (!professionalMatchesServices(services, requestedServices)) {
          return [];
        }

        const displayName =
          [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          profile.company_name ||
          profile.username ||
          "Professionnel";
        const profileReviews = reviews.get(profile.id) ?? [];
        const ratings = profileReviews.flatMap((review) =>
          typeof review.rating === "number" && Number.isFinite(review.rating) ? [review.rating] : []);

        return [
          {
            id: profile.id,
            professional_type: professionalType,
            role: profile.role ?? "",
            avatar_url: profile.avatar_url,
            image: profile.image,
            display_name: displayName,
            city: profile.city,
            postal_code: profile.postal_code,
            location: profile.location,
            country: profile.country,
            service_area: profile.service_area,
            service_radius_km: profile.service_radius_km,
            latitude: coverage ? coverage.get(profile.id)?.marker?.latitude ?? null : profile.latitude,
            longitude: coverage ? coverage.get(profile.id)?.marker?.longitude ?? null : profile.longitude,
            services,
            property_types: propertyTypes.get(profile.id) ?? [],
            category: profile.category,
            hourly_rate: profile.hourly_rate,
            monthly_rate: profile.monthly_rate,
            experience_level: profile.experience_level,
            years_experience: profile.years_experience,
            is_pro: ["concierge_pro", "provider_pro", "artisan_pro"].includes(
              profile.role ?? "",
            ),
            is_available_now: isProfileAvailableNow({ availabilityHours: profile.availability_hours, emergencyService: profile.emergency_service }),
            average_rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
            reviews_count: ratings.length,
            latest_review_comment: profileReviews[0]?.comment ?? null,
            latest_review_at: profileReviews[0]?.created_at ?? null,
          },
        ];
      },
    );

    const filteredItems = applyConciergeSearchFilters(items, {
      ...filters,
      city: geographic ? "" : filters.city,
      availableOnly: params.has("availableOnly") && filters.availableOnly,
      radiusKm: null,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const resultItems = coverage
      ? filteredItems.filter((item) => coverage.get(item.id)?.state === "covered")
      : filteredItems;
    // 11. Compteurs sur les profils satisfaisant tous les critères non géographiques.
    const warnings: string[] = [];
    const unknownCount = coverage
      ? filteredItems.filter((item) => coverage.get(item.id)?.state === "unknown").length : 0;
    if (unknownCount) {
      warnings.push(
        `La couverture de ${unknownCount} professionnel(s) correspondant à vos autres critères ne peut pas être confirmée. Ils ne figurent pas dans ces résultats géographiques ; cela ne signifie pas qu'ils sont hors zone.`,
      );
    }
    const missingMarkerCount = coverage
      ? resultItems.filter((item) => !coverage.get(item.id)?.marker).length : 0;
    if (missingMarkerCount) {
      warnings.push(
        `${missingMarkerCount} professionnel(s) couvrant la zone figurent dans les résultats sans repère sur la carte.`,
      );
    }

    // 12. Réponse
    return NextResponse.json({
      items: resultItems,
      ...(geographic ? { center } : {}),
      ...(warnings.length > 0 ? { warning: warnings.join(" ") } : {}),
      available_filters: buildAvailableConciergeFilters(coverage
        ? items.filter((item) => coverage.get(item.id)?.state === "covered") : items),
    });
  } catch (error) {
    console.error("[GET /api/search/professionals] unexpected error:", error);

    return NextResponse.json(
      {
        error: "Erreur interne de recherche",
      },
      { status: 500 },
    );
  }
}
