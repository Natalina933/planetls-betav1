import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { finalizeAcceptedQuoteWorkflow } from "../app/api/_shared/acceptedQuoteWorkflow.ts";
import { upsertAcceptedHousingCollaboration } from "../app/api/_shared/housingCollaboration.ts";
import { addCollaborationIntervention } from "../app/api/_shared/collaborationInterventions.ts";
import { requestCollaborationTermination } from "../app/api/_shared/collaborationTermination.ts";
import type { LooseSupabaseClient } from "../app/api/_shared/untypedSupabase.ts";

type Row = Record<string, any>;
const owner = "11111111-1111-4111-8111-111111111111";
const concierge = "22222222-2222-4222-8222-222222222222";
const third = "33333333-3333-4333-8333-333333333333";
const qid = "44444444-4444-4444-8444-444444444444";
const rid = "55555555-5555-4555-8555-555555555555";
const cid = "66666666-6666-4666-8666-666666666666";
const stay = "77777777-7777-4777-8777-777777777777";
const services = ["guest_checkin_checkout", "cleaning_turnover", "linen_change"];

// Transport-only double: PK conflicts and failure recovery, never PostgreSQL/RLS proof.
class Memory {
  tables: Record<string, Row[]>;
  fail: { table: string; op: string; after?: number } | null = null;
  constructor(continuous = false) {
    this.tables = {
      quotes: [{ id: qid, status: "accepted", owner_profile_id: owner, concierge_profile_id: concierge,
        service_request_id: rid, currency: "EUR", total_amount: 120, metadata: {} }],
      service_requests: [{ id: rid, owner_profile_id: owner, title: "Services convenus", requested_services: services,
        desired_date: continuous ? null : "2026-11-12T15:00:00Z", reservation_id: continuous ? null : stay,
        metadata: { selected_quote_id: qid, continuous_collaboration: continuous,
          service_modalities: { guest_checkin_checkout: "arrival_departure" } } }],
      quote_items: ["guest_checkin", "guest_checkout", "cleaning_turnover", "linen_change"].map((slug, i) => ({
        id: `item-${i}`, quote_id: qid, label: slug, quantity: 1, unit_price: 30, line_total: 30, sort_order: i,
        metadata: { requested_service_slug: slug } })),
      reservations: [{ id: stay, owner_profile_id: owner, concierge_profile_id: concierge, property_id: "42",
        check_in_at: "2026-11-12T15:00:00Z", check_out_at: "2026-11-19T10:00:00Z",
        metadata: { property_housing_id: "42", requested_actions: ["checkin", "checkout", "cleaning", "linen"] } }],
      housing: [{ id: 42, proprietaire: { owner_profile_id: owner } }],
      housing_collaborations: [], missions: [], invoices: [], invoice_items: [], mission_events: [],
      services_contracts: [], services_contract_versions: [],
    };
  }
  from(table: string) { return new Query(this, table); }
  client() { return this as unknown as LooseSupabaseClient; }
}
class Query {
  filters: Array<(row: Row) => boolean> = [];
  op = "read"; values: Row[] = []; options: Row = {}; count = Infinity;
  db: Memory; table: string;
  constructor(db: Memory, table: string) { this.db = db; this.table = table; }
  select() { return this; }
  eq(key: string, value: unknown) { this.filters.push(row => row[key] === value); return this; }
  in(key: string, values: unknown[]) { this.filters.push(row => values.includes(row[key])); return this; }
  contains(key: string, value: Row) { this.filters.push(row => Object.entries(value).every(([k, v]) => row[key]?.[k] === v)); return this; }
  order() { return this; }
  limit(count: number) { this.count = count; return this; }
  range(_start: number, end: number) { this.count = end + 1; return this; }
  insert(value: Row | Row[]) { this.op = "insert"; this.values = Array.isArray(value) ? value : [value]; return this; }
  upsert(value: Row | Row[], options: Row) { this.insert(value); this.op = "upsert"; this.options = options; return this; }
  update(value: Row) { this.op = "update"; this.values = [value]; return this; }
  async result(single = false) {
    const fail = this.db.fail;
    if (fail?.table === this.table && fail.op === this.op) {
      if (!fail.after) { this.db.fail = null; return { data: null, error: { code: "fixture", message: "Injected failure" } }; }
      fail.after--;
    }
    const table = this.db.tables[this.table] ??= [];
    let rows = table.filter(row => this.filters.every(filter => filter(row))).slice(0, this.count);
    if (["insert", "upsert"].includes(this.op)) {
      const key = this.options.onConflict ?? "id";
      if (this.op === "insert" && this.values.some(value => value.id && table.some(row => row.id === value.id))) {
        return { data: null, error: { code: "23505", message: "PK fixture" } };
      }
      rows = this.values.map(value => {
        const existing = table.find(row => row[key] && row[key] === value[key]);
        if (existing) return existing;
        const row = { id: this.table === "housing_collaborations" ? cid : `fixture-${table.length}`, ...structuredClone(value) };
        table.push(row); return row;
      });
    } else if (this.op === "update") rows.forEach(row => Object.assign(row, structuredClone(this.values[0])));
    return { data: structuredClone(single ? rows[0] ?? null : rows), error: null };
  }
  single() { return this.result(true); }
  maybeSingle() { return this.result(true); }
  then(resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) { return this.result().then(resolve, reject); }
}
const finalize = (db: Memory, actorId = owner) => finalizeAcceptedQuoteWorkflow({ db: db.client(), quoteId: qid, actorProfileId: actorId });
async function activate(db: Memory) {
  const result = await finalize(db);
  assert.equal(result.continuous, true);
  return upsertAcceptedHousingCollaboration({ db: db.client(), housingId: 42, ownerProfileId: owner,
    conciergeProfileId: concierge, quoteId: qid, request: db.tables.service_requests[0] });
}
const order = (overrides: Row = {}) => ({ collaborationId: cid, actorId: owner,
  operationId: "88888888-8888-4888-8888-888888888888", serviceSlug: "linen_change",
  start: "2026-11-19T12:00:00Z", end: "2026-11-19T13:00:00Z", ...overrides });

test("continu : activation sans dates, sans mission ni facture, périmètre complet et reprise sans réactivation", async () => {
  const db = new Memory(true);
  await activate(db); await activate(db);
  assert.equal(db.tables.housing_collaborations.length, 1);
  const collaboration = db.tables.housing_collaborations[0];
  assert.equal(collaboration.status, "active");
  assert.equal(collaboration.starts_on, null); assert.equal(collaboration.ends_on, null);
  assert.deepEqual(collaboration.scope.operational_service_slugs, ["guest_checkin", "guest_checkout", "cleaning_turnover", "linen_change"]);
  assert.equal(db.tables.missions.length, 0); assert.equal(db.tables.invoices.length, 0);
  collaboration.status = "ended";
  await activate(db);
  assert.equal(collaboration.status, "ended");
});

test("ponctuel mixte : quatre interventions, arrivée et départ datés distincts, un devis et une facture", async () => {
  const db = new Memory();
  const result = await finalize(db);
  assert.equal(result.missions.length, 4);
  assert.deepEqual(db.tables.missions.map(m => m.metadata.operational_service_slug), ["guest_checkin", "guest_checkout", "cleaning_turnover", "linen_change"]);
  assert.equal(result.missions[0].scheduled_start, "2026-11-12T15:00:00Z");
  assert.equal(result.missions[1].scheduled_start, "2026-11-19T10:00:00Z");
  assert.ok(db.tables.missions.every(m => m.concierge_profile_id === concierge && m.reservation_id === stay));
  await finalize(db);
  assert.equal(db.tables.missions.length, 4); assert.equal(db.tables.invoices.length, 1);
  assert.equal(db.tables.invoice_items.length, 4); assert.equal(db.tables.mission_events.length, 4);
});

test("reprise après seconde intervention manquante et après lignes de facture manquantes", async () => {
  for (const failure of [{ table: "missions", op: "insert", after: 1 }, { table: "invoice_items", op: "upsert" },
    { table: "service_requests", op: "update" }, { table: "mission_events", op: "upsert" }]) {
    const db = new Memory(); db.fail = failure;
    await assert.rejects(finalize(db));
    const ids = db.tables.missions.map(m => m.id), invoiceId = db.tables.invoices[0]?.id;
    await finalize(db); await finalize(db);
    assert.equal(db.tables.missions.length, 4); assert.equal(db.tables.invoices.length, 1);
    assert.equal(db.tables.invoice_items.length, 4); assert.equal(db.tables.mission_events.length, 4);
    assert.ok(ids.every(id => db.tables.missions.some(m => m.id === id)));
    if (invoiceId) assert.equal(db.tables.invoices[0].id, invoiceId);
  }
});

test("attributions concurrentes simulées : PK stables sans doublons", async () => {
  const db = new Memory();
  await Promise.all([finalize(db), finalize(db)]);
  assert.equal(db.tables.missions.length, 4); assert.equal(db.tables.invoices.length, 1);
  assert.equal(db.tables.invoice_items.length, 4); assert.equal(db.tables.mission_events.length, 4);
});

test("identifiants historiques de mission, facture et lignes conservés", async () => {
  const db = new Memory();
  db.tables.missions.push({ id: "legacy-mission", owner_profile_id: owner, concierge_profile_id: concierge,
    metadata: { quote_id: qid, operational_service_slug: "guest_checkin" } });
  db.tables.quotes[0].mission_id = "legacy-mission";
  db.tables.invoices.push({ id: "legacy-invoice", quote_id: qid, status: "draft" });
  db.tables.invoice_items.push({ id: "legacy-line", invoice_id: "legacy-invoice", sort_order: 0 });
  await finalize(db);
  assert.equal(db.tables.missions.length, 4); assert.equal(db.tables.quotes[0].mission_id, "legacy-mission");
  assert.equal(db.tables.invoices[0].id, "legacy-invoice"); assert.equal(db.tables.invoice_items[0].id, "legacy-line");
  assert.equal(db.tables.invoice_items.length, 4);
});

test("ajout progressif : dates connues, périmètre et reprise contrôlés, aucune facture", async () => {
  const db = new Memory(true); await activate(db);
  const first = await addCollaborationIntervention(db.client(), order());
  const second = await addCollaborationIntervention(db.client(), order());
  assert.equal(first.id, second.id); assert.equal(db.tables.missions.length, 1);
  assert.equal(first.metadata.collaboration_id, cid); assert.equal(first.metadata.property_housing_id, 42);
  assert.equal(db.tables.invoices.length, 0);
  await assert.rejects(addCollaborationIntervention(db.client(), order({ serviceSlug: "guest_checkout" })), /clé de reprise/);
  await assert.rejects(addCollaborationIntervention(db.client(), order({ serviceSlug: "cleaning_standard" })), /périmètre/);
  await assert.rejects(addCollaborationIntervention(db.client(), order({ actorId: third })), /introuvable/);
  await assert.rejects(addCollaborationIntervention(db.client(), order({ end: "invalid" })), /dates/);
});

test("résiliation : participants autorisés, tiers refusé, préavis enregistré et historique intact", async () => {
  for (const actor of [owner, concierge]) {
    const db = new Memory(true); await activate(db); await addCollaborationIntervention(db.client(), order());
    db.tables.invoices.push({ id: "historical-invoice", status: "paid" });
    const history = structuredClone({ missions: db.tables.missions, invoices: db.tables.invoices });
    assert.equal((await requestCollaborationTermination(db.client(), cid, third)).status, 404);
    const result = await requestCollaborationTermination(db.client(), cid, actor);
    assert.equal(result.status, 202); assert.equal(result.collaboration_status, "active");
    const termination = result.termination_request as Row;
    assert.equal(termination.notice_days, 30);
    assert.ok(termination.effective_date);
    assert.equal(termination.requested_by, actor);
    assert.deepEqual({ missions: db.tables.missions, invoices: db.tables.invoices }, history);
    db.tables.housing_collaborations[0].status = "ended";
    await assert.rejects(addCollaborationIntervention(db.client(), order({ operationId: "new" })), /pas active/);
    assert.deepEqual({ missions: db.tables.missions, invoices: db.tables.invoices }, history);
  }
});

const root = fileURLToPath(new URL("../../", import.meta.url));
const native = createRequire(import.meta.url);
function loader(db: Memory, actor = owner, role = "owner") {
  const cache = new Map<string, Row>();
  const load = (name: string, parent = path.join(root, "src")): Row => {
    if (name === "next/server") return { NextResponse: { json: (data: unknown, init?: ResponseInit) => Response.json(data, init) } };
    if (name === "@/app/lib/dbServer") return { db };
    if (name === "@/server/auth/roleGuards") return { requireApiRole: async (_req: unknown, roles: Set<string>) => roles.has(role)
      ? { ok: true, auth: { userId: actor, role } } : { ok: false, response: Response.json({}, { status: 403 }) } };
    if (!name.startsWith(".") && !name.startsWith("@/")) return native(name);
    let file = name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : path.resolve(parent, name);
    if (!existsSync(file)) file += ".ts";
    if (cache.has(file)) return cache.get(file)!;
    const exports: Row = {}; cache.set(file, exports);
    const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("require", "exports", "fetch", code)((dep: string) => load(dep, path.dirname(file)), exports,
      () => { throw new Error("Network forbidden"); });
    return exports;
  };
  return load;
}

test("séjour ultérieur : quatre interventions explicites et distinctes, reprise et refus inter-comptes/terminé", async () => {
  const db = new Memory(true); await activate(db);
  const helper = loader(db)("@/app/api/_shared/stayMissionAssignments");
  const reservation = db.tables.reservations[0];
  const assignments = ["checkin", "checkout", "cleaning", "linen"].map(need => ({ need, collaboration_id: cid }));
  const invoke = () => helper.createOrReuseStayMissions({ db: db.client(), reservation, body: { assignments } });
  assert.equal((await invoke()).ok, true); assert.equal((await invoke()).ok, true);
  assert.equal(db.tables.missions.length, 4);
  assert.notEqual(db.tables.missions[0].scheduled_start, db.tables.missions[1].scheduled_start);
  assert.ok(db.tables.missions.every(m => m.metadata.collaboration_id === cid));
  reservation.owner_profile_id = third; assert.equal((await invoke()).ok, false); reservation.owner_profile_id = owner;
  db.tables.housing_collaborations[0].status = "ended"; assert.equal((await invoke()).ok, false);
  assert.equal(db.tables.missions.length, 4);
});

test("routes opérationnelles : rôle concierge refusé pour commander, tiers refusé pour résilier", async () => {
  const db = new Memory(true); await activate(db);
  const req = { json: async () => ({ operation_id: order().operationId, service_slug: "linen_change", start: order().start, end: order().end }) };
  const context = { params: Promise.resolve({ id: cid }) };
  const forbidden = loader(db, concierge, "concierge")("@/app/api/housing-collaborations/[id]/interventions/route");
  assert.equal((await forbidden.POST(req, context)).status, 403);
  const authorized = loader(db)("@/app/api/housing-collaborations/[id]/interventions/route");
  assert.equal((await authorized.POST(req, context)).status, 201);
  const outsider = loader(db, third)("@/app/api/housing-collaborations/[id]/termination/route");
  const terminationReq = new Request("http://localhost/api/termination", { method: "POST" });
  assert.equal((await outsider.POST(terminationReq, context)).status, 404);
  const participant = loader(db, concierge, "concierge")("@/app/api/housing-collaborations/[id]/termination/route");
  assert.equal((await participant.POST(terminationReq, context)).status, 202);
});
