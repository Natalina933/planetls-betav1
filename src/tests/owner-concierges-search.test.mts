import test from "node:test";
import assert from "node:assert/strict";

import {
  applyConciergeSearchFilters,
  buildAvailableConciergeFilters,
  buildConciergeSearchFilters,
  mapPropertyTypesByProfile,
  parseProfileServices,
} from "../app/api/profiles/concierges/shared.ts";
import {
  buildOwnerConciergeFilterOptions,
  hasOwnerConciergeSearchCriteria,
  buildOwnerConciergeSearchParams,
  toggleOwnerConciergeService,
} from "../app/dashboard/owner/concierges/searchHelpers.ts";
import {
  createOwnerConciergeSearchAlert,
  loadOwnerConciergeSearchAlerts,
} from "../app/dashboard/owner/searchAlerts.ts";

test("parseProfileServices merges option and active mission labels", () => {
  const result = parseProfileServices(
    "Menage, Check-in",
    JSON.stringify({
      missionProfile: {
        missions: [
          { label: "Maintenance", isActive: true },
          { label: "Check-in", isActive: false },
        ],
      },
    }),
  );

  assert.deepEqual(result, ["Menage", "Check-in", "Maintenance"]);
});

test("mapPropertyTypesByProfile groups and deduplicates property types", () => {
  const result = mapPropertyTypesByProfile([
    { profile_id: "p1", property_type: "Appartement" },
    { profile_id: "p1", property_type: "Appartement" },
    { profile_id: "p1", property_type: "Villa" },
  ]);

  assert.deepEqual(result.get("p1"), ["Appartement", "Villa"]);
});

test("buildConciergeSearchFilters parses advanced owner filters", () => {
  const params = new URLSearchParams(
    "city=Paris&postalCode=75015&services=Menage,Check-in&propertyType=Villa&budgetMax=90&radiusKm=25&proOnly=1",
  );

  const filters = buildConciergeSearchFilters(params);

  assert.equal(filters.city, "Paris");
  assert.equal(filters.postalCode, "75015");
  assert.deepEqual(filters.categories, []);
  assert.deepEqual(filters.services, ["Menage", "Check-in"]);
  assert.equal(filters.propertyType, "Villa");
  assert.equal(filters.budgetMax, 90);
  assert.equal(filters.radiusKm, 25);
  assert.equal(filters.proOnly, true);
  assert.equal(filters.availableOnly, true);
});

test("applyConciergeSearchFilters enforces service, property type and budget", () => {
  const result = applyConciergeSearchFilters(
    [
      {
        id: "1",
        display_name: "Concierge A",
        city: "Paris",
        country: "France",
        postal_code: "75015",
        service_area: "Ile-de-France",
        service_radius_km: 15,
        hourly_rate: 60,
        monthly_rate: 600,
        experience_level: "experimente",
        years_experience: 5,
        services: ["Menage", "Check-in"],
        property_types: ["Appartement"],
        is_pro: true,
        is_available_now: true,
        average_rating: 4.8,
        reviews_count: 12,
      },
      {
        id: "2",
        display_name: "Concierge B",
        city: "Paris",
        country: "France",
        postal_code: "75016",
        service_area: "Ile-de-France",
        service_radius_km: 40,
        hourly_rate: 120,
        monthly_rate: 900,
        experience_level: "intermediaire",
        years_experience: 2,
        services: ["Maintenance"],
        property_types: ["Villa"],
        is_pro: false,
        is_available_now: false,
        average_rating: 4.1,
        reviews_count: 3,
      },
    ],
    {
      city: "Paris",
      postalCode: "75015",
      categories: [],
      services: ["Menage"],
      propertyType: "Appartement",
      budgetMax: 80,
      radiusKm: 20,
      proOnly: false,
      availableOnly: true,
      limit: 20,
    },
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "1");
});

test("buildAvailableConciergeFilters and owner client helpers expose UI options", () => {
  const results = [
    {
      id: "1",
      display_name: "Concierge A",
      city: "Paris",
      country: "France",
      postal_code: "75015",
      service_area: "Paris centre",
      service_radius_km: 15,
      hourly_rate: 60,
      monthly_rate: 600,
      experience_level: "experimente",
      years_experience: 5,
      average_rating: 4.8,
      reviews_count: 12,
      is_pro: true,
      is_available_now: true,
      services: ["Menage", "Check-in"],
      property_types: ["Appartement"],
    },
    {
      id: "2",
      display_name: "Concierge B",
      city: "Nice",
      country: "France",
      postal_code: "06000",
      service_area: "Nice centre",
      service_radius_km: 25,
      hourly_rate: 80,
      monthly_rate: 800,
      experience_level: "intermediaire",
      years_experience: 3,
      average_rating: 4.2,
      reviews_count: 5,
      is_pro: false,
      is_available_now: false,
      services: ["Maintenance"],
      property_types: ["Villa", "Maison"],
    },
  ];

  assert.deepEqual(
    buildAvailableConciergeFilters(results, new Map([
      ["menage", "Menage"],
      ["check-in", "Accueil"],
      ["maintenance", "Maintenance"],
    ])),
    {
      categories: ["Accueil", "Maintenance", "Menage"],
      services: ["Check-in", "Maintenance", "Menage"],
      property_types: ["Appartement", "Maison", "Villa"],
    },
  );

  assert.deepEqual(buildOwnerConciergeFilterOptions(results), {
    services: ["Check-in", "Maintenance", "Menage"],
    propertyTypes: ["Appartement", "Maison", "Villa"],
  });

  const params = buildOwnerConciergeSearchParams({
    city: "Nice",
    postalCode: "06000",
    selectedCategories: ["Menage"],
    selectedServices: ["Menage", "Check-in"],
    propertyType: "Villa",
    budgetMax: "120",
    radiusKm: "30",
    proOnly: true,
  });

  assert.equal(params.get("city"), "Nice");
  assert.equal(params.get("postalCode"), "06000");
  assert.equal(params.get("categories"), "Menage");
  assert.equal(params.get("services"), "Menage,Check-in");
  assert.equal(params.get("propertyType"), "Villa");
  assert.equal(params.get("budgetMax"), "120");
  assert.equal(params.get("radiusKm"), "30");
  assert.equal(params.get("proOnly"), "1");

  assert.deepEqual(toggleOwnerConciergeService(["Menage"], "Check-in"), ["Menage", "Check-in"]);
  assert.deepEqual(toggleOwnerConciergeService(["Menage"], "Menage"), []);
});

test("hasOwnerConciergeSearchCriteria detects whether the owner started building a search", () => {
  assert.equal(
    hasOwnerConciergeSearchCriteria({
      city: "",
      postalCode: "",
      selectedCategories: [],
      selectedServices: [],
      propertyType: "",
      budgetMax: "",
      radiusKm: "",
      proOnly: false,
    }),
    false,
  );

  assert.equal(
    hasOwnerConciergeSearchCriteria({
      city: "",
      postalCode: "75015",
      selectedCategories: [],
      selectedServices: [],
      propertyType: "",
      budgetMax: "",
      radiusKm: "",
      proOnly: false,
    }),
    true,
  );
});

test("createOwnerConciergeSearchAlert deduplicates identical alerts and requires a location", () => {
  const storage = new Map<string, string>();
  const previousWindow = globalThis.window;

  Object.defineProperty(globalThis, "window", {
    value: {
      localStorage: {
        getItem(key: string) {
          return storage.has(key) ? storage.get(key) : null;
        },
        setItem(key: string, value: string) {
          storage.set(key, value);
        },
      },
    },
    configurable: true,
  });

  try {
    const first = createOwnerConciergeSearchAlert({
      city: "Paris",
      postalCode: "75015",
      budgetMax: "120",
      radiusKm: "15",
    });
    const duplicate = createOwnerConciergeSearchAlert({
      city: " Paris ",
      postalCode: "75015",
      budgetMax: "120",
      radiusKm: "15",
    });

    assert.equal(first.created, true);
    assert.equal(duplicate.created, false);
    assert.equal(duplicate.alert.id, first.alert.id);
    assert.equal(loadOwnerConciergeSearchAlerts().length, 1);

    assert.throws(
      () =>
        createOwnerConciergeSearchAlert({
          city: "",
          postalCode: "",
          budgetMax: "",
          radiusKm: "",
        }),
      /Ville ou code postal requis/,
    );
  } finally {
    if (typeof previousWindow === "undefined") {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
      });
    }
  }
});
