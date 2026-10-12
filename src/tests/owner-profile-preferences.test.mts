import test from "node:test";
import { PLANETLS_SERVICE_FAMILIES } from "../app/lib/planetlsServiceCatalogTarget.ts";
import assert from "node:assert/strict";
import {
  buildOwnerConciergeSearchDefaults,
  buildOwnerRequestFormDefaults,
  EMPTY_OWNER_ONBOARDING_V1,
  getOwnerProfilePreferences,
  mergeOwnerPreferencesIntoAvailabilityHours,
  resolveOwnerOnboardingNeedPreference,
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
    ownerOnboardingV1: null,
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
    ownerOnboardingV1: null,
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
    selectedServices: [],
  });

  assert.deepEqual(
    buildOwnerConciergeSearchDefaults({
      ...preferences,
      propertyType: "",
      propertyTypes: ["Maison"],
    }),
    {
      propertyType: "Maison",
      selectedServices: [],
    },
  );
});

test("canonical owner onboarding families persist unchanged and are not sent as precise services", () => {
  const familySlugs = PLANETLS_SERVICE_FAMILIES.map((family) => family.slug);
  assert.equal(familySlugs.length, 8);
  const encoded = mergeOwnerPreferencesIntoAvailabilityHours(null, {
    ownerOnboardingV1: {
      needs: familySlugs,
    },
  });
  const preferences = getOwnerProfilePreferences(encoded);

  assert.deepEqual(preferences.ownerOnboardingV1?.needs, familySlugs);
  assert.deepEqual(buildOwnerConciergeSearchDefaults(preferences).selectedServices, []);

  const stored = JSON.parse(encoded) as {
    preferences: { ownerOnboardingV1: { needs: string[] } };
  };
  assert.deepEqual(stored.preferences.ownerOnboardingV1.needs, familySlugs);
});

test("legacy precise onboarding needs map to canonical service labels for search", () => {
  const preferences = getOwnerProfilePreferences(
    JSON.stringify({
      preferences: {
        ownerOnboardingV1: {
          needs: ["check_in", "check_out", "cleaning", "linen", "maintenance"],
        },
      },
    }),
  );

  assert.deepEqual(buildOwnerConciergeSearchDefaults(preferences).selectedServices, [
    "Check-in",
    "Check-out",
    "Ménage du logement",
    "Changement de linge",
    "Petites réparations",
  ]);
});

test("owner onboarding v1 empty object stays stable", () => {
  assert.deepEqual(EMPTY_OWNER_ONBOARDING_V1, {
    managementMode: null,
    needs: [],
    situation: null,
    helpFrequency: null,
    requestOrg: null,
    billingPref: null,
    proOrg: null,
  });
});

test("owner onboarding v1 is read and merged without touching legacy preferences", () => {
  const availabilityHours = JSON.stringify({
    onboarding: { signupMode: "simple" },
    preferences: {
      ownerGoal: "find_concierge",
      collaborationType: "regular",
      frequency: "monthly",
      ownerOnboardingV1: {
        managementMode: "supported",
        needs: ["cleaning", "linen"],
        situation: "already_renting",
        helpFrequency: "regular",
        requestOrg: "bookings",
        billingPref: "monthly",
        proOrg: "main_professional",
      },
    },
  });

  const parsed = getOwnerProfilePreferences(availabilityHours);
  assert.deepEqual(parsed.ownerOnboardingV1, {
    managementMode: "supported",
    needs: ["cleaning", "linen"],
    situation: "already_renting",
    helpFrequency: "regular",
    requestOrg: "bookings",
    billingPref: "monthly",
    proOrg: "main_professional",
  });
  assert.equal(parsed.collaborationType, "regular");
  assert.equal(parsed.frequency, "monthly");

  const merged = JSON.parse(
    mergeOwnerPreferencesIntoAvailabilityHours(availabilityHours, {
      ownerOnboardingV1: {
        managementMode: "full_delegation",
        needs: ["check_in", "full_management"],
      },
    }),
  ) as Record<string, unknown>;
  const nextPreferences = merged.preferences as Record<string, unknown>;
  assert.equal(nextPreferences.collaborationType, "regular");
  assert.equal(nextPreferences.frequency, "monthly");
  assert.deepEqual(nextPreferences.ownerOnboardingV1, {
    managementMode: "full_delegation",
    needs: ["check_in", "full_management"],
    situation: "already_renting",
    helpFrequency: "regular",
    requestOrg: "bookings",
    billingPref: "monthly",
    proOrg: "main_professional",
  });
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

test("owner onboarding need preferences resolve to common catalog concepts without changing stored values", () => {
  const checkIn = resolveOwnerOnboardingNeedPreference("check_in");
  const checkOut = resolveOwnerOnboardingNeedPreference("check_out");
  const cleaning = resolveOwnerOnboardingNeedPreference("cleaning");
  const linen = resolveOwnerOnboardingNeedPreference("linen");
  const maintenance = resolveOwnerOnboardingNeedPreference("maintenance");
  const messages = resolveOwnerOnboardingNeedPreference("traveler_messages");
  const fullManagement = resolveOwnerOnboardingNeedPreference("full_management");
  const other = resolveOwnerOnboardingNeedPreference("other");

  assert.equal(checkIn.kind, "service");
  if (checkIn.kind === "service") {
    assert.equal(checkIn.slug, "guest_checkin");
    assert.equal(checkIn.service.slug, "guest_checkin");
  }
  assert.equal(checkOut.kind, "service");
  if (checkOut.kind === "service") {
    assert.equal(checkOut.slug, "guest_checkout");
    assert.equal(checkOut.service.slug, "guest_checkout");
  }

  assert.equal(cleaning.kind, "family");
  if (cleaning.kind === "family") assert.equal(cleaning.family, "cleaning_linen");
  assert.equal(linen.kind, "family");
  if (linen.kind === "family") assert.equal(linen.family, "cleaning_linen");
  assert.equal(maintenance.kind, "family");
  if (maintenance.kind === "family") assert.equal(maintenance.family, "maintenance_repair");

  for (const family of PLANETLS_SERVICE_FAMILIES) {
    const resolution = resolveOwnerOnboardingNeedPreference(family.slug);
    assert.equal(resolution.kind, "family");
    if (resolution.kind === "family") assert.equal(resolution.family, family.slug);
  }

  assert.equal(messages.kind, "ambiguous");
  if (messages.kind === "ambiguous") {
    // `admin_guest_communication` n'existe pas dans le catalogue cible :
    // aucun candidat artificiel n'est inventé (règle métier explicite du lot 4D).
    assert.equal(messages.candidates.length, 0);
  }

  assert.equal(fullManagement.kind, "mode");
  if (fullManagement.kind === "mode") {
    assert.equal(fullManagement.mode, "full_management");
  }

  assert.equal(other.kind, "unknown");
});

test("owner onboarding need preference resolver never converts unknown values silently", () => {
  assert.deepEqual(resolveOwnerOnboardingNeedPreference("custom_need"), {
    kind: "unknown",
    need: "custom_need",
    value: "custom_need",
  });
});
