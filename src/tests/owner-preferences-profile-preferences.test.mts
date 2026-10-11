import assert from "node:assert/strict";
import test from "node:test";

import { resolveOwnerOnboardingNeedPreference } from "../features/owner-preferences/profilePreferences.ts";

test("check_in est résolu comme prestation précise guest_checkin", () => {
  const resolution = resolveOwnerOnboardingNeedPreference("check_in");
  assert.equal(resolution.kind, "service");
  if (resolution.kind === "service") {
    assert.equal(resolution.slug, "guest_checkin");
  }
});

test("check_out est résolu comme prestation précise guest_checkout", () => {
  const resolution = resolveOwnerOnboardingNeedPreference("check_out");
  assert.equal(resolution.kind, "service");
  if (resolution.kind === "service") {
    assert.equal(resolution.slug, "guest_checkout");
  }
});

test("full_management reste un mode de collaboration, jamais une prestation", () => {
  const resolution = resolveOwnerOnboardingNeedPreference("full_management");
  assert.equal(resolution.kind, "mode");
  if (resolution.kind === "mode") {
    assert.equal(resolution.mode, "full_management");
  }
});

test("traveler_messages reste ambigu sans candidate artificielle", () => {
  const resolution = resolveOwnerOnboardingNeedPreference("traveler_messages");
  assert.equal(resolution.kind, "ambiguous");
  if (resolution.kind === "ambiguous") {
    assert.equal(resolution.candidates.length, 0);
  }
});

test("cleaning reste une famille générale non convertie en prestation", () => {
  const resolution = resolveOwnerOnboardingNeedPreference("cleaning");
  assert.equal(resolution.kind, "family");
});

test("une valeur inconnue reste inconnue", () => {
  const resolution = resolveOwnerOnboardingNeedPreference("other");
  assert.equal(resolution.kind, "unknown");
});
