import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as reference from "../app/dashboard/admin/(product-tech)/developpement/personas/personas.ts";
import * as coverage from "../app/dashboard/admin/(business)/personas/personaCoverage.ts";

const { productPersonas, DIGITAL_LEVELS, VALIDATION_LEVELS, getPersonaPlsIds, getValidationEvidence } = reference;
const markdown = readFileSync(new URL("../../docs/master-plan-planetls.md", import.meta.url), "utf8");
const lots = coverage.readPersonaLots(markdown);
const require = createRequire(import.meta.url);
const directory = new URL("../app/dashboard/admin/(business)/personas/", import.meta.url);

function loadComponent(file: string): Record<string, React.ComponentType<Record<string, unknown>>> {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(file, directory), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { exports, require: (name: string) => {
    if (name.endsWith("/personas")) return reference;
    if (name === "./personaCoverage") return coverage;
    if (name === "./PersonaFlipCard") return loadComponent("PersonaFlipCard.tsx");
    if (name.endsWith(".scss")) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
    return require(name);
  } });
  return exports;
}

test("référentiel : identifiants uniques, 15 rubriques, au plus trois besoins et aucune validation contradictoire", () => {
  assert.equal(new Set(productPersonas.map((p) => p.id)).size, productPersonas.length);
  for (const p of productPersonas) {
    assert.ok(p.name && p.role && p.segment && p.context && p.firstValue && p.currentBreak && p.estimatedFrequency);
    assert.ok(p.mainJourney.length && p.collaborationModes.length && p.excludedFeatures.length);
    assert.ok(p.needs.length > 0 && p.needs.length <= 3);
    assert.equal(new Set(p.needs.map((n) => n.id)).size, p.needs.length);
    assert.equal("status" in p, false, "aucun statut textuel indépendant du statut structuré");
    assert.equal(p.cohort === "future", p.validationLevel === "future");
    assert.equal(p.scope === "future", p.cohort === "future");
    assert.ok(p.digitalLevel in DIGITAL_LEVELS && p.validationLevel in VALIDATION_LEVELS);
    if (p.id !== "traveler") {
      assert.ok(p.image, `photo historique de ${p.name}`);
      assert.ok(existsSync(new URL(`../../public${p.image}`, import.meta.url)));
    }
    if (p.validationLevel === "validated") assert.ok(p.validation.date && p.validation.source && p.validation.evidenceType);
    else assert.match(getValidationEvidence(p), /Aucune preuve terrain/);
    for (const n of p.needs) {
      assert.equal(n.scope, p.scope);
      assert.ok(n.journeyStep);
      if (n.coverage !== "unknown") assert.ok(n.assessment?.note && n.assessment?.source && n.assessment?.reviewedAt);
    }
    if (p.commercialHypothesis) assert.equal(p.commercialHypothesis.status, "hypothesis");
  }
});

test("segments, cohorte proposée et distinctions owner / équipe / indépendant", () => {
  const find = (id: string) => productPersonas.find((p) => p.id === id)!;
  assert.deepEqual(productPersonas.filter((p) => p.cohort === "pilot").map((p) => p.id), ["owner-individual", "concierge-independent", "provider", "admin"]);
  assert.equal(find("owner-professional").segment, "5 logements ou plus");
  assert.deepEqual(find("owner-individual").collaborationModes, ["autonomous", "one_off", "partial_management", "regular", "temporary_replacement"]);
  assert.deepEqual(find("team-member").collaborationModes, ["team_member"]);
  assert.ok(find("provider").collaborationModes.includes("independent_provider"));
  assert.notDeepEqual(find("concierge-independent").needs.map((n) => n.label), find("concierge-manager").needs.map((n) => n.label));
  assert.equal(find("local-merchant").cohort, "future");
  assert.equal(find("traveler").cohort, "future");
});

test("catégories explicites : Avancé au-dessus d’Intermédiaire, À valider distinct de Validé", () => {
  assert.ok(DIGITAL_LEVELS.advanced.rank > DIGITAL_LEVELS.intermediate.rank);
  assert.ok(DIGITAL_LEVELS.intermediate.rank > DIGITAL_LEVELS.beginner.rank);
  assert.notEqual(VALIDATION_LEVELS.to_validate, VALIDATION_LEVELS.validated);
});

test("toutes les relations PLS existent dans le registre ou une ligne CAP réelle", () => {
  const ids = new Set(lots.map((lot) => lot.id));
  for (const p of productPersonas) for (const id of getPersonaPlsIds(p)) assert.ok(ids.has(id), `${p.name} : ${id} absent du Master Plan`);
  assert.equal(lots.find((lot) => lot.id === "PLS-CAP-006")?.source, "capability");
  assert.equal(lots.find((lot) => lot.id === "PLS-CAP-006")?.status, "IN_PROGRESS");
  assert.equal(lots.find((lot) => lot.id === "PLS-DEV-008")?.status, "✅ Terminé");
  assert.equal(new Set(lots.map((lot) => lot.id)).size, lots.length);
});

test("couverture indépendante du statut du lot et référence absente visible", () => {
  const initial = coverage.buildCoverageRows(productPersonas, lots);
  const changed = coverage.buildCoverageRows(productPersonas, lots.map((lot) => ({ ...lot, status: "✅ Terminé" })));
  assert.deepEqual(initial.map((row) => row.coverage), changed.map((row) => row.coverage));
  const missing = coverage.buildCoverageRows(productPersonas, []);
  assert.ok(missing[0].lots.every((item) => item.lot === null));
  assert.equal(missing[0].lots[0].id, productPersonas[0].needs[0].plsIds[0]);
  const withoutAssessment = { ...productPersonas[0], needs: [{ ...productPersonas[0].needs[0], assessment: null }] };
  assert.equal(coverage.buildCoverageRows([withoutAssessment], lots)[0].coverage, "unknown");
  assert.deepEqual(coverage.buildCoverageRows([], lots), []);
  assert.deepEqual(coverage.readPersonaLots("# Document sans registre"), []);
});

test("page rendue : sections ordonnées, neuf fiches, détails natifs et ancres sans cible manquante", () => {
  const View = loadComponent("PersonasView.tsx").PersonasView;
  const html = renderToStaticMarkup(createElement(View, { lots, sourceAvailable: true }));
  let previous = -1;
  for (const id of ["pilot", "secondary", "future", "coverage", "hypotheses"]) {
    const index = html.indexOf(`id="${id}"`);
    assert.ok(index > previous, id); previous = index;
  }
  for (const p of productPersonas) {
    assert.equal(html.split(`id="persona-${p.id}"`).length - 1, 1);
    assert.equal(html.split(p.currentBreak).length - 1, 1, `rupture de ${p.name} affichée une seule fois`);
    if (p.image) assert.match(html, new RegExp(`alt="Portrait illustratif de ${p.name}"`));
  }
  assert.doesNotMatch(html, /id="critical-needs"|id="breaks"/);
  assert.match(html, /<details class="fold"><summary>Comparer les 23 besoins/);
  assert.match(html, /Hypothèse commerciale/);
  assert.match(html, /Aucune preuve terrain/);
  assert.doesNotMatch(html, /getSignalValue|Maturité|4 à 15 logements|Profils actifs/);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), `ancre ${id}`);
  assert.match(html, /<summary>Voir la fiche de Sophie Martin<\/summary>/);
  const fallback = renderToStaticMarkup(createElement(View, { lots: [], sourceAvailable: false }));
  assert.match(fallback, /Master Plan indisponible ou invalide/);
  assert.match(fallback, /référence indisponible/);
});

test("route : garde admin avant lecture et anciennes URL redirigées", () => {
  const route = readFileSync(new URL("page.tsx", directory), "utf8");
  assert.ok(route.indexOf("await requireAdminAccess()") < route.indexOf("lots = readPersonaLots"));
  for (const file of ["../app/dashboard/admin/(business)/pilotage/personas/page.tsx", "../app/dashboard/admin/(product-tech)/developpement/personas/page.tsx"]) {
    assert.match(readFileSync(new URL(file, import.meta.url), "utf8"), /redirect\("\/dashboard\/admin\/personas"\)/);
  }
});
