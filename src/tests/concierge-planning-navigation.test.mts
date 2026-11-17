import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { getPlanningPeriod, navigatePlanningDate, PLANNING_MODES, PLANNING_AGENDA_LENGTH } from "../app/dashboard/concierge/planning/planningNavigation.ts";

const nativeRequire = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../../", import.meta.url));
type Row = Record<string, any>;
const dayKey = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

test("navigation : cinq modes, mois courts, années et dates sources immuables", () => {
  assert.equal(PLANNING_MODES.length, 5);
  const january = new Date(2026, 0, 31, 12);
  assert.deepEqual(dayKey(navigatePlanningDate(january, "month", 1)), [2026, 2, 28]);
  assert.deepEqual(dayKey(january), [2026, 1, 31]);
  assert.deepEqual(dayKey(navigatePlanningDate(new Date(2026, 11, 15), "month", 1)), [2027, 1, 15]);
  assert.deepEqual(dayKey(navigatePlanningDate(new Date(2027, 0, 1), "day", -1)), [2026, 12, 31]);
  assert.deepEqual(dayKey(navigatePlanningDate(new Date(2026, 10, 14), "agenda", 1)), [2026, 12, 14]);
  assert.equal(PLANNING_AGENDA_LENGTH, 30);
});

test("périodes : semaine lundi/dimanche et Terrain identiques, grille mensuelle et Agenda", () => {
  const sunday = new Date(2026, 10, 15, 12);
  const week = getPlanningPeriod(sunday, "week");
  assert.deepEqual(dayKey(week.start), [2026, 11, 9]);
  assert.deepEqual(dayKey(week.end), [2026, 11, 15]);
  assert.deepEqual(getPlanningPeriod(sunday, "terrain"), week);
  assert.deepEqual(dayKey(navigatePlanningDate(sunday, "terrain", 1)), [2026, 11, 22]);
  const monday = getPlanningPeriod(new Date(2026, 10, 16), "terrain");
  assert.deepEqual(dayKey(monday.start), [2026, 11, 16]);
  const newYear = getPlanningPeriod(new Date(2026, 0, 1), "terrain");
  assert.deepEqual(dayKey(newYear.start), [2025, 12, 29]);
  const month = getPlanningPeriod(sunday, "month");
  assert.deepEqual(dayKey(month.start), [2026, 10, 26]);
  assert.deepEqual(dayKey(month.end), [2026, 12, 6]);
  const agenda = getPlanningPeriod(sunday, "agenda");
  assert.deepEqual(dayKey(agenda.end), [2026, 12, 15]);
  assert.equal(agenda.start.getHours(), 0);
  assert.equal(agenda.end.getHours(), 23);
});

test("navigation locale : semaines et jours conservés aux deux changements d'heure", () => {
  const previous = process.env.TZ;
  process.env.TZ = "Europe/Paris";
  try {
    for (const date of [new Date(2026, 2, 28, 12), new Date(2026, 9, 24, 12)]) {
      const next = navigatePlanningDate(date, "day", 1);
      assert.equal(next.getHours(), 12);
      assert.equal(next.getDate(), date.getDate() + 1);
      const week = navigatePlanningDate(date, "week", 1);
      assert.equal(week.getDay(), date.getDay());
      assert.equal(week.getHours(), 12);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});

// Vrais composants et handlers ; hooks, calendrier tiers et transport isolés.
// Aucun DOM navigateur, réseau ni Supabase : ce harnais ne constitue pas une recette visuelle.
function componentHarness(file: string, initialStates: unknown[] = []) {
  const states = [...initialStates];
  let cursor = 0;
  let now = new Date(2026, 10, 14, 12).getTime();
  const cache = new Map<string, Row>();
  const load = (name: string, parent = path.join(root, "src")): any => {
    if (name === "react") return {
      useState: (initial: any) => {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (value: any) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
      useEffect: () => {}, useMemo: (fn: () => unknown) => fn(),
    };
    if (name === "next/link") return { __esModule: true, default: "Link" };
    if (name === "lucide-react" || name === "@/components/dashboard") return new Proxy({}, { get: (_, key) => String(key) });
    if (name.endsWith("useTemporalClock")) return { useTemporalClock: () => now };
    if (name.endsWith("OptimizedRoutePlanner")) return { __esModule: true, default: "OptimizedRoutePlanner" };
    if (name === "../../shared") return { takeFirst: (items: unknown[], count: number) => items.slice(0, count) };
    if (name.endsWith("DashboardCalendar") && file.endsWith("planning/page.tsx")) return { __esModule: true, default: "DashboardCalendar" };
    if (name === "react-big-calendar") return { Calendar: "Calendar", dateFnsLocalizer: (options: unknown) => options };
    if (name.endsWith(".scss")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name.endsWith(".css")) return {};
    if (!name.startsWith("@/") && !name.startsWith(".")) return nativeRequire(name);
    let filename = name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : path.resolve(parent, name);
    if (!existsSync(filename)) filename += ".ts";
    const saved = cache.get(filename); if (saved) return saved;
    const exports: Row = {}; cache.set(filename, exports);
    const code = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    new Function("require", "exports", "fetch", code)((dependency: string) => load(dependency, path.dirname(filename)), exports,
      () => { throw new Error("Réseau interdit dans ces tests"); });
    return exports;
  };
  const component = load(`@/${file}`).default;
  function nodes(node: any): any[] {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const render = (props: Row = {}) => { cursor = 0; return nodes(component(props)); };
  const click = (label: string) => {
    const button = render().find(node => node.type === "button" && node.props.children === label);
    assert.ok(button, label); button.props.onClick();
  };
  return { render, click, states, setNow: (timestamp: number) => { now = timestamp; } };
}

test("page : cinq vues exclusives, date conservée, navigation et Aujourd'hui", () => {
  const ui = componentHarness("app/dashboard/concierge/planning/page.tsx", [[], false, null]);
  const calendar = () => ui.render().find(node => node.type === "DashboardCalendar");
  assert.equal(calendar().props.view, "month");
  const anchor = calendar().props.date.getTime();
  for (const label of ["Semaine", "Jour", "Agenda", "Mois"]) {
    ui.click(label);
    assert.equal(calendar().props.date.getTime(), anchor);
    assert.equal(ui.render().filter(node => node.type === "DashboardCalendar").length, 1);
    assert.equal(ui.render().filter(node => node.props.className === "weekBoard").length, 0);
  }
  ui.click("Terrain");
  assert.equal(calendar(), undefined);
  assert.equal(ui.render().filter(node => node.props.className === "weekBoard").length, 1);
  ui.click("Suivant");
  ui.click("Semaine");
  assert.deepEqual(dayKey(calendar().props.date), [2026, 11, 21]);
  ui.click("Précédent");
  assert.deepEqual(dayKey(calendar().props.date), [2026, 11, 14]);
  ui.click("Aujourd'hui");
  assert.equal(calendar().props.date.getTime(), anchor);
  ui.setNow(new Date(2026, 10, 15, 0).getTime());
  assert.deepEqual(dayKey(calendar().props.date), [2026, 11, 15]);
  assert.equal(ui.render().filter(node => node.type === "OptimizedRoutePlanner").length, 1);
  assert.equal(ui.render().find(node => node.type === "details").props.open, undefined);
});

test("Terrain : semaine choisie, liens et jour courant distincts de la date d'ancrage", () => {
  const missions = [{ id: "mission-test", title: "Ménage", status: "scheduled", priority: "normal", scheduled_start: new Date(2026, 10, 23, 10).toISOString() }];
  const ui = componentHarness("app/dashboard/concierge/planning/page.tsx", [missions, false, null]);
  ui.click("Terrain");
  assert.equal(ui.render().filter(node => node.type === "Link").length, 0);
  ui.click("Suivant"); ui.click("Suivant");
  const link = ui.render().find(node => node.type === "Link");
  assert.equal(link.props.href, "/dashboard/concierge/missions/mission-test");
  assert.ok(!ui.render().some(node => String(node.props.className).includes("weekColumnToday")));
  ui.click("Jour");
  assert.deepEqual(dayKey(ui.render().find(node => node.type === "DashboardCalendar").props.date), [2026, 11, 28]);
});

test("page : pas de navigation adapté à chaque mode et sélection d'un jour depuis le mois", () => {
  const ui = componentHarness("app/dashboard/concierge/planning/page.tsx", [[], false, null]);
  const calendar = () => ui.render().find(node => node.type === "DashboardCalendar");
  for (const [label, expected] of [
    ["Mois", [2026, 12, 14]], ["Semaine", [2026, 11, 21]], ["Jour", [2026, 11, 15]],
    ["Agenda", [2026, 12, 14]], ["Terrain", [2026, 11, 21]],
  ] as const) {
    ui.click(label); ui.click("Suivant");
    // Terrain ne monte aucun calendrier ; changer de mode conserve l'ancrage.
    if (label === "Terrain") ui.click("Semaine");
    assert.deepEqual(dayKey(calendar().props.date), [...expected]);
    ui.click("Précédent");
    assert.deepEqual(dayKey(calendar().props.date), [2026, 11, 14]);
  }
  ui.click("Mois");
  const callbacks = calendar().props;
  const chosen = new Date(2026, 11, 31);
  // Ordre réel du drill-down RBC : onView(day), puis onNavigate avec l'ancienne vue.
  callbacks.onView("day"); callbacks.onNavigate(chosen, "month", "DATE");
  assert.equal(calendar().props.view, "day");
  assert.equal(calendar().props.date.getTime(), chosen.getTime());
  ui.click("Suivant");
  assert.deepEqual(dayKey(calendar().props.date), [2027, 1, 1]);
  ui.click("Aujourd'hui");
  assert.deepEqual(dayKey(calendar().props.date), [2026, 11, 14]);
});

test("calendrier partagé : comportement autonome historique et propriétés contrôlées", () => {
  const ui = componentHarness("app/components/dashboard/calendar/DashboardCalendar.tsx");
  const props = { events: [], title: "Historique" };
  const calendar = (input: Row = props) => ui.render(input).find(node => node.type === "Calendar");
  assert.equal(calendar().props.view, "month");
  assert.equal(calendar().props.toolbar, true);
  const date = new Date(2027, 0, 3);
  calendar().props.onNavigate(date, "month", "NEXT");
  calendar().props.onView("week");
  assert.equal(calendar().props.date, date);
  assert.equal(calendar().props.view, "week");
  const calls: unknown[] = [];
  const controlled = { ...props, date, view: "day", toolbar: false, onNavigate: (...args: unknown[]) => calls.push(args), onView: (view: unknown) => calls.push(view) };
  calendar(controlled).props.onNavigate(new Date(2027, 1, 3), "day", "NEXT");
  calendar(controlled).props.onView("agenda");
  assert.equal(calendar(controlled).props.date, date);
  assert.equal(calendar(controlled).props.view, "day");
  assert.equal(calendar(controlled).props.toolbar, false);
  assert.equal(calls.length, 2);
});
