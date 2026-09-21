import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;
const root = fileURLToPath(new URL("../../", import.meta.url));
const OWNER = "11111111-1111-4111-8111-111111111111";
const CONCIERGE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const CONCIERGE_B = "88888888-8888-4888-8888-888888888888";
const Q = "44444444-4444-4444-8444-444444444444";
const Q2 = "44444444-4444-4444-8444-555555555555";
const QB = "44444444-4444-4444-8444-666666666666";
const R = "55555555-5555-4555-8555-555555555555";
const RB = "55555555-5555-4555-8555-666666666666";
const RECIPIENT = "66666666-6666-4666-8666-666666666666";
const RECIPIENT2 = "66666666-6666-4666-8666-777777777777";
const RECIPIENT_B = "66666666-6666-4666-8666-888888888888";
const PROPERTY = "77777777-7777-4777-8777-777777777777";
const asRow = (v: unknown) => v as Row;

class MemoryDb {
  tables: Record<string, Row[]> = {
    quotes: [{ id: Q, owner_profile_id: OWNER, concierge_profile_id: CONCIERGE,
      service_request_id: R, service_request_recipient_id: RECIPIENT, status: "sent",
      quote_number: "DV-1", total_amount: 30, metadata: {}, quote_items: [] }],
    service_requests: [{ id: R, owner_profile_id: OWNER, metadata: { property_housing_id: "42" }, title: "Ménage" }],
    service_request_recipients: [{ id: RECIPIENT, service_request_id: R, concierge_profile_id: CONCIERGE, status: "quoted" }],
    housing: [{ id: 42, proprietaire: { owner_profile_id: OWNER, manager_profile_id: CONCIERGE }, contrat: {} }],
    profiles: [{ id: OWNER, first_name: "Alice" }],
    quote_items: [{ id: "item", quote_id: Q, label: "Ménage", quantity: 1, unit_price: 30, line_total: 30 }],
    properties: [{ id: PROPERTY, owner_id: OWNER }],
  };
  writes: Array<{ table: string; operation: string }> = [];
  failRead: string | null = null;
  beforeHousingUpdate: (() => void) | null = null;
  from(table: string) { return new Query(this, table); }
  // RPC transport double. Real SQL locking/permissions are tested in local PostgreSQL.
  async rpc(name: string, args: Row) {
    assert.equal(name, "award_service_request_quote");
    const q = this.tables.quotes.find(row => row.id === args.p_quote_id);
    if (!q || q.owner_profile_id !== args.p_actor_id) return { data: null, error: { code: "42501", message: "Forbidden" } };
    const requestId = q.service_request_id ?? asRow(q.metadata).service_request_id;
    if (!requestId) return { data: null, error: null };
    const r = this.tables.service_requests.find(row => row.id === requestId);
    const recipientId = q.service_request_recipient_id ?? asRow(q.metadata).service_request_recipient_id;
    const metadata = asRow(r?.metadata ?? {});
    if (!r || (metadata.selected_quote_id && metadata.selected_quote_id !== q.id) || !["sent", "accepted"].includes(String(q.status))) {
      return { data: null, error: { code: "40001", message: "Already awarded" } };
    }
    if (metadata.selected_quote_id === q.id) return { data: structuredClone(r), error: null };
    Object.assign(r, { status: "quote_accepted", selected_concierge_profile_id: q.concierge_profile_id,
      metadata: { ...metadata, selected_quote_id: q.id, selected_recipient_id: recipientId } });
    for (const other of this.tables.quotes) {
      if ((other.service_request_id ?? asRow(other.metadata).service_request_id) !== requestId) continue;
      if (other.id === q.id) Object.assign(other, { status: "accepted", accepted_at: "2026-09-20" });
      else if (["draft", "sent"].includes(String(other.status))) other.status = "not_selected";
    }
    for (const recipient of this.tables.service_request_recipients) {
      if (recipient.service_request_id === requestId) recipient.status = recipient.id === recipientId ? "selected" : "not_selected";
    }
    this.writes.push({ table: "service_requests", operation: "award" });
    return { data: structuredClone(r), error: null };
  }
}

function valueAt(row: Row, key: string) {
  const [parent, child] = key.split("->>");
  return child ? asRow(row[parent] ?? {})[child] : row[key];
}

class Query {
  db: MemoryDb;
  table: string;
  operation = "select";
  payload: Row | Row[] = {};
  filters: Array<(row: Row) => boolean> = [];
  count = Infinity;
  ignoreDuplicates = false;
  constructor(db: MemoryDb, table: string) { this.db = db; this.table = table; }
  select() { return this; }
  eq(key: string, value: unknown) {
    this.filters.push((row) => JSON.stringify(valueAt(row, key)) === JSON.stringify(value));
    return this;
  }
  in(key: string, values: unknown[]) { this.filters.push((row) => values.includes(row[key])); return this; }
  is(key: string, value: unknown) { this.filters.push((row) => (valueAt(row, key) ?? null) === value); return this; }
  order() { return this; }
  limit(n: number) { this.count = n; return this; }
  update(payload: Row) { this.operation = "update"; this.payload = payload; return this; }
  insert(payload: Row | Row[]) { this.operation = "insert"; this.payload = payload; return this; }
  upsert(payload: Row, options?: { ignoreDuplicates?: boolean }) {
    this.operation = "upsert"; this.payload = payload; this.ignoreDuplicates = options?.ignoreDuplicates ?? false; return this;
  }
  async result(single = false) {
    if (this.operation === "select" && this.db.failRead === this.table) {
      return { data: null, error: { message: "read unavailable" } };
    }
    if (this.table === "housing" && this.operation === "update") this.db.beforeHousingUpdate?.();
    const rows = this.db.tables[this.table] ??= [];
    let selected = rows.filter((row) => this.filters.every((filter) => filter(row))).slice(0, this.count);
    if (this.operation !== "select") {
      this.db.writes.push({ table: this.table, operation: this.operation });
      if (this.operation === "update") selected.forEach((row) => Object.assign(row, structuredClone(this.payload)));
      else {
        selected = (Array.isArray(this.payload) ? this.payload : [this.payload]).flatMap((payload) => {
          if (this.operation === "upsert") {
            const previous = rows.find((row) => row.quote_id === payload.quote_id);
            if (previous) {
              if (this.ignoreDuplicates) return [];
              Object.assign(previous, structuredClone(payload)); return [previous];
            }
          }
          const row = { id: this.table === "housing" ? 100 + rows.length : `${this.table}-${rows.length}`, ...structuredClone(payload) };
          rows.push(row);
          return [row];
        });
      }
    }
    return { data: structuredClone(single ? selected[0] ?? null : selected), error: null };
  }
  maybeSingle() { return this.result(true); }
  single() { return this.result(true); }
  then<TResult1 = Awaited<ReturnType<Query["result"]>>, TResult2 = never>(
    resolve?: ((value: Awaited<ReturnType<Query["result"]>>) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) { return this.result().then(resolve, reject); }
}

/** Execute actual route/helper sources. Only transport/auth/database are replaced;
 * no server, credentials, network, build output or remote mutations are involved. */
function modules(db: MemoryDb) {
  const cache = new Map<string, { exports: Row }>();
  const load = (name: string, parent = path.join(root, "src")): Row => {
    if (name === "next/server") return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } };
    if (["@/app/lib/dbServer", "@/server/db/dbServer"].includes(name)) return { db };
    if (name === "@/server/auth/roleGuards") return {
      requireApiRole: async () => ({ ok: true, auth: { userId: OWNER, role: "owner", isAdmin: false } }),
    };
    let file = name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : path.resolve(parent, name);
    if (!existsSync(file)) file += ".ts";
    const existing = cache.get(file);
    if (existing) return existing.exports;
    const loaded = { exports: {} as Row };
    cache.set(file, loaded);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "module", "exports", code)(
      (dependency: string) => load(dependency, path.dirname(file)), loaded, loaded.exports,
    );
    return loaded.exports;
  };
  return load;
}

type Handler = (req: { json: () => Promise<Row> }, context: { params: Promise<{ id: string }> }) => Promise<Response>;
function setup(kind: "accept" | "select", db = new MemoryDb()) {
  const load = modules(db);
  const route = load(kind === "accept" ? "@/app/api/quotes/[id]/status/route" : "@/app/api/service-requests/[id]/select/route");
  const call = () => (route[kind === "accept" ? "PATCH" : "POST"] as Handler)(
    { json: async () => kind === "accept" ? { status: "accepted" } : { recipient_id: RECIPIENT, quote_id: Q } },
    { params: Promise.resolve({ id: kind === "accept" ? Q : R }) },
  );
  return { db, load, call };
}

for (const kind of ["accept", "select"] as const) {
  for (const status of ["pending_handover", "active", "paused", "ended", "cancelled"]) {
    test(`${kind}: acceptance retry preserves ${status}, references and contractual versions`, async () => {
      const { db, call } = setup(kind);
      assert.equal((await call()).status, 200);
      assert.equal(db.tables.housing_collaborations.length, 1);
      assert.equal(db.tables.housing_collaborations[0].status, "pending_handover");
      Object.assign(db.tables.housing_collaborations[0], {
        status, handover_status: "ready", starts_on: "2026-09-01", ends_on: "2027-09-01",
        scope: { requested_services: ["CHECK_IN"], preserved: true },
      });
      db.tables.services_contracts = [{ id: "contract", collaboration_id: db.tables.housing_collaborations[0].id }];
      db.tables.services_contract_versions = [{ id: "version", contract_id: "contract", status: "ready_to_sign", revision: 3,
        conditions: { mode: "A_LA_CARTE" }, owner_accepted_at: "2026-09-20", concierge_accepted_at: "2026-09-20" }];
      const collaboration = structuredClone(db.tables.housing_collaborations);
      const contracts = structuredClone(db.tables.services_contracts);
      const versions = structuredClone(db.tables.services_contract_versions);
      const missionIds = db.tables.missions.map(row => row.id);
      assert.equal((await call()).status, 200);
      assert.equal((await call()).status, 200);
      assert.deepEqual(db.tables.housing_collaborations, collaboration);
      assert.deepEqual(db.tables.services_contracts, contracts);
      assert.deepEqual(db.tables.services_contract_versions, versions);
      assert.deepEqual(db.tables.missions.map(row => row.id), missionIds);
      assert.equal(db.tables.invoices.length, 1);
    });
  }
  test(`${kind}: legitimate attachment preserves mission, invoice and history; retry reuses objects`, async () => {
    const { db, call } = setup(kind);
    assert.equal((await call()).status, 200);
    assert.equal(asRow(db.tables.housing[0].proprietaire).owner_profile_id, OWNER);
    assert.equal(asRow(db.tables.housing[0].proprietaire).manager_profile_id, CONCIERGE);
    assert.equal(db.tables.missions.length, 1);
    assert.equal(db.tables.invoices.length, 1);
    assert.ok(db.tables.mission_events.length > 0);
    const housing = structuredClone(db.tables.housing);
    assert.equal((await call()).status, 200);
    assert.deepEqual(db.tables.housing, housing);
    assert.equal(db.tables.missions.length, 1);
    assert.equal(db.tables.invoices.length, 1);
  });

  const cases: Array<[string, (db: MemoryDb) => void]> = [
    ["foreign owner", (db) => { asRow(db.tables.housing[0].proprietaire).owner_profile_id = OTHER; }],
    ["foreign concierge quote", (db) => { db.tables.quotes[0].concierge_profile_id = OTHER; }],
    ["wrong request", (db) => { db.tables.quotes[0].service_request_id = OTHER; }],
    ["conflicting request metadata", (db) => { db.tables.quotes[0].metadata = { service_request_id: OTHER }; }],
    ["conflicting housing refs", (db) => { db.tables.quotes[0].metadata = { housing_id: 43 }; }],
    ["unprovable UUID/numeric mapping", (db) => { db.tables.service_requests[0].property_id = PROPERTY; }],
    ["wrong request owner", (db) => { db.tables.service_requests[0].owner_profile_id = OTHER; }],
    ["missing housing", (db) => { db.tables.housing = []; }],
    ["missing owner", (db) => { db.tables.housing[0].proprietaire = { manager_profile_id: CONCIERGE }; }],
    ["conflicting owner aliases", (db) => { asRow(db.tables.housing[0].proprietaire).id = OTHER; }],
    ["foreign recipient concierge", (db) => { db.tables.service_request_recipients[0].concierge_profile_id = OTHER; }],
    ["invalid housing reference", (db) => { db.tables.service_requests[0].metadata = { housing_id: "invalid" }; }],
  ];
  for (const [label, change] of cases) test(`${kind}: ${label} refuses BEFORE any business write`, async () => {
    const { db, call } = setup(kind);
    change(db);
    const before = structuredClone(db.tables);
    const response = await call();
    assert.ok([404, 409].includes(response.status), `${response.status}: ${await response.text()}`);
    assert.equal(db.writes.length, 0);
    assert.deepEqual(db.tables, before);
  });

  test(`${kind}: housing read failure refuses before writes`, async () => {
    const { db, call } = setup(kind);
    db.failRead = "housing";
    assert.equal((await call()).status, 500);
    assert.equal(db.writes.length, 0);
  });

  test(`${kind}: absent housing reference still creates once and preserves quote metadata`, async () => {
    const { db, call } = setup(kind);
    db.tables.service_requests[0].metadata = {};
    db.tables.quotes[0].metadata = { service_request_id: R, service_request_recipient_id: RECIPIENT, payment_plan: "monthly" };
    assert.equal((await call()).status, 200);
    assert.equal(db.tables.housing.length, 2);
    assert.equal(asRow(db.tables.quotes[0].metadata).service_request_id, R);
    assert.equal(asRow(db.tables.quotes[0].metadata).payment_plan, "monthly");
    assert.equal((await call()).status, 200);
    assert.equal(db.tables.housing.length, 2);
  });

  test(`${kind}: legacy properties UUID keeps its verified origin across retries`, async () => {
    const { db, call } = setup(kind);
    db.tables.service_requests[0].metadata = { housing_id: PROPERTY };
    db.tables.service_requests[0].property_id = PROPERTY;
    assert.equal((await call()).status, 200);
    assert.equal(asRow(db.tables.housing[1].infos).quote_source_property_id, PROPERTY);
    assert.equal((await call()).status, 200);
    assert.equal(db.tables.housing.length, 2);
  });

  test(`${kind}: a legitimate unassigned home can receive its first manager`, async () => {
    const { db, call } = setup(kind);
    db.tables.housing[0].proprietaire = { owner_profile_id: OWNER };
    assert.equal((await call()).status, 200);
    assert.equal(asRow(db.tables.housing[0].proprietaire).manager_profile_id, CONCIERGE);
  });

  test(`${kind}: a home managed by another concierge can create a separate collaboration without replacing it`, async () => {
    const { db, call } = setup(kind);
    asRow(db.tables.housing[0].proprietaire).manager_profile_id = OTHER;
    assert.equal((await call()).status, 200);
    assert.equal(asRow(db.tables.housing[0].proprietaire).manager_profile_id, OTHER);
    assert.equal(db.tables.housing_collaborations.length, 1);
    assert.equal(db.tables.housing_collaborations[0].concierge_profile_id, CONCIERGE);
  });
}

type CollaborationInput = {
  db: unknown; housingId: number; ownerProfileId: string; conciergeProfileId: string;
  quoteId: string; missionId?: string | null; request?: { id: string } | null;
};
function collaborationWriter(db: MemoryDb) {
  return modules(db)("@/app/api/_shared/housingCollaboration").upsertAcceptedHousingCollaboration as (input: CollaborationInput) => Promise<Row>;
}
const collaborationInput = (db: unknown): CollaborationInput => ({
  db, housingId: 42, ownerProfileId: OWNER, conciergeProfileId: CONCIERGE, quoteId: Q,
});

test("accept: a losing quote cannot overwrite the winner or create business effects", async () => {
  const { db, load, call } = setup("accept");
  db.tables.quotes.push({
    ...structuredClone(db.tables.quotes[0]),
    id: Q2,
    quote_number: "DV-2",
    status: "sent",
    service_request_recipient_id: RECIPIENT2,
    mission_id: null,
    accepted_at: null,
  });
  db.tables.service_request_recipients.push({
    id: RECIPIENT2,
    service_request_id: R,
    concierge_profile_id: CONCIERGE,
    status: "quoted",
  });

  assert.equal((await call()).status, 200);
  const afterWinner = structuredClone(db.tables);

  const route = load("@/app/api/quotes/[id]/status/route");
  const response = await (route.PATCH as Handler)(
    { json: async () => ({ status: "accepted" }) },
    { params: Promise.resolve({ id: Q2 }) },
  );

  assert.equal(response.status, 409);
  assert.equal(asRow(db.tables.service_requests[0].metadata).selected_quote_id, Q);
  assert.equal(db.tables.quotes.find((quote) => quote.id === Q)?.status, "accepted");
  assert.equal(db.tables.quotes.find((quote) => quote.id === Q2)?.status, "not_selected");
  assert.deepEqual(db.tables.missions, afterWinner.missions);
  assert.deepEqual(db.tables.invoices, afterWinner.invoices);
  assert.deepEqual(db.tables.housing_collaborations, afterWinner.housing_collaborations);
});

test("accept: same housing can keep collaboration A and create collaboration B for another request", async () => {
  const { db, load, call } = setup("accept");
  assert.equal((await call()).status, 200);
  const collaborationA = structuredClone(db.tables.housing_collaborations[0]);

  db.tables.service_requests.push({
    id: RB,
    owner_profile_id: OWNER,
    metadata: { property_housing_id: "42" },
    title: "Accueil voyageurs",
  });
  db.tables.service_request_recipients.push({
    id: RECIPIENT_B,
    service_request_id: RB,
    concierge_profile_id: CONCIERGE_B,
    status: "quoted",
  });
  db.tables.quotes.push({
    id: QB,
    owner_profile_id: OWNER,
    concierge_profile_id: CONCIERGE_B,
    service_request_id: RB,
    service_request_recipient_id: RECIPIENT_B,
    status: "sent",
    quote_number: "DV-B",
    total_amount: 45,
    metadata: {},
    quote_items: [],
  });
  db.tables.quote_items.push({ id: "item-b", quote_id: QB, label: "Accueil", quantity: 1, unit_price: 45, line_total: 45 });

  const route = load("@/app/api/quotes/[id]/status/route");
  const response = await (route.PATCH as Handler)(
    { json: async () => ({ status: "accepted" }) },
    { params: Promise.resolve({ id: QB }) },
  );

  assert.equal(response.status, 200);
  assert.equal(db.tables.housing_collaborations.length, 2);
  assert.deepEqual(db.tables.housing_collaborations[0], collaborationA);
  const collaborationB = db.tables.housing_collaborations.find((row) => row.quote_id === QB);
  assert.equal(collaborationB?.housing_id, 42);
  assert.equal(collaborationB?.concierge_profile_id, CONCIERGE_B);
  assert.equal(db.tables.missions.some((mission) => mission.concierge_profile_id === CONCIERGE_B), true);
});

test("collaboration writer allows a new quote after an ended collaboration on the same housing", async () => {
  const db = new MemoryDb();
  const save = collaborationWriter(db);
  await save(collaborationInput(db));
  db.tables.housing_collaborations[0].status = "ended";
  const second = await save({ ...collaborationInput(db), quoteId: QB });
  assert.equal(db.tables.housing_collaborations.length, 2);
  assert.equal(db.tables.housing_collaborations[0].status, "ended");
  assert.equal(second.quote_id, QB);
});

test("acceptance helper never erases existing references when optional inputs are missing", async () => {
  const db = new MemoryDb();
  const save = collaborationWriter(db);
  await save({ ...collaborationInput(db), missionId: "mission-kept", request: { id: R } });
  const previous = structuredClone(db.tables.housing_collaborations);
  const result = await save({ ...collaborationInput(db), missionId: null, request: null });
  assert.equal(result.id, previous[0].id);
  assert.deepEqual(db.tables.housing_collaborations, previous);
});

test("concurrent helper calls converge on the same collaboration", async () => {
  const db = new MemoryDb();
  const save = collaborationWriter(db);
  const results = await Promise.all([save(collaborationInput(db)), save(collaborationInput(db))]);
  assert.equal(db.tables.housing_collaborations.length, 1);
  assert.equal(results[0].id, results[1].id);
});

test("real Supabase client sends atomic ignore-duplicates and re-reads the existing quote binding", async () => {
  const requests: Array<{ url: string; method: string }> = [];
  const existing = { id: "existing", status: "active", handover_status: "ready" };
  const db = createClient("https://local-test.invalid", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      requests.push({ url: url.pathname, method: init?.method ?? "GET" });
      if (init?.method === "POST") {
        assert.equal(url.searchParams.get("on_conflict"), "quote_id");
        assert.match(new Headers(init.headers).get("Prefer") ?? "", /resolution=ignore-duplicates/);
        assert.equal(JSON.parse(String(init.body)).status, "pending_handover");
        return new Response(null, { status: 201 });
      }
      assert.equal(url.searchParams.get("quote_id"), `eq.${Q}`);
      return Response.json(existing);
    } },
  });
  const result = await collaborationWriter(new MemoryDb())(collaborationInput(db));
  assert.deepEqual(result, existing);
  assert.deepEqual(requests.map(r => r.method), ["POST", "GET"]);
  assert.ok(requests.every(r => r.url === "/rest/v1/housing_collaborations"));
});

test("shared writer independently refuses a foreign concierge", async () => {
  const { load, db } = setup("accept");
  const shared = load("@/app/api/profiles/housing/shared");
  await assert.rejects((shared.createHousingFromQuote as (q: string, c: string) => Promise<unknown>)(Q, OTHER), /concierge/);
  assert.equal(db.writes.length, 0);
});

test("shared writer refuses a concurrent change of housing ownership", async () => {
  const { load, db } = setup("accept");
  db.beforeHousingUpdate = () => { asRow(db.tables.housing[0].proprietaire).owner_profile_id = OTHER; };
  const shared = load("@/app/api/profiles/housing/shared");
  await assert.rejects((shared.createHousingFromQuote as (q: string, c: string) => Promise<unknown>)(Q, CONCIERGE), /changé/);
  assert.equal(asRow(db.tables.housing[0].proprietaire).owner_profile_id, OTHER);
  assert.deepEqual(db.tables.housing[0].contrat, {});
});
