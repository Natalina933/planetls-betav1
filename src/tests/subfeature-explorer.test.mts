import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { subfeatureCatalog } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureCatalog.ts";
import * as search from "../app/dashboard/admin/(product-tech)/developpement/subfeatureSearch.ts";
import * as inventory from "../app/dashboard/admin/(product-tech)/developpement/spaceInventory.ts";
import { SUBFEATURE_SPACES } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureTypes.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { computeSpaceProgress } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";
import { loadSubfeatureDetail, loadProgressCards } from "./helpers/load-concierge-subfeatures.mts";

const base = "src/app/dashboard/admin/(product-tech)/developpement/";
const parents = parseMasterPlan(readFileSync("docs/master-plan-planetls.md", "utf8"), "2026-11-15T12:00:00Z").registryItems;
function load(reactOverride?: Record<string, unknown>, browser?: unknown) {
  const require = createRequire(import.meta.url);
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(readFileSync(base + "SubfeatureExplorer.tsx", "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function("require", "exports", "window", code)((name: string) => {
    if (name === "react" && reactOverride) return reactOverride;
    if (name === "./subfeatureCatalog") return { subfeatureCatalog };
    if (name === "./subfeatureSearch") return search;
    if (name === "./spaceInventory") return inventory;
    if (name === "./subfeatureTypes") return { SUBFEATURE_SPACES };
    if (name === "./SubfeatureDetail") return loadSubfeatureDetail();
    if (name === "./SpaceProgress") return { SpaceProgress: loadProgressCards() };
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    return require(name);
  }, exports, browser);
  return exports.SubfeatureExplorer;
}

function nodes(node: any): any[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (typeof node.type === "function") return nodes(node.type(node.props));
  return [node, ...nodes(node.props?.children)];
}

function harness(hash = "", host: Record<string, any> = {}) {
  const states: any[] = [];
  const deps: any[][] = [];
  const effects: Array<() => void> = [];
  const listeners = new Map<string, () => void>();
  let stateCursor = 0, effectCursor = 0, dirty = false, focused = 0;
  const disclosure = { open: false };
  const ref = { current: { focus: () => { focused++; }, querySelector: () => disclosure } };
  const browser = { location: { hash }, addEventListener: (event: string, fn: () => void) => listeners.set(event, fn), removeEventListener: (event: string) => listeners.delete(event) };
  const Component = load({
    useState: (initial: any) => {
      const index = stateCursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (next: any) => {
        const value = typeof next === "function" ? next(states[index]) : next;
        if (!Object.is(value, states[index])) { states[index] = value; dirty = true; }
      }];
    },
    useRef: () => ref,
    useEffect: (effect: () => void, next: any[]) => {
      const index = effectCursor++;
      if (!deps[index] || next.some((value, i) => !Object.is(value, deps[index][i]))) effects.push(effect);
      deps[index] = next;
    },
  }, browser);
  function tree() {
    let result: any;
    do {
      dirty = false; stateCursor = 0; effectCursor = 0;
      result = Component({ parents, progress: computeSpaceProgress(parents), ...host });
      effects.splice(0).forEach(effect => effect());
    } while (dirty);
    return result;
  }
  return {
    tree,
    change(label: string, value: string) {
      const field = nodes(tree()).find(node => node.type === "label" && node.props.children[0] === label);
      assert.ok(field, label);
      nodes(field).find(node => node.type === "input" || node.type === "select").props.onChange({ target: { value } });
    },
    reset() { nodes(tree()).find(node => node.type === "button" && node.props.children === "Réinitialiser les filtres").props.onClick(); },
    resultIds(kind: "technical" | "documentary") {
      // Choix explicite de la catégorie avant inspection de ses résultats.
      const selector = nodes(tree()).find(node => node.type === "label" && node.props.children[0] === "Catégorie de résultats");
      nodes(selector).find(node => node.type === "select").props.onChange({ target: { value: kind } });
      const result: string[] = [];
      for (let page = 0; page < 10; page++) {
        const all = nodes(tree());
        result.push(...all.filter(node => node.props?.[`data-${kind}-result`]).map(node => node.props[`data-${kind}-result`]));
        const next = all.find(node => node.type === "button" && node.props.children === "Suivant");
        if (next.props.disabled) break;
        next.props.onClick();
      }
      return result;
    },
    click(text: string) { const button = nodes(tree()).find(node => node.type === "button" && (node.props.children === text || node.props["aria-label"] === text)); assert.ok(button, text); button.props.onClick(); },
    html() { return renderToStaticMarkup(tree()); },
    open(id: string) {
      for (let page = 0; page < 10; page++) {
        const all = nodes(tree());
        const previous = all.find(node => node.type === "button" && node.props.children === "Précédent");
        if (previous.props.disabled) break;
        previous.props.onClick();
      }
      for (let page = 0; page < 10; page++) {
        const all = nodes(tree());
        const link = all.find(node => node.type === "a" && node.props.href === `#subfeature-${id}`);
        if (link) { link.props.onClick(); return; }
        const next = all.find(node => node.type === "button" && node.props.children === "Suivant");
        assert.ok(!next.props.disabled, id); next.props.onClick();
      }
      assert.fail(id);
    },
    navigate(hash: string) { tree(); browser.location.hash = hash; listeners.get("hashchange")?.(); },
    focusCount: () => focused,
    disclosure,
  };
}

test("explorateur : 19 résultats techniques, 58 documentaires et six inventaires distincts", () => {
  const html = renderToStaticMarkup(createElement(load(), { parents }));
  assert.equal((html.match(/data-technical-result=/g) ?? []).length, 10);
  assert.equal((html.match(/data-documentary-result=/g) ?? []).length, 0);
  assert.equal((html.match(/data-inventory-space=/g) ?? []).length, 6);
  const ui = harness(); ui.change("Catégorie de résultats", "documentary");
  const documentary = ui.html().slice(ui.html().indexOf('id="explorer-documentary-title"'));
  assert.match(documentary, /Statut documentaire/);
  assert.doesNotMatch(documentary, /Implémentation :|Validation :/);
  assert.match(html, /Inventaire partiel/);
  assert.equal((html.match(/Inventaire détaillé non réalisé dans le catalogue<\/summary>/g) ?? []).length, 5);
  assert.doesNotMatch(html, /0 fonctionnalité|0 %|role="progressbar"/);
});

test("inventaires et longue liste documentaire fermés par défaut, accès natifs préservés", () => {
  const ui = harness();
  const all = nodes(ui.tree());
  const disclosures = all.filter(node => node.type === "details");
  assert.equal(disclosures.length, 12);
  assert.ok(disclosures.every(node => !node.props.open && !node.props.hidden));
  for (const inventoryState of inventory.spaceInventory) {
    const row = all.find(node => node.props?.["data-inventory-space"] === inventoryState.id);
    const disclosure = nodes(row).find(node => node.type === "details");
    const summary = nodes(disclosure).find(node => node.type === "summary");
    const summaryHtml = renderToStaticMarkup(summary);
    assert.ok(summaryHtml.includes(inventoryState.name));
    assert.ok(summaryHtml.includes(inventory.SPACE_INVENTORY_LABELS[inventoryState.state]));
    assert.equal(nodeText(disclosure).includes(inventoryState.scope), true);
  }
  assert.equal(ui.resultIds("documentary").length, 58);
  assert.equal(ui.resultIds("technical").length, 19);
  assert.equal(new Set(ui.resultIds("technical")).size, 19);
  // Tous les accès stables ouvrent encore le vrai détail partagé.
  for (const item of subfeatureCatalog) {
    ui.open(item.id);
    assert.ok(ui.html().includes(`data-subfeature-id="${item.id}"`));
  }
});

function nodeText(node: any): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  return node?.props ? nodeText(node.props.children) : "";
}

test("recherche globale par nom, identifiant et description dans les deux catégories", () => {
  const ui = harness();
  ui.change("Recherche globale par nom, identifiant ou description", "  TOURNEE  ");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-011"]);
  assert.ok(ui.resultIds("documentary").includes("PLS-DEV-020"));
  ui.change("Recherche globale par nom, identifiant ou description", "PLS-SF-CON-004");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-004"]);
  assert.deepEqual(ui.resultIds("documentary"), []);
  ui.change("Recherche globale par nom, identifiant ou description", "sans ressaisie");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-010"]);
});

test("six espaces responsables, espaces concernés distincts et filtres combinables", () => {
  const ui = harness();
  for (const space of SUBFEATURE_SPACES) {
    ui.change("Espace responsable", space);
    assert.equal(ui.resultIds("technical").length, space === "Conciergerie" ? 19 : 0);
    assert.equal(ui.resultIds("documentary").length, parents.filter(p => p.spaceTracking?.primarySpace === space).length);
  }
  ui.reset();
  ui.change("Espace responsable", "Conciergerie");
  ui.change("Autres espaces concernés", "Propriétaires");
  ui.change("Parent canonique", "PLS-DEV-009");
  ui.change("Implémentation — fiches techniques", "implemented");
  ui.change("Validation — fiches techniques", "not_assessed");
  ui.change("Présence de preuves — fiches techniques", "with");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-005", "PLS-SF-CON-006"]);
  assert.deepEqual(ui.resultIds("documentary"), ["PLS-DEV-009"]);
});

test("filtres techniques sans effet documentaire, états vides et réinitialisation", () => {
  const ui = harness();
  ui.change("Validation — fiches techniques", "validated");
  assert.deepEqual(ui.resultIds("technical"), []);
  assert.equal(ui.resultIds("documentary").length, 58);
  ui.change("Catégorie de résultats", "technical");
  assert.match(ui.html(), /Aucune fiche technique inventoriée ne correspond/);
  ui.reset();
  ui.change("Présence de preuves — fiches techniques", "without");
  assert.deepEqual(ui.resultIds("technical"), []);
  assert.equal(ui.resultIds("documentary").length, 58);
  ui.change("Recherche globale par nom, identifiant ou description", "introuvable-xyz");
  assert.deepEqual(ui.resultIds("documentary"), []);
  assert.match(ui.html(), /Aucune entrée documentaire ne correspond/);
  ui.reset();
  assert.equal(ui.resultIds("technical").length, 19);
  assert.equal(ui.resultIds("documentary").length, 58);
});

test("navigation stable : détail partagé ouvert et cible de focus, même hors filtre", () => {
  const ui = harness();
  ui.open("PLS-SF-CON-015");
  assert.match(ui.html(), /id="subfeature-PLS-SF-CON-015" tabindex="-1"/);
  assert.match(ui.html(), /data-subfeature-id="PLS-SF-CON-015"/);
  assert.match(ui.html(), /Rapport historique — ne vaut pas validation actuelle/);
  assert.equal(ui.disclosure.open, true);
  assert.equal(ui.focusCount(), 1);
  ui.change("Recherche globale par nom, identifiant ou description", "aucun-resultat");
  assert.match(ui.html(), /hors des résultats filtrés/);
  assert.equal(ui.focusCount(), 1);
  ui.navigate("#subfeature-PLS-SF-CON-019");
  assert.match(ui.html(), /P4 — exclue de la progression documentaire/);
  assert.equal(ui.focusCount(), 2);
});

test("identifiants inconnus, liens directs et encodage invalide traités explicitement", () => {
  const direct = harness("#subfeature-PLS-SF-CON-004");
  assert.match(direct.html(), /Périmètre à qualifier/);
  const unknown = harness("#subfeature-PLS-SF-CON-999");
  assert.match(unknown.html(), /Fiche technique inconnue/);
  assert.match(unknown.html(), /PLS-SF-CON-999/);
  assert.equal(unknown.focusCount(), 1);
  const malformed = harness("#subfeature-%ZZ");
  assert.match(malformed.html(), /Identifiant mal encodé/);
  unknown.navigate("#autre-section");
  assert.doesNotMatch(unknown.html(), /Fiche technique inconnue/);
});

test("intégration dans les onglets, sémantique des contrôles et moteur commun réutilisé", () => {
  const page = readFileSync(base + "page.tsx", "utf8");
  assert.match(page, /<MasterPlanViewer[^>]+progress=\{spaceProgress\}/);
  const viewer = readFileSync(base + "MasterPlanViewer.tsx", "utf8");
  const mounted = viewer.slice(viewer.indexOf('aria-label="Navigation du développement"'), viewer.indexOf("  const toggleSection ="));
  assert.equal((mounted.match(/<SubfeatureExplorer\b/g) ?? []).length, 1);
  assert.match(mounted, /<SubfeatureExplorer parents=\{plan.registryItems\} active=/);
  const html = harness().html();
  assert.equal((html.match(/<label>/g) ?? []).length, 8);
  assert.equal((html.match(/<select\b/g) ?? []).length, 7);
  assert.match(html, /aria-describedby="explorer-filter-scope"/);
  assert.match(html, /href="#subfeature-PLS-SF-CON-001"/);
  const source = readFileSync(base + "SubfeatureExplorer.tsx", "utf8");
  assert.match(source, /searchSubfeatures\(items, filters\)/);
});

test("08A : demande d’espace, filtres conservés et focus au retour d’onglet", () => {
  const host: Record<string, any> = { active: false, progress: undefined };
  const ui = harness("", host);
  ui.change("Recherche globale par nom, identifiant ou description", "mission");
  host.spaceRequest = { name: "Conciergerie" };
  host.active = true;
  assert.ok(ui.html().includes("Espace responsable : Conciergerie"));
  assert.equal(ui.focusCount(), 1);
  assert.ok(ui.html().includes('value="mission"'));
  host.active = false; ui.tree();
  host.active = true;
  assert.ok(ui.html().includes('value="mission"'));
  assert.ok(ui.html().includes("Espace responsable : Conciergerie"));
  assert.equal(ui.focusCount(), 1);
  assert.equal((ui.html().match(/<article\b/g) ?? []).length, 0);
});

test("08A : lien direct depuis un onglet masqué ouvre Fonctionnalités sans modifier l’URL", () => {
  let activations = 0;
  const host: Record<string, any> = { active: false, progress: undefined, onOpenFeature: () => { activations++; host.active = true; } };
  const ui = harness("#subfeature-PLS-SF-CON-019", host);
  ui.tree();
  assert.equal(activations, 1);
  assert.match(ui.html(), /Fiche technique — PLS-SF-CON-019/);
  assert.equal(ui.focusCount(), 1);
  const source = readFileSync(base + "SubfeatureExplorer.tsx", "utf8");
  assert.doesNotMatch(source, /pushState|replaceState|location\.hash\s*=/);
});

test("aucune mutation, aucun double comptage et pourcentages documentaires inchangés", () => {
  const before = JSON.stringify({ subfeatureCatalog, parents });
  const progress = computeSpaceProgress(parents);
  const ui = harness();
  ui.change("Autres espaces concernés", "Propriétaires");
  const results = ui.resultIds("technical");
  assert.equal(results.length, new Set(results).size);
  ui.open(results[0]); ui.html(); ui.reset(); ui.html();
  assert.equal(JSON.stringify({ subfeatureCatalog, parents }), before);
  assert.deepEqual(computeSpaceProgress(parents), progress);
  assert.equal(progress.totalRegistryItems, 58);
  assert.equal(progress.covered, 53);
  assert.equal(progress.excluded, 5);
});

test("six cartes pilotent le filtre unique et transfèrent le focus sans seconde liste", () => {
  const ui = harness();
  const before = ui.html();
  assert.equal((before.match(/<article\b/g) ?? []).length, 6);
  const counts = before.match(/<dd>\d+<\/dd>/g);
  const percentages = before.match(/aria-valuenow="\d+"/g);
  for (const space of SUBFEATURE_SPACES) {
    ui.click(`Explorer l’espace : ${space}`);
    const html = ui.html();
    assert.ok(html.includes(`Espace responsable : ${space}`));
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /space-progress-detail|Entrées documentaires de l’espace/);
    assert.deepEqual(html.match(/<dd>\d+<\/dd>/g), counts);
    assert.deepEqual(html.match(/aria-valuenow="\d+"/g), percentages);
    assert.equal(ui.resultIds("technical").length, space === "Conciergerie" ? 19 : 0);
  }
  assert.equal(ui.focusCount(), 6);
  ui.click("Tous les espaces");
  assert.equal(ui.resultIds("technical").length, 19);
  assert.equal((ui.html().match(/aria-pressed="true"/g) ?? []).length, 0);
});

test("catégorie unique, filtres conservés et contrôles techniques inactifs côté documentaire", () => {
  const ui = harness();
  ui.change("Recherche globale par nom, identifiant ou description", "planning");
  ui.change("Implémentation — fiches techniques", "implemented");
  ui.click("Explorer l’espace : Conciergerie");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-006"]);
  ui.change("Catégorie de résultats", "documentary");
  let html = ui.html();
  assert.doesNotMatch(html, /data-technical-result=|data-subfeature-id=/);
  assert.ok((html.match(/data-documentary-result=/g) ?? []).length > 0);
  assert.equal(nodes(ui.tree()).filter(node => node.type === "select" && node.props.disabled).length, 3);
  ui.change("Catégorie de résultats", "technical");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-006"]);
  assert.doesNotMatch(ui.html(), /data-documentary-result=/);
  ui.click("Tous les espaces");
  assert.deepEqual(ui.resultIds("technical"), ["PLS-SF-CON-006"]);
  assert.match(ui.html(), /value="planning"/);
});

test("cinq espaces non inventoriés proposent leurs entrées documentaires sans faux avancement", () => {
  const ui = harness();
  for (const space of SUBFEATURE_SPACES.filter(space => space !== "Conciergerie")) {
    ui.change("Catégorie de résultats", "technical");
    ui.click(`Explorer l’espace : ${space}`);
    assert.ok(ui.html().includes(`Inventaire détaillé non réalisé pour ${space}`));
    ui.click("Consulter les entrées documentaires de cet espace");
    const html = ui.html();
    assert.doesNotMatch(html, /data-technical-result=/);
    assert.ok((html.match(/data-documentary-result=/g) ?? []).length > 0);
    assert.doesNotMatch(html, /0 fonctionnalité|0 % de développement/);
  }
});

test("pagination technique : dix puis neuf fiches, plages et bornes", () => {
  const ui = harness();
  const visible = () => nodes(ui.tree()).filter(node => node.props?.["data-technical-result"]).map(node => node.props["data-technical-result"]);
  const button = (text: string) => nodes(ui.tree()).find(node => node.type === "button" && node.props.children === text);
  const first = visible();
  assert.equal(first.length, 10);
  assert.equal(button("Précédent").props.disabled, true);
  assert.equal(button("Suivant").props.disabled, false);
  assert.match(ui.html(), /1–10 sur 19/);
  ui.click("Suivant");
  const second = visible();
  assert.equal(second.length, 9);
  assert.match(ui.html(), /11–19 sur 19/);
  assert.equal(button("Précédent").props.disabled, false);
  assert.equal(button("Suivant").props.disabled, true);
  assert.equal(new Set([...first, ...second]).size, 19);
  assert.deepEqual([...first, ...second], subfeatureCatalog.map(item => item.id));
  ui.click("Précédent");
  assert.deepEqual(visible(), first);
});

test("pagination documentaire : six pages et 58 entrées distinctes dans un ordre déterministe", () => {
  const ui = harness();
  ui.change("Catégorie de résultats", "documentary");
  const ids: string[] = [];
  for (let page = 0; page < 6; page++) {
    const rows = nodes(ui.tree()).filter(node => node.props?.["data-documentary-result"]);
    assert.equal(rows.length, page < 5 ? 10 : 8);
    ids.push(...rows.map(node => node.props["data-documentary-result"]));
    const next = nodes(ui.tree()).find(node => node.type === "button" && node.props.children === "Suivant");
    assert.equal(next.props.disabled, page === 5);
    if (page < 5) next.props.onClick();
  }
  assert.match(ui.html(), /51–58 sur 58/);
  assert.equal(new Set(ids).size, 58);
  assert.deepEqual(ids, parents.map(parent => parent.id).sort());
});

test("critères, catégorie et réinitialisation ramènent à la première page", () => {
  const ui = harness();
  for (const [label, value] of [
    ["Recherche globale par nom, identifiant ou description", "PLS-SF-CON-001"],
    ["Espace responsable", "Conciergerie"],
    ["Autres espaces concernés", "Propriétaires"],
    ["Parent canonique", "PLS-DEV-004"],
    ["Implémentation — fiches techniques", "partial"],
    ["Validation — fiches techniques", "not_assessed"],
    ["Présence de preuves — fiches techniques", "with"],
  ]) {
    ui.reset(); ui.click("Suivant");
    assert.match(ui.html(), /11–19 sur 19/);
    ui.change(label, value);
    const previous = nodes(ui.tree()).find(node => node.type === "button" && node.props.children === "Précédent");
    assert.equal(previous.props.disabled, true, label);
  }
  ui.reset(); ui.click("Suivant"); ui.change("Catégorie de résultats", "documentary");
  assert.match(ui.html(), /1–10 sur 58/);
  ui.click("Suivant"); ui.change("Catégorie de résultats", "technical");
  assert.match(ui.html(), /1–10 sur 19/);
  ui.click("Suivant"); ui.reset();
  assert.match(ui.html(), /1–10 sur 19/);
  ui.change("Recherche globale par nom, identifiant ou description", "introuvable-xyz");
  assert.match(ui.html(), /0–0 sur 0/);
  for (const text of ["Précédent", "Suivant"]) assert.equal(nodes(ui.tree()).find(node => node.type === "button" && node.props.children === text).props.disabled, true);
});

test("listes compactes et informations longues accessibles uniquement dans les détails", () => {
  const ui = harness();
  const technicalRow = nodes(ui.tree()).find(node => node.props?.["data-technical-result"] === subfeatureCatalog[0].id);
  assert.ok(!nodeText(technicalRow).includes(subfeatureCatalog[0].description));
  assert.ok(!nodeText(technicalRow).includes("Autres espaces concernés"));
  ui.open(subfeatureCatalog[0].id);
  assert.ok(ui.html().includes(subfeatureCatalog[0].description));
  ui.change("Catégorie de résultats", "documentary");
  const row = nodes(ui.tree()).find(node => node.props?.["data-documentary-result"]);
  const id = row.props["data-documentary-result"];
  const parent = parents.find(parent => parent.id === id)!;
  const detail = nodes(row).find(node => node.type === "details");
  assert.ok(detail);
  assert.equal(detail.props.open, undefined);
  assert.ok(nodeText(detail).includes(parent.summary));
  assert.ok(nodeText(detail).includes(parent.nextAction));
  for (const value of [...parent.evidence, ...parent.routes, ...parent.files, ...parent.validationCriteria]) assert.ok(nodeText(detail).includes(value));
  assert.ok(!row.props.children.filter((child: any) => child?.type !== "details").map(nodeText).join("").includes(parent.summary));
});
