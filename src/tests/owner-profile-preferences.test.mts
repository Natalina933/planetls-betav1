import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOwnerConciergeSearchDefaults,
  buildOwnerRequestFormDefaults,
  getOwnerProfilePreferences,
  mergeOwnerPreferencesIntoAvailabilityHours,
} from "../features/owner-preferences/profilePreferences.ts";
import { parseOnboardingDetails } from "../features/onboarding-assistant/onboardingPayload.ts";

test("owner profile preferences read merged onboarding and preferences with preferences taking priority", () => {
  const availabilityHours = JSON.stringify({
    onboarding: {
      onboardingGoal: "prepare_listing",
      missionPreference: "onboarding",
      supportNeed: "shared",
      propertyType: "Maison",
      needVolume: "seasonal",
    },
    preferences: {
      ownerGoal: "regular_support",
      collaborationType: "regular",
      responsibilityLevel: "full",
      frequency: "year_round",
      estimatedDuration: "12 mois",
      operatingContext: "Location saisonniere avec arrivees le samedi",
      recurringExpectations: "Menage, linge et controle consommables",
      firstRequestTemplate: "Base recurrente",
    },
  });

  assert.deepEqual(getOwnerProfilePreferences(availabilityHours), {
    ownerGoal: "regular_support",
    collaborationType: "regular",
    frequency: "year_round",
    estimatedDuration: "12 mois",
    responsibilityLevel: "full",
    propertyType: "Maison",
    needVolume: "seasonal",
    operatingContext: "Location saisonniere avec arrivees le samedi",
    recurringExpectations: "Menage, linge et controle consommables",
    firstRequestTemplate: "Base recurrente",
    propertyTypes: [],
  });
});

test("owner preference merge preserves payload and updates preferences sub-tree", () => {
  const availabilityHours = JSON.stringify({
    onboarding: {
      signupMode: "business",
    },
    preferences: {
      ownerGoal: "find_concierge",
      collaborationType: "partial_management",
      frequency: "unknown",
    },
    existing: true,
  });

  const merged = mergeOwnerPreferencesIntoAvailabilityHours(availabilityHours, {
    ownerGoal: "replace_current",
    collaborationType: "temporary_replacement",
    frequency: "seasonal",
    responsibilityLevel: "shared",
    estimatedDuration: "2 semaines",
    propertyType: "Appartement",
    needVolume: "haute saison",
    operatingContext: "Arrivees autonomes et forte rotation estivale",
    recurringExpectations: "Menage, linge, photos apres intervention",
    firstRequestTemplate: "Relais a organiser",
  });
  const parsed = JSON.parse(merged) as Record<string, unknown>;
  const preferences = parsed.preferences as Record<string, unknown>;

  assert.equal(parsed.existing, true);
  assert.equal((parsed.onboarding as Record<string, unknown>).signupMode, "business");
  assert.equal(preferences.ownerGoal, "replace_current");
  assert.equal(preferences.collaborationType, "temporary_replacement");
  assert.equal(preferences.frequency, "seasonal");
  assert.equal(preferences.responsibilityLevel, "shared");
  assert.equal(preferences.estimatedDuration, "2 semaines");
  assert.equal(preferences.propertyType, "Appartement");
  assert.equal(preferences.operatingContext, "Arrivees autonomes et forte rotation estivale");
  assert.equal(preferences.recurringExpectations, "Menage, linge, photos apres intervention");
  assert.deepEqual(preferences.propertyTypes, ["Appartement"]);
});

test("owner request form defaults reuse saved profile preferences", () => {
  const defaults = buildOwnerRequestFormDefaults({
    ownerGoal: "one_off_quote",
    collaborationType: "one_off",
    frequency: "once",
    estimatedDuration: "1 jour",
    responsibilityLevel: "low",
    propertyType: "Appartement",
    needVolume: "",
    operatingContext: "Acces autonome et stationnement limite",
    recurringExpectations: "Menage et linge a chaque depart",
    firstRequestTemplate: "Menage apres depart",
    propertyTypes: ["Appartement"],
  });

  assert.deepEqual(defaults, {
    requestType: "ponctuel",
    ownerGoal: "one_off_quote",
    collaborationType: "one_off",
    frequency: "once",
    estimatedDuration: "1 jour",
    responsibilityLevel: "low",
    title: "Obtenir un devis ponctuel - Appartement",
    propertyType: "Appartement",
    propertyConstraints: "Acces autonome et stationnement limite",
    description: "Menage apres depart\n\nAttentes recurrentes : Menage et linge a chaque depart",
  });
});

test("owner concierge search defaults reuse the saved property context", () => {
  const preferences = getOwnerProfilePreferences(
    JSON.stringify({
      preferences: {
        propertyType: "Villa haut de gamme",
        propertyTypes: ["Appartement"],
      },
    }),
  );

  assert.deepEqual(buildOwnerConciergeSearchDefaults(preferences), {
    propertyType: "Villa haut de gamme",
  });

  assert.deepEqual(
    buildOwnerConciergeSearchDefaults({
      ...preferences,
      propertyType: "",
      propertyTypes: ["Maison"],
    }),
    {
      propertyType: "Maison",
    },
  );
});

test("parseOnboardingDetails now reads new owner preference aliases", () => {
  const parsed = parseOnboardingDetails(
    JSON.stringify({
      onboarding: {
        onboardingGoal: "prepare_listing",
      },
      preferences: {
        ownerGoal: "delegate_tasks",
        collaborationType: "partial_management",
        responsibilityLevel: "shared",
        frequency: "monthly",
        propertyType: "Maison",
        firstRequestTemplate: "Base brief",
      },
    }),
  );

  assert.equal(parsed.onboardingGoal, "delegate_tasks");
  assert.equal(parsed.missionPreference, "partial_management");
  assert.equal(parsed.supportNeed, "shared");
  assert.equal(parsed.needVolume, "monthly");
  assert.equal(parsed.propertyType, "Maison");
  assert.equal(parsed.firstRequestTemplate, "Base brief");
});
