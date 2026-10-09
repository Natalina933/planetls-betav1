import test from "node:test";
import assert from "node:assert/strict";

import { resolveCommonServiceById } from "../app/lib/commonServiceCatalog.ts";
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

test("stay needs map to explicit common service slugs", () => {
  assert.deepEqual(STAY_NEED_SERVICE_SLUGS, {
    checkin: "guest_checkin",
    checkout: "guest_checkout",
    cleaning: "cleaning_turnover",
    linen: "linen_change",
    courses: "groceries_arrival",
  });
});

test("stay need catalog resolution preserves independent needs", () => {
  const expected: Record<NeedKey, string> = {
    checkin: "guest_checkin",
    checkout: "guest_checkout",
    cleaning: "cleaning_turnover",
    linen: "linen_change",
    courses: "groceries_arrival",
  };

  for (const [need, slug] of Object.entries(expected) as Array<[NeedKey, string]>) {
    const resolved = resolveStayNeedCatalogService(need);
    assert.equal(resolved.kind, "service");
    if (resolved.kind === "service") {
      assert.equal(resolved.need, need);
      assert.equal(resolved.slug, slug);
      assert.equal(resolved.service.slug, slug);
      assert.equal(resolved.historicalCode, SERVICE_CODES[need]);
    }
  }
});

test("check-in and check-out stay needs never split legacy id 16", () => {
  const legacyBundle = resolveCommonServiceById(16);
  const checkin = resolveStayNeedCatalogService("checkin");
  const checkout = resolveStayNeedCatalogService("checkout");

  assert.equal(legacyBundle?.slug, "guest_checkin_checkout_legacy_bundle");
  assert.equal(legacyBundle?.status, "ambiguous");
  assert.equal(checkin.kind, "service");
  assert.equal(checkout.kind, "service");
  if (checkin.kind === "service" && checkout.kind === "service") {
    assert.equal(checkin.service.id, null);
    assert.equal(checkout.service.id, null);
    assert.notEqual(checkin.service.slug, legacyBundle?.slug);
    assert.notEqual(checkout.service.slug, legacyBundle?.slug);
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
  assert.deepEqual(resolveStayNeedCatalogService("guest_checkin_checkout_legacy_bundle"), {
    kind: "unknown",
    value: "guest_checkin_checkout_legacy_bundle",
  });
  assert.deepEqual(resolveStayNeedCatalogService("maintenance"), {
    kind: "unknown",
    value: "maintenance",
  });
  assert.equal(normalizeStayNeed("maintenance"), null);
});

test("stay need service slug helper is explicit", () => {
  assert.equal(getStayNeedServiceSlug("cleaning"), "cleaning_turnover");
  assert.equal(getStayNeedServiceSlug("linen"), "linen_change");
});
