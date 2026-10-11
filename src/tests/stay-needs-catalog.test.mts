import test from "node:test";
import assert from "node:assert/strict";

import {
  getStayNeedServiceSlug,
  normalizeStayNeed,
  resolveStayNeedCatalogService,
  SERVICE_CODES,
  STAY_NEED_KEYS,
  STAY_NEED_SERVICE_SLUGS,
  type NeedKey,
} from "../app/api/_shared/stayNeeds.ts";

test("stay need catalog mapping keeps historical need keys and service codes", () => {
  assert.deepEqual(STAY_NEED_KEYS, ["checkin", "checkout", "cleaning", "linen", "courses"]);
  assert.deepEqual(SERVICE_CODES, {
    checkin: "CHECK_IN",
    checkout: "CHECK_OUT",
    cleaning: "MENAGE",
    linen: "LINGE",
    courses: "COURSES",
  });
});

test("stay needs map to explicit target service slugs", () => {
  assert.deepEqual(STAY_NEED_SERVICE_SLUGS, {
    checkin: "guest_checkin",
    checkout: "guest_checkout",
    cleaning: "cleaning_turnover",
    linen: "linen_change",
    courses: "shopping_supplies",
  });
});

test("stay need catalog resolution preserves independent needs", () => {
  const expected: Record<NeedKey, string> = {
    checkin: "guest_checkin",
    checkout: "guest_checkout",
    cleaning: "cleaning_turnover",
    linen: "linen_change",
    courses: "shopping_supplies",
  };

  for (const [need, slug] of Object.entries(expected) as Array<[NeedKey, string]>) {
    const resolved = resolveStayNeedCatalogService(need);
    // Aucun besoin reconnu ne doit rester inconnu.
    assert.notEqual(resolved.kind, "unknown");
    if (resolved.kind !== "unknown") {
      assert.equal(resolved.need, need);
      assert.equal(resolved.slug, slug);
      assert.equal(resolved.service.slug, slug);
      assert.equal(resolved.historicalCode, SERVICE_CODES[need]);
    }
  }
});

test("courses correspond to a group to qualify, not a precise service", () => {
  const resolved = resolveStayNeedCatalogService("courses");
  assert.equal(resolved.kind, "group");
});

test("check-in and check-out stay needs never collapse into a single bundle", () => {
  const checkin = resolveStayNeedCatalogService("checkin");
  const checkout = resolveStayNeedCatalogService("checkout");

  assert.equal(checkin.kind, "service");
  assert.equal(checkout.kind, "service");
  if (checkin.kind === "service" && checkout.kind === "service") {
    assert.equal(checkin.slug, "guest_checkin");
    assert.equal(checkout.slug, "guest_checkout");
    assert.notEqual(checkin.service.slug, checkout.service.slug);
  }
});

test("normalization behavior remains compatible with historical stay values", () => {
  assert.equal(normalizeStayNeed("CHECK_IN"), "checkin");
  assert.equal(normalizeStayNeed("arrival"), "checkin");
  assert.equal(normalizeStayNeed("CHECK_OUT"), "checkout");
  assert.equal(normalizeStayNeed("departure"), "checkout");
  assert.equal(normalizeStayNeed("ménage"), "cleaning");
  assert.equal(normalizeStayNeed("linge"), "linen");
  assert.equal(normalizeStayNeed("groceries"), "courses");
});

test("unknown values are not silently converted to services", () => {
  assert.equal(resolveStayNeedCatalogService("maintenance").kind, "unknown");
  assert.equal(normalizeStayNeed("maintenance"), null);
});

test("stay need service slug helper is explicit", () => {
  assert.equal(getStayNeedServiceSlug("cleaning"), "cleaning_turnover");
  assert.equal(getStayNeedServiceSlug("linen"), "linen_change");
});
