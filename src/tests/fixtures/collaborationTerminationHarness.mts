import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import type { LooseSupabaseClient } from "../../app/api/_shared/untypedSupabase.ts";

export type Row = Record<string, any>;
export const OWNER = "11111111-1111-4111-8111-111111111111";
export const CONCIERGE = "22222222-2222-4222-8222-222222222222";
export const THIRD = "33333333-3333-4333-8333-333333333333";
export const ID = "44444444-4444-4444-8444-444444444444";
export const REQUEST = "55555555-5555-4555-8555-555555555555";
export const QUOTE = "66666666-6666-4666-8666-666666666666";
export const STAY = "77777777-7777-4777-8777-777777777777";
export const NOW = new Date("2026-10-26T15:42:11.000Z");

// Isolated transport/CAS fixture, never PostgreSQL/RLS proof.
export class TerminationDb {
  tables: Record<string, Row[]> = {
    housing_collaborations: [{ id: ID, owner_profile_id: OWNER, concierge_profile_id: CONCIERGE, housing_id: 42,
      status: "active", ends_on: null, updated_at: "2026-01-01T00:00:00Z", quote_id: QUOTE, service_request_id: REQUEST,
      scope: { continuous_collaboration: true, operational_service_slugs: ["linen_change"] } }],
    services_contracts: [], services_contract_versions: [], missions: [], invoices: [{ id: "invoice-history", status: "paid" }],
    quotes: [{ id: QUOTE, owner_profile_id: OWNER, concierge_profile_id: CONCIERGE, service_request_id: REQUEST, status: "accepted" }],
    service_requests: [{ id: REQUEST, owner_profile_id: OWNER, requested_services: ["linen_change"],
      metadata: { selected_quote_id: QUOTE, continuous_collaboration: true } }],
    housing: [{ id: 42, proprietaire: { owner_profile_id: OWNER } }],
    reservations: [{ id: STAY, owner_profile_id: OWNER, concierge_profile_id: CONCIERGE, property_id: "42",
      check_in_at: "2026-11-01T15:00:00Z", check_out_at: "2026-12-01T10:00:00Z",
      metadata: { collaboration_id: ID, property_housing_id: "42", requested_actions: ["linen"] } }],
  };
  writes: string[] = [];
  failTable = "";
  row() { return this.tables.housing_collaborations[0]; }
  client() { return this as unknown as LooseSupabaseClient; }
  from(table: string) { return new Query(this, table); }
}
class Query {
  db: TerminationDb; table: string; filters: Array<(row: Row) => boolean> = [];
  op = "read"; payload: Row = {}; start = 0; end = Infinity;
  constructor(db: TerminationDb, table: string) { this.db = db; this.table = table; }
  select() { return this; }
  eq(key: string, value: unknown) { this.filters.push(row => row[key] === value); return this; }
  in(key: string, values: unknown[]) { this.filters.push(row => values.includes(row[key])); return this; }
  contains(key: string, value: Row) { this.filters.push(row => Object.entries(value).every(([k, v]) => row[key]?.[k] === v)); return this; }
  order() { return this; }
  range(start: number, end: number) { this.start = start; this.end = end; return this; }
  limit(count: number) { this.end = count - 1; return this; }
  update(payload: Row) { this.op = "update"; this.payload = payload; return this; }
  insert(payload: Row) { this.op = "insert"; this.payload = payload; return this; }
  async result(single = false) {
    if (this.db.failTable === this.table) return { data: null, error: { message: "Injected transport error" } };
    const table = this.db.tables[this.table] ??= [];
    let rows = table.filter(row => this.filters.every(filter => filter(row))).slice(this.start, this.end + 1);
    if (this.op === "update") {
      this.db.writes.push(this.table); rows.forEach(row => Object.assign(row, structuredClone(this.payload)));
    }
    if (this.op === "insert") {
      this.db.writes.push(this.table); rows = [{ id: `fixture-${table.length}`, ...structuredClone(this.payload) }]; table.push(...rows);
    }
    return { data: structuredClone(single ? rows[0] ?? null : rows), error: null };
  }
  single() { return this.result(true); }
  maybeSingle() { return this.result(true); }
  then(resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) { return this.result().then(resolve, reject); }
}

export function agreedVersion(db: TerminationDb, days: number, overrides: Row = {}) {
  db.tables.services_contracts = [{ id: "contract", collaboration_id: ID }];
  const version = { id: "version-agreed", contract_id: "contract", version_number: 1, status: "signed",
    proposed_owner_id: OWNER, proposed_concierge_id: CONCIERGE,
    owner_accepted_by: OWNER, concierge_accepted_by: CONCIERGE,
    owner_accepted_at: "2020-01-01T00:00:00Z", concierge_accepted_at: "2020-01-02T00:00:00Z",
    conditions: { duration: { kind: "INDETERMINEE", endsOn: null, noticeDays: days } }, ...overrides };
  db.tables.services_contract_versions.push(version); return version;
}

const root = fileURLToPath(new URL("../../../", import.meta.url));
const native = createRequire(import.meta.url);
export function modules(db: TerminationDb, actor = OWNER, role = "owner") {
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
