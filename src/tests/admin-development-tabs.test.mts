import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { computeSpaceProgress } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";
import { buildMissionControlView } from "../app/dashboard/admin/(product-tech)/developpement/missionControl.ts";
import { buildDeveloperLogView, createManualLogEntrySeed } from "../app/dashboard/admin/(product-tech)/developpement/developerLog.ts";
import { buildRoadmapView } from "../app/dashboard/admin/(product-tech)/developpement/roadmap.ts";
import { buildTechnicalMemoryView } from "../app/dashboard/admin/(product-tech)/developpement/technicalMemory.ts";

const base = "src/app/dashboard/admin/(product-tech)/developpement/";
const markdown = readFileSync("docs/master-plan-planetls.md", "utf8");
const plan = parseMasterPlan(markdown, "2026-11-15T12:00:00Z");
const options = { plan, markdown, projectVersion: "0.1.0", commits: [], branch: "test", dirtyFileCount: 0, repositoryUrl: null, workflowExists: false, metadataBaseHost: null, supabaseHealth: { label: "Supabase", status: "unverifiable" as const, detail: "Non mesuré dans ce test", checkedAt: "2026-11-15T12:00:00Z" } };
const props = {
  ...options,
  journal: buildDeveloperLogView({ ...options, changedFiles: [] }),
  missionControl: buildMissionControlView(options),
  roadmap: buildRoadmapView(plan),
  technicalMemory: buildTechnicalMemoryView(options),
  defaultAuthor: "Test local",
  progress: computeSpaceProgress(plan.registryItems),
};
const native = createRequire(import.meta.url);
const source = readFileSync(base + "MasterPlanViewer.tsx", "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, reportDiagnostics: true });

function nodes(node: any): any[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

// Le composant réel est exécuté ; seuls les hooks et les frontières UI sont isolés.
// Aucun montage de page serveur ni accès réseau ou localStorage.
function harness() {
  const state: any[] = [];
  let cursor = 0;
  const hooks = {
    useState: (initial: any) => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [state[index], (value: any) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useMemo: (fn: () => any) => fn(),
    useCallback: (fn: any) => fn,
    useRef: () => ({ current: null }),
    useEffect: () => {},
    useSyncExternalStore: (_subscribe: any, getSnapshot: () => any) => getSnapshot(),
  };
  const exports: Record<string, any> = {};
  new Function("require", "exports", code.outputText)((name: string) => {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return native(name);
    if (name === "@/components/ui" || name === "lucide-react") return new Proxy({}, { get: (_target, key) => String(key) });
    if (name === "next/link") return { __esModule: true, default: "Link" };
    if (name.startsWith("@/")) return {};
    if (name === "./SpaceProgress") return { SpaceProgress: "SpaceProgress" };
    if (name === "./SubfeatureExplorer") return { SubfeatureExplorer: "SubfeatureExplorer" };
    if (name === "./SocleProgress") return { EMPTY_SOCLE: { capabilities: [] }, SocleSummary: "SocleSummary", SocleExplorer: "SocleExplorer", SocleChecks: "SocleChecks" };
    if (name.endsWith(".scss")) return { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) };
    if (name.startsWith("./")) return native("../app/dashboard/admin/(product-tech)/developpement/" + name.slice(2) + ".ts");
    return native(name);
  }, exports);
  const tree = () => { cursor = 0; return exports.MasterPlanViewer(props); };
  return {
    tree,
    all: () => nodes(tree()),
    select: (value: string) => nodes(tree()).find(node => node.type === "Tabs").props.onValueChange(value),
  };
}

test("08A : quatre onglets persistants, une seule vue visible, vue d’ensemble par défaut", () => {
  assert.equal(code.diagnostics?.length, 0);
  const ui = harness();
  const triggers = ui.all().filter(node => node.type === "TabsTrigger");
  assert.deepEqual(triggers.map(node => node.props.children), ["Vue d’ensemble", "Fonctionnalités", "Travaux", "Contrôles"]);
  for (const value of ["overview", "features", "work", "checks"]) {
    if (value !== "overview") ui.select(value);
    const panels = ui.all().filter(node => node.type === "TabsContent");
    assert.equal(panels.length, 4);
    assert.ok(panels.every(node => node.props.forceMount));
    assert.deepEqual(panels.filter(node => !node.props.hidden).map(node => node.props.value), [value]);
  }
});

test("08A : répartition des sections, un seul explorateur et carte vers filtre demandé", () => {
  const ui = harness();
  const panels = ui.all().filter(node => node.type === "TabsContent");
  const overview = panels.find(node => node.props.value === "overview");
  const cards = nodes(overview).find(node => node.type === "SpaceProgress");
  assert.equal(cards.props.spaces.length, 6);
  assert.deepEqual(cards.props.spaces, props.progress.items);
  assert.equal(cards.props.covered, 53);
  assert.equal(cards.props.excluded, 5);
  assert.equal(nodes(overview).filter(node => node.type === "SubfeatureExplorer" || node.type === "table").length, 0);
  const socleSummary = nodes(overview).find(node => node.type === "SocleSummary");
  assert.ok(socleSummary);
  socleSummary.props.onChecks();
  assert.equal(ui.all().find(node => node.type === "Tabs").props.value, "checks");
  socleSummary.props.onFeatures();
  assert.equal(ui.all().find(node => node.type === "Tabs").props.value, "features");
  assert.equal(ui.all().filter(node => node.type === "SocleExplorer").length, 1);
  assert.equal(ui.all().filter(node => node.type === "SocleChecks").length, 1);
  const work = panels.find(node => node.props.value === "work");
  assert.ok(nodes(work).some(node => node.props?.id === "work-focus-title"));
  assert.ok(!nodes(work).some(node => node.props?.title === "Prochaine action"));
  assert.ok(nodes(work).some(node => node.type === "summary" && node.props.children === "Toutes les priorités et les automatisations"));
  assert.ok(nodes(work).some(node => node.props?.["aria-label"] === "Pilotage des priorités"));
  assert.ok(nodes(work).some(node => node.props?.["aria-label"] === "Tableau court des automatisations et processus"));
  const checks = panels.find(node => node.props.value === "checks");
  assert.ok(nodes(checks).some(node => node.props?.title === "Vérifications rapides"));
  const pendingChecks = nodes(checks).find(node => node.props?.["aria-label"] === "Contrôles non exécutés par le tableau de bord");
  assert.equal(nodes(pendingChecks).filter(node => node.type === "li").length, 5);
  assert.equal(nodes(checks).filter(node => node.type === "SpaceProgress" || node.type === "SubfeatureExplorer").length, 0);
  cards.props.onSpaceSelect("Propriétaires");
  const explorer = ui.all().find(node => node.type === "SubfeatureExplorer");
  assert.equal(explorer.props.active, true);
  assert.equal(explorer.props.spaceRequest.name, "Propriétaires");
  assert.equal(explorer.props.parents.length, 58);
  assert.equal(ui.all().filter(node => node.type === "SubfeatureExplorer").length, 1);
  ui.select("checks");
  ui.all().find(node => node.type === "SubfeatureExplorer").props.onOpenFeature();
  assert.equal(ui.all().find(node => node.type === "Tabs").props.value, "features");
});

test("08A : détails repliés par défaut, clés locales et accès administrateur conservés", () => {
  const ui = harness();
  for (const value of ["overview", "features", "work", "checks"]) {
    ui.select(value);
    const ids = ui.all().map(node => node.props?.id).filter(Boolean);
    for (const oldId of ["master-plan", "mission-control", "memoire-technique", "roadmap-intelligente", "journal-de-bord"]) assert.ok(!ids.includes(oldId), oldId);
  }
  for (const key of ["favorites", "comments", "manual-entries"]) assert.ok(source.includes('"planetls:developer-log:' + key + '"'));
  assert.ok(source.includes('"planetls:developer-roadmap:completions"'));
  const page = readFileSync(base + "page.tsx", "utf8");
  assert.ok(page.indexOf("await requireAdminAccess()") < page.indexOf("const [markdown, stats"));
  assert.match(readFileSync("src/app/dashboard/admin/layout.tsx", "utf8"), /await requireAdminAccess\(\)/);
  const mounted = source.slice(source.indexOf("  return (", source.indexOf("export function MasterPlanViewer")), source.indexOf("  const toggleSection ="));
  assert.doesNotMatch(mounted, /fetch\(|createClient\(|\/api\/admin\/control-tower/);
  const css = readFileSync(base + "page.module.scss", "utf8");
  assert.match(css, /\&\[hidden\] \{ display: none !important; \}/);
  assert.match(css, /\.developmentTabList \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
});

test("08A : les outils existants restent accessibles à la demande dans Travaux", () => {
  const ui = harness();
  ui.select("work");
  const disclosure = ui.all().find(node => node.type === "details" && node.props.onToggle);
  assert.ok(disclosure);
  disclosure.props.onToggle({ currentTarget: { open: true } });
  const ids = ui.all().map(node => node.props?.id).filter(Boolean);
  for (const id of ["master-plan", "mission-control", "memoire-technique", "roadmap-intelligente", "journal-de-bord"]) assert.ok(ids.includes(id), id);
  disclosure.props.onToggle({ currentTarget: { open: false } });
  assert.ok(!ui.all().some(node => node.props?.id === "journal-de-bord"));
});

test("08A : vrais onglets Radix, rôles et relations accessibles, trois panneaux masqués", () => {
  const exports: Record<string, any> = {};
  const compiled = ts.transpileModule(readFileSync("src/components/ui/Tabs/Tabs.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  new Function("require", "exports", compiled.outputText)((name: string) => name.endsWith(".scss") ? { __esModule: true, default: {} } : native(name), exports);
  for (const selected of ["overview", "features", "work", "checks"]) {
    const values = ["overview", "features", "work", "checks"];
    const html = renderToStaticMarkup(createElement(exports.Tabs, { value: selected },
      createElement(exports.TabsList, { "aria-label": "Navigation du développement" }, ...values.map(value => createElement(exports.TabsTrigger, { value, key: value }, value))),
      ...values.map(value => createElement(exports.TabsContent, { value, forceMount: true, hidden: value !== selected, key: value }, value)),
    ));
    assert.equal((html.match(/role="tab"/g) ?? []).length, 4);
    assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 4);
    assert.equal((html.match(/hidden=""/g) ?? []).length, 3);
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    for (const match of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) assert.ok(ids.includes(match[1]));
  }
});

test("08A : refus administrateur avant toute collecte serveur", async () => {
  let forbiddenCalls = 0;
  const denied = new Error("Accès administrateur refusé — test isolé");
  const exports: Record<string, any> = {};
  const pageCode = ts.transpileModule(readFileSync(base + "page.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  new Function("require", "exports", pageCode.outputText)((name: string) => {
    if (name === "../../adminAccess") return { requireAdminAccess: async () => { throw denied; } };
    if (name === "node:fs") return { promises: new Proxy({}, { get: () => () => { forbiddenCalls++; throw new Error("IO interdit"); } }) };
    if (name === "@supabase/supabase-js") return { createClient: () => { forbiddenCalls++; throw new Error("Supabase interdit"); } };
    if (name === "./MasterPlanViewer") return {};
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    if (name.startsWith("./")) return native("../app/dashboard/admin/(product-tech)/developpement/" + name.slice(2) + ".ts");
    return native(name);
  }, exports);
  await assert.rejects(exports.default(), error => error === denied);
  assert.equal(forbiddenCalls, 0);
});

test("08A : syntaxe TSX des quatre composants modifiés", () => {
  for (const file of ["page.tsx", "MasterPlanViewer.tsx", "SubfeatureExplorer.tsx", "SpaceProgress.tsx"]) {
    const parsed = ts.createSourceFile(file, readFileSync(base + file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    assert.equal((parsed as any).parseDiagnostics.length, 0, file);
  }
});

test("favoris : le composant réel charge, ajoute, retire et retrouve les étoiles après rechargement", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  const key = "planetls:developer-log:favorites";
  values.set("planetls:developer-log:manual-entries", JSON.stringify([
    { ...createManualLogEntrySeed("0.1.0", "Test local"), id: "favorite-test", title: "Entrée synthétique pour les favoris" },
  ]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: { getItem: (name: string) => values.get(name) ?? null, setItem: (name: string, value: string) => values.set(name, value) },
  } });
  try {
    const openJournal = () => {
      const ui = harness();
      ui.select("work");
      ui.all().find(node => node.type === "details" && node.props.onToggle).props.onToggle({ currentTarget: { open: true } });
      ui.all().find(node => node.props?.title === "Journal de bord" && node.props.onToggle).props.onToggle();
      return ui;
    };
    const first = openJournal();
    assert.equal(first.all().filter(node => node.props?.["aria-label"] === "Retirer des favoris").length, 0);
    const add = first.all().find(node => node.props?.["aria-label"] === "Ajouter aux favoris");
    assert.ok(add);
    add.props.onClick();
    assert.equal(JSON.parse(values.get(key)!).length, 1);
    assert.ok(first.all().some(node => node.props?.["aria-label"] === "Retirer des favoris" && node.props["aria-pressed"]));
    const reloaded = openJournal();
    const remove = reloaded.all().find(node => node.props?.["aria-label"] === "Retirer des favoris");
    assert.ok(remove);
    remove.props.onClick();
    assert.deepEqual(JSON.parse(values.get(key)!), []);
    assert.equal(openJournal().all().filter(node => node.props?.["aria-label"] === "Retirer des favoris").length, 0);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
