export type OwnerConciergeSearchFilters = {
  city: string;
  selectedCategories: string[];
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

  if (filters.city.trim()) params.set("city", filters.city.trim());
  if (filters.selectedCategories.length > 0) {
    params.set("categories", filters.selectedCategories.join(","));
  }
  if (filters.selectedServices.length > 0) {
    params.set("services", filters.selectedServices.join(","));
  }
  if (filters.propertyType.trim()) params.set("propertyType", filters.propertyType.trim());
  if (filters.budgetMax.trim()) params.set("budgetMax", filters.budgetMax.trim());
  if (filters.radiusKm.trim()) params.set("radiusKm", filters.radiusKm.trim());
  if (filters.proOnly) params.set("proOnly", "1");

  return params;
}

export function hasOwnerConciergeSearchCriteria(filters: OwnerConciergeSearchFilters) {
  return Boolean(
    filters.city.trim() ||
      filters.selectedCategories.length > 0 ||
      filters.selectedServices.length > 0 ||
      filters.propertyType.trim() ||
      filters.budgetMax.trim() ||
      filters.radiusKm.trim() ||
      filters.proOnly,
  );
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
