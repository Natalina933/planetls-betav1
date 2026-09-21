import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

type Row = Record<string, unknown>;
const source = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function execute(code: string, require: (id: string) => unknown) {
  const loaded = { exports: {} as Record<string, unknown> };
  const compiled = ts.transpileModule(code, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function("require", "module", "exports", compiled)(require, loaded, loaded.exports);
  return loaded.exports;
}

function fixture(role = "owner", userId: string | null = "owner") {
  const tables: Record<string, Row[]> = {
    housing_collaborations: [{ id: "collab", status: "pending_handover", owner_profile_id: "owner", concierge_profile_id: "concierge", housing_id: 42, quote_id: "quote", service_request_id: "request", mission_id: "mission" }],
    profiles: [{ id: "owner", first_name: "Alice" }, { id: "concierge", company_name: "Conciergerie" }],
    housing: [{ id: 42, nom_logement: "Maison", proprietaire: { owner_profile_id: "owner" } }],
    quotes: [{ id: "quote", quote_number: "DV-42", status: "accepted", owner_profile_id: "owner", concierge_profile_id: "concierge", service_request_id: "request" }],
    service_requests: [{ id: "request", title: "Accueil", owner_profile_id: "owner" }],
  };
  const calls: string[] = [];
  let failTable = "";
  const db = { from(table: string) {
    calls.push(table);
    let rows = tables[table] ?? [];
    const query = {
      select() { return query; },
      eq(key: string, value: unknown) { rows = rows.filter(r => r[key] === value); return query; },
      in(key: string, values: unknown[]) { rows = rows.filter(r => values.includes(r[key])); return query; },
      order() { return query; },
      // Any attempted write is an immediate test failure, even if caught by the route.
      insert() { calls.push("WRITE"); throw new Error("Unexpected write"); },
      update() { calls.push("WRITE"); throw new Error("Unexpected write"); },
      upsert() { calls.push("WRITE"); throw new Error("Unexpected write"); },
      delete() { calls.push("WRITE"); throw new Error("Unexpected write"); },
      then(resolve: (value: unknown) => unknown) {
        return Promise.resolve({ data: structuredClone(rows), error: table === failTable ? { message: "unavailable" } : null }).then(resolve);
      },
    };
    return query;
  } };
  const load = (id: string): unknown => {
    if (id === "next/server") return { NextResponse: { json: Response.json } };
    if (id === "@/app/lib/dbServer") return { db };
    if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
    if (id === "./apiAuth") return { getApiAuthContext: async () => ({ userId, role }) };
    if (id === "@/server/auth/roleGuards") return execute(source("server/auth/roleGuards.ts"), load);
    throw new Error(`Unexpected module ${id}`);
  };
  const mod = execute(source("app/api/housing-collaborations/route.ts"), load);
  return {
    tables, calls, mod,
    fail(table: string) { failTable = table; },
    get: (query = "") => (mod.GET as (req: Request) => Promise<Response>)(new Request(`http://localhost/api/housing-collaborations${query}`)),
  };
}

for (const [role, id] of [["owner", "owner"], ["owner_pro", "owner"], ["concierge", "concierge"], ["concierge_pro", "concierge"]]) {
  test(`${role}: authorized participant receives correct references and no private fields`, async () => {
    const f = fixture(role, id);
    f.tables.housing_collaborations.push({ ...f.tables.housing_collaborations[0], id: "foreign", owner_profile_id: "other", concierge_profile_id: "other" });
    const response = await f.get("?owner_id=other&concierge_id=other");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    const { items } = await response.json();
    assert.equal(items.length, 1);
    assert.deepEqual(items[0].housing, { id: 42, name: "Maison" });
    assert.deepEqual(items[0].quote, { id: "quote", number: "DV-42" });
    assert.deepEqual(items[0].request, { id: "request", title: "Accueil" });
    assert.equal(items[0].status, "pending_handover");
    assert.equal(items[0].owner.name, "Alice");
    assert.equal(items[0].concierge.name, "Conciergerie");
    assert.equal(JSON.stringify(items).includes("proprietaire"), false);
  });
}
for (const role of ["owner", "concierge"]) {
  test(`${role}: third party gets no data, even with forged participant parameters`, async () => {
    const f = fixture(role, "third-party");
    const response = await f.get("?owner_profile_id=owner&concierge_profile_id=concierge");
    assert.deepEqual(await response.json(), { items: [] });
    assert.deepEqual(f.calls, ["housing_collaborations"]);
  });
}
for (const [role, user, status] of [["owner", null, 401], ["provider", "owner", 403], ["admin", "owner", 403]] as const) {
  test(`unauthorized ${role}/${user}: ${status} before database access`, async () => {
    const f = fixture(role, user);
    assert.equal((await f.get()).status, status);
    assert.deepEqual(f.calls, []);
  });
}
test("repeated GET is read-only, stable and cannot create duplicates", async () => {
  const f = fixture();
  const before = structuredClone(f.tables);
  const first = await (await f.get()).json();
  assert.deepEqual(await (await f.get()).json(), first);
  assert.deepEqual(f.tables, before);
  assert.equal(f.calls.includes("WRITE"), false);
  assert.deepEqual(Object.keys(f.mod).sort(), ["GET", "dynamic"]);
});
test("missing collaboration is empty; legacy active/signed/manager markers create nothing", async () => {
  const f = fixture();
  f.tables.housing_collaborations[0].status = "active";
  f.tables.housing[0].contrat = { signed_at: "2026-01-01" };
  f.tables.housing[0].proprietaire = { manager_profile_id: "concierge" };
  assert.deepEqual(await (await f.get()).json(), { items: [] });
  f.tables.housing_collaborations = [];
  assert.deepEqual(await (await f.get()).json(), { items: [] });
});
test("optional source request can be absent", async () => {
  const f = fixture();
  f.tables.housing_collaborations[0].service_request_id = null;
  f.tables.quotes[0].service_request_id = null;
  assert.equal((await (await f.get()).json()).items[0].request, null);
});
for (const [table, key, value] of [
  ["quotes", "owner_profile_id", "other"], ["quotes", "concierge_profile_id", "other"],
  ["quotes", "status", "sent"], ["quotes", "service_request_id", "other"],
  ["housing", "proprietaire", { owner_profile_id: "other" }],
  ["service_requests", "owner_profile_id", "other"],
] as const) {
  test(`inconsistent ${table}.${key} fails closed`, async () => {
    const f = fixture();
    f.tables[table][0][key] = value;
    const response = await f.get();
    assert.equal(response.status, 409);
    assert.equal((await response.json()).items, undefined);
    assert.equal(f.calls.includes("WRITE"), false);
  });
}
test("database error is not an empty successful collaboration list", async () => {
  const f = fixture();
  f.fail("housing");
  assert.equal((await f.get()).status, 500);
});

test("repository SELECT RLS scopes access to either participant (not a live database test)", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20260621000100_housing_collaborations.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /for select\s+using \(auth.uid\(\) = owner_profile_id or auth.uid\(\) = concierge_profile_id\)/i);
});

test("multi-collaboration migration removes housing-only uniqueness and keeps quote identity", () => {
  const initial = readFileSync(new URL("../../supabase/migrations/20260621000100_housing_collaborations.sql", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../../supabase/migrations/20260921120000_allow_multi_housing_collaborations.sql", import.meta.url), "utf8");
  assert.match(initial, /unique \(quote_id\)/i);
  assert.match(migration, /drop index if exists public\.housing_collaborations_one_active_per_housing/i);
  assert.doesNotMatch(migration, /create unique index/i);
  assert.match(migration, /housing_collaborations_housing_status_idx/i);
});

test("shared UI renders loading, empty, error and pending states without active claims", async () => {
  const items = (await (await fixture().get()).json()).items;
  const types = execute(source("features/housing-collaborations/types.ts"), () => { throw new Error("Unexpected import"); });
  function render(states: unknown[]) {
    let index = 0;
    const component = execute(source("features/housing-collaborations/PendingCollaborations.tsx"), id => {
      if (id === "react") return { useEffect() {}, useState: () => [states[index++], () => {}] };
      if (id === "react/jsx-runtime") return jsxRuntime;
      if (id === "./types") return types;
      if (id === "./ContractDraftEditor") return { ContractDraftEditor: () => null };
      if (id.startsWith("@/components/ui")) return { Section: "section", Card: "article", CardHeader: "header", CardBody: "div", Button: "button" };
      throw new Error(id);
    });
    return renderToStaticMarkup(React.createElement(component.PendingCollaborations as React.ComponentType));
  }
  const loading = render([[], true, false, 0]);
  assert.match(loading, /Chargement des collaborations/);
  assert.match(render([[], false, false, 0]), /Aucune collaboration/);
  assert.match(render([[], false, true, 0]), /Réessayer/);
  const ready = render([items, false, false, 0]);
  assert.match(ready, /En attente de contractualisation/);
  assert.match(ready, /Maison/);
  assert.match(ready, /DV-42/);
  assert.doesNotMatch(ready, /Sous contrat|Signée|Active/);
});
