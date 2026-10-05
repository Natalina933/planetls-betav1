import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

type Row = Record<string, unknown>;
const root = fileURLToPath(new URL("../../", import.meta.url));
const nodeRequire = createRequire(import.meta.url);

const OWNER = "11111111-1111-4111-8111-111111111111";
const CONCIERGE = "22222222-2222-4222-8222-222222222222"; // Sophie : pro sélectionné sur ce séjour
const MAIN_CONCIERGE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"; // Christa : conciergerie principale du séjour
const OTHER = "33333333-3333-4333-8333-333333333333";
const Q = "44444444-4444-4444-8444-444444444444";
const R = "55555555-5555-4555-8555-555555555555";
const RECIPIENT = "66666666-6666-4666-8666-666666666666";
const PROPERTY = "77777777-7777-4777-8777-777777777777";
const RES = "99999999-9999-4999-8999-999999999999";
const asRow = (v: unknown) => v as Row;

class MemoryDb {
  tables: Record<string, Row[]> = {};
  writes: Array<{ table: string; operation: string }> = [];

  constructor(stayScoped: boolean) {
    this.tables = {
      quotes: [{
        id: Q, owner_profile_id: OWNER, concierge_profile_id: CONCIERGE,
        service_request_id: R, service_request_recipient_id: RECIPIENT,
        status: "sent", quote_number: "DV-1", total_amount: 30, currency: "EUR",
        metadata: {}, mission_id: null,
      }],
      service_requests: [{
        id: R, owner_profile_id: OWNER, title: "Linge pour le séjour",
        metadata: { property_housing_id: "42" }, status: "sent",
        ...(stayScoped ? { reservation_id: RES, stay_need: "linen" } : {}),
      }],
      service_request_recipients: [{ id: RECIPIENT, service_request_id: R, concierge_profile_id: CONCIERGE, status: "quoted" }],
      quote_items: [{ id: "item", quote_id: Q, label: "Linge", quantity: 1, unit_price: 30, line_total: 30, sort_order: 1 }],
      reservations: [{
        id: RES, owner_profile_id: OWNER, concierge_profile_id: MAIN_CONCIERGE,
        property_id: null, check_in_at: "2026-11-01T15:00:00.000Z",
        check_out_at: "2026-11-08T10:00:00.000Z", metadata: {},
      }],
      housing: [{ id: 42, proprietaire: { owner_profile_id: OWNER, manager_profile_id: CONCIERGE }, contrat: {} }],
      profiles: [
        { id: OWNER, role: "owner" },
        { id: CONCIERGE, role: "concierge" },
      ],
      properties: [{ id: PROPERTY, owner_id: OWNER }],
      missions: [], invoices: [], invoice_items: [], mission_events: [],
      housing_collaborations: [], quote_events: [], workflow_events: [],
      contact_conversations: [],
    };
  }

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
    Object.assign(r, {
      status: "quote_accepted", selected_concierge_profile_id: q.concierge_profile_id,
      metadata: { ...metadata, selected_quote_id: q.id, selected_recipient_id: recipientId },
    });
    for (const other of this.tables.quotes) {
      if ((other.service_request_id ?? asRow(other.metadata).service_request_id) !== requestId) continue;
      if (other.id === q.id) Object.assign(other, { status: "accepted", accepted_at: "2026-10-05" });
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

/** Execute actual route/helper sources. Only transport/auth/database are replaced. */
function modules(db: MemoryDb) {
  const cache = new Map<string, { exports: Row }>();
  const load = (name: string, parent = path.join(root, "src")): Row => {
    if (name === "next/server") return { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } };
    if (["@/app/lib/dbServer", "@/server/db/dbServer"].includes(name)) return { db };
    if (name === "@/server/auth/roleGuards") return {
      requireApiRole: async () => ({ ok: true, auth: { userId: OWNER, role: "owner", isAdmin: false } }),
    };
    if (name === "@/app/lib/apiAuth") return {
      getApiAuthContext: async () => ({ userId: OWNER, role: "owner" }),
    };
    if (!name.startsWith(".") && !name.startsWith("@/") && !path.isAbsolute(name) && !/^[a-zA-Z]:[\\/]/.test(name)) {
      return nodeRequire(name);
    }
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

type Handler = (
  req: { json: () => Promise<Row> },
  context?: { params: Promise<{ id: string }> },
) => Promise<Response>;

function setup(kind: "accept" | "select" | "create", options: { stayScoped: boolean } = { stayScoped: true }) {
  const db = new MemoryDb(options.stayScoped);
  const load = modules(db);
  const route = load(
    kind === "accept"
      ? "@/app/api/quotes/[id]/status/route"
      : kind === "select"
        ? "@/app/api/service-requests/[id]/select/route"
        : "@/app/api/service-requests/route",
  );
  const call = (body?: Row) =>
    kind === "accept"
      ? (route.PATCH as Handler)({ json: async () => body ?? { status: "accepted" } }, { params: Promise.resolve({ id: Q }) })
      : kind === "select"
        ? (route.POST as Handler)(
            { json: async () => body ?? { recipient_id: RECIPIENT, quote_id: Q } },
            { params: Promise.resolve({ id: R }) },
          )
        : (route.POST as Handler)({ json: async () => body ?? {} });
  return { db, load, call };
}

function assertStayMissionLinked(db: MemoryDb) {
  assert.equal(db.tables.missions.length, 1);
  const mission = asRow(db.tables.missions[0]);
  assert.equal(mission.reservation_id, RES);
  assert.equal(mission.concierge_profile_id, CONCIERGE);
  const metadata = asRow(mission.metadata);
  assert.equal(metadata.service_request_id, R);
  assert.equal(metadata.quote_id, Q);
  assert.equal(metadata.stay_need, "linen");
  assert.equal(metadata.reservation_id, RES);
  // Christa (conciergerie principale) reste responsable du séjour.
  assert.equal(asRow(db.tables.reservations[0]).concierge_profile_id, MAIN_CONCIERGE);
  // Liaisons demande <-> devis <-> mission.
  assert.equal(asRow(db.tables.quotes[0]).mission_id, mission.id);
  assert.equal(asRow(db.tables.service_requests[0]).mission_id, mission.id);
}

function assertNoHousingEffects(db: MemoryDb) {
  assert.equal(db.tables.housing_collaborations.length, 0);
  assert.equal(db.writes.filter((write) => write.table === "housing").length, 0);
  assert.equal(db.writes.filter((write) => write.table === "housing_collaborations").length, 0);
  assert.deepEqual(db.tables.housing, [{
    id: 42, proprietaire: { owner_profile_id: OWNER, manager_profile_id: CONCIERGE }, contrat: {},
  }]);
}

test("accept: stay request creates one mission linked to the reservation, without housing effects", async () => {
  const { db, call } = setup("accept");
  const response = await call();
  assert.equal(response.status, 200);
  assertStayMissionLinked(db);
  assertNoHousingEffects(db);
  assert.equal(db.tables.invoices.length, 1);
  assert.ok(db.tables.mission_events.length > 0);
  const body = await response.json() as Row;
  assert.equal(body.auto_housing, null);
  assert.equal(asRow(db.tables.service_requests[0]).status, "quote_accepted");
  // Cas 1 : aucune collaboration durable => aucune action « finaliser le contrat ».
  const stayWorkflow = asRow(body.accepted_workflow);
  assert.equal(stayWorkflow.collaboration_id, null);
  assert.equal(stayWorkflow.collaboration_kind, null);
  const stayCompleted = asRow(body.completed_action);
  assert.equal(stayCompleted.next_action, null);
  assert.equal(stayCompleted.next_href, null);
  assert.equal(asRow(db.tables.service_requests[0]).selected_concierge_profile_id, CONCIERGE);
});

test("accept: retrying the stay acceptance is idempotent", async () => {
  const { db, call } = setup("accept");
  assert.equal((await call()).status, 200);
  const mission = structuredClone(db.tables.missions);
  const invoice = structuredClone(db.tables.invoices);
  assert.equal((await call()).status, 200);
  assert.equal((await call()).status, 200);
  assert.deepEqual(db.tables.missions, mission);
  assert.deepEqual(db.tables.invoices, invoice);
  assertNoHousingEffects(db);
});

test("select: stay request creates the stay mission only, never a collaboration", async () => {
  const { db, call } = setup("select");
  const response = await call();
  assert.equal(response.status, 200);
  assertStayMissionLinked(db);
  assertNoHousingEffects(db);
  assert.equal(db.tables.invoices.length, 1);
  const body = await response.json() as Row;
  assert.equal(body.auto_housing, null);
  // Cas 1 (select) : aucune collaboration durable, aucune action de finalisation de contrat.
  const stayWorkflow = asRow(body.accepted_workflow);
  assert.equal(stayWorkflow.collaboration_id, null);
  assert.equal(stayWorkflow.collaboration_kind, null);
  const stayCompleted = asRow(body.completed_action);
  assert.equal(stayCompleted.next_action, null);
  assert.equal(stayCompleted.next_href, null);
});

test("classic request keeps the housing attachment and collaboration behavior", async () => {
  const { db, call } = setup("accept", { stayScoped: false });
  const response = await call();
  assert.equal(response.status, 200);
  assert.equal(db.tables.missions.length, 1);
  assert.equal(asRow(db.tables.missions[0]).reservation_id, undefined);
  assert.equal(asRow(asRow(db.tables.missions[0]).metadata).stay_need, undefined);
  assert.equal(db.tables.housing_collaborations.length, 1);
  assert.equal(asRow(db.tables.housing[0].proprietaire).manager_profile_id, CONCIERGE);
  const body = await response.json() as Row;
  assert.ok(asRow(body.auto_housing).housingId);
  // Cas 2 : la demande classique conserve son next_action historique.
  const classicCompleted = asRow(body.completed_action);
  assert.equal(typeof classicCompleted.next_action, "string");
  assert.ok(String(classicCompleted.next_action).trim().length > 0);
  assert.notEqual(asRow(body.accepted_workflow).collaboration_kind, null);
});

test("create: stay context is validated, persisted and explicit on the request", async () => {
  const { db, call } = setup("create");
  const response = await call({
    title: "Linge pour le séjour",
    reservation_id: RES,
    stay_need: "Linge",
    property_id: PROPERTY,
    requested_services: ["Linge"],
    recipient_ids: [CONCIERGE],
  });
  assert.equal(response.status, 201);
  const created = asRow(db.tables.service_requests.find((row) => row.id !== R) ?? null);
  assert.equal(created.reservation_id, RES);
  assert.equal(created.stay_need, "linen");
  assert.equal(created.property_id, PROPERTY);
  assert.equal(created.owner_profile_id, OWNER);
});

test("create: a reservation owned by another profile is refused before any write", async () => {
  const { db, call } = setup("create");
  asRow(db.tables.reservations[0]).owner_profile_id = OTHER;
  const before = structuredClone(db.tables);
  const response = await call({
    title: "Linge pour le séjour",
    reservation_id: RES,
    stay_need: "linen",
    recipient_ids: [CONCIERGE],
  });
  assert.equal(response.status, 403);
  assert.equal(db.writes.length, 0);
  assert.deepEqual(db.tables, before);
});

test("create: an unknown or missing stay need is refused before any write", async () => {
  const { db, call } = setup("create");
  const before = structuredClone(db.tables);
  const invalid = await call({
    title: "Linge pour le séjour",
    reservation_id: RES,
    stay_need: "valet",
    recipient_ids: [CONCIERGE],
  });
  assert.equal(invalid.status, 400);
  const missing = await call({
    title: "Linge pour le séjour",
    reservation_id: RES,
    recipient_ids: [CONCIERGE],
  });
  assert.equal(missing.status, 400);
  assert.equal(db.writes.length, 0);
  assert.deepEqual(db.tables, before);
});
