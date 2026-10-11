import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getStayNeedServiceSlug,
  normalizeStayNeed,
  resolveStayNeedCatalogService,
} from "../app/api/_shared/stayNeeds.ts";

test("L'arrivée des voyageurs correspond à guest_checkin", () => {
  const result = resolveStayNeedCatalogService("checkin");

  assert.equal(result.kind, "service");
  assert.equal(getStayNeedServiceSlug("checkin"), "guest_checkin");
});

test("Le départ des voyageurs correspond à guest_checkout", () => {
  const result = resolveStayNeedCatalogService("checkout");

  assert.equal(result.kind, "service");
  assert.equal(getStayNeedServiceSlug("checkout"), "guest_checkout");
});

test("Le ménage correspond à une prestation adaptée", () => {
  const result = resolveStayNeedCatalogService("cleaning");

  assert.equal(result.kind, "service");
  assert.equal(getStayNeedServiceSlug("cleaning"), "cleaning_turnover");
});

test("Le linge correspond à une prestation adaptée", () => {
  const result = resolveStayNeedCatalogService("linen");

  assert.equal(result.kind, "service");
  assert.equal(getStayNeedServiceSlug("linen"), "linen_change");
});

test("Les courses restent un groupe à qualifier", () => {
  const result = resolveStayNeedCatalogService("courses");

  assert.equal(result.kind, "group");
  assert.equal(getStayNeedServiceSlug("courses"), "shopping_supplies");
});

test("La maintenance reste un besoin à préciser", () => {
  assert.equal(normalizeStayNeed("maintenance"), null);
  assert.equal(resolveStayNeedCatalogService("maintenance").kind, "unknown");
});

test("Un besoin inconnu reste inconnu", () => {
  assert.equal(resolveStayNeedCatalogService("piscine").kind, "unknown");
});
