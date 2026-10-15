import { normalizeConciergeCategories } from "../../../../features/owner-concierges/lib/searchNormalization.ts";
import {
  PLANETLS_SERVICE_FAMILIES,
  type PlanetLSServiceFamily,
} from "../../../lib/planetlsServiceCatalogTarget.ts";
import { resolvePlanetLSServiceSlug } from "../../../lib/planetlsServiceMatching.ts";
import {
  getGuestCheckinCheckoutOperationalSlugs,
  GUEST_CHECKIN_CHECKOUT_BUNDLE,
} from "../../../lib/guestCheckinCheckout.ts";

export type OwnerConciergeSearchFilters = {
  region?: string;
  city: string;
  selectedCategories: string[];
  selectedServiceFamilies?: PlanetLSServiceFamily[];
  selectedServices: string[];
  propertyType: string;
  budgetMax: string;
  radiusKm: string;
  proOnly: boolean;
};

export type ConciergeSearchResult = {
  services: string[];
  property_types?: string[];
};

export function buildOwnerConciergeSearchParams(filters: OwnerConciergeSearchFilters) {
  const params = new URLSearchParams();

  if (filters.region?.trim()) params.set("region", filters.region.trim());
  if (filters.city.trim()) params.set("city", filters.city.trim());
  const normalizedCategories = normalizeConciergeCategories(filters.selectedCategories);
  if (normalizedCategories.length > 0) {
    params.set("categories", normalizedCategories.join(","));
  }
  if (filters.selectedServiceFamilies && filters.selectedServiceFamilies.length > 0) {
    params.set("serviceFamilies", filters.selectedServiceFamilies.join(","));
  }
  if (filters.selectedServices.length > 0) {
    params.set("services", filters.selectedServices.join(","));
  }
  if (filters.propertyType.trim()) params.set("propertyType", filters.propertyType.trim());
  if (filters.budgetMax.trim()) params.set("budgetMax", filters.budgetMax.trim());
  if (filters.radiusKm.trim()) params.set("radiusKm", filters.radiusKm.trim());
  if (filters.city.trim() && filters.radiusKm.trim()) params.set("geographic", "1");
  if (filters.proOnly) params.set("proOnly", "1");

  return params;
}

export function hasOwnerConciergeSearchCriteria(filters: OwnerConciergeSearchFilters) {
  return Boolean(
    filters.region?.trim() ||
      filters.city.trim() ||
      filters.selectedCategories.length > 0 ||
      (filters.selectedServiceFamilies?.length ?? 0) > 0 ||
      filters.selectedServices.length > 0 ||
      filters.propertyType.trim() ||
      filters.budgetMax.trim() ||
      filters.radiusKm.trim() ||
      filters.proOnly,
  );
}

export function normalizeOwnerServiceFamilies(values: readonly string[]) {
  const validFamilies = new Set<string>(PLANETLS_SERVICE_FAMILIES.map((family) => family.slug));
  return Array.from(
    new Set(values.filter((value): value is PlanetLSServiceFamily => validFamilies.has(value))),
  );
}

export function normalizeOwnerServiceSelections(values: readonly string[]) {
  const normalized = values.flatMap((value) => {
    const slug = resolvePlanetLSServiceSlug(value) ?? value.trim();
    return slug === GUEST_CHECKIN_CHECKOUT_BUNDLE
      ? getGuestCheckinCheckoutOperationalSlugs()
      : [slug];
  });
  return Array.from(new Set(normalized.filter(Boolean)));
}

export function preserveTouchedOwnerConciergeFilters(
  defaults: OwnerConciergeSearchFilters,
  current: OwnerConciergeSearchFilters,
  touchedKeys: ReadonlySet<keyof OwnerConciergeSearchFilters>,
): OwnerConciergeSearchFilters {
  const next = { ...defaults };
  touchedKeys.forEach((key) => {
    Object.assign(next, { [key]: current[key] });
  });
  return next;
}

export function buildOwnerConciergeFilterOptions(results: ConciergeSearchResult[]) {
  const services = new Set<string>();
  const propertyTypes = new Set<string>();

  results.forEach((item) => {
    item.services.forEach((service) => services.add(service));
    (item.property_types ?? []).forEach((propertyType) => propertyTypes.add(propertyType));
  });

  return {
    services: Array.from(services).sort((a, b) => a.localeCompare(b)),
    propertyTypes: Array.from(propertyTypes).sort((a, b) => a.localeCompare(b)),
  };
}

export function toggleOwnerConciergeValue(selected: string[], value: string) {
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

export const toggleOwnerConciergeService = toggleOwnerConciergeValue;

export function getOwnerConciergeMapFeedback(resultCount: number, loading: boolean, error: string | null) {
  if (loading) return { title: "Recherche en cours…", description: "Chargement des professionnels et de leur localisation." };
  if (error) return { title: "Impossible de charger la carte", description: error };
  if (resultCount === 0) return {
    title: "Aucun professionnel dans cette recherche",
    description: "Élargissez le rayon ou ajustez vos filtres pour trouver des professionnels.",
  };
  return {
    title: "Carte indisponible pour ces résultats.",
    description: "Les profils retournés ne contiennent pas encore de coordonnées exploitables.",
  };
}
