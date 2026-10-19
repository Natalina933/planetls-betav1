import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToString } from "react-dom/server";
import { chromium } from "@playwright/test";
import ts from "typescript";
import * as temporal from "../app/lib/temporalClock.ts";
import { getUpcomingHousingStays } from "../app/components/dashboard/housing/ownerHousingPresentation.ts";
import { getConciergeMissionView } from "../app/dashboard/concierge/missionDisplay.ts";

const { createTemporalClock, temporalSchedule, planningTemporalSchedule, ROLLING_48_HOURS } = temporal;
const require = createRequire(import.meta.url);
const timestamp = (value: string) => new Date(value).getTime();
const initial = timestamp("2026-10-19T12:00:00+02:00");

function harness(start = initial) {
  let now = start;
  let sequence = 0;
  let notifications = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const listeners = new Set<() => void>();
  const clock = createTemporalClock({
    now: () => now,
    setTimeout(callback, delay) {
      assert.ok(delay > 0);
      const id = ++sequence;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimeout: (id) => { timers.delete(id as number); },
    listen(callback) {
      listeners.add(callback);
      return () => { listeners.delete(callback); };
    },
  });
  return {
    clock, timers, listeners,
    subscribe: (schedule: temporal.TemporalSchedule) => clock.subscribe(() => { notifications++; }, schedule),
    notifications: () => notifications,
    jump: (value: number) => { now = value; },
    resume: () => { for (const listener of listeners) listener(); },
    advance(value: number) {
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > value) break;
        assert.ok(sequence < 100, "no timer loop");
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
      }
      now = value;
    },
  };
}

test("numeric snapshot is stable; empty schedules have no timer or resume listener", () => {
  const h = harness();
  assert.equal(h.clock.getSnapshot(), 0);
  assert.equal(temporal.getTemporalServerSnapshot(), 0);
  const stop = h.subscribe(temporalSchedule([]));
  assert.equal(h.clock.getSnapshot(), initial);
  h.jump(initial + 1000);
  assert.equal(h.clock.getSnapshot(), initial);
  assert.equal(h.notifications(), 1);
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
  stop();
});

test("one timeout per next boundary, duplicate deadlines removed and no idle polling", () => {
  const h = harness();
  const stop = h.subscribe(temporalSchedule([NaN, Infinity, initial + 100, initial + 100, initial + 200]));
  assert.equal(h.timers.size, 1);
  h.advance(initial + 99);
  assert.equal(h.clock.getSnapshot(), initial);
  h.advance(initial + 100);
  assert.equal(h.clock.getSnapshot(), initial + 100);
  h.advance(initial + 200);
  assert.equal(h.notifications(), 3);
  assert.equal(h.timers.size, 0);
  stop();
  assert.equal(h.listeners.size, 0);
});

test("resume after inactivity crosses missed boundaries once; unchanged focus is silent", () => {
  const h = harness();
  h.subscribe(temporalSchedule([initial + 10, initial + 20]));
  h.jump(initial + 5); h.resume();
  assert.equal(h.notifications(), 1);
  h.jump(initial + 30); h.resume();
  assert.equal(h.clock.getSnapshot(), initial + 30);
  assert.equal(h.notifications(), 2);
  h.resume();
  assert.equal(h.notifications(), 2);
  assert.equal(h.timers.size, 0);
});

test("system clock moving backward re-enters a previous period and rearms its deadline", () => {
  const h = harness();
  h.subscribe(temporalSchedule([initial + 10]));
  h.advance(initial + 10);
  h.jump(initial - 100); h.resume();
  assert.equal(h.clock.getSnapshot(), initial - 100);
  assert.equal(h.timers.size, 1);
  h.advance(initial + 10);
  assert.equal(h.clock.getSnapshot(), initial + 10);
});

test("early timeout after a clock correction reschedules without premature publication", () => {
  const h = harness();
  h.subscribe(temporalSchedule([initial + 100]));
  const callback = [...h.timers.values()][0].callback;
  h.jump(initial - 100);
  callback();
  assert.equal(h.clock.getSnapshot(), initial);
  assert.equal(h.notifications(), 1);
  assert.equal([...h.timers.values()][0].at, initial + 100);
});

test("unsubscription, new data and Strict Mode resubscription clean and rearm correctly", () => {
  const h = harness();
  const old = h.subscribe(temporalSchedule([initial + 100]));
  old();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
  h.jump(initial + 20);
  const stop = h.subscribe(temporalSchedule([initial + 50]));
  assert.equal(h.clock.getSnapshot(), initial + 20);
  assert.equal([...h.timers.values()][0].at, initial + 50);
  stop();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test("multiple subscriptions share the closest deadline; removing it preserves the remaining one", () => {
  const h = harness();
  const first = h.subscribe(temporalSchedule([initial + 10]));
  const second = h.subscribe(temporalSchedule([initial + 20]));
  assert.equal(h.timers.size, 1);
  first();
  assert.equal([...h.timers.values()][0].at, initial + 20);
  second();
  assert.equal(h.timers.size, 0);
});

test("clock instances do not share a mutable snapshot", () => {
  const a = harness(initial);
  const b = harness(initial + 1000);
  a.subscribe(temporalSchedule([])); b.subscribe(temporalSchedule([]));
  assert.equal(a.clock.getSnapshot(), initial);
  assert.equal(b.clock.getSnapshot(), initial + 1000);
  assert.equal(temporal.getTemporalServerSnapshot(), 0);
});

test("long delays respect the browser timeout limit", () => {
  const h = harness();
  h.subscribe(temporalSchedule([initial + 3_000_000_000]));
  assert.equal([...h.timers.values()][0].at - initial, 2_147_483_647);
});

test("local midnight and 23/25 hour days use calendar transitions in Europe/Paris", () => {
  const previous = process.env.TZ;
  process.env.TZ = "Europe/Paris";
  try {
    for (const [start, hours] of [["2026-03-29T00:00:00+01:00", 23], ["2026-10-25T00:00:00+02:00", 25]] as const) {
      const time = timestamp(start);
      assert.equal(temporal.localDayStart(time), time);
      assert.equal(temporal.localDayEnd(time) - time + 1, hours * 3600000);
      const h = harness(time);
      h.subscribe(temporalSchedule([], true));
      const midnight = time + hours * 3600000;
      assert.equal([...h.timers.values()][0].at, midnight);
      h.advance(midnight);
      assert.equal(h.clock.getSnapshot(), midnight);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});

test("48 elapsed hours remain exact across both daylight saving transitions", () => {
  for (const [start, end] of [
    ["2026-03-28T12:00:00+01:00", "2026-03-30T13:00:00+02:00"],
    ["2026-10-24T12:00:00+02:00", "2026-10-26T11:00:00+01:00"],
  ]) {
    const now = timestamp(start);
    const mission = timestamp(end);
    assert.equal(mission - now, ROLLING_48_HOURS);
    const h = harness(now - 1);
    h.subscribe(planningTemporalSchedule([mission]));
    h.advance(now);
    assert.equal(h.clock.getSnapshot(), now);
  }
});

const files = {
  housing: "src/app/components/dashboard/housing/OwnerHousingOverview.tsx",
  missions: "src/app/dashboard/concierge/missions/page.tsx",
  planning: "src/app/dashboard/concierge/planning/page.tsx",
  admin: "src/app/dashboard/admin/(business)/pilotage/page.tsx",
  owner: "src/app/dashboard/owner/logements/[id]/page.tsx",
};
function sourceNode(file: string, predicate: (node: ts.Node) => boolean) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found: ts.Node | undefined;
  function visit(node: ts.Node) { if (predicate(node)) found = node; ts.forEachChild(node, visit); }
  visit(source);
  assert.ok(found);
  return found.getText(source);
}
function expression(file: string, name: string) {
  const declaration = sourceNode(file, (node) => ts.isVariableDeclaration(node) && node.name.getText() === name);
  return declaration.slice(declaration.indexOf("=") + 1);
}
function run(expression: string, values: Record<string, unknown> = {}): unknown {
  const code = ts.transpileModule(`const result = (${expression}); result;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(code, { ...temporal, ...values, useMemo: (calculate: () => unknown) => calculate() });
}

test("housing component keeps exact arrival boundary, then advances to the next stay", () => {
  const stays = [initial, initial + 1000].map((start) => ({ property_id: "42", status: "confirmed", check_in_at: new Date(start).toISOString(), check_out_at: new Date(start + 10000).toISOString() }));
  const schedule = run(expression(files.housing, "timeSchedule"), { stays, getUpcomingHousingStays }) as temporal.TemporalSchedule;
  const h = harness(); h.subscribe(schedule);
  const calculate = () => run(expression(files.housing, "upcoming"), { stays, now: h.clock.getSnapshot(), getUpcomingHousingStays }) as Map<string, typeof stays[number]>;
  assert.equal(calculate().get("42")?.check_in_at, stays[0].check_in_at);
  h.advance(initial + 1);
  assert.equal(calculate().get("42")?.check_in_at, stays[1].check_in_at);
});

test("missions component changes local day views at midnight and respects status precedence", () => {
  const previous = process.env.TZ; process.env.TZ = "Europe/Paris";
  try {
    const missions = [{ id: "m", title: "x", status: "scheduled", scheduled_start: "2026-10-19T12:00:00+02:00" }];
    const schedule = run(expression(files.missions, "timeSchedule"), { missions, getConciergeMissionView, toMissionTimestamp: timestamp }) as temporal.TemporalSchedule;
    const h = harness(timestamp("2026-10-19T23:59:59.999+02:00")); h.subscribe(schedule);
    assert.equal(getConciergeMissionView(missions[0], h.clock.getSnapshot()), "today");
    h.advance(timestamp("2026-10-20T00:00:00+02:00"));
    assert.equal(getConciergeMissionView(missions[0], h.clock.getSnapshot()), "late");
    assert.equal(h.timers.size, 0, "past missions do not schedule perpetual midnight updates");
    const inactive = run(expression(files.missions, "timeSchedule"), { missions: [{ ...missions[0], status: "completed" }], getConciergeMissionView, toMissionTimestamp: timestamp }) as temporal.TemporalSchedule;
    assert.equal(inactive.localDay, false);
    assert.equal(inactive.localDates?.length, 0);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test("planning component preserves elapsed 48h and strict/inclusive boundaries", () => {
  const start = initial + ROLLING_48_HOURS + 10;
  const plannedActiveMissions = [{ id: "m", scheduled_start: new Date(start).toISOString() }];
  const h = harness(); h.subscribe(planningTemporalSchedule([start]));
  const calculate = (name: string) => run(expression(files.planning, name), { plannedActiveMissions, now: h.clock.getSnapshot(), next48h: h.clock.getSnapshot() + ROLLING_48_HOURS, takeFirst: (a: unknown[], n: number) => a.slice(0, n), toTimestamp: timestamp }) as unknown[];
  assert.equal(calculate("nextMissions").length, 0);
  h.advance(initial + 10);
  assert.equal(calculate("nextMissions").length, 1);
  h.advance(start);
  assert.equal(calculate("nextMissions").length, 0);
  assert.equal(calculate("overdueMissions").length, 0);
  h.advance(start + 1);
  assert.equal(calculate("overdueMissions").length, 1);
});

test("planning week highlight is client-only until hydration then follows midnight", () => {
  const declaration = sourceNode(files.planning, (node) => ts.isFunctionDeclaration(node) && node.name?.text === "buildWeekBuckets");
  const factory = vm.runInNewContext(ts.transpileModule(`${declaration}\nbuildWeekBuckets;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, { toTimestamp: timestamp }) as (missions: unknown[], now: number) => { isToday: boolean }[];
  const calculate = (now: number) => run(expression(files.planning, "weekBuckets"), { now, plannedActiveMissions: [], buildWeekBuckets: factory }) as { isToday: boolean }[];
  assert.equal(calculate(0).length, 0);
  const previous = process.env.TZ; process.env.TZ = "Europe/Paris";
  try {
    assert.equal(calculate(timestamp("2026-10-19T23:59:59+02:00")).findIndex((x) => x.isToday), 0);
    assert.equal(calculate(timestamp("2026-10-20T00:00:00+02:00")).findIndex((x) => x.isToday), 1);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test("admin component crosses strict non-invoiced deadline without changing data", () => {
  const missions = [{ scheduled_start: new Date(initial + 10).toISOString(), invoice_id: null }, { scheduled_start: new Date(initial - 10).toISOString(), invoice_id: "paid" }];
  const h = harness(); h.subscribe(run(expression(files.admin, "timeSchedule"), { missions }) as temporal.TemporalSchedule);
  const calculate = () => run(expression(files.admin, "lateUnbilledMissions"), { missions, now: h.clock.getSnapshot() });
  h.advance(initial + 10); assert.equal(calculate(), 0);
  h.advance(initial + 11); assert.equal(calculate(), 1);
  assert.equal(h.timers.size, 0);
});

test("owner component preserves upcoming ordering and existing undated fallback", () => {
  const relatedMissions = [initial + 10, initial + 20, Infinity].map((start, id) => ({ id, scheduled_start: Number.isFinite(start) ? new Date(start).toISOString() : null }));
  const getMissionTime = (value: string | null) => value ? timestamp(value) : Infinity;
  const schedule = run(expression(files.owner, "timeSchedule"), { relatedMissions, getMissionTime }) as temporal.TemporalSchedule;
  const h = harness(); h.subscribe(schedule);
  const calculate = () => run(expression(files.owner, "upcomingMission"), { relatedMissions, getMissionTime, now: h.clock.getSnapshot() }) as { id: number };
  h.advance(initial + 10); assert.equal(calculate().id, 0);
  h.advance(initial + 11); assert.equal(calculate().id, 1);
  h.advance(initial + 21); assert.equal(calculate().id, 2);
  assert.equal(h.timers.size, 0);
});

const hookCode = ts.transpileModule(readFileSync("src/app/hooks/useTemporalClock.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const coreCode = ts.transpileModule(readFileSync("src/app/lib/temporalClock.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const hookModule = { exports: {} as { useTemporalClock: (schedule: temporal.TemporalSchedule) => number } };
new Function("require", "exports", "module", hookCode)((id: string) => id.includes("temporalClock") ? temporal : require(id), hookModule.exports, hookModule);
const browserModules = Object.fromEntries([
  ["react", "react/cjs/react.development.js"],
  ["react-dom", "react-dom/cjs/react-dom.development.js"],
  ["client", "react-dom/cjs/react-dom-client.development.js"],
  ["scheduler", "scheduler/cjs/scheduler.development.js"],
].map(([name, path]) => [name, readFileSync(`node_modules/${path}`, "utf8")]));

test("actual React SSR and Chromium hydration: sentinel, no loop/network, resume and cleanup", async () => {
  const schedule = temporalSchedule([initial + 1000]);
  function ServerClock() {
    const now = hookModule.exports.useTemporalClock(schedule);
    return React.createElement("output", null, now === 0 ? "Chargement" : String(now));
  }
  const html = renderToString(React.createElement(ServerClock));
  assert.equal(html, "<output>Chargement</output>");
  assert.equal(renderToString(React.createElement(ServerClock)), html);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const requests: string[] = [];
    const pageErrors: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("**/*", (route) => route.abort());
    await page.setContent(`<div id="root">${html}</div>`);
    const result = await page.evaluate(async ({ modules, initial }) => {
      const cache: Record<string, { exports: unknown }> = {};
      const load = (name: string): unknown => {
        if (cache[name]) return cache[name].exports;
        const entry = { exports: {} };
        cache[name] = entry;
        new Function("require", "exports", "module", "process", modules[name])(load, entry.exports, entry, { env: { NODE_ENV: "development" } });
        return entry.exports;
      };
      const React = load("react") as typeof import("react");
      const client = load("client") as typeof import("react-dom/client");
      const core = load("core") as typeof import("../app/lib/temporalClock.ts");
      const hook = load("hook") as typeof hookModule.exports;
      let now = initial;
      Date.now = () => now;
      const rawSet = window.setTimeout.bind(window);
      const rawClear = window.clearTimeout.bind(window);
      const timers = new Set<number>();
      window.setTimeout = ((callback: TimerHandler, delay?: number) => {
        const id = rawSet(callback, delay); timers.add(id); return id;
      }) as typeof window.setTimeout;
      window.clearTimeout = (id) => { timers.delete(id as number); rawClear(id); };
      const listeners = new Set<string>();
      const addWindow = window.addEventListener.bind(window);
      const removeWindow = window.removeEventListener.bind(window);
      const addDocument = document.addEventListener.bind(document);
      const removeDocument = document.removeEventListener.bind(document);
      window.addEventListener = ((type: string, listener: EventListener, options?: boolean) => { if (["focus", "pageshow"].includes(type)) listeners.add(type); addWindow(type, listener, options); }) as typeof window.addEventListener;
      window.removeEventListener = ((type: string, listener: EventListener, options?: boolean) => { listeners.delete(type); removeWindow(type, listener, options); }) as typeof window.removeEventListener;
      document.addEventListener = ((type: string, listener: EventListener, options?: boolean) => { if (type === "visibilitychange") listeners.add(type); addDocument(type, listener, options); }) as typeof document.addEventListener;
      document.removeEventListener = ((type: string, listener: EventListener, options?: boolean) => { listeners.delete(type); removeDocument(type, listener, options); }) as typeof document.removeEventListener;
      const hydrationErrors: string[] = [];
      const values: number[] = [];
      let schedule = core.temporalSchedule([initial + 1000]);
      function Clock() {
        const value = hook.useTemporalClock(schedule);
        values.push(value);
        return React.createElement("output", null, value === 0 ? "Chargement" : String(value));
      }
      const root = client.hydrateRoot(document.getElementById("root")!, React.createElement(React.StrictMode, null, React.createElement(Clock)), { onRecoverableError: (error) => hydrationErrors.push(String(error)) });
      const settle = () => new Promise<void>((resolve) => rawSet(resolve, 60));
      await settle();
      const afterHydration = document.querySelector("output")?.textContent;
      const stableCount = values.length;
      now = initial + 500;
      window.dispatchEvent(new Event("focus")); await settle();
      const noUnnecessaryRender = values.length === stableCount;
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      now = initial + 2000;
      document.dispatchEvent(new Event("visibilitychange")); await settle();
      const hiddenValue = document.querySelector("output")?.textContent;
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
      document.dispatchEvent(new Event("visibilitychange")); await settle();
      const resumedValue = document.querySelector("output")?.textContent;
      now = initial - 100;
      window.dispatchEvent(new Event("pageshow")); await settle();
      const restoredValue = document.querySelector("output")?.textContent;
      now = initial + 100;
      schedule = core.temporalSchedule([initial + 5000]);
      root.render(React.createElement(React.StrictMode, null, React.createElement(Clock)));
      await settle();
      const changedDataValue = document.querySelector("output")?.textContent;
      const activeTimers = timers.size;
      const activeListeners = [...listeners].sort();
      root.unmount(); await settle();
      return { values, hydrationErrors, afterHydration, noUnnecessaryRender, hiddenValue, resumedValue, restoredValue, changedDataValue, activeTimers, activeListeners, remainingTimers: timers.size, remainingListeners: listeners.size };
    }, { modules: { ...browserModules, core: coreCode, hook: hookCode, "../lib/temporalClock": 'module.exports = require("core");' } as Record<string, string>, initial });
    assert.deepEqual(result.hydrationErrors, []);
    assert.deepEqual(pageErrors, []);
    assert.equal(result.values[0], 0);
    assert.ok(result.values.length < 20, "no render loop under StrictMode");
    assert.equal(result.afterHydration, String(initial));
    assert.equal(result.noUnnecessaryRender, true);
    assert.equal(result.hiddenValue, String(initial));
    assert.equal(result.resumedValue, String(initial + 2000));
    assert.equal(result.restoredValue, String(initial - 100));
    assert.equal(result.changedDataValue, String(initial + 100));
    assert.equal(result.activeTimers, 1);
    assert.deepEqual(result.activeListeners, ["focus", "pageshow", "visibilitychange"]);
    assert.equal(result.remainingTimers, 0);
    assert.equal(result.remainingListeners, 0);
    assert.deepEqual(requests, []);
  } finally { await browser.close(); }
});
