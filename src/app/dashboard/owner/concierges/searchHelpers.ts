export type OwnerConciergeSearchFilters = {
  location: string;
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

  if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.selectedServices.length > 0) {
    params.set("services", filters.selectedServices.join(","));
  }
  if (filters.propertyType.trim()) params.set("propertyType", filters.propertyType.trim());
  if (filters.budgetMax.trim()) params.set("budgetMax", filters.budgetMax.trim());
  if (filters.radiusKm.trim()) params.set("radiusKm", filters.radiusKm.trim());
  if (filters.proOnly) params.set("proOnly", "1");

  return params;
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

export function toggleOwnerConciergeService(selected: string[], service: string) {
  return selected.includes(service)
    ? selected.filter((item) => item !== service)
    : [...selected, service];
}
