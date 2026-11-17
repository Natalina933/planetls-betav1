import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { subfeatureCatalog } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureCatalog.ts";
import { searchSubfeatures, resetSubfeatureSearch, normalizeSubfeatureSearch } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureSearch.ts";
import { computeSpaceProgress } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

const ids = (items: ReturnType<typeof searchSubfeatures>) => items.map(item => item.id);
const expected = (...numbers: number[]) => numbers.map(n => `PLS-SF-CON-${String(n).padStart(3, "0")}`);

test("recherche commune par nom, identifiant et description, accents et casse ignorés", () => {
  assert.equal(normalizeSubfeatureSearch("  ÉVALUÉ  "), "evalue");
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { query: "TOURNEE" })), expected(11));
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { query: "  pls-sf-con-004 " })), expected(4));
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { query: "sans ressaisie" })), expected(10));
  assert.equal(searchSubfeatures(subfeatureCatalog, { query: "  " }).length, 19);
  assert.deepEqual(searchSubfeatures(subfeatureCatalog, { query: "introuvable-xyz" }), []);
});

test("chaque filtre indépendant conserve la distinction responsable / autre espace", () => {
  assert.equal(searchSubfeatures(subfeatureCatalog, { primarySpace: "Conciergerie" }).length, 19);
  assert.deepEqual(searchSubfeatures(subfeatureCatalog, { primarySpace: "Propriétaires" }), []);
  assert.deepEqual(searchSubfeatures(subfeatureCatalog, { relatedSpace: "Conciergerie" }), []);
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { relatedSpace: "Sécurité et infrastructure" })), expected(13, 14));
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { parent: "PLS-DEV-004" })), expected(1, 2, 3, 4));
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { implementation: "implemented" })), expected(2, 5, 6, 15));
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { implementation: "not_assessed" })), expected(4));
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, { implementation: "not_started" })), expected(10, 13, 14, 19));
  assert.equal(searchSubfeatures(subfeatureCatalog, { validation: "not_assessed" }).length, 19);
  assert.equal(searchSubfeatures(subfeatureCatalog, { evidence: "with" }).length, 19);
  assert.deepEqual(searchSubfeatures(subfeatureCatalog, { evidence: "without" }), []);
});

test("filtres combinés par ET, y compris responsable et espaces concernés simultanés", () => {
  assert.deepEqual(ids(searchSubfeatures(subfeatureCatalog, {
    query: "planning", parent: "PLS-DEV-009", primarySpace: "Conciergerie", relatedSpace: "Propriétaires",
    implementation: "implemented", validation: "not_assessed", evidence: "with",
  })), expected(6));
  assert.deepEqual(searchSubfeatures(subfeatureCatalog, { primarySpace: "Conciergerie", relatedSpace: "Administration", implementation: "implemented" }), []);
});

test("preuves historiques à résultat inconnu incluses, sans promotion en validation", () => {
  const result = searchSubfeatures(subfeatureCatalog, { evidence: "with" });
  assert.ok(result.every(item => item.validation.state === "not_assessed"));
  assert.deepEqual(searchSubfeatures(subfeatureCatalog, { evidence: "with", validation: "validated" }), []);
  const fixture = structuredClone([...subfeatureCatalog]);
  fixture[0].evidence = [];
  assert.deepEqual(ids(searchSubfeatures(fixture, { evidence: "without" })), expected(1));
  assert.equal(searchSubfeatures(fixture, { evidence: "with" }).length, 18);
  // Fixtures seulement : les états absents du catalogue sont aussi filtrables.
  fixture[0].validation.state = "not_validated";
  fixture[1].validation.state = "partially_validated";
  fixture[2].validation.state = "validated";
  assert.deepEqual(ids(searchSubfeatures(fixture, { validation: "not_validated" })), expected(1));
  assert.deepEqual(ids(searchSubfeatures(fixture, { validation: "partially_validated" })), expected(2));
  assert.deepEqual(ids(searchSubfeatures(fixture, { validation: "validated" })), expected(3));
});

test("déduplication par ID et ordre lexical déterministe sans tri des sources", () => {
  const reversed = [...subfeatureCatalog].reverse();
  const before = [...reversed];
  const result = searchSubfeatures([...reversed, ...subfeatureCatalog]);
  assert.deepEqual(ids(result), expected(...Array.from({ length: 19 }, (_, i) => i + 1)));
  assert.equal(new Set(ids(result)).size, 19);
  assert.deepEqual(reversed, before);
  for (const item of result) assert.strictEqual(item, subfeatureCatalog.find(source => source.id === item.id));
  assert.deepEqual(searchSubfeatures([]), []);
});

test("réinitialisation pure, indépendance des valeurs et compteurs documentaires préservés", () => {
  const parents = parseMasterPlan(readFileSync("docs/master-plan-planetls.md", "utf8"), "2026-11-15T12:00:00Z").registryItems;
  const before = JSON.stringify({ parents, subfeatureCatalog });
  const progress = computeSpaceProgress(parents);
  const active = { ...resetSubfeatureSearch(), query: "test", parent: "PLS-DEV-004" };
  const snapshot = { ...active };
  searchSubfeatures(subfeatureCatalog, active);
  const reset = resetSubfeatureSearch();
  assert.notStrictEqual(reset, resetSubfeatureSearch());
  assert.ok(Object.values(reset).every(value => value === ""));
  assert.deepEqual(active, snapshot);
  assert.equal(searchSubfeatures(subfeatureCatalog, reset).length, 19);
  assert.equal(JSON.stringify({ parents, subfeatureCatalog }), before);
  assert.deepEqual(computeSpaceProgress(parents), progress);
});
