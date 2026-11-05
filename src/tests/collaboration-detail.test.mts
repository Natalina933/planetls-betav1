import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as lifecycle from "../app/api/_shared/collaborationLifecycle.ts";
import { TerminationDb, OWNER, CONCIERGE, THIRD, ID } from "./fixtures/collaborationTerminationHarness.mts";

const native = createRequire(import.meta.url);
function fixture(role = "owner", userId: string | null = OWNER) {
  const db = new TerminationDb();
  db.tables.profiles = [{ id: OWNER, first_name: "Alice" }, { id: CONCIERGE, company_name: "Conciergerie" }];
  db.row().starts_on = "2026-01-01";
  db.row().collaboration_type = "regular";
  function execute(file: string): Record<string, any> {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "exports", code)((id: string): unknown => {
      if (id === "next/server") return { NextResponse: { json: Response.json } };
      if (id === "@/app/lib/dbServer") return { db };
      if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
      if (id === "@/app/api/_shared/collaborationLifecycle") return lifecycle;
      if (id === "@/server/auth/roleGuards") return execute("server/auth/roleGuards.ts");
      if (id === "./apiAuth") return { getApiAuthContext: async () => ({ userId, role }) };
      if (id === "zod") return native(id);
      throw new Error(`Unexpected import: ${id}`);
    }, exports);
    return exports;
  }
  const route = execute("app/api/housing-collaborations/[id]/route.ts");
  return { db, get: (id = ID) => route.GET(new Request(`http://localhost/api/housing-collaborations/${id}`), { params: Promise.resolve({ id }) }) as Promise<Response> };
}

for (const [role, user, expected] of [
  ["owner", OWNER, 200], ["owner_pro", OWNER, 200], ["concierge", CONCIERGE, 200], ["concierge_pro", CONCIERGE, 200],
  ["owner", THIRD, 404], ["concierge", THIRD, 404], ["owner", null, 401], ["provider", OWNER, 403], ["admin", OWNER, 403],
] as const) test(`detail authorization ${role}/${user}: ${expected}`, async () => {
  const f = fixture(role, user);
  const response = await f.get();
  assert.equal(response.status, expected);
  const payload = await response.json();
  assert.equal(Boolean(payload.item), expected === 200);
  assert.deepEqual(f.db.writes, []);
});

test("invalid UUID and missing collaboration", async () => {
  assert.equal((await fixture().get("invalid")).status, 400);
  const f = fixture(); f.db.tables.housing_collaborations = [];
  assert.equal((await f.get()).status, 404);
});
test("continuous collaboration uses persisted fields without fictitious mission or end", async () => {
  const f = fixture(); const before = structuredClone(f.db.tables);
  const response = await f.get(); const { item } = await response.json();
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(item.collaboration_type, "continuous");
  assert.equal(item.start_date, "2026-01-01");
  assert.equal(item.end_date, null); assert.equal(item.mission, null);
  assert.equal(JSON.stringify(item).includes("proprietaire"), false);
  assert.deepEqual(f.db.tables, before);
});
test("one-off dates and type stay unchanged", async () => {
  const f = fixture(); f.db.row().scope = {}; f.db.row().collaboration_type = "one_off"; f.db.row().ends_on = "2026-12-01";
  const { item } = await (await f.get()).json();
  assert.equal(item.collaboration_type, "one_off"); assert.equal(item.end_date, "2026-12-01");
});
for (const [table, key, value] of [
  ["quotes", "owner_profile_id", THIRD], ["quotes", "concierge_profile_id", THIRD],
  ["quotes", "status", "sent"], ["quotes", "service_request_id", THIRD],
  ["service_requests", "owner_profile_id", THIRD], ["housing", "proprietaire", { owner_profile_id: THIRD }],
] as const) test(`detail rejects inconsistent ${table}.${key}`, async () => {
  const f = fixture(); f.db.tables[table][0][key] = value;
  const response = await f.get(); assert.equal(response.status, 409);
  assert.equal((await response.json()).item, undefined);
});
test("foreign mission is never disclosed", async () => {
  const f = fixture(); f.db.row().mission_id = THIRD;
  f.db.tables.missions = [{ id: THIRD, owner_profile_id: THIRD, concierge_profile_id: CONCIERGE, title: "Private" }];
  assert.equal((await f.get()).status, 409);
});
for (const table of ["housing_collaborations", "profiles", "housing", "quotes", "service_requests", "services_contracts", "missions"]) {
  test(`detail database failure ${table}: 500`, async () => {
    const f = fixture(); if (table === "missions") f.db.row().mission_id = THIRD;
    f.db.failTable = table;
    assert.equal((await f.get()).status, 500);
  });
}
test("effective termination is reflected without changing stored history", async () => {
  const f = fixture(); const requested_at = "2020-01-01T12:00:00Z";
  f.db.row().scope.termination_request = { schema_version: 1, requested_at, notice_days: 30, ...lifecycle.terminationSchedule(requested_at, 30) };
  f.db.row().ends_on = "2020-01-31";
  assert.equal((await (await f.get()).json()).item.status, "ended");
  assert.equal(f.db.row().status, "active"); assert.deepEqual(f.db.writes, []);
});

function renderDetail(states: unknown[], file = "../app/dashboard/owner/conciergerie/partenaires/[id]/page.tsx") {
  let index = 0;
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function("require", "exports", code)((id: string): unknown => {
    if (id === "react") return { useState: () => [states[index++], () => {}], useRef: () => ({ current: false }), useEffect() {}, useCallback: (fn: unknown) => fn, useMemo: (fn: () => unknown) => fn() };
    if (id === "react/jsx-runtime") return jsxRuntime;
    if (id === "next/navigation") return { useParams: () => ({ id: ID }) };
    if (id === "next/link") return { default: "a" };
    if (id === "@/components/ui") return { ButtonLink: "a", Input: "input", Select: "select" };
    if (id === "lucide-react") return new Proxy({}, { get: () => () => null });
    if (id.endsWith(".scss")) return { default: {} };
    throw new Error(id);
  }, exports);
  return renderToStaticMarkup(React.createElement(exports.default));
}
test("actual detail component renders loading, error and empty states", () => {
  assert.match(renderDetail([null, true]), /Chargement des détails/);
  assert.match(renderDetail([null, false, "Erreur de lecture"]), /Erreur de lecture/);
  assert.match(renderDetail([null, false, null]), /Collaboration introuvable/);
});
test("actual detail component preserves zero-day notice and exposes termination load errors", async () => {
  const { item } = await (await fixture().get()).json();
  const termination = { collaboration_status: "active", termination_request: { notice_days: 0, state: "notice", notice_source: "bilateral_contract_conditions" }, interventions_requiring_arbitration: [] };
  const html = renderDetail([item, false, null, termination, null, false, false, null, false]);
  assert.match(html, /0 jours/); assert.match(html, /Continue/);
  assert.doesNotMatch(html, /Demander la résiliation/);
  const failed = renderDetail([item, false, null, null, "Résiliation indisponible", false, false, null, false]);
  assert.match(failed, /role="alert"/); assert.match(failed, /Résiliation indisponible/);
  assert.doesNotMatch(failed, /Demander la résiliation/);
});

test("actual partner list renders cards and honest totals, without a false empty state on error", async () => {
  const { item } = await (await fixture().get()).json();
  const page = "../app/dashboard/owner/conciergerie/partenaires/page.tsx";
  function render(items: unknown[], quotes: Map<string, unknown>, error: string | null = null) {
    return renderDetail([items, quotes, new Map(), false, error, "", "all", "all", "recent"], page);
  }
  const unknown = render([item], new Map([[item.quote.id, { ...item.quote, total_amount: null }]]));
  assert.match(unknown, /Sur devis/);
  assert.match(unknown, new RegExp(`/partenaires/${ID}`));
  const mixed = render([item], new Map([["a", { total_amount: 10, currency: "EUR" }], ["b", { total_amount: 10, currency: "USD" }]]));
  assert.match(mixed, /Devises multiples/);
  const failed = render([], new Map(), "Chargement impossible");
  assert.match(failed, /Chargement impossible/);
  assert.doesNotMatch(failed, /Aucune collaboration trouvée/);
  assert.match(render([], new Map()), /Aucune collaboration trouvée/);
});
