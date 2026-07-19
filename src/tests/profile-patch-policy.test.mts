import test from "node:test";
import assert from "node:assert/strict";
import {
  getProfilePatchPolicy,
  isProfilePatchNumberValueAllowed,
  sanitizeProfilePatchBody,
} from "../app/api/profiles/pure.ts";

test("owner patch policy keeps common identity fields and blocks operator fields", () => {
  const policy = getProfilePatchPolicy("owner", false);

  assert.equal(policy.stringFields.has("first_name"), true);
  assert.equal(policy.stringFields.has("company_name"), true);
  assert.equal(policy.stringFields.has("search_target"), true);
  assert.equal(policy.stringFields.has("service_area"), false);
  assert.equal(policy.stringFields.has("availability_hours"), false);
  assert.equal(policy.stringFields.has("category"), false);
  assert.equal(policy.numberFields.has("hourly_rate"), false);
  assert.equal(policy.allowExperienceLevel, false);
  assert.equal(policy.allowOwnerPreferencesObject, true);
});

test("concierge patch policy allows operational profile fields", () => {
  const policy = getProfilePatchPolicy("concierge", false);

  assert.equal(policy.stringFields.has("service_area"), true);
  assert.equal(policy.stringFields.has("availability_hours"), true);
  assert.equal(policy.stringFields.has("insurance_company"), true);
  assert.equal(policy.stringFields.has("search_target"), false);
  assert.equal(policy.numberFields.has("hourly_rate"), true);
  assert.equal(policy.numberFields.has("monthly_rate"), true);
  assert.equal(policy.booleanFields.has("emergency_service"), true);
  assert.equal(policy.allowExperienceLevel, true);
});

test("provider patch policy allows professional, compliance and operational fields", () => {
  const policy = getProfilePatchPolicy("artisan", false);

  assert.equal(policy.stringFields.has("category"), true);
  assert.equal(policy.stringFields.has("service_area"), true);
  assert.equal(policy.stringFields.has("availability_hours"), true);
  assert.equal(policy.stringFields.has("insurance_number"), true);
  assert.equal(policy.stringFields.has("certifications"), true);
  assert.equal(policy.stringFields.has("siret"), true);
  assert.equal(policy.numberFields.has("hourly_rate"), true);
  assert.equal(policy.numberFields.has("monthly_rate"), false);
  assert.equal(policy.booleanFields.has("emergency_service"), true);
  assert.equal(policy.allowExperienceLevel, true);
});

test("admin patch policy keeps broad compatibility including role mutation", () => {
  const policy = getProfilePatchPolicy("admin", true);

  assert.equal(policy.stringFields.has("search_target"), true);
  assert.equal(policy.stringFields.has("availability_hours"), true);
  assert.equal(policy.stringFields.has("siret"), true);
  assert.equal(policy.numberFields.has("monthly_rate"), true);
  assert.equal(policy.booleanFields.has("emergency_service"), true);
  assert.equal(policy.allowRoleMutation, true);
  assert.equal(policy.allowOwnerPreferencesObject, false);
});

test("profile patch numeric validator rejects negative business values but keeps avatar transforms", () => {
  assert.equal(isProfilePatchNumberValueAllowed("hourly_rate", -1), false);
  assert.equal(isProfilePatchNumberValueAllowed("travel_fee", -1), false);
  assert.equal(isProfilePatchNumberValueAllowed("years_experience", -2), false);
  assert.equal(isProfilePatchNumberValueAllowed("service_radius_km", 15), true);
  assert.equal(isProfilePatchNumberValueAllowed("avatar_offset_x", -12), true);
  assert.equal(isProfilePatchNumberValueAllowed("avatar_rotation", -5), true);
});

test("sanitizeProfilePatchBody keeps allowed fields and reports ignored owner operator fields", () => {
  const policy = getProfilePatchPolicy("owner", false);
  const result = sanitizeProfilePatchBody(
    {
      first_name: "Alice",
      city: "Paris",
      service_area: "Lyon",
      availability_hours: "{}",
      hourly_rate: 80,
      onboarding_complete: true,
    },
    policy,
  );

  assert.deepEqual(result.updateData, {
    first_name: "Alice",
    city: "Paris",
    onboarding_complete: true,
  });
  assert.deepEqual(result.ignoredFields, [
    "availability_hours",
    "hourly_rate",
    "service_area",
  ]);
  assert.deepEqual(result.invalidNumberFields, []);
  assert.equal(result.onboardingCompleteInput, true);
  assert.equal(result.ownerPreferencesInput, null);
});

test("sanitizeProfilePatchBody captures owner preferences payload without reopening raw availability_hours writes", () => {
  const policy = getProfilePatchPolicy("owner", false);
  const result = sanitizeProfilePatchBody(
    {
      owner_preferences: {
        ownerGoal: "find_concierge",
        collaborationType: "partial_management",
      },
      availability_hours: "{\"preferences\":{}}",
    },
    policy,
  );

  assert.deepEqual(result.updateData, {});
  assert.deepEqual(result.ownerPreferencesInput, {
    ownerGoal: "find_concierge",
    collaborationType: "partial_management",
  });
  assert.deepEqual(result.ignoredFields, ["availability_hours"]);
});

test("sanitizeProfilePatchBody drops invalid negative numeric business fields", () => {
  const policy = getProfilePatchPolicy("concierge", false);
  const result = sanitizeProfilePatchBody(
    {
      service_radius_km: -5,
      hourly_rate: -1,
      monthly_rate: 2500,
      travel_fee: 10,
    },
    policy,
  );

  assert.deepEqual(result.updateData, {
    monthly_rate: 2500,
    travel_fee: 10,
  });
  assert.deepEqual(result.ignoredFields, []);
  assert.deepEqual(result.invalidNumberFields, ["hourly_rate", "service_radius_km"]);
});
