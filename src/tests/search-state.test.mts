import test from "node:test";
import assert from "node:assert/strict";

import {
  buildInitialSearchFilters,
  buildResetFiltersState,
  buildSearchRequestOptions,
  toggleSelectedService,
} from "../app/dashboard/concierge/recherche/searchState.ts";
import type { SearchResponse } from "../app/dashboard/concierge/recherche/searchClient.ts";

const searchResponse: SearchResponse = {
  profile: {
    location: "Bordeaux",
    city: "Bordeaux",
    postal_code: "33000",
    country: "France",
    service_area: "Gironde",
    service_radius_km: 45,
  },
  active_services: [],
  applied_filters: {
    city: "Bordeaux",
    postal_code: "33000",
    radius_km: 30,
    services: [],
    country_wide: false,
  },
  meta: {
    total_found: 1,
    distance_mode: "radius",
    note: "ok",
  },
  listings: [],
};

test("buildInitialSearchFilters derives UI defaults from API response", () => {
  assert.deepEqual(buildInitialSearchFilters(searchResponse), {
    cityFilter: "Bordeaux",
    postalCodeFilter: "",
    radiusFilter: 45,
    selectedServices: [],
    allFranceMode: false,
  });
});

test("buildSearchRequestOptions adapts filters to API payload", () => {
  assert.deepEqual(
    buildSearchRequestOptions({
      cityFilter: " Paris ",
      postalCodeFilter: "75001 ",
      radiusFilter: 30,
      selectedServices: ["Menage"],
      allFranceMode: false,
    }),
    {
      city: "Paris",
      postalCode: "75001",
      radiusKm: 30,
      services: ["Menage"],
      countryWide: false,
      initialLoad: false,
    },
  );
});

test("buildResetFiltersState clears postal code and selected services", () => {
  assert.deepEqual(
    buildResetFiltersState({
      cityFilter: "Paris",
      postalCodeFilter: "75001",
      radiusFilter: 20,
      selectedServices: ["Menage"],
      allFranceMode: false,
    }),
    {
      cityFilter: "Paris",
      postalCodeFilter: "",
      radiusFilter: 20,
      selectedServices: [],
      allFranceMode: false,
    },
  );
});

test("toggleSelectedService adds and removes labels idempotently", () => {
  assert.deepEqual(toggleSelectedService([], "Menage"), ["Menage"]);
  assert.deepEqual(toggleSelectedService(["Menage"], "Menage"), []);
});
