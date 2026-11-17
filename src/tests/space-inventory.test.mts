import assert from "node:assert/strict";
import test from "node:test";
import { spaceInventory, spaceInventorySchema, SPACE_INVENTORY_LABELS } from "../app/dashboard/admin/(product-tech)/developpement/spaceInventory.ts";
import { SUBFEATURE_SPACES } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureTypes.ts";
import { subfeatureCatalog } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureCatalog.ts";

test("six espaces uniques, dates valides et sources explicites d'inventaire", () => {
  assert.equal(spaceInventory.length, 6);
  assert.equal(new Set(spaceInventory.map(item => item.id)).size, 6);
  assert.deepEqual(spaceInventory.map(item => item.name), [...SUBFEATURE_SPACES]);
  for (const item of spaceInventory) {
    assert.equal(spaceInventorySchema.safeParse(item).success, true);
    assert.ok(item.source.length > 0);
    assert.ok(item.limitations.length > 0);
    assert.ok(item.unknowns.length > 0);
  }
});

test("Conciergerie partielle, 19 fiches dont une qualification, aucune validation déduite", () => {
  const concierge = spaceInventory.find(item => item.name === "Conciergerie")!;
  assert.equal(concierge.state, "partial");
  assert.match(concierge.scope, /19 fiches/);
  assert.match(concierge.scope, /PLS-SF-CON-004/);
  assert.equal(subfeatureCatalog.filter(item => item.primarySpace === "Conciergerie").length, 19);
  assert.equal(subfeatureCatalog.filter(item => item.recordType === "scope_to_qualify").length, 1);
  assert.ok(concierge.limitations.some(limit => limit.includes("exhaustive")));
});

test("cinq inventaires absents ne signifient pas absence de fonctionnalités", () => {
  const absent = spaceInventory.filter(item => item.state === "absent");
  assert.equal(absent.length, 5);
  for (const item of absent) {
    assert.equal(subfeatureCatalog.some(feature => feature.primarySpace === item.name), false);
    assert.match(item.scope, /Inventaire détaillé non réalisé/);
    assert.ok(item.limitations.some(limit => limit.includes("ne signifie pas l'absence de fonctionnalités")));
  }
  assert.equal(spaceInventory.some(item => item.state === "reviewed_scope"), false);
});

test("dates inconnues admises, états distincts et aucun pourcentage de couverture", () => {
  assert.equal(spaceInventorySchema.safeParse({ ...spaceInventory[0], assessedAt: null }).success, true);
  assert.equal(spaceInventorySchema.safeParse({ ...spaceInventory[0], assessedAt: "2026-99-99" }).success, false);
  assert.equal(spaceInventorySchema.safeParse({ ...spaceInventory[0], state: "reviewed_scope" }).success, true);
  assert.equal(SPACE_INVENTORY_LABELS.reviewed_scope, "Inventaire relu sur un périmètre défini");
  for (const item of spaceInventory) assert.deepEqual(Object.keys(item).sort(), ["id", "name", "state", "scope", "source", "assessedAt", "limitations", "unknowns"].sort());
});
