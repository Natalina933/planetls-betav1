import { normalizeAreaLabel } from "../../../lib/profileLocation.ts";

type PricingPackageRow = {
  profile_id: string;
  property_type: string | null;
};

type SearchResultInput = {
  id: string;
  display_name: string;
  city: string | null;
  postal_code?: string | null;
  country: string | null;
  service_area: string | null;
  location?: string | null;
  service_radius_km: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  experience_level: string | null;
  years_experience: number | null;
  services: string[];
  is_pro: boolean;
  is_available_now?: boolean;
  average_rating: number | null;
  reviews_count: number;
  property_types?: string[];
};

export type ConciergeSearchFilters = {
  region: string;
  city: string;
  postalCode: string;
  categories: string[];
  services: string[];
  proOnly: boolean;
  availableOnly: boolean;
  propertyType: string;
  budgetMax: number | null;
  radiusKm: number | null;
  limit: number;
};

export const normalizeSearchValue = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const LEGACY_SERVICE_NOISE = new Set([
  "conciergerie complete menage",
  "accueil",
  "gestion",
  "cleaning",
  "welcome",
  "management",
  "checkin",
  "laundry",
]);

const SERVICE_LABEL_FIXES = new Map([
  ["menage", "Ménage"],
  ["grand menage", "Grand ménage"],
  ["desinfection complete", "Désinfection complète"],
  ["blanchisserie complete", "Blanchisserie complète"],
]);

const cleanServiceLabel = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[[\]"]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;

  const key = normalizeSearchValue(cleaned);
  if (LEGACY_SERVICE_NOISE.has(key)) return null;

  return SERVICE_LABEL_FIXES.get(key) ?? cleaned;
};

const hasAnyScheduleRange = (
  schedule: Array<{ day?: string; ranges?: Array<{ start?: string; end?: string }> }> | undefined,
): boolean =>
  (schedule ?? []).some((day) =>
    (day?.ranges ?? []).some(
      (range) =>
        typeof range?.start === "string" &&
        range.start.trim() !== "" &&
        typeof range?.end === "string" &&
        range.end.trim() !== "",
    ),
  );

export const splitServices = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(cleanServiceLabel).filter((item): item is string => Boolean(item));
    }
  } catch {
    // Legacy values can be malformed JSON-like strings, CSV, or newline-separated.
  }

  return value
    .split(/[;,|\n\r]+/g)
    .map(cleanServiceLabel)
    .filter((item): item is string => Boolean(item));
};

const readActiveMissionServices = (availabilityHours: string | null): string[] => {
  if (!availabilityHours) return [];

  try {
    const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
    const missionProfile = parsed?.missionProfile as
      | { missions?: Array<Record<string, unknown>> }
      | undefined;

    return (
      missionProfile?.missions
        ?.map((mission) =>
          mission?.isActive === true && typeof mission.label === "string"
            ? cleanServiceLabel(mission.label)
            : null,
        )
        .filter((item): item is string => Boolean(item)) ?? []
    );
  } catch {
    return [];
  }
};

export const parseProfileServices = (
  optionValue: string | null,
  availabilityHours: string | null,
): string[] => {
  const activeMissionServices = readActiveMissionServices(availabilityHours);
  if (activeMissionServices.length > 0) {
    return Array.from(new Set(activeMissionServices));
  }

  const values = new Set<string>();

  if (optionValue) {
    splitServices(optionValue).forEach((item) => values.add(item));
  }

  return Array.from(values);
};

export const isProfileAvailableNow = (input: {
  availabilityHours: string | null;
  emergencyService?: boolean | null;
  isAvailableForUrgent?: boolean | null;
}): boolean => {
  if (input.isAvailableForUrgent === true || input.emergencyService === true) return true;
  if (!input.availabilityHours) return true;

  try {
    const parsed = JSON.parse(input.availabilityHours) as {
      emergency24h?: boolean;
      rules?: { autoAcceptEmergency?: boolean };
      missionProfile?: { missions?: Array<{ isActive?: boolean }> };
      schedule?: Array<{ day?: string; ranges?: Array<{ start?: string; end?: string }> }>;
    };

    if (parsed.emergency24h === true || parsed.rules?.autoAcceptEmergency === true) {
      return true;
    }

    if (hasAnyScheduleRange(parsed.schedule)) {
      return true;
    }

    return (parsed.missionProfile?.missions ?? []).some((mission) => mission?.isActive === true);
  } catch {
    return true;
  }
};

export function buildConciergeSearchFilters(searchParams: URLSearchParams): ConciergeSearchFilters {
  const categories = (searchParams.get("categories") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const serviceFromList = (searchParams.get("services") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const serviceFromSingle = (searchParams.get("service") ?? "").trim();
  const budgetMaxRaw = Number(searchParams.get("budgetMax") ?? "");
  const radiusKmRaw = Number(searchParams.get("radiusKm") ?? "");
  const limitRaw = Number(searchParams.get("limit") ?? "48");

  return {
    region: (searchParams.get("region") ?? "").trim(),
    city: (searchParams.get("city") ?? searchParams.get("postalCode") ?? "").trim(),
    postalCode: (searchParams.get("postalCode") ?? "").trim(),
    categories,
    services:
      serviceFromList.length > 0
        ? serviceFromList
        : serviceFromSingle
          ? [serviceFromSingle]
          : [],
    proOnly: ["1", "true", "yes"].includes(
      (searchParams.get("proOnly") ?? "").trim().toLowerCase(),
    ),
    availableOnly: !["0", "false", "no"].includes(
      (searchParams.get("availableOnly") ?? "1").trim().toLowerCase(),
    ),
    propertyType: (searchParams.get("propertyType") ?? "").trim(),
    budgetMax: Number.isFinite(budgetMaxRaw) && budgetMaxRaw > 0 ? budgetMaxRaw : null,
    radiusKm: Number.isFinite(radiusKmRaw) && radiusKmRaw > 0 ? radiusKmRaw : null,
    limit: Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 120) : 48,
  };
}

export function mapPropertyTypesByProfile(rows: PricingPackageRow[]) {
  const byProfile = new Map<string, string[]>();

  rows.forEach((row) => {
    const type = typeof row.property_type === "string" ? row.property_type.trim() : "";
    if (!type) return;

    const current = byProfile.get(row.profile_id) ?? [];
    if (!current.some((item) => normalizeSearchValue(item) === normalizeSearchValue(type))) {
      current.push(type);
      byProfile.set(row.profile_id, current);
    }
  });

  return byProfile;
}

export function applyConciergeSearchFilters(
  results: SearchResultInput[],
  filters: ConciergeSearchFilters,
  categoryByService: Map<string, string> = new Map(),
) {
  const regionNormalized = normalizeSearchValue(filters.region);
  const cityQueryNormalized = normalizeSearchValue(filters.city);
  const categoriesNormalized = filters.categories.map(normalizeSearchValue);
  const servicesNormalized = filters.services.map(normalizeSearchValue);
  const propertyTypeNormalized = normalizeSearchValue(filters.propertyType);

  return results
    .filter((profile) => {
      const fullLocation = normalizeSearchValue(
        [
          normalizeAreaLabel(profile.city),
          profile.postal_code,
          normalizeAreaLabel(profile.service_area),
          normalizeAreaLabel(profile.location),
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (regionNormalized) {
        const regionArea = normalizeSearchValue(
          [
            normalizeAreaLabel(profile.service_area),
            normalizeAreaLabel(profile.location),
            normalizeAreaLabel(profile.city),
          ]
            .filter(Boolean)
            .join(" "),
        );
        if (!regionArea.includes(regionNormalized)) {
          return false;
        }
      }

      if (cityQueryNormalized && !fullLocation.includes(cityQueryNormalized)) {
        return false;
      }

      if (filters.availableOnly && profile.is_available_now !== true) {
        return false;
      }

      if (categoriesNormalized.length > 0) {
        const normalizedProfileCategories = Array.from(
          new Set(
            profile.services
              .map((service) => {
                const normalizedService = normalizeSearchValue(service);
                return categoryByService.get(normalizedService) ?? normalizedService;
              })
              .filter(Boolean),
          ),
        );
        const hasAllRequestedCategories = categoriesNormalized.every((category) =>
          normalizedProfileCategories.some((item) => item.includes(category) || category.includes(item)),
        );
        if (!hasAllRequestedCategories) {
          return false;
        }
      }

      if (servicesNormalized.length > 0) {
        const normalizedProfileServices = profile.services.map(normalizeSearchValue);
        const hasAllRequestedServices = servicesNormalized.every((service) =>
          normalizedProfileServices.some((item) => item.includes(service)),
        );
        if (!hasAllRequestedServices) {
          return false;
        }
      }

      if (propertyTypeNormalized) {
        const normalizedPropertyTypes = (profile.property_types ?? []).map(normalizeSearchValue);
        if (!normalizedPropertyTypes.some((item) => item.includes(propertyTypeNormalized))) {
          return false;
        }
      }

      if (
        typeof filters.budgetMax === "number" &&
        filters.budgetMax > 0 &&
        typeof profile.hourly_rate === "number" &&
        profile.hourly_rate > filters.budgetMax &&
        typeof profile.monthly_rate === "number" &&
        profile.monthly_rate > filters.budgetMax
      ) {
        return false;
      }

      if (
        typeof filters.radiusKm === "number" &&
        filters.radiusKm > 0 &&
        typeof profile.service_radius_km === "number" &&
        profile.service_radius_km > filters.radiusKm
      ) {
        return false;
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
    .slice(0, filters.limit);
}

export function buildAvailableConciergeFilters(
  results: SearchResultInput[],
  categoryByService: Map<string, string> = new Map(),
) {
  const categories = new Set<string>();
  const services = new Set<string>();
  const propertyTypes = new Set<string>();

  results.forEach((item) => {
    item.services.forEach((service) => {
      services.add(service);
      const category = categoryByService.get(normalizeSearchValue(service));
      if (category) categories.add(category);
    });
    (item.property_types ?? []).forEach((propertyType) => propertyTypes.add(propertyType));
  });

  return {
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    services: Array.from(services).sort((a, b) => a.localeCompare(b)),
    property_types: Array.from(propertyTypes).sort((a, b) => a.localeCompare(b)),
  };
}
