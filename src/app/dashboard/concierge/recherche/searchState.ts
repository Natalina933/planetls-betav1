import type { SearchFetchOptions, SearchResponse } from "./searchClient";

export interface SearchFiltersState {
  cityFilter: string;
  postalCodeFilter: string;
  radiusFilter: number;
  selectedServices: string[];
  allFranceMode: boolean;
}

export function buildInitialSearchFilters(data: SearchResponse): SearchFiltersState {
  const defaultCity =
    data.profile?.location ??
    data.profile?.city ??
    data.profile?.service_area ??
    data.applied_filters?.city ??
    "";

  return {
    cityFilter: defaultCity,
    postalCodeFilter: "",
    radiusFilter:
      Number(data.profile?.service_radius_km ?? data.applied_filters?.radius_km ?? 30) || 30,
    selectedServices: [],
    allFranceMode: Boolean(data.applied_filters?.country_wide),
  };
}

export function buildSearchRequestOptions(
  filters: SearchFiltersState,
): SearchFetchOptions & { initialLoad: false } {
  return {
    city: filters.allFranceMode ? "" : filters.cityFilter.trim(),
    postalCode: filters.allFranceMode ? "" : filters.postalCodeFilter.trim(),
    radiusKm: filters.allFranceMode ? 0 : filters.radiusFilter,
    services: filters.selectedServices,
    countryWide: filters.allFranceMode,
    initialLoad: false,
  };
}

export function buildResetFiltersState(filters: SearchFiltersState): SearchFiltersState {
  return {
    ...filters,
    postalCodeFilter: "",
    selectedServices: [],
  };
}

export function toggleSelectedService(selectedServices: string[], label: string) {
  return selectedServices.includes(label)
    ? selectedServices.filter((item) => item !== label)
    : [...selectedServices, label];
}
