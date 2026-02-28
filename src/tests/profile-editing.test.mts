import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProfileSavePayload,
  buildProfileSuccessMessage,
  buildSessionUserPayload,
  createSectionSnapshot,
  ensureOpenSection,
  hasSectionUnsavedChanges,
  hasValidationErrors,
  removeSectionSnapshot,
  shouldCompleteMissionOnboarding,
  toggleOpenSection,
  updateSocialFieldValue,
  upsertSectionSnapshot,
} from "../app/dashboard/concierge/profile/profileEditing.ts";

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
