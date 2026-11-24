import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { fetchJsonOrThrow } from "../app/dashboard/shared/http.ts";

const source = readFileSync(new URL("../app/dashboard/concierge/useConciergeDashboardData.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function renderDashboard(matches: () => Promise<unknown>) {
  const states: unknown[] = [];
  const effects: { deps: unknown[]; cleanup?: () => void }[] = [];
  let stateIndex = 0;
  let effectIndex = 0;
  let pending: (() => void)[] = [];
  let otherCalls = 0;
  const mocks = {
    react: {
      useState(initial: unknown) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (value: unknown) => {
          states[index] = typeof value === "function" ? value(states[index]) : value;
        }];
      },
      useMemo: (factory: () => unknown) => factory(),
      useEffect(effect: () => (() => void) | undefined, deps: unknown[]) {
        const index = effectIndex++;
        if (effects[index]?.deps.every((value, position) => value === deps[position])) return;
        pending.push(() => {
          effects[index]?.cleanup?.();
          effects[index] = { deps, cleanup: effect() };
        });
      },
    },
    "../shared": {
      fetchJsonOrThrow,
      fetchJsonOrFallback: async <T,>(_input: string, fallback: T) => {
        otherCalls++;
        return fallback;
      },
      takeFirst: <T,>(items: T[]) => items[0] ?? null,
    },
    "./dashboardClient": { fetchConciergeMatches: matches },
  };
  const exports = {} as typeof import("../app/dashboard/concierge/useConciergeDashboardData.ts");
  new Function("require", "exports", compiled)((name: keyof typeof mocks) => mocks[name], exports);
  return {
    get otherCalls() { return otherCalls; },
    render() {
      stateIndex = 0;
      effectIndex = 0;
      pending = [];
      const state = exports.useConciergeDashboardData(true);
      pending.forEach(run => run());
      return state;
    },
  };
}

const settle = () => new Promise<void>(resolve => setImmediate(resolve));

test("un échec des rapprochements laisse les demandes disponibles et leur relance reste ciblée", async t => {
  let requestCalls = 0;
  let matchCalls = 0;
  const request = { recipient_id: "initial", title: "Ménage" };
  t.mock.method(globalThis, "fetch", async (input: string) => {
    assert.equal(input, "/api/service-requests?view=concierge&limit=10");
    ++requestCalls;
    if (requestCalls === 2) return Response.json({ error: "Indisponible" }, { status: 503 });
    return Response.json({ items: requestCalls === 1 ? [request] : [] });
  });
  const dashboard = renderDashboard(async () => {
    ++matchCalls;
    throw new Error("Rapprochements indisponibles");
  });
  dashboard.render();
  await settle();
  const reference = dashboard.render();
  assert.deepEqual(reference.requests, [request]);
  assert.equal(reference.matchesError, "Rapprochements indisponibles");
  const otherCalls = dashboard.otherCalls;
  reference.retryRequests();
  dashboard.render();
  assert.equal(dashboard.render().requestsLoading, true);
  await settle();
  const failed = dashboard.render();
  assert.equal(failed.requestsError, "Impossible de charger les demandes.");
  assert.deepEqual(failed.requests, [request]);
  failed.retryRequests();
  dashboard.render();
  await settle();
  assert.deepEqual(dashboard.render().requests, []);
  assert.equal(dashboard.render().requestsError, null);
  assert.equal(requestCalls, 3);
  assert.equal(matchCalls, 1);
  assert.equal(dashboard.otherCalls, otherCalls);
});

test("une erreur réseau initiale permet une reprise sans effacer les rapprochements chargés", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    if (++calls === 1) throw new TypeError("network failure");
    return Response.json({ items: [{ recipient_id: "retry" }] });
  });
  const match = { id: "match" };
  const dashboard = renderDashboard(async () => [match]);
  dashboard.render();
  await settle();
  const failed = dashboard.render();
  assert.ok(failed.requestsError);
  assert.deepEqual(failed.matches, [match]);
  failed.retryRequests();
  dashboard.render();
  await settle();
  assert.equal(dashboard.render().requests[0]?.recipient_id, "retry");
  assert.deepEqual(dashboard.render().matches, [match]);
});
