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
  getOwnerConciergeMapFeedback,
  buildOwnerConciergeFilterOptions,
  hasOwnerConciergeSearchCriteria,
  buildOwnerConciergeSearchParams,
  normalizeOwnerServiceSelections,
  preserveTouchedOwnerConciergeFilters,
  toggleOwnerConciergeService,
} from "../app/dashboard/owner/concierges/searchHelpers.ts";
import {
  createOwnerConciergeSearchAlert,
  deleteOwnerConciergeSearchAlert,
  loadOwnerConciergeSearchAlerts,
  upsertOwnerConciergeSearchAlert,
} from "../app/dashboard/owner/searchAlerts.ts";

test("parseProfileServices prefers active mission labels over legacy option", () => {
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

  assert.deepEqual(result, ["Maintenance"]);
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
    "region=Ile-de-France&city=75015&serviceFamilies=cleaning_linen,guest_concierge&services=Menage,Check-in&propertyType=Villa&budgetMax=90&radiusKm=25&proOnly=1",
  );

  const filters = buildConciergeSearchFilters(params);

  assert.equal(filters.region, "Ile-de-France");
  assert.equal(filters.city, "75015");
  assert.equal(filters.postalCode, "");
  assert.deepEqual(filters.categories, []);
  assert.deepEqual(filters.serviceFamilies, ["cleaning_linen", "guest_concierge"]);
  assert.deepEqual(filters.services, ["Menage", "Check-in"]);
  assert.equal(filters.propertyType, "Villa");
  assert.equal(filters.budgetMax, 90);
  assert.equal(filters.radiusKm, 25);
  assert.equal(filters.proOnly, true);
  assert.equal(filters.availableOnly, true);
});

test("buildConciergeSearchFilters normalizes legacy accueil category", () => {
  const filters = buildConciergeSearchFilters(
    new URLSearchParams("city=Paris&categories=Accueil"),
  );

  assert.deepEqual(filters.categories, ["Accueil voyageurs"]);
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
      region: "Ile-de-France",
      city: "Paris",
      postalCode: "",
      categories: [],
      serviceFamilies: [],
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

test("family filters match professionals' central-catalog services without selecting services", () => {
  const profiles = [
    {
      id: "cleaner",
      display_name: "Concierge ménage",
      city: "Nice",
      country: "France",
      service_area: "Nice",
      service_radius_km: 20,
      hourly_rate: null,
      monthly_rate: null,
      experience_level: null,
      years_experience: null,
      services: ["Ménage du logement"],
      is_pro: false,
      average_rating: null,
      reviews_count: 0,
    },
    {
      id: "photographer",
      display_name: "Photographe",
      city: "Nice",
      country: "France",
      service_area: "Nice",
      service_radius_km: 20,
      hourly_rate: null,
      monthly_rate: null,
      experience_level: null,
      years_experience: null,
      services: ["Photographie immobilière"],
      is_pro: false,
      average_rating: null,
      reviews_count: 0,
    },
    {
      id: "catalog-family",
      display_name: "Professionnel catégorisé",
      city: "Nice",
      country: "France",
      service_area: "Nice",
      service_radius_km: 20,
      hourly_rate: null,
      monthly_rate: null,
      experience_level: null,
      years_experience: null,
      services: ["Prestation catalogue historique"],
      is_pro: false,
      average_rating: null,
      reviews_count: 0,
    },
  ];

  const result = applyConciergeSearchFilters(
    profiles,
    {
      region: "",
      city: "",
      postalCode: "",
      categories: [],
      serviceFamilies: ["cleaning_linen"],
      services: [],
      proOnly: false,
      availableOnly: false,
      propertyType: "",
      budgetMax: null,
      radiusKm: null,
      limit: 20,
    },
    new Map([["prestation catalogue historique", "Ménage et linge"]]),
  );

  assert.deepEqual(result.map((profile) => profile.id), ["cleaner", "catalog-family"]);
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
    buildAvailableConciergeFilters(
      results,
      new Map([
        ["menage", "Menage"],
        ["check-in", "Accueil"],
        ["maintenance", "Maintenance"],
      ]),
    ),
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
    region: "Provence-Alpes-Cote d'Azur",
    city: "06000",
    selectedCategories: ["Menage"],
    selectedServiceFamilies: ["cleaning_linen", "guest_concierge"],
    selectedServices: ["Menage", "Check-in"],
    propertyType: "Villa",
    budgetMax: "120",
    radiusKm: "30",
    proOnly: true,
  });

  assert.equal(params.get("region"), "Provence-Alpes-Cote d'Azur");
  assert.equal(params.get("city"), "06000");
  assert.equal(params.get("categories"), "Menage");
  assert.equal(params.get("serviceFamilies"), "cleaning_linen,guest_concierge");
  assert.equal(params.get("services"), "Menage,Check-in");
  assert.equal(params.get("propertyType"), "Villa");
  assert.equal(params.get("budgetMax"), "120");
  assert.equal(params.get("radiusKm"), "30");
  assert.equal(params.get("geographic"), "1");
  assert.equal(params.get("proOnly"), "1");

  assert.deepEqual(toggleOwnerConciergeService(["Menage"], "Check-in"), [
    "Menage",
    "Check-in",
  ]);
  assert.deepEqual(toggleOwnerConciergeService(["Menage"], "Menage"), []);
  assert.deepEqual(toggleOwnerConciergeService(["cleaning_linen"], "cleaning_linen"), []);
  assert.deepEqual(
    normalizeOwnerServiceSelections(["Check-in", "Ménage entre voyageurs", "custom value"]),
    ["guest_checkin", "cleaning_turnover", "custom value"],
  );
});

test("profile hydration keeps user-edited filters while retaining URL city and radius defaults", () => {
  const defaults = {
    region: "",
    city: "Nice",
    selectedCategories: [],
    selectedServiceFamilies: ["cleaning_linen" as const],
    selectedServices: ["cleaning_standard"],
    propertyType: "",
    budgetMax: "",
    radiusKm: "20",
    proOnly: false,
  };
  const current = {
    ...defaults,
    selectedServiceFamilies: ["guest_concierge" as const],
    selectedServices: ["guest_checkin"],
  };

  assert.deepEqual(
    preserveTouchedOwnerConciergeFilters(
      defaults,
      current,
      new Set(["selectedServiceFamilies", "selectedServices"]),
    ),
    {
      ...defaults,
      selectedServiceFamilies: ["guest_concierge"],
      selectedServices: ["guest_checkin"],
    },
  );
});

test("hasOwnerConciergeSearchCriteria detects whether the owner started building a search", () => {
  assert.equal(
    hasOwnerConciergeSearchCriteria({
      region: "",
      city: "",
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
      region: "",
      city: "",
      selectedCategories: [],
      selectedServiceFamilies: ["cleaning_linen"],
      selectedServices: [],
      propertyType: "",
      budgetMax: "",
      radiusKm: "",
      proOnly: false,
    }),
    true,
  );

  assert.equal(
    hasOwnerConciergeSearchCriteria({
      region: "Ile-de-France",
      city: "",
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

test("createOwnerConciergeSearchAlert allows only one alert per city and requires a location", () => {
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
      postalCode: "75016",
      budgetMax: "250",
      radiusKm: "40",
    });

    assert.equal(first.created, true);
    assert.equal(duplicate.created, false);
    assert.equal(duplicate.alert.id, first.alert.id);
    assert.equal(loadOwnerConciergeSearchAlerts().length, 1);

    const postalOnly = createOwnerConciergeSearchAlert({
      city: "",
      postalCode: "69000",
      budgetMax: "",
      radiusKm: "",
    });
    const duplicatePostalOnly = createOwnerConciergeSearchAlert({
      city: "",
      postalCode: "69000",
      budgetMax: "180",
      radiusKm: "25",
    });

    assert.equal(postalOnly.created, true);
    assert.equal(duplicatePostalOnly.created, false);
    assert.equal(loadOwnerConciergeSearchAlerts().length, 2);

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

test("upsertOwnerConciergeSearchAlert updates an alert and deleteOwnerConciergeSearchAlert removes it", () => {
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
    const created = createOwnerConciergeSearchAlert({
      city: "Lyon",
      postalCode: "69000",
      budgetMax: "120",
      radiusKm: "15",
    });

    const updated = upsertOwnerConciergeSearchAlert(created.alert.id, {
      city: "Lyon",
      postalCode: "69003",
      budgetMax: "180",
      radiusKm: "30",
    });

    assert.equal(updated.created, true);
    assert.equal(updated.alert.id, created.alert.id);
    assert.equal(updated.alert.postalCode, "69003");
    assert.equal(updated.alert.budgetMax, "180");

    const alertsAfterDelete = deleteOwnerConciergeSearchAlert(created.alert.id);
    assert.equal(alertsAfterDelete.length, 0);
    assert.equal(loadOwnerConciergeSearchAlerts().length, 0);
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

test("service matching keeps distinct cleaning and check-in services", () => {
  const baseProfile = {
    display_name: "Concierge Test",
    city: "Paris",
    country: "France",
    service_area: "Paris",
    service_radius_km: 20,
    hourly_rate: 30,
    monthly_rate: 300,
    experience_level: null,
    years_experience: null,
    is_pro: false,
    is_available_now: true,
    average_rating: null,
    reviews_count: 0,
  };

  const profiles = [
    {
      ...baseProfile,
      id: "checkin",
      services: ["Check-in"],
    },
    {
      ...baseProfile,
      id: "checkout",
      services: ["Check-out"],
    },
    {
      ...baseProfile,
      id: "turnover",
      services: ["Ménage entre voyageurs"],
    },
    {
      ...baseProfile,
      id: "deep",
      services: ["Grand ménage"],
    },
  ];

  const search = (service: string) =>
    applyConciergeSearchFilters(profiles, {
      region: "",
      city: "",
      postalCode: "",
      categories: [],
      serviceFamilies: [],
      services: [service],
      proOnly: false,
      availableOnly: false,
      propertyType: "",
      budgetMax: null,
      radiusKm: null,
      limit: 20,
    }).map((profile) => profile.id);

  assert.deepEqual(search("guest_checkin"), ["checkin"]);
  assert.deepEqual(search("guest_checkout"), ["checkout"]);
  assert.deepEqual(search("cleaning_turnover"), ["turnover"]);
  assert.deepEqual(search("cleaning_deep"), ["deep"]);
  assert.deepEqual(search("Ménage"), []);
});


test("map feedback distinguishes loading, API errors, empty results and missing coordinates", () => {
  assert.match(getOwnerConciergeMapFeedback(0, false, null).title, /Aucun professionnel/);
  assert.match(getOwnerConciergeMapFeedback(2, false, null).description, /coordonn/);
  assert.deepEqual(getOwnerConciergeMapFeedback(2, false, "API 503"), {
    title: "Impossible de charger la carte", description: "API 503",
  });
  assert.match(getOwnerConciergeMapFeedback(0, true, null).title, /cours/);
});


test("saved property context preserves requests while Paris and Nice discovery stays unfiltered", async () => {
  const { buildOwnerConciergeSearchDefaults, buildOwnerRequestFormDefaults, getOwnerProfilePreferences } = await import("../features/owner-preferences/profilePreferences.ts");
  const { locateConcierges } = await import("../app/api/profiles/concierges/geographicSearch.ts");
  const propertyType = "Résidence secondaire";
  const preferences = getOwnerProfilePreferences(JSON.stringify({ preferences: { propertyType, propertyTypes: [propertyType] } }));
  const defaults = buildOwnerConciergeSearchDefaults(preferences);
  assert.equal(defaults.propertyType, "");
  assert.equal(preferences.propertyType, propertyType);
  assert.equal(buildOwnerRequestFormDefaults(preferences).propertyType, propertyType);
  for (const [city, latitude, longitude] of [["Paris", 48.8589, 2.3200], ["Nice", 43.7009, 7.2684]] as const) {
    const search = { ...defaults, city, radiusKm: "20", selectedCategories: [], budgetMax: "", proOnly: false };
    const params = buildOwnerConciergeSearchParams(search);
    assert.equal(params.has("propertyType"), false);
    assert.equal(params.has("services"), false);
    assert.equal(params.has("serviceFamilies"), false);
    const profile = { id: city, display_name: city, city, country: "France", service_area: city,
      latitude, longitude, availability_hours: null, service_radius_km: 25,
      hourly_rate: null, monthly_rate: null, experience_level: null, years_experience: null,
      services: [], property_types: [], is_pro: false, average_rating: null, reviews_count: 0 };
    const filters = { ...buildConciergeSearchFilters(params), city: "", radiusKm: null, availableOnly: false };
    const candidates = applyConciergeSearchFilters([profile], filters);
    const located = await locateConcierges(candidates, { latitude, longitude }, 20, async () => { throw new Error("Unexpected geocoding"); });
    assert.equal(located.results.length, 1);
    const manual = buildOwnerConciergeSearchParams({ ...search, propertyType: "Appartement" });
    assert.equal(manual.get("propertyType"), "Appartement");
    const explicitUrl = new URLSearchParams("city=" + city + "&radiusKm=20&propertyType=Appartement");
    for (const explicit of [manual, explicitUrl]) {
      const active = { ...buildConciergeSearchFilters(explicit), city: "", radiusKm: null, availableOnly: false };
      assert.equal(applyConciergeSearchFilters([profile], active).length, 0);
      assert.equal(applyConciergeSearchFilters([{ ...profile, property_types: ["Appartement"] }], active).length, 1);
    }
  }
});
