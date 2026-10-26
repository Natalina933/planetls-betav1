import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { PLANETLS_SERVICE_TARGET } from "../app/lib/planetlsServiceCatalogTarget.ts";

type Row = Record<string, any>;
const root = fileURLToPath(new URL("../../", import.meta.url));
const nativeRequire = createRequire(import.meta.url);
const OWNER = "11111111-1111-4111-8111-111111111111";
const A = "22222222-2222-4222-8222-222222222222";
const B = "33333333-3333-4333-8333-333333333333";
const REQUEST = "44444444-4444-4444-8444-444444444444";
const RA = "55555555-5555-4555-8555-555555555555";
const RB = "66666666-6666-4666-8666-666666666666";
const selections = ["guest_checkin_checkout", "cleaning_standard", "linen_change"];

class MemoryDb {
  tables: Record<string, Row[]> = {
    service_requests: [{ id: REQUEST, status: "sent", owner_profile_id: OWNER, requested_services: selections,
      title: "Demande isolée", desired_date: "2026-11-01T15:00:00Z", currency: "EUR",
      reservation_id: "77777777-7777-4777-8777-777777777777", stay_need: "cleaning",
      metadata: { service_modalities: { guest_checkin_checkout: "arrival_departure" } } }],
    service_request_recipients: [RA, RB].map((id, i) => ({ id, service_request_id: REQUEST,
      concierge_profile_id: i ? B : A, status: "sent", metadata: {} })),
    profiles: [OWNER, A, B].map(id => ({ id, first_name: "Fixture", last_name: "ISOLÉE", company_name: "Test" })),
    services_catalog: PLANETLS_SERVICE_TARGET.filter(entry => ["guest_checkin", "guest_checkout", "cleaning_standard", "linen_change"].includes(entry.slug))
      .map(entry => ({ id: entry.legacyId!, service: entry.label, category: entry.family, description: null })),
    services_pricing: [{ id: "price-a", profile_id: A, service_id: 1, label: "Tarif ménage", type: "fixed", amount: 50, unit: "prestation" }],
    quotes: [], quote_items: [], services_packages: [], contact_conversations: [], contact_messages: [], workflow_events: [], quote_events: [],
  };
  writes: string[] = [];
  failTable: string | null = null;
  failOnce: { table: string; op: string } | null = null;
  failFinalize = false;
  incompleteFinalize = false;
  from(table: string) { return new Query(this, table); }
  // Atomic RPC transport double, matching the existing SQL arbitration contract.
  // This is not a PostgreSQL concurrency/RLS test.
  async rpc(_name: string, input: Row) {
    const q = this.tables.quotes.find(row => row.id === input.p_quote_id);
    const r = this.tables.service_requests.find(row => row.id === q?.service_request_id);
    const recipient = this.tables.service_request_recipients.find(row => row.id === q?.service_request_recipient_id);
    if (!q || !r || r.owner_profile_id !== input.p_actor_id || q.owner_profile_id !== input.p_actor_id) {
      return { data: null, error: { code: "42501", message: "Forbidden fixture" } };
    }
    if (!recipient || recipient.service_request_id !== r.id || recipient.concierge_profile_id !== q.concierge_profile_id ||
      !["sent", "accepted"].includes(q.status) || (r.metadata.selected_quote_id && r.metadata.selected_quote_id !== q.id)) {
      return { data: null, error: { code: "40001", message: "Already awarded fixture" } };
    }
    if (r.metadata.selected_quote_id === q.id) return { data: structuredClone(r), error: null };
    Object.assign(r, { status: "quote_accepted", selected_concierge_profile_id: q.concierge_profile_id,
      metadata: { ...r.metadata, selected_quote_id: q.id, selected_recipient_id: recipient.id } });
    for (const other of this.tables.quotes) if (other.service_request_id === r.id) other.status = other.id === q.id ? "accepted" : "not_selected";
    for (const row of this.tables.service_request_recipients) if (row.service_request_id === r.id) row.status = row.id === recipient.id ? "selected" : "not_selected";
    this.tables.quote_events.push({ quote_id: q.id, event_type: "accepted" });
    return { data: structuredClone(r), error: null };
  }
}

class Query {
  filters: Array<(row: Row) => boolean> = [];
  op = "read"; payload: Row | Row[] = {}; count = Infinity;
  private db: MemoryDb;
  private table: string;
  constructor(db: MemoryDb, table: string) { this.db = db; this.table = table; }
  select() { return this; }
  eq(key: string, value: unknown) { this.filters.push(row => row[key] === value); return this; }
  neq(key: string, value: unknown) { this.filters.push(row => row[key] !== value); return this; }
  is(key: string, value: unknown) { this.filters.push(row => (row[key] ?? null) === value); return this; }
  in(key: string, values: unknown[]) { this.filters.push(row => values.includes(row[key])); return this; }
  contains(key: string, value: Row) { this.filters.push(row => Object.entries(value).every(([k, v]) => row[key]?.[k] === v)); return this; }
  order() { return this; }
  limit(count: number) { this.count = count; return this; }
  insert(value: Row | Row[]) { this.op = "insert"; this.payload = value; return this; }
  update(value: Row) { this.op = "update"; this.payload = value; return this; }
  delete() { this.op = "delete"; return this; }
  async result(single = false) {
    if (this.db.failOnce?.table === this.table && this.db.failOnce.op === this.op) {
      this.db.failOnce = null;
      return { data: null, error: { code: "fixture", message: "One isolated failure" } };
    }
    if (this.db.failTable === this.table) return { data: null, error: { code: "fixture", message: "Isolated failure" } };
    const rows = this.db.tables[this.table] ??= [];
    let selected = rows.filter(row => this.filters.every(filter => filter(row))).slice(0, this.count);
    if (this.op !== "read") this.db.writes.push(`${this.table}:${this.op}`);
    if (this.op === "insert") {
      const values = Array.isArray(this.payload) ? this.payload : [this.payload];
      if (values.some(value => value.id && rows.some(row => row.id === value.id))) return { data: null, error: { code: "23505", message: "Duplicate fixture PK" } };
      selected = values.map((value, index) => ({ id: `${this.table}-${rows.length + index}`, ...structuredClone(value) }));
      rows.push(...selected);
    } else if (this.op === "update") selected.forEach(row => Object.assign(row, structuredClone(this.payload)));
    else if (this.op === "delete") this.db.tables[this.table] = rows.filter(row => !selected.includes(row));
    return { data: structuredClone(single ? selected[0] ?? null : selected), error: null };
  }
  single() { return this.result(true); }
  maybeSingle() { return this.result(true); }
  then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) { return this.result().then(resolve, reject); }
}

function harness(db = new MemoryDb(), actor = A, role = "concierge") {
  const cache = new Map<string, Row>();
  const load = (name: string, parent = path.join(root, "src")): Row => {
    if (name === "next/server") return { NextResponse: { json: (value: unknown, init?: ResponseInit) => Response.json(value, init) } };
    if (["@/app/lib/dbServer", "@/server/db/dbServer"].includes(name)) return { db };
    if (["@/app/lib/apiAuth", "@/server/auth/apiAuth"].includes(name)) return { getApiAuthContext: async () => ({ userId: actor, role }) };
    if (name === "@/server/auth/roleGuards") return { requireApiRole: async (_req: unknown, allowed: Set<string>) =>
      allowed.has(role) ? { ok: true, auth: { userId: actor, role } } : { ok: false, response: Response.json({}, { status: 403 }) } };
    let file = name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : path.resolve(parent, name);
    if (!name.startsWith("@/") && !name.startsWith(".")) return nativeRequire(name);
    if (!existsSync(file)) file += ".ts";
    const previous = cache.get(file); if (previous) return previous;
    const exports: Row = {}; cache.set(file, exports);
    const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("require", "exports", "fetch", code)((dep: string) => load(dep, path.dirname(file)), exports,
      () => { throw new Error("Network forbidden in commercial tests"); });
    if (file.endsWith(`${path.sep}acceptedQuoteWorkflow.ts`)) exports.finalizeAcceptedQuoteWorkflow = async () => {
      if (db.failFinalize) throw new Error("Isolated post-award failure");
      if (db.incompleteFinalize) return { mission: null, missions: [], invoice: null };
      return { mission: { id: "existing-fixture-mission", status: "planned" }, missions: [], invoice: { id: "existing-fixture-invoice" } };
    };
    return exports;
  };
  const call = async (route: string, method: string, body: Row = {}, id = RA) => {
    const handlers = load(`@/app/api/${route}/route`);
    return handlers[method]({ url: `http://localhost/api/${route}?view=concierge`, json: async () => body }, { params: Promise.resolve({ id }) }) as Promise<Response>;
  };
  return { db, call };
}

test("réception : chaque destinataire retrouve une seule invitation, un tiers n'en reçoit aucune", async () => {
  const db = new MemoryDb();
  for (const [actor, expected] of [[A, RA], [B, RB], [OWNER, null]] as const) {
    const response = await harness(db, actor).call("service-requests", "GET");
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload.items.map((row: Row) => row.recipient_id), expected ? [expected] : []);
    if (expected) assert.deepEqual(payload.items[0].requested_services, selections);
  }
});

test("réponses : destinataire autorisé, tiers refusé, refus définitif non réactivable", async () => {
  const { db, call } = harness();
  assert.equal((await harness(db, B).call("service-request-recipients/[id]/respond", "POST", { status: "interested" })).status, 404);
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "interested", response_message: "Disponible" })).status, 200);
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "declined", response_message: "Indisponible" })).status, 200);
  const messages = db.tables.contact_messages.length;
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "declined", response_message: "Indisponible" })).status, 200);
  assert.equal(db.tables.contact_messages.length, messages);
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "interested" })).status, 409);
  assert.equal(db.tables.service_request_recipients[0].metadata.response_history.length, 2);
});

test("brouillons indépendants : toutes les prestations, modalités et dates ; répétition sans doublon", async () => {
  const { db, call } = harness();
  const first = await call("service-request-recipients/[id]/prepare-quote", "POST");
  assert.equal(first.status, 201);
  const second = await harness(db, B).call("service-request-recipients/[id]/prepare-quote", "POST", {}, RB);
  assert.equal(second.status, 201);
  assert.equal((await call("service-request-recipients/[id]/prepare-quote", "POST")).status, 200);
  assert.equal(db.tables.quotes.length, 2);
  for (const quote of db.tables.quotes) {
    assert.equal(quote.valid_until, "2026-11-01T15:00:00Z");
    const items = db.tables.quote_items.filter(row => row.quote_id === quote.id);
    assert.deepEqual(items.map(row => row.metadata.requested_service_slug), ["guest_checkin", "guest_checkout", "cleaning_standard", "linen_change"]);
  }
});

test("brouillons concurrents : même clé primaire, un seul devis persistant", async () => {
  const { db, call } = harness();
  const responses = await Promise.all([call("service-request-recipients/[id]/prepare-quote", "POST"), call("service-request-recipients/[id]/prepare-quote", "POST")]);
  assert.ok(responses.every(response => [200, 201, 409].includes(response.status)));
  assert.equal(db.tables.quotes.length, 1);
});

test("devis : tiers non invité et modification d'une proposition concurrente refusés", async () => {
  const { db, call } = harness();
  assert.equal((await harness(db, B).call("service-request-recipients/[id]/prepare-quote", "POST")).status, 404);
  const q = await (await call("service-request-recipients/[id]/prepare-quote", "POST")).json();
  assert.equal((await harness(db, B).call("quotes/[id]", "PATCH", { notes: "Tentative" }, q.quote.id)).status, 404);
});

test("envoi : tarif non résolu bloqué, saisie des tarifs et recalcul serveur avec remise/TVA", async () => {
  const { db, call } = harness();
  const q = await (await call("service-request-recipients/[id]/prepare-quote", "POST")).json();
  const id = q.quote.id;
  assert.equal((await call("quotes/[id]/status", "PATCH", { status: "sent" }, id)).status, 400);
  const items = db.tables.quote_items.map(row => ({ ...row, quantity: 2, unit_price: 10, line_total: 9999 }));
  assert.equal((await call("quotes/[id]", "PATCH", { items, discount_amount: 10, tax_rate: 20 }, id)).status, 200);
  assert.equal((await call("quotes/[id]/status", "PATCH", { status: "sent" }, id)).status, 200);
  assert.equal(db.tables.quotes[0].total_amount, 84);
  assert.equal((await call("quotes/[id]", "PATCH", { notes: "Après envoi" }, id)).status, 400);
});

async function sentQuotes(db: MemoryDb) {
  for (const [actor, recipient] of [[A, RA], [B, RB]]) {
    await harness(db, actor).call("service-request-recipients/[id]/prepare-quote", "POST", {}, recipient);
  }
  db.tables.quotes.forEach(row => row.status = "sent");
}

test("attribution : propriétaire légitime, deux sélections concurrentes, répétition du gagnant", async () => {
  const db = new MemoryDb(); await sentQuotes(db);
  const [qa, qb] = db.tables.quotes;
  const owner = harness(db, OWNER, "owner");
  assert.equal((await harness(db, A, "owner").call("service-requests/[id]/select", "POST", { quote_id: qa.id, recipient_id: RA }, REQUEST)).status, 404);
  const responses = await Promise.all([
    owner.call("service-requests/[id]/select", "POST", { quote_id: qa.id, recipient_id: RA }, REQUEST),
    owner.call("service-requests/[id]/select", "POST", { quote_id: qb.id, recipient_id: RB }, REQUEST),
  ]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
  assert.equal(db.tables.quotes.filter(row => row.status === "accepted").length, 1);
  assert.equal((await owner.call("service-requests/[id]/select", "POST", { quote_id: qa.id, recipient_id: RA }, REQUEST)).status, 200);
  assert.equal(db.tables.quote_events.filter(row => row.event_type === "accepted").length, 1);
  assert.equal((await harness(db, B).call("service-request-recipients/[id]/respond", "POST", { status: "interested" }, RB)).status, 409);
  assert.equal((await harness(db, B).call("quotes/[id]", "PATCH", { notes: "Réactiver" }, qb.id)).status, 409);
});

test("erreur après attribution : gagnant conservé et blocage de reprise explicite", async () => {
  const db = new MemoryDb(); await sentQuotes(db); db.failFinalize = true;
  const qa = db.tables.quotes[0];
  const response = await harness(db, OWNER, "owner").call("service-requests/[id]/select", "POST", { quote_id: qa.id, recipient_id: RA }, REQUEST);
  assert.equal(response.status, 500);
  const payload = await response.json();
  assert.equal(payload.code, "POST_AWARD_WORKFLOW_PENDING");
  assert.equal(payload.selection_persisted, true);
  assert.equal(db.tables.service_requests[0].metadata.selected_quote_id, qa.id);
});

test("SQL existant : verrou demande puis devis, gagnant conservé et RPC non publique", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20260920140000_service_request_quote_award.sql", import.meta.url), "utf8");
  assert.match(sql, /service_requests WHERE id = request_id FOR UPDATE/);
  assert.match(sql, /quotes WHERE id = p_quote_id FOR UPDATE/);
  assert.match(sql, /winner = q.id::text AND q.status = 'accepted' THEN RETURN/);
  assert.match(sql, /REVOKE ALL.*award_service_request_quote/);
});

test("précisions et date proposée : historique conservé après consultation et rechargement", async () => {
  const { db, call } = harness();
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "information_requested", response_message: "Combien de couchages ?" })).status, 200);
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "date_proposed", proposed_date: "2026-11-03T10:00:00Z" })).status, 200);
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "viewed" })).status, 200);
  assert.equal(db.tables.service_request_recipients[0].status, "date_proposed");
  assert.equal(db.tables.service_request_recipients[0].proposed_date, "2026-11-03T10:00:00Z");
  assert.equal(db.tables.service_request_recipients[0].metadata.response_history.length, 2);
  const payload = await (await harness(db).call("service-requests", "GET")).json();
  assert.equal(payload.items[0].recipient_status, "date_proposed");
  assert.equal(payload.items[0].proposed_date, "2026-11-03T10:00:00Z");
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", { status: "date_proposed", proposed_date: "invalid" }, RB)).status, 404);
});

test("transmission partielle d'une réponse : état explicite, reprise sans doublon de message", async () => {
  const { db, call } = harness(); db.failTable = "contact_messages";
  const body = { status: "interested", response_message: "Disponible" };
  const first = await call("service-request-recipients/[id]/respond", "POST", body);
  assert.equal(first.status, 202);
  assert.equal((await first.json()).delivery_pending, true);
  db.failTable = null;
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", body)).status, 200);
  assert.equal((await call("service-request-recipients/[id]/respond", "POST", body)).status, 200);
  assert.equal(db.tables.contact_messages.length, 1);
  assert.equal(db.tables.service_request_recipients[0].metadata.response_history.length, 1);
});

test("envoi incomplet refusé même après suppression d'une ligne demandée", async () => {
  const { db, call } = harness();
  const q = await (await call("service-request-recipients/[id]/prepare-quote", "POST")).json();
  const items = db.tables.quote_items.slice(0, -1).map(row => ({ ...row, unit_price: 10 }));
  assert.equal((await call("quotes/[id]", "PATCH", { items }, q.quote.id)).status, 200);
  const response = await call("quotes/[id]/status", "PATCH", { status: "sent" }, q.quote.id);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, "MISSING_REQUESTED_SERVICES");
});

test("modification des notes seules : lignes, quantités, date et montants conservés", async () => {
  const { db, call } = harness();
  const q = await (await call("service-request-recipients/[id]/prepare-quote", "POST")).json();
  const before = structuredClone(db.tables.quote_items);
  assert.equal((await call("quotes/[id]", "PATCH", { notes: "Précision commerciale" }, q.quote.id)).status, 200);
  assert.deepEqual(db.tables.quote_items, before);
  assert.equal(db.tables.quotes[0].valid_until, "2026-11-01T15:00:00Z");
  assert.equal(db.tables.quotes[0].total_amount, 50);
});

test("autre route d'acceptation : décision du propriétaire et répétition sans nouvel événement commercial", async () => {
  const db = new MemoryDb(); await sentQuotes(db);
  const quote = db.tables.quotes[0];
  const owner = harness(db, OWNER, "owner");
  assert.equal((await harness(db).call("quotes/[id]/status", "PATCH", { status: "accepted" }, quote.id)).status, 403);
  assert.equal((await owner.call("quotes/[id]/status", "PATCH", { status: "accepted" }, quote.id)).status, 200);
  const events = db.tables.quote_events.length;
  const messages = db.tables.contact_messages.length;
  assert.equal((await owner.call("quotes/[id]/status", "PATCH", { status: "accepted" }, quote.id)).status, 200);
  assert.equal(db.tables.quote_events.length, events);
  assert.equal(db.tables.contact_messages.length, messages);
});

test("comparaison propriétaire : seulement les devis reçus de ses demandes", async () => {
  const db = new MemoryDb(); await sentQuotes(db);
  const response = await harness(db, OWNER, "owner").call("quotes", "GET");
  assert.equal((await response.json()).length, 2);
  assert.deepEqual(await (await harness(db, A, "owner").call("quotes", "GET")).json(), []);
  assert.equal((await harness(db, OWNER, "owner").call("quotes", "POST", {})).status, 403);
});

test("refus d'un devis : les autres propositions restent ouvertes", async () => {
  const db = new MemoryDb(); await sentQuotes(db);
  db.tables.service_request_recipients.forEach(row => row.status = "quoted");
  const quote = db.tables.quotes[0];
  const response = await harness(db, OWNER, "owner").call("quotes/[id]/status", "PATCH", { status: "rejected" }, quote.id);
  assert.equal(response.status, 200);
  assert.equal(db.tables.service_requests[0].status, "quoted");
  assert.equal(db.tables.service_request_recipients[1].status, "quoted");
  assert.equal(db.tables.quotes[1].status, "sent");
});

test("échec de remplacement des lignes : compensation et quantités précédentes conservées", async () => {
  const { db, call } = harness();
  const q = await (await call("service-request-recipients/[id]/prepare-quote", "POST")).json();
  const before = structuredClone(db.tables.quote_items);
  db.failOnce = { table: "quote_items", op: "insert" };
  const response = await call("quotes/[id]", "PATCH", { items: before.map(row => ({ ...row, quantity: 7, unit_price: 25 })) }, q.quote.id);
  assert.equal(response.status, 500);
  assert.equal((await response.json()).code, "QUOTE_EDIT_RESTORED");
  assert.deepEqual(db.tables.quote_items, before);
});

test("finalisation silencieusement incomplète : échec explicite et gagnant préservé", async () => {
  const db = new MemoryDb(); await sentQuotes(db); db.incompleteFinalize = true;
  const q = db.tables.quotes[0];
  const response = await harness(db, OWNER, "owner").call("quotes/[id]/status", "PATCH", { status: "accepted" }, q.id);
  assert.equal(response.status, 500);
  assert.equal((await response.json()).code, "POST_AWARD_WORKFLOW_PENDING");
  assert.equal(db.tables.service_requests[0].metadata.selected_quote_id, q.id);
});
