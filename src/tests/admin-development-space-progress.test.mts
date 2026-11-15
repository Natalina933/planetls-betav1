import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { computeSpaceProgress, SPACE_ORDER } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";

test("les imports du calcul serveur et du composant client résolvent deux modules distincts", () => {
  const page = fileURLToPath(new URL("../app/dashboard/admin/(product-tech)/developpement/page.tsx", import.meta.url));
  const options = { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX };
  const data = ts.resolveModuleName("./spaceProgressData", page, options, ts.sys).resolvedModule;
  const component = ts.resolveModuleName("./SpaceProgress", page, options, ts.sys).resolvedModule;
  assert.ok(data);
  assert.ok(component);
  assert.ok(data.resolvedFileName.endsWith("spaceProgressData.ts"));
  assert.ok(component.resolvedFileName.endsWith("SpaceProgress.tsx"));
  assert.notEqual(data.resolvedFileName.toLowerCase(), component.resolvedFileName.toLowerCase());
  assert.equal(typeof computeSpaceProgress, "function");
  assert.doesNotMatch(readFileSync(data.resolvedFileName, "utf8"), /["']use client["']/);
  const source = readFileSync(page, "utf8");
  assert.match(source, /import \{ computeSpaceProgress \} from "\.\/spaceProgressData"/);
  assert.match(source, /import \{ SpaceProgress \} from "\.\/SpaceProgress"/);
});

function loadSpaceProgress(reactOverride?: Record<string, unknown>) {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL("../app/dashboard/admin/(product-tech)/developpement/SpaceProgress.tsx", import.meta.url), "utf8");
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function("require", "exports", code)((name: string) => {
    if (name === "react" && reactOverride) return reactOverride;
    if (name === "@/components/ui") return { Card: "article", CardBody: "div", CardHeader: "header" };
    if (name === "lucide-react") return { ChevronRight: "svg", Clock: "svg", CheckCircle2: "svg", LayoutList: "svg", AlertTriangle: "svg" };
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    return require(name);
  }, exports);
  return exports.SpaceProgress;
}

test("libellés rendus : progression déclarative et absence de faux zéro pour une catégorie vide", () => {
  const SpaceProgress = loadSpaceProgress();
  const render = (items: ReturnType<typeof item>[]) => {
    const result = computeSpaceProgress(items);
    return renderToStaticMarkup(createElement(SpaceProgress, { spaces: result.items, covered: result.covered,
      excluded: result.excluded, totalRegistryItems: result.totalRegistryItems }));
  };
  const empty = render([]);
  assert.match(empty, /Non évalué/);
  assert.doesNotMatch(empty, /role="progressbar"/);
  const html = render([item({ domain: "Conciergerie", status: "COMPLETED" }), item({ domain: "Owner", status: "TO_VERIFY" })]);
  assert.match(html, /Progression déclarée par espace/);
  assert.match(html, /entrées déclarées terminées/);
  assert.match(html, /autres statuts/);
  assert.match(html, /non une validation fonctionnelle complète/);
  assert.match(html, /aria-label="Progression déclarée"/);
});

test("six cartes : cinq compteurs complets dans le bon ordre et sélection accessible", () => {
  const result = computeSpaceProgress([
    item({ domain: "Conciergerie", status: "COMPLETED" }), item({ domain: "Owner", status: "TO_VERIFY" }),
    item({ domain: "Provider", status: "BLOCKED" }),
  ]);
  const html = renderToStaticMarkup(createElement(loadSpaceProgress(), {
    spaces: result.items, covered: result.covered, excluded: result.excluded, totalRegistryItems: result.totalRegistryItems,
  }));
  const cards = [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(match => match[0]);
  assert.equal(cards.length, 6);
  for (const card of cards) {
    assert.deepEqual([...card.matchAll(/<dt>(.*?)<\/dt>/g)].map(match => match[1]), ["Terminées", "En cours", "À vérifier", "Bloquées", "Restantes"]);
    assert.equal([...card.matchAll(/<dd>\d+<\/dd>/g)].length, 5);
    assert.match(card, /aria-controls="space-progress-detail"/);
    assert.match(card, /Domaines inclus/);
  }
  assert.equal([...html.matchAll(/aria-pressed="true"/g)].length, 1);
});

test("sélection d'une carte : détail réel de son domaine, exclusion P4 et données intactes", () => {
  let selected = "Conciergerie";
  const SpaceProgress = loadSpaceProgress({ useState: () => [selected, (value: string) => { selected = value; }] });
  const entries = [
    item({ id: "PLS-A", domain: "Conciergerie", title: "Titre concierge" }),
    item({ id: "PLS-B", domain: "Owner", title: "Titre propriétaire", nextAction: "Suite owner" }),
    item({ id: "PLS-C", domain: "Owner", title: "Idée future exclue", priority: "P4" }),
  ];
  entries[1].nextAction = "Suite propriétaire";
  const result = computeSpaceProgress(entries);
  const props = { spaces: result.items, covered: result.covered, excluded: result.excluded, totalRegistryItems: result.totalRegistryItems, entries };
  const before = JSON.stringify(props);
  function nodes(node: any): any[] {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const render = () => nodes(SpaceProgress(props));
  const ownerButton = render().find(node => node.props["aria-label"] === "Afficher le détail : Propriétaires");
  assert.ok(ownerButton);
  ownerButton.props.onClick();
  const next = render();
  const detail = next.find(node => node.props.id === "space-progress-detail");
  const html = renderToStaticMarkup(detail);
  assert.match(html, /Titre propriétaire/);
  assert.match(html, /Suite propriétaire/);
  assert.doesNotMatch(html, /Titre concierge|Idée future exclue/);
  assert.equal(next.find(node => node.props["aria-label"] === "Afficher le détail : Propriétaires").props["aria-pressed"], true);
  assert.equal(JSON.stringify(props), before);
});

test("Master Plan détaillé : composant conservé une fois dans un panneau fermé et sans démontage conditionnel", () => {
  const source = readFileSync(new URL("../app/dashboard/admin/(product-tech)/developpement/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<h1>Développement PlanetLS<\/h1>/);
  assert.equal((source.match(/<MasterPlanViewer\b/g) ?? []).length, 1);
  assert.match(source, /<details className=\{styles.masterPlanDisclosure\}>[\s\S]*?<summary>[\s\S]*?<\/summary>\s*<div[^>]*>\s*<MasterPlanViewer\b/);
  assert.doesNotMatch(source, /<details[^>]*(?:\bopen\b|onToggle)/);
  const css = readFileSync(new URL("../app/dashboard/admin/(product-tech)/developpement/page.module.scss", import.meta.url), "utf8");
  assert.match(css, /\.spaceProgressCounts\s*\{[^}]*display: flex;[^}]*flex-direction: column;/);
  assert.match(css, /\.spaceProgressGrid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 640px\)\s*\{\s*\.spaceProgressGrid\s*\{\s*grid-template-columns: 1fr;/);
  assert.doesNotMatch(css.slice(css.indexOf(".spaceProgressSection")), /text-overflow: ellipsis|white-space: nowrap/);
});

function item(overrides: Record<string, any> = {}): any {
  return {
    id: overrides.id ?? "PLS-TEST-001",
    domain: overrides.domain ?? "Test",
    title: overrides.title ?? "Test feature",
    summary: "summary",
    status: overrides.status ?? "IN_PROGRESS",
    priority: overrides.priority ?? "P1",
    type: "feature",
    persona: "Admin",
    phase: "Pilotage",
    updatedAt: "2026-08-24",
    nextAction: "Valider.",
    validationCriteria: [],
    validatedCriteria: [],
    dependencies: [],
    blocker: null,
    routes: [],
    files: [],
    progressLabel: "En cours.",
    userNeed: "",
    potentialValue: "",
    risks: "",
    businessModel: "",
    source: "test",
    evidence: [],
    missingWork: [],
    githubIssues: [],
  };
}

test("computeSpaceProgress retourne six categories", () => {
  const result = computeSpaceProgress([]);
  assert.equal(result.items.length, 6);
  const names = result.items.map((i) => i.name);
  assert.deepEqual(names, SPACE_ORDER);
  assert.ok(names.includes("Conciergerie"));
  assert.ok(names.includes("Propriétaires"));
  assert.ok(names.includes("Artisans / Prestataires"));
  assert.ok(names.includes("Administration"));
  assert.ok(names.includes("Sécurité et infrastructure"));
  assert.ok(names.includes("Transversal"));
});

test("computeSpaceProgress exclut les items P4", () => {
  const items = [item({ id: "PLS-1", domain: "Conciergerie", status: "IN_PROGRESS", priority: "P1" }), item({ id: "PLS-2", domain: "Conciergerie", status: "IN_PROGRESS", priority: "P4" })];
  const result = computeSpaceProgress(items);
  const concierge = result.items.find((i) => i.name === "Conciergerie");
  assert.equal(concierge?.total, 1);
  assert.equal(result.excluded, 1);
  assert.equal(result.totalRegistryItems, 2);
});

test("computeSpaceProgress compte COMPLETED comme termine", () => {
  const items = [
    item({ id: "PLS-1", domain: "Conciergerie", status: "COMPLETED", priority: "P1" }),
    item({ id: "PLS-2", domain: "Conciergerie", status: "IN_PROGRESS", priority: "P1" }),
    item({ id: "PLS-3", domain: "Conciergerie", status: "TO_VERIFY", priority: "P1" }),
    item({ id: "PLS-4", domain: "Conciergerie", status: "TO_PLAN", priority: "P1" }),
  ];
  const result = computeSpaceProgress(items);
  const concierge = result.items.find((i) => i.name === "Conciergerie");
  assert.equal(concierge?.total, 4);
  assert.equal(concierge?.completed, 1);
  assert.equal(concierge?.inProgress, 1);
  assert.equal(concierge?.toVerify, 1);
  assert.equal(concierge?.remaining, 1);
  assert.equal(concierge?.percentage, 25);
});

test("computeSpaceProgress ne compte jamais TO_VERIFY comme termine", () => {
  const items = [item({ id: "PLS-1", domain: "Provider", status: "TO_VERIFY", priority: "P1" }), item({ id: "PLS-2", domain: "Provider", status: "COMPLETED", priority: "P1" })];
  const result = computeSpaceProgress(items);
  const artisans = result.items.find((i) => i.name === "Artisans / Prestataires");
  assert.equal(artisans?.completed, 1);
  assert.equal(artisans?.inProgress, 0);
  assert.equal(artisans?.toVerify, 1);
  assert.equal(artisans?.remaining, 0);
  assert.equal(artisans?.percentage, 50);
});

test("computeSpaceProgress affiche Non evalue quand une categorie est vide", () => {
  const result = computeSpaceProgress([item({ id: "PLS-1", domain: "Conciergerie", status: "IN_PROGRESS", priority: "P1" })]);
  const proprietaires = result.items.find((i) => i.name === "Propriétaires");
  assert.equal(proprietaires?.total, 0);
  assert.equal(proprietaires?.percentage, null);
});

test("computeSpaceProgress n'effectue aucun double comptage", () => {
  const items = [
    item({ id: "PLS-1", domain: "Conciergerie", status: "COMPLETED", priority: "P1" }),
    item({ id: "PLS-2", domain: "Owner", status: "COMPLETED", priority: "P1" }),
    item({ id: "PLS-3", domain: "Provider", status: "COMPLETED", priority: "P1" }),
  ];
  const result = computeSpaceProgress(items);
  const totalByCategory = result.items.reduce((sum, i) => sum + i.total, 0);
  assert.equal(totalByCategory, 3);
  assert.equal(result.covered, 3);
  assert.equal(result.excluded, 0);
});

test("computeSpaceProgress rattache les domaines inconnus a Transversal", () => {
  const items = [
    item({ id: "PLS-1", domain: "Domaine Inconnu X", status: "IN_PROGRESS", priority: "P1" }),
    item({ id: "PLS-2", domain: "Autre Domaine Y", status: "TO_PLAN", priority: "P2" }),
  ];
  const result = computeSpaceProgress(items);
  const transversal = result.items.find((i) => i.name === "Transversal");
  assert.equal(transversal?.total, 2);
  assert.ok(transversal?.domains.includes("Autre Domaine Y"));
  assert.ok(transversal?.domains.includes("Domaine Inconnu X"));
  for (const it of result.items) {
    if (it.name === "Transversal") continue;
    assert.equal(it.total, 0);
  }
});

test("computeSpaceProgress calcule le pourcentage correctement", () => {
  const items = [
    item({ id: "PLS-1", domain: "Admin Platform", status: "COMPLETED", priority: "P0" }),
    item({ id: "PLS-2", domain: "Admin Platform", status: "COMPLETED", priority: "P1" }),
    item({ id: "PLS-3", domain: "Admin Platform", status: "IN_PROGRESS", priority: "P1" }),
    item({ id: "PLS-4", domain: "Admin Platform", status: "TO_PLAN", priority: "P2" }),
  ];
  const result = computeSpaceProgress(items);
  const admin = result.items.find((i) => i.name === "Administration");
  assert.equal(admin?.total, 4);
  assert.equal(admin?.completed, 2);
  assert.equal(admin?.inProgress, 1);
  assert.equal(admin?.remaining, 1);
  assert.equal(admin?.percentage, 50);
});


test("computeSpaceProgress avec le registre reel couvre 53 entrees non-P4 et en exclut 5", async () => {
  const fs = await import("node:fs/promises");
  const markdown = await fs.readFile("docs/master-plan-planetls.md", "utf8");
  const { parseMasterPlan } = await import("../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts");

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");
  const result = computeSpaceProgress(plan.registryItems);

  assert.equal(result.totalRegistryItems, 58);
  assert.equal(result.covered, 53);
  assert.equal(result.excluded, 5);

  const totalByCategory = result.items.reduce((sum, i) => sum + i.total, 0);
  assert.equal(totalByCategory, 53);
  assert.equal(result.items.length, 6);

  const transversal = result.items.find((i) => i.name === "Transversal");
  assert.ok(transversal);
  assert.ok(transversal.total > 0);
  assert.ok(transversal.domains.includes("Activation"));
  assert.ok(transversal.domains.includes("Workflow métier"));
  assert.ok(transversal.domains.includes("Design System"));

  const allDomains = result.items.flatMap((i) => i.domains);
  const uniqueDomains = new Set(allDomains);
  assert.equal(allDomains.length, uniqueDomains.size);
});
