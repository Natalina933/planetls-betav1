import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCreatePricingModalState,
  buildMissionProgressSteps,
  buildEditPricingModalState,
  buildEmptyPricingPropertyRuleDraft,
  buildEmptyPricingSegmentDraft,
  buildPricingCatalogRows,
  buildPricingPropertyRulePayload,
  buildPricingScenarioDefaultPayload,
  buildPricingScenarioLoadedMessage,
  buildPricingScenarioPayload,
  buildPricingPropertyRuleUpdatePayload,
  buildPricingSegmentPayload,
  buildPricingSegmentUpdatePayload,
  buildResetPricingModalState,
  buildServicePricePayload,
  buildServicePriceRequest,
  buildProfileSuccessMessageSafe,
  buildProfileValidationAlertMessageSafe,
  buildProfileSavePayload,
  buildProfileSuccessMessage,
  buildSessionUserPayload,
  buildServicePriceMap,
  buildTariffReadinessChecks,
  collectServiceIdsToDisable,
  computeProgressPercent,
  countConfiguredPricingRows,
  countCompletedProgressSteps,
  countReadyChecks,
  createSectionSnapshot,
  deletePricingResource,
  ensureOpenSection,
  fetchPricingCollection,
  filterPricingCatalogRows,
  findPendingReadinessChecks,
  groupPricingCatalogRows,
  hasSectionUnsavedChanges,
  hasValidationErrors,
  findMatchingPropertyRule,
  removeSectionSnapshot,
  resolveSavedSectionId,
  scrollToPageSection,
  selectPricingSegment,
  syncMissionServiceFromPricing,
  shouldDisableMissionServiceAfterDelete,
  sortPropertyRulesBySpecificity,
  sortPricingCatalogRows,
  shouldCompleteMissionOnboarding,
  toggleCollapsedCategory,
  toggleOpenSection,
  validatePricingModalState,
  updatePricingResource,
  savePricingResource,
  updateProfileFieldErrorsSafe,
  updateProfileFieldValue,
  updateSocialFieldValue,
  validateProfileField,
  upsertSectionSnapshot,
} from "../app/dashboard/concierge/profile/profileEditing.ts";

type MissionProfileForLegacy = {
  missions: Array<{ id: string; label: string }>;
};

const seasonalPricingFixture = {
  checkInFee: 0,
  checkOutFee: 0,
  cleaningStudioFee: 0,
  cleaningTwoRoomsFee: 0,
  linenKitFee: 0,
  welcomePackFee: 0,
  urgentPercent: 0,
  nightPercent: 0,
  weekendPercent: 0,
  highSeasonPercent: 0,
  extraKmFee: 0,
  minimumInvoice: 35,
};

const pricingV2Fixture = {
  version: 2 as const,
  currency: "EUR",
  base: { hourlyRate: 40, travelFee: 10, minimumInvoice: 35 },
  globalModifiers: {
    urgentPercent: 0,
    nightPercent: 0,
    weekendPercent: 0,
    highSeasonPercent: 0,
  },
  serviceOverrides: {},
  contextRules: [],
};

test("snapshot helpers track dirty section state correctly", () => {
  const profile = { id: "1", first_name: "Nathalie", last_name: "C", avatar_url: null };
  const snapshots = upsertSectionSnapshot({}, "fiche", profile);

  assert.equal(createSectionSnapshot(profile), JSON.stringify(profile));
  assert.equal(hasSectionUnsavedChanges(snapshots, "fiche", profile), false);
  assert.equal(
    hasSectionUnsavedChanges(snapshots, "fiche", { ...profile, first_name: "Claire" }),
    true,
  );
  assert.deepEqual(removeSectionSnapshot(snapshots, "fiche"), {});
});

test("profile save helpers build expected payloads", () => {
  const profile = {
    id: "1",
    first_name: "Nathalie",
    last_name: "Charbonnel",
    avatar_url: null,
    onboarding_complete: false,
  };

  assert.deepEqual(
    buildProfileSavePayload(profile, "/avatar.png", true),
    {
      ...profile,
      avatar_url: "/avatar.png",
      onboarding_complete: true,
    },
  );

  assert.equal(
    buildProfileSuccessMessage("Photo de profil"),
    "✅ Photo de profil mis à jour avec succès",
  );

  assert.deepEqual(buildSessionUserPayload(profile, "/avatar.png"), {
    image: "/avatar.png",
    avatar_url: "/avatar.png",
    name: "Nathalie Charbonnel",
    firstName: "Nathalie",
    lastName: "Charbonnel",
  });
});

test("safe profile UI messages avoid corrupted dashboard labels", () => {
  assert.equal(
    buildProfileSuccessMessageSafe("Photo de profil"),
    "Photo de profil mis à jour avec succès",
  );

  assert.equal(
    buildProfileValidationAlertMessageSafe(),
    "Veuillez corriger les erreurs avant de sauvegarder.",
  );

  assert.deepEqual(
    updateProfileFieldErrorsSafe({ email: "" }, "email", "bad-email"),
    { email: "Email invalide" },
  );
});

test("validation and onboarding helpers enforce expected rules", () => {
  assert.equal(hasValidationErrors({ email: "", phone: "" }), false);
  assert.equal(hasValidationErrors({ email: "", phone: "Champ requis" }), true);

  assert.equal(
    shouldCompleteMissionOnboarding(
      "missions",
      [{ done: true }, { done: true }],
      { first_name: "N", last_name: "C", avatar_url: null, onboarding_complete: false },
    ),
    true,
  );

  assert.equal(
    shouldCompleteMissionOnboarding(
      "fiche",
      [{ done: true }],
      { first_name: "N", last_name: "C", avatar_url: null, onboarding_complete: false },
    ),
    false,
  );

  assert.equal(
    shouldCompleteMissionOnboarding(
      "missions",
      [{ done: true }],
      { first_name: "N", last_name: "C", avatar_url: null, onboarding_complete: true },
    ),
    false,
  );
});

test("section state helpers update UI state predictably", () => {
  assert.deepEqual(toggleOpenSection({}, "missions"), { missions: true });
  assert.deepEqual(toggleOpenSection({ missions: true }, "missions"), { missions: false });
  assert.deepEqual(ensureOpenSection({ fiche: false }, "fiche"), { fiche: true });
  assert.deepEqual(toggleCollapsedCategory({}, "Accueil"), { Accueil: true });
  assert.deepEqual(toggleCollapsedCategory({ Accueil: true }, "Accueil"), {
    Accueil: false,
  });
});

test("scrollToPageSection is safe without document and scrolls when target exists", () => {
  scrollToPageSection("tariffs-config");

  let scrolled = false;
  globalThis.document = {
    getElementById(id: string) {
      assert.equal(id, "tariffs-config");
      return {
        scrollIntoView(options: { behavior: string; block: string }) {
          scrolled = options.behavior === "smooth" && options.block === "start";
        },
      } as unknown as HTMLElement;
    },
  } as unknown as Document;

  scrollToPageSection("tariffs-config");
  assert.equal(scrolled, true);

  Reflect.deleteProperty(globalThis, "document");
});

test("social field helper updates only requested field", () => {
  const profile = {
    website: "https://old.example",
    linkedin: null,
  };

  assert.deepEqual(updateSocialFieldValue(profile, "website", "https://new.example"), {
    website: "https://new.example",
    linkedin: null,
  });
  assert.equal(updateSocialFieldValue(null, "facebook", "x"), null);
});

test("resolveSavedSectionId prefers current editing section", () => {
  const normalize = (value: string) => value.replaceAll(" ", "_");

  assert.equal(resolveSavedSectionId("Photo_de_profil", "Photo de profil", normalize), "Photo_de_profil");
  assert.equal(resolveSavedSectionId(null, "Photo de profil", normalize), "Photo_de_profil");
});

test("updateProfileFieldValue handles plain and tariff fields", () => {
  const profile = {
    first_name: "Nathalie",
    last_name: "Charbonnel",
    avatar_url: null,
    availability_hours: JSON.stringify({ existing: true }),
    hourly_rate: 40,
    travel_fee: 10,
    city: "Paris",
  };

  const plain = updateProfileFieldValue(profile, "city", "Lyon", {
    parseSeasonalPricing: () => seasonalPricingFixture,
    parsePricingV2FromAvailabilityHours: () => pricingV2Fixture,
    syncSeasonalPricingFromPricingV2: () => seasonalPricingFixture,
    parseAvailabilityPayloadRaw: () => ({ existing: true }),
  });

  assert.equal(plain?.city, "Lyon");

  const tariff = updateProfileFieldValue(profile, "hourly_rate", "55", {
    parseSeasonalPricing: () => seasonalPricingFixture,
    parsePricingV2FromAvailabilityHours: () => pricingV2Fixture,
    syncSeasonalPricingFromPricingV2: () => seasonalPricingFixture,
    parseAvailabilityPayloadRaw: () => ({ existing: true }),
  });

  assert.equal(tariff?.hourly_rate, 55);
  assert.match(String(tariff?.availability_hours), /pricing_v2/);
});

test("validateProfileField enforces common profile formats", () => {
  assert.equal(validateProfileField("email", "contact@example.com"), "");
  assert.equal(validateProfileField("email", "bad-email"), "Email invalide");

  assert.equal(validateProfileField("phone", "+33612345678"), "");
  assert.equal(validateProfileField("phone", "abc"), "Telephone invalide");

  assert.equal(validateProfileField("siret", "12345678901234"), "");
  assert.equal(
    validateProfileField("siret", "123"),
    "SIRET invalide (14 chiffres)",
  );

  assert.equal(validateProfileField("siren", "123456789"), "");
  assert.equal(
    validateProfileField("siren", "1234"),
    "SIREN invalide (9 chiffres)",
  );

  assert.equal(validateProfileField("postal_code", "75001"), "");
  assert.equal(
    validateProfileField("postal_code", "7500"),
    "Code postal invalide (5 chiffres)",
  );

  assert.equal(validateProfileField("website", "https://planetls.fr"), "");
  assert.equal(validateProfileField("website", "bad url"), "URL invalide");

  assert.equal(validateProfileField("iban", "FR7630006000011234567890189"), "");
  assert.equal(validateProfileField("iban", "FR12"), "IBAN invalide");
  assert.equal(validateProfileField("custom_field", "anything"), "");
});

test("progress helpers compute mission and tariff readiness consistently", () => {
  const missionSteps = buildMissionProgressSteps(2, 1, 5, 8, {
    SERVICES: "services",
    ZONE_RULES: "zone",
    WEEKLY_AVAILABILITY: "availability",
  });

  assert.equal(missionSteps.length, 3);
  assert.equal(countCompletedProgressSteps(missionSteps), 3);
  assert.equal(computeProgressPercent(3, missionSteps.length), 100);

  const tariffChecks = buildTariffReadinessChecks({
    activeMissionServiceCount: 1,
    hourlyRate: 45,
    location: "Paris",
    serviceArea: null,
    missionRowsCount: 0,
  });

  assert.equal(tariffChecks.length, 4);
  assert.equal(countReadyChecks(tariffChecks), 3);
  assert.equal(findPendingReadinessChecks(tariffChecks).length, 1);
  assert.equal(computeProgressPercent(3, tariffChecks.length), 75);
});

test("pricing catalog helpers build, filter and group rows consistently", () => {
  const services = [
    { id: 1, category: "Accueil", service: "Check-in" },
    { id: 2, category: "Ménage", service: "Ménage" },
  ];
  const prices = [{ id: "p1", service_id: 2, amount: 45 }];

  const priceMap = buildServicePriceMap(prices);
  assert.equal(priceMap.get(2)?.amount, 45);

  const rows = buildPricingCatalogRows(services, priceMap, new Set([2]));
  assert.equal(rows[0]?.service.id, 2);
  assert.equal(countConfiguredPricingRows(rows), 1);

  const filtered = filterPricingCatalogRows(rows, false);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.service.id, 2);

  const sorted = sortPricingCatalogRows(rows, "category");
  assert.equal(sorted.length, 2);

  const grouped = groupPricingCatalogRows(sorted);
  assert.equal(grouped.length, 2);
});

test("pricing segment helpers build payloads and resolve default segment", () => {
  assert.deepEqual(buildEmptyPricingSegmentDraft(), {
    name: "",
    commission_delta_pct: "0",
    setup_fee_delta_pct: "0",
  });

  assert.deepEqual(
    buildPricingSegmentPayload({
      name: " Premium ",
      commission_delta_pct: "12",
      setup_fee_delta_pct: "8",
    }),
    {
      name: "Premium",
      commission_delta_pct: 12,
      setup_fee_delta_pct: 8,
    },
  );

  assert.deepEqual(
    buildPricingSegmentUpdatePayload({
      id: "seg_1",
      name: "Premium",
      commission_delta_pct: 12,
      setup_fee_delta_pct: 8,
      is_default: 1 as unknown as boolean,
    }),
    {
      name: "Premium",
      commission_delta_pct: 12,
      setup_fee_delta_pct: 8,
      is_default: true,
    },
  );

  const segments = [
    { id: "seg_1", name: "Standard", commission_delta_pct: 0, setup_fee_delta_pct: 0, is_default: true },
    { id: "seg_2", name: "Premium", commission_delta_pct: 10, setup_fee_delta_pct: 5, is_default: false },
  ];

  assert.equal(selectPricingSegment(segments, "seg_2")?.name, "Premium");
  assert.equal(selectPricingSegment(segments, "missing")?.name, "Standard");
});

test("pricing property rule helpers build payloads and match by specificity", () => {
  assert.deepEqual(buildEmptyPricingPropertyRuleDraft(), {
    service_id: "",
    property_type: "",
    min_surface_m2: "",
    max_surface_m2: "",
    delta_pct: "0",
  });

  assert.deepEqual(
    buildPricingPropertyRulePayload({
      service_id: "2",
      property_type: " Appartement ",
      min_surface_m2: "20",
      max_surface_m2: "80",
      delta_pct: "15",
    }),
    {
      service_id: 2,
      property_type: "Appartement",
      min_surface_m2: 20,
      max_surface_m2: 80,
      delta_pct: 15,
    },
  );

  assert.deepEqual(
    buildPricingPropertyRuleUpdatePayload({
      id: "rule_1",
      service_id: 2,
      property_type: "Appartement",
      min_surface_m2: 20,
      max_surface_m2: 80,
      delta_pct: 15,
    }),
    {
      service_id: 2,
      property_type: "Appartement",
      min_surface_m2: 20,
      max_surface_m2: 80,
      delta_pct: 15,
    },
  );

  const rules = [
    {
      id: "rule_1",
      service_id: null,
      property_type: "Appartement",
      min_surface_m2: null,
      max_surface_m2: null,
      delta_pct: 5,
    },
    {
      id: "rule_2",
      service_id: 2,
      property_type: "Appartement",
      min_surface_m2: 20,
      max_surface_m2: 80,
      delta_pct: 15,
    },
  ];

  const sortedRules = sortPropertyRulesBySpecificity(rules);
  assert.equal(sortedRules[0]?.id, "rule_2");

  const matchedRule = findMatchingPropertyRule(rules, {
    selectedServiceId: 2,
    propertyType: "appartement",
    surfaceM2: 45,
  });
  assert.equal(matchedRule?.id, "rule_2");
});

test("pricing scenario helpers normalize payload and success message", () => {
  assert.deepEqual(
    buildPricingScenarioPayload("  Projection été  ", { revenueEstimate: "12000" }),
    {
      name: "Projection été",
      simulation: { revenueEstimate: "12000" },
    },
  );

  assert.equal(
    buildPricingScenarioLoadedMessage("Projection été"),
    "Scénario chargé : Projection été.",
  );

  assert.deepEqual(buildPricingScenarioDefaultPayload(), { is_default: true });
});

test("fetchPricingCollection returns arrays and exposes API errors", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => [{ id: "seg_1" }],
      }) as Response) as typeof fetch;

    const rows = await fetchPricingCollection<{ id: string }>(
      "/api/pricing/segments",
      "fallback",
    );
    assert.deepEqual(rows, [{ id: "seg_1" }]);

    globalThis.fetch = (async () =>
      ({
        ok: false,
        json: async () => ({ error: "boom" }),
      }) as Response) as typeof fetch;

    await assert.rejects(
      fetchPricingCollection("/api/pricing/segments", "fallback"),
      /boom/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("deletePricingResource resolves on success and exposes API errors", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({}),
      }) as Response) as typeof fetch;

    await assert.doesNotReject(
      deletePricingResource("/api/pricing/segments/1", "fallback"),
    );

    globalThis.fetch = (async () =>
      ({
        ok: false,
        json: async () => ({ error: "delete-boom" }),
      }) as Response) as typeof fetch;

    await assert.rejects(
      deletePricingResource("/api/pricing/segments/1", "fallback"),
      /delete-boom/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("updatePricingResource resolves on success and exposes API errors", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({}),
      }) as Response) as typeof fetch;

    await assert.doesNotReject(
      updatePricingResource("/api/pricing/segments/1", { name: "Premium" }, "fallback"),
    );

    globalThis.fetch = (async () =>
      ({
        ok: false,
        json: async () => ({ error: "patch-boom" }),
      }) as Response) as typeof fetch;

    await assert.rejects(
      updatePricingResource("/api/pricing/segments/1", { name: "Premium" }, "fallback"),
      /patch-boom/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("service price helpers validate, build payloads and compute request metadata", async () => {
  assert.deepEqual(
    validatePricingModalState({
      serviceId: "",
      label: "",
      type: "fixed",
      amount: "",
      unit: "",
    }),
    {
      serviceIdNumber: null,
      parsedAmount: null,
      error: "Selectionnez un service.",
    },
  );

  assert.deepEqual(
    validatePricingModalState({
      serviceId: "2",
      label: "",
      type: "fixed",
      amount: "0",
      unit: "par prestation",
    }),
    {
      serviceIdNumber: 2,
      parsedAmount: null,
      error: "Le tarif doit etre superieur a 0.",
    },
  );

  const validState = {
    id: "price_1",
    serviceId: "2",
    label: "",
    type: "fixed",
    amount: "90",
    unit: "par prestation",
  };

  assert.deepEqual(validatePricingModalState(validState), {
    serviceIdNumber: 2,
    parsedAmount: 90,
    error: null,
  });

  const payload = buildServicePricePayload(validState, 2, 90, [
    { id: 2, service: "Check-in" },
  ]);
  assert.deepEqual(payload, {
    service_id: 2,
    label: "Check-in",
    type: "fixed",
    amount: 90,
    unit: "par prestation",
  });

  assert.deepEqual(buildServicePriceRequest(validState, payload), {
    isUpdate: true,
    endpoint: "/api/pricing/price_1",
    method: "PATCH",
    payload,
  });

  assert.deepEqual(buildResetPricingModalState(42, "hourly"), {
    amount: "42",
    unit: "par heure",
  });

  assert.deepEqual(buildCreatePricingModalState({ id: 2, service: "Check-in" }, 42), {
    id: undefined,
    serviceId: "2",
    label: "Check-in",
    type: "hourly",
    amount: "42",
    unit: "par heure",
  });

  assert.deepEqual(
    buildEditPricingModalState({
      id: "price_1",
      service_id: 2,
      label: "Check-in",
      type: "fixed",
      amount: 90,
      unit: "par prestation",
    }),
    {
      id: "price_1",
      serviceId: "2",
      label: "Check-in",
      type: "fixed",
      amount: "90",
      unit: "par prestation",
    },
  );

  assert.equal(
    shouldDisableMissionServiceAfterDelete(
      { id: "price_1", service_id: 2 },
      [{ id: "price_1", service_id: 2 }],
    ),
    true,
  );

  assert.deepEqual(
    collectServiceIdsToDisable([
      { id: "1", service_id: 2 },
      { id: "2", service_id: 3 },
      { id: "3", service_id: 2 },
      { id: "4", service_id: null },
    ]),
    [2, 3],
  );
});

test("syncMissionServiceFromPricing toggles mission activation from pricing actions", () => {
  const profile = {
    availability_hours: JSON.stringify({
      existing: true,
      missionProfile: {
        missions: [
          {
            id: "check-in",
            label: "Check-in",
            isActive: false,
            minNoticeHours: 24,
            allowUrgent: false,
            urgentMultiplier: 1.3,
          },
        ],
      },
      missionCatalog: [{ id: "check-in", label: "Check-in" }],
      preferences: {},
    }),
  };

  const parseMissionPayload = () => ({
    missionProfile: {
      missions: [
        {
          id: "check-in",
          label: "Check-in",
          isActive: false,
          minNoticeHours: 24,
          allowUrgent: false,
          urgentMultiplier: 1.3,
        },
      ],
    },
    missionCatalog: [{ id: "check-in", label: "Check-in" }],
    preferences: {},
  });

  const enabled = syncMissionServiceFromPricing(profile, {
    serviceIdNumber: 2,
    fallbackLabel: "Check-in",
    mode: "enable",
    catalogServices: [{ id: 2, service: "Check-in" }],
    parseMissionPayload,
    parseAvailabilityPayloadRaw: () => ({ existing: true }),
    buildLegacyFromMissionProfile: (missionProfile: MissionProfileForLegacy) => ({
      missionCatalog: missionProfile.missions.map((mission) => ({
        id: mission.id,
        label: mission.label,
      })),
      preferences: {},
    }),
    normalizeServiceLabel: (value) => value.toLowerCase(),
    toMissionTypeId: (value) => value.toLowerCase(),
  });
  assert.match(String(enabled?.availability_hours), /"isActive":true/);

  const disabled = syncMissionServiceFromPricing(enabled, {
    serviceIdNumber: 2,
    fallbackLabel: "Check-in",
    mode: "disable",
    catalogServices: [{ id: 2, service: "Check-in" }],
    parseMissionPayload: () => ({
      missionProfile: {
        missions: [
          {
            id: "check-in",
            label: "Check-in",
            isActive: true,
            minNoticeHours: 24,
            allowUrgent: false,
            urgentMultiplier: 1.3,
          },
        ],
      },
      missionCatalog: [{ id: "check-in", label: "Check-in" }],
      preferences: {},
    }),
    parseAvailabilityPayloadRaw: () => ({ existing: true }),
    buildLegacyFromMissionProfile: (missionProfile: MissionProfileForLegacy) => ({
      missionCatalog: missionProfile.missions.map((mission) => ({
        id: mission.id,
        label: mission.label,
      })),
      preferences: {},
    }),
    normalizeServiceLabel: (value) => value.toLowerCase(),
    toMissionTypeId: (value) => value.toLowerCase(),
  });
  assert.match(String(disabled?.availability_hours), /"isActive":false/);
});

test("savePricingResource resolves on success and exposes API errors", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({}),
      }) as Response) as typeof fetch;

    await assert.doesNotReject(
      savePricingResource({
        endpoint: "/api/pricing",
        method: "POST",
        payload: { label: "Check-in" },
        fallbackErrorMessage: "fallback",
      }),
    );

    globalThis.fetch = (async () =>
      ({
        ok: false,
        json: async () => ({ error: "save-boom" }),
      }) as Response) as typeof fetch;

    await assert.rejects(
      savePricingResource({
        endpoint: "/api/pricing",
        method: "PATCH",
        payload: { label: "Check-in" },
        fallbackErrorMessage: "fallback",
      }),
      /save-boom/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
