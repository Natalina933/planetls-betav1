import test from "node:test";
import assert from "node:assert/strict";

import {
  addServiceValues,
  groupServiceCatalog,
  hasServiceValue,
  normalizeServiceCatalogCategory,
  removeServiceValue,
} from "../app/lib/serviceCatalog.ts";

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
