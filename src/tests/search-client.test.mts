import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAvailableServiceOptions,
  buildSearchParams,
} from "../app/dashboard/concierge/recherche/searchClient.ts";
import type {
  ActiveService,
  OwnerListing,
} from "../app/dashboard/concierge/recherche/searchPageSections.tsx";

const activeServices: ActiveService[] = [
  { id: "1", label: "Menage" },
  { id: "2", label: "Check-in" },
];

const listings: OwnerListing[] = [
  {
    id: "housing-1",
    source: "housing",
    title: "Appartement centre",
    city: "Paris",
    postal_code: "75001",
    property_type: "Appartement",
    surface_m2: 42,
    owner_profile_id: "owner-1",
    owner_name: "Alice Martin",
    status: "published",
    services_wanted: ["Ménage", "Blanchisserie", "Check-in"],
    services_wanted_ids: [],
    matched_services: [],
    compatibility_ratio: "2/3",
    compatibility_score: 66,
    distance_km: 4.2,
    budget_note: null,
  },
];

test("buildSearchParams serializes search options coherently", () => {
  const params = buildSearchParams({
    city: "Bordeaux",
    postalCode: "33000",
    radiusKm: 30,
    services: ["Menage", "Check-in"],
    countryWide: false,
  });

  assert.equal(params.get("city"), "Bordeaux");
  assert.equal(params.get("postalCode"), "33000");
  assert.equal(params.get("radiusKm"), "30");
  assert.equal(params.get("services"), "Menage,Check-in");
  assert.equal(params.get("limit"), "80");
  assert.equal(params.get("countryWide"), null);
});

test("buildSearchParams adapts limit for country-wide mode", () => {
  const params = buildSearchParams({
    city: "",
    postalCode: "",
    radiusKm: 0,
    services: [],
    countryWide: true,
  });

  assert.equal(params.get("countryWide"), "1");
  assert.equal(params.get("radiusKm"), null);
  assert.equal(params.get("limit"), "200");
});

test("buildAvailableServiceOptions merges accents and deduplicates labels", () => {
  const result = buildAvailableServiceOptions(activeServices, listings);

  assert.deepEqual(result, ["Blanchisserie", "Check-in", "Menage"]);
});
