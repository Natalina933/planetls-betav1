import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import { getToken as verifyToken } from "next-auth/jwt";

const native = createRequire(import.meta.url);
const { NextRequest, NextResponse } = native("next/server");
const uuid = (n: number) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const ID = uuid(1), OWNER = uuid(2), CONCIERGE = uuid(3), MISSION = uuid(4);
const FOREIGN = uuid(8), SELECTED = uuid(9);
const NOW = Date.parse("2026-11-11T12:00:00Z");
const PRIVATE = "synthetic-private-mission-data";
const compiled = new Map<string, string>();
type Row = Record<string, any>;
type Options = {
  role?: string; claim?: string; actor?: "owner" | "concierge" | "foreign";
  profile?: unknown; token?: Row | null; selected?: Row;
  readError?: boolean; readThrows?: boolean; tokenThrows?: boolean; invalidJwt?: boolean;
  status?: string; session?: Row | null; authThrows?: boolean;
};

function fixture(options: Options = {}) {
  const role = options.role ?? "admin";
  let profile = Object.hasOwn(options, "profile") ? options.profile : { id: ID, role, status: "active", email: "actor@example.invalid" };
  const token = Object.hasOwn(options, "token") ? options.token : { id: ID, role: options.claim ?? role, email: "actor@example.invalid" };
  const owner = options.actor === "owner" ? ID : OWNER;
  const concierge = options.actor === "concierge" ? ID : CONCIERGE;
  const calls = { profiles: [] as string[], business: [] as string[], writes: [] as Row[], storage: [] as Row[], outbound: [] as unknown[], logs: [] as unknown[] };
  const mission = { id: MISSION, title: 'Synthetic mission', description: PRIVATE, status: options.status ?? 'draft',
    owner_profile_id: owner, concierge_profile_id: concierge, property_id: FOREIGN,
    scheduled_start: '2026-11-12T10:00:00Z', scheduled_end: '2026-11-12T11:00:00Z',
    amount: 100, currency: 'EUR', metadata: {}, created_at: '2026-11-12T08:00:00Z' };
  const tables: Record<string, Row[]> = {
    missions: [mission], profiles: [{ id: OWNER }, { id: CONCIERGE }], mission_events: [],
    mission_reviews: [], mission_checklist_items: [], quotes: [], invoices: [], invoice_events: [],
    contact_conversations: [], contact_messages: [], workflow_events: [], provider_interventions: [],
    provider_intervention_reports: [], concierge_owner_matches: [{ id: FOREIGN, owner_profile_id: owner, concierge_profile_id: concierge, match_status: 'new' }],
    properties: [{ id: FOREIGN, owner_id: owner }], housing: [], reservations: [],
  };
  function query(table: string) {
    let operation = "select", payload: Row | Row[] = {};
    let projection = "", requestedProfileId = "";
    const filters: Array<(row: Row) => boolean> = [];
    function result(single = false) {
      if (table === 'profiles' && operation === 'select') {
        const candidates = [profile, options.selected, ...tables.profiles].filter(Boolean) as Row[];
        const rows = candidates.filter(row => filters.every(filter => filter(row)));
        if (projection.includes('status') || projection.includes('additional_info')) {
          calls.profiles.push(String(rows[0]?.id ?? 'missing'));
          if (options.readThrows) throw new Error(PRIVATE);
          const data = projection.includes('status')
            ? requestedProfileId === ID ? profile : options.selected ?? null
            : rows[0] ?? null;
          return { data, error: options.readError ? { message: PRIVATE } : null };
        }
        calls.business.push(table + ':select');
        return { data: single ? rows[0] ?? null : rows, error: null };
      }
      calls.business.push(table + ':' + operation);
      let rows = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
      if (operation === "insert") {
        rows = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: FOREIGN, ...row }));
        tables[table] = [...(tables[table] ?? []), ...rows];
      } else if (operation === "update") rows.forEach(row => Object.assign(row, payload));
      else if (operation === "delete") tables[table] = (tables[table] ?? []).filter(row => !rows.includes(row));
      if (operation !== "select") calls.writes.push(...rows.map(row => ({ table, operation, ...row })));
      return { data: single ? rows[0] ?? null : rows, error: null };
    }
    const chain: any = {
      select: (columns: string) => { projection = columns ?? ""; return chain; },
      eq: (key: string, value: unknown) => { if (table === "profiles" && key === "id") requestedProfileId = String(value); filters.push(row => row[key] === value); return chain; },
      neq: (key: string, value: unknown) => { filters.push(row => row[key] !== value); return chain; },
      in: (key: string, values: unknown[]) => { filters.push(row => values.includes(row[key])); return chain; },
      or: (value: string) => { const choices = value.split(",").map(part => part.split(".eq.")); filters.push(row => choices.some(([key, id]) => row[key] === id)); return chain; },
      order: () => chain, limit: () => chain, ilike: () => chain,
      is: (key: string, value: unknown) => { filters.push(row => row[key] === value); return chain; },
      contains: (key: string, value: Row) => { filters.push(row => Object.entries(value).every(([k,v]) => row[key]?.[k] === v)); return chain; },
      not: (key: string, _operator: string, values: string) => { const excluded = values.slice(1,-1).split(','); filters.push(row => !excluded.includes(row[key])); return chain; },
      lt: (key: string, value: string) => { filters.push(row => row[key] < value); return chain; },
      gt: (key: string, value: string) => { filters.push(row => row[key] > value); return chain; },
      insert: (value: Row | Row[]) => { operation = "insert"; payload = value; return chain; },
      update: (value: Row) => { operation = "update"; payload = value; return chain; },
      delete: () => { operation = "delete"; return chain; },
      maybeSingle: async () => result(true), single: async () => result(true),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
    };
    return chain;
  }
  const db = { from: (table: string) => query(table), storage: {
    listBuckets: async () => { calls.storage.push({ action: 'list' }); return { data: [{ name: 'housing-photos' }], error: null }; },
    updateBucket: async () => { calls.storage.push({ action: 'configure' }); return { error: null }; },
    from: (bucket: string) => ({
    upload: async (file: string) => { calls.storage.push({ action: "upload", bucket, file }); return { data: { path: file }, error: null }; },
    remove: async (files: string[]) => { calls.storage.push({ action: "remove", bucket, files }); return { error: null }; },
    createSignedUrl: async (file: string, ttl: number) => { calls.storage.push({ action: "sign", bucket, file, ttl }); return { data: { signedUrl: "https://synthetic.invalid/private-proof?token=synthetic" }, error: null }; },
  }) } };
  const modules = new Map<string, Row>();
  function execute(file: string): Row {
    if (modules.has(file)) return modules.get(file)!;
    let code = compiled.get(file);
    if (!code) {
      code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      }).outputText;
      compiled.set(file, code);
    }
    const exports = {}; modules.set(file, exports);
    function load(id: string): unknown {
      if (id === "server-only") return {};
      if (id === "next/server") return { NextRequest, NextResponse };
      if (id === "@supabase/supabase-js") return { createClient: () => db };
      if (id === "zod" || id === "crypto" || id === "node:crypto") return native(id);
      if (id === "next-auth/jwt") return { getToken: async (args: Parameters<typeof verifyToken>[0]) => {
        if (options.tokenThrows) throw new Error(PRIVATE);
        return options.invalidJwt ? verifyToken(args) : token;
      } };
      if (id === "./authOptions" || id === "@/server/auth/authOptions") return { auth: async () => { if (options.authThrows) throw new Error(PRIVATE); return options.session ? { user: options.session } : null; } };
      if (id === "@/app/lib/dbServer" || id === "../db/dbServer") return { db, isSupabaseServerConfigured: true };
      if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
      if (id.startsWith("@/")) return execute(id.slice(2) + ".ts");
      if (id.startsWith(".")) return execute(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)).replace(/\.ts$/, "") + ".ts");
      throw new Error(`Unexpected import ${id} in ${file}`);
    }
    new Function("require", "exports", "process", "console", "Date", "fetch", code)(load, exports, {
      env: { NEXTAUTH_SECRET: "synthetic-housing-only-secret", SUPABASE_URL: "https://synthetic.invalid", SUPABASE_SERVICE_ROLE_KEY: "synthetic" },
    }, { warn: (...args: unknown[]) => calls.logs.push(args), error: (...args: unknown[]) => calls.logs.push(args), info: (...args: unknown[]) => calls.outbound.push(args) }, class extends Date { static now() { return NOW; } },
    (...args: unknown[]) => { calls.outbound.push(args); throw new Error("Unexpected outbound request"); });
    return exports;
  }
  async function invoke(route: string, method: string, body?: unknown, scope = "owner") {
    const cookie = options.invalidJwt ? "authjs.session-token=invalid" : options.selected ? `planetls_active_profile_id=${SELECTED}` : "";
    const req = new NextRequest(`http://localhost/api/${route}?scope=${scope}`, {
      method, headers: { cookie, "content-type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body ?? (method === "POST"
        ? { title: "Synthetic creation", concierge_profile_id: concierge }
        : { title: "Synthetic edit" })),
    });
    return execute(`app/api/${route}/route.ts`)[method](req, { params: Promise.resolve({ id: MISSION }) });
  }
  return { invoke, calls, tables, mission, setProfile: (value: unknown) => { profile = value; } };
}

const methods: [string, string][] = [
  ["missions", "GET"], ["missions", "POST"], ["missions/[id]", "GET"], ["missions/[id]", "PATCH"], ["missions/kpis", "GET"],
];
function noEffects(f: ReturnType<typeof fixture>) {
  assert.ok(f.calls.business.every(call => call.endsWith(":select")), "No SQL mutation may execute after refusal");
  assert.deepEqual(f.calls.writes, []);
  assert.deepEqual(f.calls.storage, []);
  assert.deepEqual(f.calls.outbound, []);
}
const denied: [string, Options, number][] = [
  ["demoted admin", { role: "owner", claim: "admin", actor: "owner" }, 403],
  ["demoted super admin", { role: "concierge", claim: "super_admin", actor: "concierge" }, 403],
  ["suspended principal", { profile: { id: ID, role: "admin", status: "suspended" } }, 403],
  ["deleted principal", { profile: null }, 401],
  ["no authentication", { token: null }, 401],
  ["sub alone", { token: { sub: ID, role: "admin" } }, 401],
  ["invalid application identity", { token: { id: "ambiguous", role: "admin" } }, 401],
  ["invalid JWT", { invalidJwt: true }, 401],
  ["rights unavailable", { readError: true }, 503],
  ["rights exception", { readThrows: true }, 503],
  ["authentication exception", { tokenThrows: true }, 503],
  ["session exception", { token: null, authThrows: true }, 503],
  ["profile identity mismatch", { profile: { id: FOREIGN, role: "admin", status: "active" } }, 503],
  ["invalid role", { profile: { id: ID, role: "root", status: "active" } }, 403],
  ["selected admin alone", { role: "owner", selected: { id: SELECTED, role: "admin", status: "active", email: "actor@example.invalid" } }, 403],
  ["unlinked selection", { role: "owner", selected: { id: SELECTED, role: "owner", status: "active", email: "other@example.invalid" } }, 403],
  ["inactive selection", { selected: { id: SELECTED, role: "owner", status: "suspended", email: "actor@example.invalid" } }, 403],
  ["provider excluded", { role: "provider" }, 403],
];
for (const [name, options, status] of denied) {
  test(`${name}: five real handlers refuse before private reads and effects`, async () => {
    for (const [route, method] of methods) {
      const f = fixture(options);
      const response = await f.invoke(route, method);
      assert.equal(response.status, status, `${method} ${route}: ${await response.clone().text()}`);
      assert.deepEqual(f.calls.business, []);
      noEffects(f);
      assert.equal((await response.text()).includes(PRIVATE), false);
      assert.deepEqual(f.calls.logs, []);
    }
  });
}
for (const role of ["admin", "super_admin"]) {
  test(`current ${role} with old owner claim retains the five existing permissions`, async () => {
    for (const [route, method] of methods) {
      const f = fixture({ role, claim: "owner" });
      const response = await f.invoke(route, method);
      assert.equal(response.status, method === "POST" ? 201 : 200, `${method} ${route}: ${await response.clone().text()}`);
      if (route === "missions/[id]" && method === "GET") assert.equal((await response.text()).includes(PRIVATE), true);
    }
  });
  test(`${role} cannot perform owner-only validate_completion`, async () => {
    const f = fixture({ role, status: "awaiting_owner_validation" });
    assert.equal((await f.invoke("missions/[id]", "PATCH", { action: "validate_completion" })).status, 403);
    noEffects(f);
  });
}
for (const role of ["owner", "owner_pro", "concierge", "concierge_pro"]) {
  const actor = role.startsWith("owner") ? "owner" : "concierge";
  test(`${role} retains participant read, creation, edit and scoped list`, async () => {
    for (const [route, method] of methods) {
      const f = fixture({ role, actor });
      const response = await f.invoke(route, method, undefined, actor);
      assert.equal(response.status, route === "missions/kpis" && actor === "owner" ? 403 : method === "POST" ? 201 : 200,
        `${method} ${route}: ${await response.clone().text()}`);
    }
  });
  test(`${role} cannot read or patch a foreign mission`, async () => {
    for (const method of ["GET", "PATCH"]) {
      const f = fixture({ role, actor: "foreign" });
      const response = await f.invoke("missions/[id]", method);
      assert.equal(response.status, 403);
      assert.equal((await response.text()).includes(PRIVATE), false);
      assert.deepEqual(f.calls.business, ["missions:select"]);
      noEffects(f);
    }
  });
}
test("creation rejects foreign housing before writes, messages or events", async () => {
  const f = fixture({ role: "concierge", actor: "concierge" });
  const response = await f.invoke("missions", "POST", { title: "Foreign", property_id: FOREIGN, owner_profile_id: ID });
  assert.ok([403, 409].includes(response.status));
  noEffects(f);
});
test("owner cannot change amount or execute concierge-only transitions", async () => {
  for (const body of [{ amount: 500 }, { action: "start" }, { action: "complete" }]) {
    const f = fixture({ role: "owner", actor: "owner", status: "accepted" });
    assert.equal((await f.invoke("missions/[id]", "PATCH", body)).status, 403);
    noEffects(f);
  }
});
test("assigned concierge accepts and starts; terminal states block reopening", async () => {
  for (const [from, action, expected] of [["draft", "accept", "accepted"], ["accepted", "start", "in_progress"]]) {
    const f = fixture({ role: "concierge", actor: "concierge", status: from });
    assert.equal((await f.invoke("missions/[id]", "PATCH", { action })).status, 200);
    assert.equal(f.mission.status, expected);
    assert.ok(f.calls.writes.some(row => row.table === "mission_events"));
    assert.ok(f.calls.writes.some(row => row.table === "contact_messages"));
  }
  for (const status of ["closed", "canceled"]) {
    const f = fixture({ role: "admin", status });
    assert.equal((await f.invoke("missions/[id]", "PATCH", { action: "start" })).status, 403);
    noEffects(f);
  }
});
test("complete still awaits owner validation and issues existing draft invoices", async () => {
  const f = fixture({ role: "concierge", actor: "concierge", status: "in_progress" });
  f.tables.invoices.push({ id: FOREIGN, mission_id: MISSION, status: "draft", total_amount: 100, paid_amount: 0 });
  assert.equal((await f.invoke("missions/[id]", "PATCH", { action: "complete" })).status, 200);
  assert.equal(f.mission.status, "awaiting_owner_validation");
  assert.equal(f.tables.invoices[0].status, "issued");
  assert.ok(f.calls.writes.some(row => row.table === "invoice_events" && row.event_type === "issued"));
});
test("owner validation preserves deposit and requests outstanding balance", async () => {
  const f = fixture({ role: "owner", actor: "owner", status: "awaiting_owner_validation" });
  f.tables.invoices.push({ id: FOREIGN, mission_id: MISSION, status: "partially_paid", total_amount: 100, paid_amount: 30,
    balance_amount: 70, metadata: { payment_plan: "deposit_then_balance", deposit_amount: 30 } });
  assert.equal((await f.invoke("missions/[id]", "PATCH", { action: "validate_completion" })).status, 200);
  assert.equal(f.mission.status, "validated");
  assert.equal(f.tables.invoices[0].paid_amount, 30);
  assert.equal(f.tables.invoices[0].balance_amount, 70);
  assert.ok(f.calls.writes.some(row => row.table === "invoice_events" && row.event_type === "balance_requested"));
});
test("planning refuses unpaid deposit and accepts a sufficient deposit", async () => {
  for (const paid of [0, 30]) {
    const f = fixture({ role: "concierge", actor: "concierge", status: "accepted" });
    f.tables.invoices.push({ id: FOREIGN, mission_id: MISSION, owner_profile_id: OWNER, concierge_profile_id: ID,
      status: paid ? "partially_paid" : "issued", total_amount: 100, paid_amount: paid, balance_amount: 100 - paid,
      metadata: { payment_plan: "deposit_then_balance", deposit_amount: 30 } });
    const response = await f.invoke("missions/[id]", "PATCH", { action: "schedule" });
    assert.equal(response.status, paid ? 200 : 409, await response.clone().text());
    if (!paid) noEffects(f);
    assert.equal(f.tables.invoices[0].paid_amount, paid);
  }
});
test("planning refuses overlapping mission and invalid time range before mutations", async () => {
  for (const invalid of [false, true]) {
    const f = fixture({ role: "concierge", actor: "concierge" });
    f.tables.missions.push({ ...f.mission, id: FOREIGN });
    const response = await f.invoke("missions/[id]", "PATCH", { scheduled_start: "2026-11-12T10:30:00Z",
      scheduled_end: invalid ? "2026-11-12T10:00:00Z" : "2026-11-12T11:30:00Z" });
    assert.equal(response.status, invalid ? 400 : 409);
    noEffects(f);
  }
});
test("suspension between requests is reread without cached authorization", async () => {
  const f = fixture({ role: "owner", actor: "owner" });
  assert.equal((await f.invoke("missions/[id]", "GET")).status, 200);
  f.setProfile({ id: ID, role: "owner", status: "suspended" });
  f.calls.business.length = 0;
  assert.equal((await f.invoke("missions/[id]", "PATCH")).status, 403);
  assert.deepEqual(f.calls.business, []);
  noEffects(f);
});
test("authenticated session fallback uses current rights instead of its old role", async () => {
  const f = fixture({ token: null, role: "owner", actor: "owner", session: { id: ID, role: "owner", email: "actor@example.invalid" } });
  assert.equal((await f.invoke("missions/[id]", "GET")).status, 200);
  const demoted = fixture({ token: null, role: "owner", actor: "owner", session: { id: ID, role: "admin", email: "actor@example.invalid" } });
  assert.equal((await demoted.invoke("missions/[id]", "PATCH")).status, 403);
  assert.deepEqual(demoted.calls.business, []);
  noEffects(demoted);
});
test("linked active professional profile keeps resource ownership separate from the principal", async () => {
  const f = fixture({ role: "owner", selected: { id: SELECTED, role: "owner_pro", status: "active", email: "actor@example.invalid" } });
  f.mission.owner_profile_id = SELECTED;
  assert.equal((await f.invoke("missions/[id]", "GET")).status, 200);
  f.mission.owner_profile_id = ID;
  assert.equal((await f.invoke("missions/[id]", "PATCH")).status, 403);
  noEffects(f);
});
test("admin choosing an ordinary profile receives no administrative resource exemption", async () => {
  const f = fixture({ role: "admin", selected: { id: SELECTED, role: "owner", status: "active", email: "actor@example.invalid" } });
  assert.equal((await f.invoke("missions/[id]", "GET")).status, 403);
  assert.equal((await f.invoke("missions/kpis", "GET")).status, 403);
  noEffects(f);
});
test("mission list and KPIs stay scoped even for a current administrator", async () => {
  for (const role of ["admin", "concierge"]) {
    const f = fixture({ role });
    const list = await f.invoke("missions", "GET", undefined, "all");
    assert.equal(list.status, 200);
    assert.equal((await list.text()).includes(PRIVATE), false);
    const kpis = await f.invoke("missions/kpis", "GET");
    assert.equal(kpis.status, 200);
    assert.equal((await kpis.json()).total_missions, 0);
    noEffects(f);
  }
});
test("creation preserves coherent property and reservation authorization", async () => {
  for (const mismatch of [false, true]) {
    const f = fixture({ role: "concierge", actor: "concierge" });
    f.tables.reservations.push({ id: SELECTED, owner_profile_id: OWNER, concierge_profile_id: mismatch ? FOREIGN : ID, property_id: FOREIGN, metadata: {} });
    const response = await f.invoke("missions", "POST", { title: "From stay", owner_profile_id: OWNER,
      property_id: FOREIGN, reservation_id: SELECTED });
    assert.equal(response.status, mismatch ? 403 : 201, await response.clone().text());
    if (mismatch) noEffects(f);
    else assert.ok(f.calls.writes.some(row => row.table === "missions" && row.reservation_id === SELECTED));
  }
});
test("creation preserves exact active housing collaboration and rejects inactive linkage", async () => {
  for (const active of [true, false]) {
    const f = fixture({ role: "concierge", actor: "concierge" });
    f.tables.housing_collaborations = [{ id: SELECTED, housing_id: 1, owner_profile_id: OWNER,
      concierge_profile_id: ID, status: active ? "active" : "terminated", scope: {}, ends_on: null }];
    const response = await f.invoke("missions", "POST", { title: "From collaboration", owner_profile_id: OWNER,
      metadata: { collaboration_id: SELECTED, property_housing_id: "1" } });
    assert.equal(response.status, active ? 201 : 403, await response.clone().text());
    if (!active) noEffects(f);
  }
});
test("owner signoff validates a completed mission; concierge signature cannot validate it", async () => {
  for (const role of ["owner", "concierge"] as const) {
    const f = fixture({ role, actor: role, status: "completed" });
    assert.equal((await f.invoke("missions/[id]", "PATCH", { action: "signoff", signature: "Synthetic signer" })).status, 200);
    assert.equal(f.mission.status, role === "owner" ? "validated" : "completed");
    const metadata = f.mission.metadata as Row;
    assert.equal(metadata[role + "_signature"].profile_id, ID);
  }
});
test("checklist remains concierge-only and is persisted with its mission", async () => {
  for (const role of ["owner", "concierge"] as const) {
    const f = fixture({ role, actor: role });
    const response = await f.invoke("missions/[id]", "PATCH", { action: "update_checklist",
      checklist: [{ id: "window", label: "Window checked", done: true }] });
    assert.equal(response.status, role === "owner" ? 403 : 200);
    if (role === "owner") noEffects(f);
    else {
      assert.equal(f.tables.mission_checklist_items[0].mission_id, MISSION);
      assert.equal(f.tables.mission_checklist_items[0].completed_by, ID);
    }
  }
});
test("owner cancellation only cancels draft invoices and preserves paid invoices", async () => {
  const f = fixture({ role: "owner", actor: "owner", status: "accepted" });
  f.tables.invoices.push({ id: FOREIGN, mission_id: MISSION, status: "draft" }, { id: SELECTED, mission_id: MISSION, status: "paid" });
  assert.equal((await f.invoke("missions/[id]", "PATCH", { action: "cancel", cancel_reason: "Synthetic reason" })).status, 200);
  assert.equal(f.mission.status, "canceled");
  assert.equal(f.tables.invoices[0].status, "canceled");
  assert.equal(f.tables.invoices[1].status, "paid");
});
