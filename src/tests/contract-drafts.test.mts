import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as zod from "zod";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { conditions, invalidConditions } from "./fixtures/contractDraftCases.mts";

type Row = Record<string, unknown>;
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function execute(code: string, load: (id: string) => unknown) {
  const loaded = { exports: {} as Record<string, unknown> };
  const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require", "module", "exports", js)(load, loaded, loaded.exports);
  return loaded.exports;
}
const schemas = execute(read("features/housing-collaborations/contractConditions.ts"), id => {
  if (id === "zod") return zod;
  throw new Error(id);
}) as { contractConditionsSchema: zod.ZodType; saveContractDraftSchema: zod.ZodType; contractVersionActionSchema: zod.ZodType };
test("all pricing modes and both general modes are valid without inferring services", () => {
  assert.deepEqual(schemas.contractConditionsSchema.parse(conditions), conditions);
  const full = schemas.contractConditionsSchema.parse({ ...conditions, mode: "FULL_MANAGEMENT" }) as typeof conditions;
  assert.deepEqual(full.services, conditions.services);
});
for (const [label, value] of invalidConditions()) {
  test(`strict conditions: ${label}`, () => assert.equal(schemas.contractConditionsSchema.safeParse(value).success, false));
}
test("identity, signature and revision fields cannot be smuggled into request", () => {
  for (const field of ["owner_id", "concierge_id", "profile_id", "signature", "status"]) {
    assert.equal(schemas.saveContractDraftSchema.safeParse({ expectedRevision: 0, conditions, [field]: "injected" }).success, false);
  }
  assert.equal(schemas.saveContractDraftSchema.safeParse({ expectedRevision: -1, conditions }).success, false);
});

const OWNER = "11111111-1111-4111-8111-111111111111";
const CONCIERGE = "22222222-2222-4222-8222-222222222222";
const CONCIERGE_B = "33333333-3333-4333-8333-333333333333";
const COLLAB = "44444444-4444-4444-8444-444444444444";
const COLLAB_B = "55555555-5555-4555-8555-555555555555";
const VERSION = "66666666-6666-4666-8666-666666666666";
const VERSION_B = "77777777-7777-4777-8777-777777777777";
type ResponseModule = Record<string, (req: Request, context?: { params: Promise<{ id: string }> }) => Promise<Response>>;
function fixture(role = "owner", userId: string | null = OWNER) {
  const tables: Record<string, Row[]> = {
    housing_collaborations: [{ id: COLLAB, status: "pending_handover", owner_profile_id: OWNER, concierge_profile_id: CONCIERGE }],
    services_contracts: [{ id: "envelope", collaboration_id: COLLAB, profile_id: OWNER, title: "Linked" }, { id: "legacy", collaboration_id: null, profile_id: OWNER, title: "Historical" }],
    services_contract_versions: [{ id: VERSION, contract_id: "envelope", version_number: 1, status: "draft", revision: 1, conditions }],
  };
  const calls: { table: string; operation: string }[] = [];
  const rpcCalls: Row[] = [];
  let rpcError: string | null = null;
  const db = {
    from(table: string) {
      let op = "select";
      let values: Row = {};
      let orderBy: string | null = null;
      const filters: ((row: Row) => boolean)[] = [];
      function result(single: boolean) {
        calls.push({ table, operation: op });
        let rows = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
        if (orderBy) { const key = orderBy; rows.sort((a, b) => Number(b[key]) - Number(a[key])); }
        if (op === "update") rows.forEach(row => Object.assign(row, values));
        if (op === "delete") tables[table] = tables[table].filter(row => !rows.includes(row));
        if (op === "insert") { rows = [{ id: "new", collaboration_id: null, ...values }]; tables[table].push(...rows); }
        return { data: structuredClone(single ? rows[0] ?? null : rows), error: null, count: rows.length };
      }
      const query = {
        select() { return query; }, order(key: string) { orderBy = key; return query; },
        eq(key: string, value: unknown) { filters.push(row => row[key] === value); return query; },
        is(key: string, value: unknown) { filters.push(row => (row[key] ?? null) === value); return query; },
        update(body: Row) { op = "update"; values = body; return query; },
        insert(body: Row) { op = "insert"; values = body; return query; },
        delete() { op = "delete"; return query; },
        maybeSingle() { return Promise.resolve(result(true)); },
        single() { return Promise.resolve(result(true)); },
        then(resolve: (value: unknown) => unknown) { return Promise.resolve(result(false)).then(resolve); },
      };
      return query;
    },
    async rpc(name: string, args: Row) {
      assert.ok(["save_collaboration_contract_draft", "transition_collaboration_contract_version"].includes(name));
      rpcCalls.push(args);
      return { data: rpcError ? null : tables.services_contract_versions[0], error: rpcError ? { code: rpcError } : null };
    },
  };
  const load = (id: string): unknown => {
    if (id === "zod") return zod;
    if (id === "next/server") return { NextResponse: { json: Response.json } };
    if (id === "@/app/lib/dbServer") return { db };
    if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
    if (id === "@/features/housing-collaborations/contractConditions") return schemas;
    if (id === "./apiAuth") return { getApiAuthContext: async () => ({ userId, role }) };
    if (id === "@/server/auth/roleGuards") return execute(read("server/auth/roleGuards.ts"), load);
    if (id === "@/app/api/services/_shared") return {
      getServiceAuthContext: async () => userId ? { userId, role, isAdmin: role === "admin" } : null,
      isAllowedServiceRole: () => true,
      serviceAuthError: (status: number) => Response.json({ error: "Forbidden" }, { status }),
    };
    throw new Error(`Unexpected import ${id}`);
  };
  const routes = execute(read("app/api/housing-collaborations/[id]/conditions/route.ts"), load) as ResponseModule;
  const legacy = execute(read("app/api/services/contracts/[id]/route.ts"), load) as ResponseModule;
  const legacyList = execute(read("app/api/services/contracts/route.ts"), load) as ResponseModule;
  const request = (method: string, body?: unknown) => new Request("http://localhost/api/test?owner_id=forged", { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }) });
  return {
    tables, calls, rpcCalls, setRpcError(code: string) { rpcError = code; },
    get: (id = COLLAB) => routes.GET(request("GET"), { params: Promise.resolve({ id }) }),
    put: (body: unknown = { expectedRevision: 0, conditions }) => routes.PUT(request("PUT", body), { params: Promise.resolve({ id: COLLAB }) }),
    action: (body: unknown = { action: "propose", versionId: VERSION, expectedRevision: 1 }) => routes.POST(request("POST", body), { params: Promise.resolve({ id: COLLAB }) }),
    legacy: (method: string, id: string, body?: unknown) => legacy[method](request(method, body), { params: Promise.resolve({ id }) }),
    list: () => legacyList.GET(request("GET")),
    postLegacy: (body: unknown) => legacyList.POST(request("POST", body)),
  };
}

for (const [role, user] of [["owner", OWNER], ["concierge", CONCIERGE], ["owner_pro", OWNER], ["concierge_pro", CONCIERGE]]) {
  test(`${role} reads and edits own draft through scoped API`, async () => {
    const f = fixture(role, user);
    assert.equal((await f.get()).status, 200);
    const before = structuredClone(f.tables);
    assert.equal((await f.put()).status, 200);
    assert.equal(f.rpcCalls[0].p_actor_id, user);
    assert.equal(f.rpcCalls[0].p_collaboration_id, COLLAB);
    assert.deepEqual(f.tables, before);
    assert.ok(f.calls.every(call => call.operation === "select"));
  });
}
for (const [role, user, expected] of [["owner", null, 401], ["owner", "third", 404], ["concierge", "third", 404], ["admin", OWNER, 403], ["provider", OWNER, 403]] as const) {
  test(`${role}/${user}: no read/write access`, async () => {
    const f = fixture(role, user);
    assert.equal((await f.get()).status, expected);
    assert.equal((await f.put()).status, expected);
    assert.equal((await f.action()).status, expected);
    assert.equal(f.rpcCalls.length, 0);
  });
}
test("absent draft GET remains read-only and does not create an envelope", async () => {
  const f = fixture();
  f.tables.services_contracts = [];
  assert.deepEqual(await (await f.get()).json(), { draft: null, currentVersion: null, versions: [], actorId: OWNER });
  assert.deepEqual(await (await f.get()).json(), { draft: null, currentVersion: null, versions: [], actorId: OWNER });
  assert.equal(f.rpcCalls.length, 0);
});

for (const [role, user] of [["owner", OWNER], ["concierge", CONCIERGE]]) {
  for (const action of ["propose", "accept", "request_changes"]) {
    test(`${role}: ${action} always targets authenticated actor and exact version/revision`, async () => {
      const f = fixture(role, user);
      const response = await f.action({ action, versionId: VERSION, expectedRevision: 3, ...(action === "request_changes" ? { reason: "Modifier le tarif" } : {}) });
      assert.equal(response.status, 200);
      assert.deepEqual(f.rpcCalls[0], { p_collaboration_id: COLLAB, p_actor_id: user, p_version_id: VERSION, p_expected_revision: 3, p_action: action, p_reason: action === "request_changes" ? "Modifier le tarif" : null });
      assert.ok(f.calls.every(call => call.operation === "select"));
    });
  }
}
test("agreement actions reject identity injection, missing versions/revisions and signing", async () => {
  const f = fixture();
  const base = { action: "accept", versionId: VERSION, expectedRevision: 1 };
  for (const body of [
    { ...base, actorId: CONCIERGE }, { ...base, owner_accepted_by: CONCIERGE },
    { ...base, role: "owner" }, { ...base, action: "sign" }, { ...base, expectedRevision: 0 },
    { action: "accept" }, { ...base, action: "request_changes", reason: " " },
  ]) assert.equal((await f.action(body)).status, 400);
  assert.equal(f.rpcCalls.length, 0);
});
test("save forwards the explicit draft ID and never silently selects a newer draft", async () => {
  const f = fixture();
  await f.put({ versionId: VERSION, expectedRevision: 2, conditions });
  assert.equal(f.rpcCalls[0].p_version_id, VERSION);
});
test("GET exposes the latest version plus immutable history without writing", async () => {
  const f = fixture();
  f.tables.services_contract_versions[0].status = "superseded";
  f.tables.services_contract_versions.push({ id: "new-version", contract_id: "envelope", version_number: 2, status: "proposed", conditions });
  const response = await (await f.get()).json();
  assert.equal(response.draft, null);
  assert.equal(response.currentVersion.id, "new-version");
  assert.equal(response.versions.length, 2);
  assert.equal(f.rpcCalls.length, 0);
});

test("two collaborations for the same housing keep separate contracts and versions", async () => {
  const f = fixture();
  f.tables.housing_collaborations[0].housing_id = 42;
  f.tables.housing_collaborations.push({
    id: COLLAB_B,
    status: "pending_handover",
    owner_profile_id: OWNER,
    concierge_profile_id: CONCIERGE_B,
    housing_id: 42,
  });
  f.tables.services_contracts.push({
    id: "envelope-b",
    collaboration_id: COLLAB_B,
    profile_id: OWNER,
    title: "Linked B",
  });
  f.tables.services_contract_versions.push({
    id: VERSION_B,
    contract_id: "envelope-b",
    version_number: 1,
    status: "draft",
    revision: 1,
    conditions: { ...conditions, mode: "FULL_MANAGEMENT" },
  });

  const contractA = f.tables.services_contracts.find((contract) => contract.collaboration_id === COLLAB);
  const contractB = f.tables.services_contracts.find((contract) => contract.collaboration_id === COLLAB_B);
  assert.equal(contractA?.id, "envelope");
  assert.equal(contractB?.id, "envelope-b");
  assert.equal(f.tables.services_contract_versions.find((version) => version.id === VERSION)?.contract_id, contractA?.id);
  assert.equal(f.tables.services_contract_versions.find((version) => version.id === VERSION_B)?.contract_id, contractB?.id);

  const responseA = await (await f.get(COLLAB)).json();
  const responseB = await (await f.get(COLLAB_B)).json();
  assert.equal(responseA.currentVersion.id, VERSION);
  assert.equal(responseB.currentVersion.id, VERSION_B);
});
for (const [code, status] of [["40001", 409], ["42501", 403], ["23514", 400], ["XX000", 500]] as const) {
  test(`transition RPC ${code} surfaces as HTTP ${status}`, async () => {
    const f = fixture(); f.setRpcError(code);
    assert.equal((await f.action()).status, status);
  });
}
test("invalid conditions and participant spoofing are rejected before RPC", async () => {
  const f = fixture();
  assert.equal((await f.put({ expectedRevision: 0, conditions, owner_id: "third" })).status, 400);
  assert.equal((await f.put({ expectedRevision: 0, conditions: {} })).status, 400);
  assert.equal(f.rpcCalls.length, 0);
});
test("nonpending collaboration cannot be modified or activated", async () => {
  const f = fixture();
  f.tables.housing_collaborations[0].status = "paused";
  assert.equal((await f.put()).status, 409);
  assert.equal(f.rpcCalls.length, 0);
});
for (const [code, status] of [["40001", 409], ["42501", 403], ["23514", 400], ["XX000", 500]] as const) {
  test(`RPC ${code} surfaces as HTTP ${status}`, async () => {
    const f = fixture(); f.setRpcError(code);
    assert.equal((await f.put()).status, status);
  });
}
for (const role of ["owner", "admin"]) {
  test(`${role}: legacy APIs cannot read, update or delete a linked envelope`, async () => {
    const f = fixture(role);
    const linked = structuredClone(f.tables.services_contracts[0]);
    assert.equal((await f.legacy("GET", "envelope")).status, 404);
    assert.equal((await f.legacy("PATCH", "envelope", { status: "actif" })).status, 404);
    assert.equal((await f.legacy("DELETE", "envelope")).status, 404);
    assert.deepEqual(f.tables.services_contracts[0], linked);
    const rows = await (await f.list()).json();
    assert.deepEqual(rows.map((r: Row) => r.id), ["legacy"]);
    assert.equal((await f.legacy("PATCH", "legacy", { notes: "Updated" })).status, 200);
    assert.equal((await f.legacy("DELETE", "legacy")).status, 200);
  });
}
test("legacy POST preserves historical behavior and ignores collaboration/identity injection", async () => {
  const f = fixture();
  const response = await f.postLegacy({ title: "Historic", start_date: "2026-01-01", collaboration_id: COLLAB, profile_id: "third" });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.collaboration_id, null);
  assert.equal(body.profile_id, OWNER);
});

test("draft form uses existing labeled controls; changing mode preserves every service", () => {
  let index = 0;
  const states: unknown[] = [true, false, false, true, 1, structuredClone(conditions), null, null, 0, null, [], OWNER, ""];
  const loadControl = (id: string): unknown => {
    if (id === "react") return React;
    if (id === "react/jsx-runtime") return jsxRuntime;
    if (id.endsWith(".scss")) return { default: {} };
    throw new Error(id);
  };
  const controls = {
    ...execute(read("components/ui/Input/Input.tsx"), loadControl),
    ...execute(read("components/ui/Select/Select.tsx"), loadControl),
    Button: "button",
  };
  const loaded = execute(read("features/housing-collaborations/ContractDraftEditor.tsx"), id => {
    if (id === "react") return { ...React, useEffect() {}, useState() {
      const current = index++;
      return [states[current], (value: unknown) => { states[current] = typeof value === "function" ? value(states[current]) : value; }];
    } };
    if (id === "react/jsx-runtime") return jsxRuntime;
    if (id === "@/components/ui") return controls;
    if (id === "./contractConditions") return schemas;
    throw new Error(id);
  });
  const tree = (loaded.ContractDraftEditor as (props: { collaborationId: string }) => React.ReactElement)({ collaborationId: COLLAB });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Brouillon de conditions contractuelles/);
  assert.match(html, /Assiette du pourcentage/);
  assert.match(html, /Devise/);
  let labelDepth = 0;
  for (const match of html.matchAll(/<\/?label\b[^>]*>/g)) {
    labelDepth += match[0].startsWith("</") ? -1 : 1;
    assert.ok(labelDepth === 0 || labelDepth === 1, "No nested labels");
  }
  function visit(node: React.ReactNode) {
    if (!React.isValidElement<{ label?: string; onChange?: (event: { target: { value: string } }) => void; children?: React.ReactNode }>(node)) return;
    if (node.props.label === "Mode général") node.props.onChange?.({ target: { value: "FULL_MANAGEMENT" } });
    React.Children.forEach(node.props.children, visit);
  }
  visit(tree);
  assert.equal((states[5] as typeof conditions).mode, "FULL_MANAGEMENT");
  assert.deepEqual((states[5] as typeof conditions).services, conditions.services);
});

function frozenEditor(status: string, actor: string, accepted = false) {
  const version = {
    id: VERSION, version_number: 1, revision: 3, status, conditions,
    proposed_by: OWNER, proposed_owner_id: OWNER, proposed_concierge_id: CONCIERGE,
    proposed_at: "2026-09-20T10:00:00Z", owner_accepted_at: accepted ? "2026-09-20T11:00:00Z" : null,
    concierge_accepted_at: status === "ready_to_sign" ? "2026-09-20T12:00:00Z" : null,
  };
  const states: unknown[] = [true, false, false, true, 3, conditions, null, null, 0, version, [version], actor, ""];
  let index = 0;
  const loaded = execute(read("features/housing-collaborations/ContractDraftEditor.tsx"), id => {
    if (id === "react") return { ...React, useEffect() {}, useState() {
      const position = index++;
      return [states[position], (value: unknown) => { states[position] = typeof value === "function" ? value(states[position]) : value; }];
    } };
    if (id === "react/jsx-runtime") return jsxRuntime;
    if (id === "@/components/ui") return { Button: "button", Input: "input", Select: "select" };
    if (id === "./contractConditions") return schemas;
    throw new Error(id);
  });
  const tree = (loaded.ContractDraftEditor as (props: { collaborationId: string }) => React.ReactElement)({ collaborationId: COLLAB });
  return { tree, html: renderToStaticMarkup(tree) };
}
test("proposer must explicitly accept; frozen conditions have no edit/save controls", () => {
  const { html } = frozenEditor("proposed", OWNER);
  assert.match(html, /Accepter les conditions/);
  assert.match(html, /Proposer ne vaut pas accord/);
  assert.doesNotMatch(html, /<form|Enregistrer le brouillon|Demander une modification/);
  assert.match(frozenEditor("proposed", CONCIERGE).html, /Demander une modification/);
});
test("ready to sign is read-only with clear message, not a signature or activation", () => {
  const { html } = frozenEditor("ready_to_sign", OWNER, true);
  assert.match(html, /Les conditions ont été acceptées par les deux parties/);
  assert.match(html, /prêt pour l/);
  assert.doesNotMatch(html, /Accepter les conditions|Demander une modification|Contrat signé|Collaboration active|<form/);
});
test("accept button submits the exact displayed version/revision and no participant identity", async () => {
  const originalFetch = globalThis.fetch;
  let sent: unknown;
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(String(init?.body));
    return Response.json({ version: { id: VERSION, status: "proposed", conditions, revision: 3 } });
  };
  try {
    const { tree } = frozenEditor("proposed", OWNER);
    function visit(node: React.ReactNode) {
      if (!React.isValidElement<{ children?: React.ReactNode; onClick?: () => void }>(node)) return;
      if (node.props.children === "Accepter les conditions") node.props.onClick?.();
      React.Children.forEach(node.props.children, visit);
    }
    visit(tree);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(sent, { action: "accept", versionId: VERSION, expectedRevision: 3 });
  } finally { globalThis.fetch = originalFetch; }
});
