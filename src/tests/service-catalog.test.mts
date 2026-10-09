import test from "node:test";
import assert from "node:assert/strict";

import {
  addServiceValues,
  groupServiceCatalog,
  hasServiceValue,
  normalizeServiceCatalogCategory,
  removeServiceValue,
} from "../app/lib/serviceCatalog.ts";
import {
  COMMON_SERVICE_REFERENCES,
  FUTURE_SERVICE_REFERENCES,
  resolveCommonServiceById,
  resolveCommonServiceValue,
} from "../app/lib/commonServiceCatalog.ts";

test("service catalog groups normalize legacy categories and remove duplicates", () => {
  const groups = groupServiceCatalog([
    { id: 1, category: "Accueil", service: "Check-in", description: "A" },
    { id: 2, category: "Accueil voyageurs", service: "Check-in", description: "Duplicate" },
    { id: 3, category: "Administratif", service: "Reporting", description: "B" },
    { id: 4, category: "", service: "Besoin libre", description: null },
  ]);

  assert.deepEqual(
    groups.map((group) => [group.category, group.services.map((service) => service.service)]),
    [
      ["Accueil voyageurs", ["Check-in"]],
      ["Gestion administrative", ["Reporting"]],
      ["Autre besoin", ["Besoin libre"]],
    ],
  );
});

test("service catalog selection can add a category with all subservices then remove manually", () => {
  const selected = addServiceValues([], ["Accueil voyageurs", "Check-in", "Assistance voyageurs"]);

  assert.equal(hasServiceValue(selected, "Accueil voyageurs"), true);
  assert.equal(hasServiceValue(selected, "Check-in"), true);
  assert.deepEqual(removeServiceValue(selected, "Check-in"), ["Accueil voyageurs", "Assistance voyageurs"]);
});

test("service catalog category labels stay owner and concierge compatible", () => {
  assert.equal(normalizeServiceCatalogCategory("Accueil"), "Accueil voyageurs");
  assert.equal(normalizeServiceCatalogCategory("Administratif"), "Gestion administrative");
  assert.equal(normalizeServiceCatalogCategory("Autres"), "Autre besoin");
});

test("common service catalog preserves the 76 historical ids", () => {
  assert.equal(COMMON_SERVICE_REFERENCES.length, 76);
  assert.deepEqual(
    COMMON_SERVICE_REFERENCES.map((service) => service.id),
    Array.from({ length: 76 }, (_, index) => index + 1),
  );
  assert.equal(new Set(COMMON_SERVICE_REFERENCES.map((service) => service.slug)).size, 76);
});

test("common service catalog separates future check-in and check-out without numeric ids", () => {
  const futureBySlug = new Map(FUTURE_SERVICE_REFERENCES.map((service) => [service.slug, service]));

  assert.equal(futureBySlug.get("guest_checkin")?.id, null);
  assert.equal(futureBySlug.get("guest_checkout")?.id, null);
  assert.notEqual(futureBySlug.get("guest_checkin")?.slug, futureBySlug.get("guest_checkout")?.slug);
});

test("common service catalog preserves id 16 as ambiguous legacy bundle", () => {
  const legacyBundle = resolveCommonServiceById(16);

  assert.equal(legacyBundle?.slug, "guest_checkin_checkout_legacy_bundle");
  assert.equal(legacyBundle?.status, "ambiguous");
  assert.equal(resolveCommonServiceValue("Check-in / Check-out").kind, "service");
});

test("common service catalog distinguishes collaboration modes from services", () => {
  const fullManagement = resolveCommonServiceValue("Gestion complète");
  const alaCarte = resolveCommonServiceValue("À la carte");

  assert.equal(fullManagement.kind, "collaboration_mode");
  if (fullManagement.kind === "collaboration_mode") {
    assert.equal(fullManagement.mode, "full_management");
  }
  assert.equal(alaCarte.kind, "collaboration_mode");
  if (alaCarte.kind === "collaboration_mode") {
    assert.equal(alaCarte.mode, "a_la_carte");
  }
});

test("common service catalog resolves common historical aliases without silent unknown conversion", () => {
  const menage = resolveCommonServiceValue("Ménage");
  const linge = resolveCommonServiceValue("Linge");
  const maintenance = resolveCommonServiceValue("Maintenance");
  const unknown = resolveCommonServiceValue("Valeur inventée");

  assert.equal(menage.kind, "service");
  if (menage.kind === "service") {
    assert.equal(menage.service.slug, "legacy_menage");
  }
  assert.equal(linge.kind, "service");
  assert.equal(maintenance.kind, "service");
  assert.equal(unknown.kind, "unknown");
});

test("common service catalog keeps intendance and night emergency ambiguous", () => {
  const intendance = resolveCommonServiceById(73);
  const nightEmergency = resolveCommonServiceById(75);

  assert.equal(intendance?.status, "ambiguous");
  assert.equal(nightEmergency?.status, "ambiguous");
});
