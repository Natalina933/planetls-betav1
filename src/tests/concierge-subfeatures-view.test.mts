import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ts from "typescript";
import { resolve } from "node:path";
import { conciergeSubfeatures } from "../app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatures.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { computeSpaceProgress } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";
import { loadConciergeSubfeatures } from "./helpers/load-concierge-subfeatures.mts";

const parents = parseMasterPlan(readFileSync("docs/master-plan-planetls.md", "utf8"), "2026-11-15T12:00:00Z").registryItems;
const Component = loadConciergeSubfeatures();
const render = (items = conciergeSubfeatures, entries = parents) => renderToStaticMarkup(createElement(Component, { parents: entries, items }));
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

test("résolution distincte du composant et du registre sur Windows", () => {
  const file = resolve("src/app/dashboard/admin/(product-tech)/developpement/SpaceProgress.tsx");
  const options = { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX };
  const component = ts.resolveModuleName("./ConciergeSubfeatureList", file, options, ts.sys).resolvedModule;
  const data = ts.resolveModuleName("./conciergeSubfeatures", file, options, ts.sys).resolvedModule;
  assert.ok(component?.resolvedFileName.endsWith("ConciergeSubfeatureList.tsx"));
  assert.ok(data?.resolvedFileName.endsWith("conciergeSubfeatures.ts"));
});

test("19 fiches avec parents, états, prochaines actions et panneaux natifs fermés", () => {
  const html = render();
  assert.equal((html.match(/data-subfeature-id=/g) ?? []).length, 19);
  assert.equal((html.match(/<details\b/g) ?? []).length, 19);
  assert.equal((html.match(/<summary>/g) ?? []).length, 19);
  assert.doesNotMatch(html, /<details[^>]*\bopen\b/);
  for (const item of conciergeSubfeatures) {
    const start = html.indexOf(`data-subfeature-id="${item.id}"`);
    const next = html.indexOf("data-subfeature-id=", start + 1);
    const card = html.slice(start, next < 0 ? undefined : next);
    assert.ok(card.includes(escape(item.name)), item.name);
    assert.ok(card.includes(item.parentMasterPlanId));
    assert.ok(card.includes(escape(item.nextAction)));
    assert.match(card, /Validation : Non évaluée/);
    assert.ok(card.includes(`Consulter les détails de ${item.id}`));
  }
  assert.match(html, /Périmètre à qualifier/);
  assert.match(html, /Implémentation : Non évalué/);
  assert.match(html, /Implémentation : Non commencé/);
  assert.match(html, /Implémentation : Partiellement implémenté/);
  assert.match(html, /Implémentation : Implémenté/);
  assert.match(html, /ne modifient pas la progression documentaire/);
  assert.match(html, /« Non évalué » ne signifie pas un échec/);
  // Le texte historique peut citer une commission (20 %) ; aucun indicateur
  // de progression supplémentaire ne doit être créé.
  assert.doesNotMatch(html, /role="progressbar"|aria-valuenow=/);
});

test("preuves, sources, dates et limites accessibles sans promotion historique", () => {
  const html = render();
  for (const item of conciergeSubfeatures) {
    for (const value of [...item.files, ...item.routes, ...item.unknowns, ...item.remainingWork, ...item.validation.limitations]) assert.ok(html.includes(escape(value)), value);
    for (const proof of item.evidence) {
      assert.ok(html.includes(escape(proof.description)));
      assert.ok(html.includes(escape(proof.source)));
      for (const limit of proof.limitations) assert.ok(html.includes(escape(limit)), limit);
    }
  }
  assert.match(html, /Rapport historique — ne vaut pas validation actuelle/);
  assert.match(html, /Date d’exécution : Date inconnue/);
  assert.match(html, /Commit inconnu/);
  assert.match(html, /Environnement inconnu/);
  assert.match(html, /Résultat : Résultat inconnu/);
  assert.match(html, /<time dateTime="2026-10-10">2026-10-10<\/time>/);
  assert.match(html, /Aucun critère défini ; aucune validation complète établie/);
  assert.doesNotMatch(html, /Validation : Validée avec preuves/);
});

test("P4 dérivée du parent canonique, inconnues et critères explicites", () => {
  const item = structuredClone(conciergeSubfeatures[18]);
  assert.match(render([item]), /P4 — exclue de la progression documentaire/);
  assert.doesNotMatch(render([item], parents.map(p => ({ ...p, priority: "P1" as const }))), /P4 — exclue/);
  assert.match(render([item], []), /Priorité documentaire inconnue/);
  item.validation.criteria = [{ id: "fixture", description: "Critère à vérifier", state: "unverified", evidenceIds: [] }];
  item.assessment.assessedAt = null;
  const html = render([item]);
  assert.match(html, /Critère à vérifier · Non vérifié/);
  assert.match(html, /Aucune preuve référencée/);
  assert.match(html, /Date inconnue/);
});

test("rendu sans mutation des fiches, parents et compteurs documentaires", () => {
  const before = JSON.stringify({ parents, conciergeSubfeatures });
  const progress = computeSpaceProgress(parents);
  render();
  assert.equal(JSON.stringify({ parents, conciergeSubfeatures }), before);
  assert.deepEqual(computeSpaceProgress(parents), progress);
  assert.equal(progress.covered, 53);
  assert.equal(progress.excluded, 5);
  assert.deepEqual(progress.items.map(s => s.total), [9, 5, 2, 9, 14, 14]);
});

function filterHarness(items = conciergeSubfeatures) {
  let state: Record<string, string> = { query: "", parent: "", implementation: "", validation: "", space: "", evidence: "" };
  const Filtered = loadConciergeSubfeatures({ useState: () => [state, (next: any) => { state = typeof next === "function" ? next(state) : next; }] });
  const tree = () => Filtered({ items, parents });
  function nodes(node: any): any[] {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (typeof node.type === "function") return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  return {
    change(label: string, value: string) {
      const field = nodes(tree()).find(node => node.type === "label" && node.props.children[0] === label);
      assert.ok(field, label);
      const control = nodes(field).find(node => node.type === "input" || node.type === "select");
      control.props.onChange({ target: { value } });
    },
    reset() { nodes(tree()).find(node => node.type === "button").props.onClick(); },
    ids() { return nodes(tree()).filter(node => node.props?.["data-subfeature-id"]).map(node => node.props["data-subfeature-id"]); },
    html() { return renderToStaticMarkup(tree()); },
  };
}

const sf = (...numbers: number[]) => numbers.map(n => `PLS-SF-CON-${String(n).padStart(3, "0")}`);

test("recherche par nom, identifiant et description, casse et accents ignorés", () => {
  const ui = filterHarness();
  ui.change("Recherche par nom, identifiant ou description", "  TOURNEE  ");
  assert.deepEqual(ui.ids(), sf(11));
  ui.change("Recherche par nom, identifiant ou description", "pls-sf-con-004");
  assert.deepEqual(ui.ids(), sf(4));
  ui.change("Recherche par nom, identifiant ou description", "sans ressaisie");
  assert.deepEqual(ui.ids(), sf(10));
  ui.change("Recherche par nom, identifiant ou description", "   ");
  assert.equal(ui.ids().length, 19);
});

test("chaque filtre individuel et présence de preuves historiques", () => {
  const ui = filterHarness();
  ui.change("Parent du Master Plan", "PLS-DEV-004");
  assert.deepEqual(ui.ids(), sf(1, 2, 3, 4));
  ui.reset();
  ui.change("État d’implémentation", "implemented");
  assert.deepEqual(ui.ids(), sf(2, 5, 6, 15));
  ui.reset();
  ui.change("État d’implémentation", "not_started");
  assert.deepEqual(ui.ids(), sf(10, 13, 14, 19));
  ui.reset();
  ui.change("État d’implémentation", "not_assessed");
  assert.deepEqual(ui.ids(), sf(4));
  ui.reset();
  ui.change("État de validation", "not_assessed");
  assert.equal(ui.ids().length, 19);
  ui.reset();
  ui.change("État de validation", "validated");
  assert.deepEqual(ui.ids(), []);
  ui.reset();
  ui.change("Espace concerné", "Sécurité et infrastructure");
  assert.deepEqual(ui.ids(), sf(13, 14));
  ui.reset();
  ui.change("Présence de preuves", "with");
  assert.equal(ui.ids().length, 19);
  ui.change("Présence de preuves", "without");
  assert.deepEqual(ui.ids(), []);
  // Fixture : cas sans preuve, absent du registre réel.
  const fixture = structuredClone(conciergeSubfeatures);
  fixture[0].evidence = [];
  const emptyProof = filterHarness(fixture);
  emptyProof.change("Présence de preuves", "without");
  assert.deepEqual(emptyProof.ids(), sf(1));
});

test("combinaison des six champs, état vide et réinitialisation complète", () => {
  const ui = filterHarness();
  ui.change("Parent du Master Plan", "PLS-DEV-009");
  ui.change("État d’implémentation", "implemented");
  ui.change("État de validation", "not_assessed");
  ui.change("Espace concerné", "Propriétaires");
  ui.change("Présence de preuves", "with");
  ui.change("Recherche par nom, identifiant ou description", "planning");
  assert.deepEqual(ui.ids(), sf(6));
  assert.match(ui.html(), /1 résultat\(s\) trouvé\(s\) sur 19/);
  ui.change("Espace concerné", "Administration");
  assert.deepEqual(ui.ids(), []);
  assert.match(ui.html(), /Aucune sous-fonctionnalité ne correspond/);
  assert.match(ui.html(), /role="status" aria-live="polite" aria-atomic="true"/);
  ui.reset();
  assert.equal(ui.ids().length, 19);
  assert.match(ui.html(), /19 résultat\(s\) trouvé\(s\) sur 19/);
  assert.doesNotMatch(ui.html(), /Aucune sous-fonctionnalité ne correspond/);
});

test("filtres accessibles et aucune mutation des données ou compteurs", () => {
  const before = JSON.stringify({ parents, conciergeSubfeatures });
  const progress = computeSpaceProgress(parents);
  const ui = filterHarness();
  const html = ui.html();
  assert.equal((html.match(/<label>/g) ?? []).length, 6);
  assert.equal((html.match(/<select\b/g) ?? []).length, 5);
  assert.match(html, /<input type="search"/);
  assert.match(html, /<fieldset/);
  assert.match(html, /<button type="button">Réinitialiser les filtres/);
  assert.match(html, /La présence de preuves inclut les rapports historiques/);
  ui.change("Parent du Master Plan", "PLS-BIZ-002");
  assert.deepEqual(ui.ids(), sf(19));
  assert.match(ui.html(), /P4 — exclue de la progression documentaire/);
  ui.reset();
  assert.equal(JSON.stringify({ parents, conciergeSubfeatures }), before);
  assert.deepEqual(computeSpaceProgress(parents), progress);
});
