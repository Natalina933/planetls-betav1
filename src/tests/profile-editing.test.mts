import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProfileSuccessMessageSafe,
  buildProfileValidationAlertMessageSafe,
  buildProfileSavePayload,
  buildProfileSuccessMessage,
  buildSessionUserPayload,
  createSectionSnapshot,
  ensureOpenSection,
  hasSectionUnsavedChanges,
  hasValidationErrors,
  removeSectionSnapshot,
  resolveSavedSectionId,
  shouldCompleteMissionOnboarding,
  toggleOpenSection,
  updateProfileFieldErrorsSafe,
  updateProfileFieldValue,
  updateSocialFieldValue,
  validateProfileField,
  upsertSectionSnapshot,
} from "../app/dashboard/concierge/profile/profileEditing.ts";

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
