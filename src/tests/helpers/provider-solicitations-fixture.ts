import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";

const native = createRequire(import.meta.url);
const { NextRequest, NextResponse } = native("next/server");
type Row = Record<string, any>;
const id = (n: number) => `${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;
const OWNER = id(1), PROVIDER = id(2), OTHER = id(3), REQUEST = id(4), OP = id(5), EVENT = id(6), KEY = id(7);
const DATE = "2026-11-17T12:00:00.123456+00:00";
const body = { provider_profile_id: PROVIDER, service_slug: "plumbing_repair", description: "Réparer une fuite",
  location: { kind: "address", address: "12 rue Exemple", city: "Perpignan", postal_code: "66000", country_code: "FR" } };
const geographic = { place_id: 123, lat: "42.7", lon: "2.9", address: { house_number: "12", road: "rue Exemple", postcode: "66000", city: "Perpignan", country_code: "fr" } };
const view = { id: REQUEST, owner_profile_id: OWNER, prospective_client_profile_id: OWNER, provider_profile_id: PROVIDER,
  service_slug: "plumbing_repair", service_label_snapshot: "Dépannage plomberie", description: "Besoin privé",
  location_kind: "address", property_id: null, housing_id: null, reservation_id: null, desired_at: null,
  location_label: "12 rue Exemple, 66000 Perpignan", city: "Perpignan", postal_code: "66000", country_code: "FR",
  latitude: 42.7, longitude: 2.9, geocoded_at: DATE, geocoding_source: "nominatim:123", status: "sent", response_message: null,
  responded_at: null, version: 1, created_at: DATE, updated_at: DATE,
  secret_access_code: "PRIVATE-NEVER-EXPOSE", creation_operation_id: OP, business_fingerprint: "secret-hash" };
const event = { id: EVENT, solicitation_id: REQUEST, event_type: "solicitation_sent", actor_profile_id: OWNER,
  actor_principal_id: OWNER, old_status: null, new_status: "sent", version: 1, message: null, created_at: DATE, operation_id: OP };
const compiled = new Map<string, string>();
type Options = {
  role?: string; status?: string; claim?: string; actor?: string; selected?: string; unauthenticated?: boolean; disabled?: boolean;
  providerStatus?: string; skills?: string; zones?: string | null; geo?: unknown; geoThrows?: boolean; geoStatus?: number;
  propertyOwner?: string; housingOwner?: string; housingAddress?: string; stayOwner?: string;
  rpcError?: Row; lookupError?: Row; rowError?: boolean; rightsError?: boolean; rpcThrows?: boolean;
  readItems?: Row[]; detail?: Row; events?: Row[]; readMissing?: boolean; malformedResult?: boolean; replay?: boolean;
  ownerStatus?: string; ownerRole?: string; responseError?: Row; replyResult?: unknown;
};
function fixture(options: Options = {}) {
  const role = options.role ?? "owner"; const actor = options.actor ?? (role.startsWith("provider") || role.startsWith("artisan") ? PROVIDER : OWNER);
  const calls = { tables: [] as string[], rpc: [] as Row[], network: [] as string[], logs: [] as unknown[] };
  const zones = JSON.stringify({ zoneDeclaration: "root_explicit", radiusDeclaration: "explicit", zones: [
    { lat: 42.7, lng: 2.9, label: "Perpignan", placeId: "nominatim:123" } ] });
  const provider = { id: PROVIDER, role: "provider", status: options.providerStatus ?? "active", option: options.skills ?? '["plumbing_repair"]',
    availability_hours: options.zones === undefined ? zones : options.zones, service_radius_km: 20, latitude: 42.7, longitude: 2.9 };
  const operations = new Map<string, { fingerprint: string; result: Row }>();
  let current = { ...(options.detail ?? view) };
  const history: Row[] = [...(options.events ?? [event])];
  let replyQueue: Promise<void> = Promise.resolve();
  function query(table: string) {
    if (!["profiles", "properties", "housing", "reservations"].includes(table)) throw new Error("Unexpected table");
    let projection = ""; let requested = "";
    return {
      select(columns: string) { projection = columns; return this; },
      eq(column: string, value: string) { if (column === "id") requested = value; return this; },
      async maybeSingle() {
        calls.tables.push(`${table}:${projection}`);
        if (options.rowError || (projection === "id,role,status" && options.rightsError)) return { data: null, error: { message: "PRIVATE-DB" } };
        if (table === "profiles" && projection === "id,role,status") return { data: requested === actor
          ? { id: requested, role, status: options.status ?? "active" }
          : { id: requested, role: options.ownerRole ?? "owner", status: options.ownerStatus ?? "active" }, error: null };
        if (table === "profiles") return { data: provider, error: null };
        if (table === "properties") return { data: { id: requested, owner_id: options.propertyOwner ?? OWNER, city: "Perpignan" }, error: null };
        if (table === "housing") return { data: { id: requested, ville: "Perpignan", adresse: options.housingAddress ?? "12 rue Exemple", proprietaire: { owner_profile_id: options.housingOwner ?? OWNER } }, error: null };
        return { data: { id: requested, owner_profile_id: options.stayOwner ?? OWNER, property_id: OTHER }, error: null };
      },
    };
  }
  const db = { from: query, async rpc(name: string, args: Row) {
    calls.rpc.push({ name, args });
    if (options.rpcThrows) throw new Error("PRIVATE-TRANSPORT");
    if (args.p_actor_id !== actor || args.p_principal_id !== actor) return { data: null, error: { message: "FORBIDDEN" } };
    if (name === "lookup_provider_solicitation_creation") {
      if (options.lookupError) return { data: null, error: options.lookupError };
      if (options.replay) return { data: { found: true, result: { solicitation_id: REQUEST, status: "sent", version: 1 }, operation_id: OP, replayed: true }, error: null };
      const previous = operations.get(args.p_idempotency_key);
      if (previous && previous.fingerprint !== JSON.stringify(args.p_parameters)) return { data: null, error: { message: "IDEMPOTENCY_CONFLICT", code: "23505" } };
      return { data: previous ? { found: true, ...previous.result, replayed: true } : { found: false }, error: null };
    }
    if (options.rpcError) return { data: null, error: options.rpcError };
    if (name === "respond_provider_solicitation") {
      // Synthetic serialized RPC transport, not a PostgreSQL concurrency proof.
      // Business state is confined to this test fixture; production uses SQL only.
      const previous = replyQueue; let release!: () => void;
      replyQueue = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try {
        if (options.readMissing || args.p_solicitation_id !== current.id || actor !== current.provider_profile_id) return { data: null, error: { code: "P0002", message: "NOT_FOUND" } };
        if ((options.ownerStatus ?? "active") !== "active" || !["owner", "owner_pro"].includes(options.ownerRole ?? "owner")) return { data: null, error: { code: "42501", message: "FORBIDDEN" } };
        const fingerprint = JSON.stringify({ id: args.p_solicitation_id, status: args.p_status, message: args.p_message, version: args.p_expected_version });
        const operation = operations.get(args.p_idempotency_key);
        if (operation) return operation.fingerprint === fingerprint
          ? { data: { ...operation.result, replayed: true }, error: null }
          : { data: null, error: { code: "23505", message: "IDEMPOTENCY_CONFLICT" } };
        if (current.status !== "sent") return { data: null, error: { code: "55000", message: "ALREADY_RESPONDED" } };
        if (current.version !== args.p_expected_version) return { data: null, error: { code: "40001", message: "VERSION_CONFLICT" } };
        // Inject a transactional error before publishing staged effects.
        if (options.responseError) return { data: null, error: options.responseError };
        const operationId = id(8);
        const result = { result: { solicitation_id: current.id, status: args.p_status, version: 2 }, operation_id: operationId, replayed: false,
          reservation_id: "PRIVATE-STAY", address: "PRIVATE-ADDRESS", principal_id: actor };
        current = { ...current, status: args.p_status, response_message: args.p_message, responded_at: DATE, updated_at: DATE, version: 2 };
        history.push({ ...event, id: OP, operation_id: operationId, actor_principal_id: actor, actor_profile_id: actor, event_type: args.p_status === "interested" ? "provider_interested" : "provider_declined",
          old_status: "sent", new_status: args.p_status, version: 2, message: args.p_message });
        operations.set(args.p_idempotency_key, { fingerprint, result });
        return { data: options.replyResult ?? result, error: null };
      } finally { release(); }
    }
    if (name === "create_provider_solicitation") {
      const result = { result: { solicitation_id: REQUEST, status: "sent", version: 1 }, operation_id: OP, replayed: false };
      const p = args.p_parameters;
      operations.set(args.p_idempotency_key, { fingerprint: JSON.stringify({ provider_profile_id: p.provider_profile_id, service_slug: p.service_slug,
        description: p.description, location: p.location, reservation_id: p.reservation_id, desired_at: p.desired_at }), result });
      return { data: options.malformedResult ? { result: { status: "paid" } } : result, error: null };
    }
    if (name === "read_provider_solicitations") {
      if (args.p_solicitation_id) {
        const item = current;
        if (options.readMissing || (actor !== item.owner_profile_id && actor !== item.provider_profile_id)) return { data: null, error: { code: "P0002", message: "NOT_FOUND" } };
        return { data: { solicitation: item, events: history, extra_secret: "PRIVATE" }, error: null };
      }
      let items = options.readItems ?? [view];
      items = items.filter((item) => (role.startsWith("owner") ? item.owner_profile_id : item.provider_profile_id) === actor);
      if (args.p_status) items = items.filter((item) => item.status === args.p_status);
      if (args.p_before_at) items = items.filter((item) => item.created_at < args.p_before_at || (item.created_at === args.p_before_at && item.id < args.p_before_id));
      return { data: { items: items.slice(0, args.p_limit ?? 20) }, error: null };
    }
    throw new Error("Unexpected RPC");
  } };
  const modules = new Map<string, Row>();
  function execute(file: string): Row {
    if (modules.has(file)) return modules.get(file)!;
    if (file === "server/auth/authOptions.ts") return { auth: async () => null };
    if (file === "server/auth/apiAuth.ts") return { ACTIVE_PROFILE_COOKIE: "planetls_active_profile_id", getApiAuthContext: async () => ({ userId: options.selected ?? actor, sessionUserId: actor, role }) };
    if (file === "server/db/dbServer.ts") return { db, isSupabaseServerConfigured: true };
    let code = compiled.get(file);
    if (!code) {
      code = ts.transpileModule(readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText; compiled.set(file, code);
    }
    const exports = {}; modules.set(file, exports);
    function requireModule(name: string): unknown {
      if (name === "server-only") return {};
      if (name === "next/server") return { NextRequest, NextResponse };
      if (name === "next-auth/jwt") return { getToken: async () => options.unauthenticated ? null : { id: actor, role: options.claim ?? role } };
      if (name.startsWith("@/") || name.startsWith(".")) {
        let target = name.startsWith("@/") ? name.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
        if (!target.endsWith(".ts")) target += ".ts";
        return execute(target);
      }
      return native(name);
    }
    new Function("require", "exports", "process", "console", "fetch", code)(requireModule, exports,
      { env: { NEXTAUTH_SECRET: "synthetic-test-secret", PROVIDER_SOLICITATIONS_API_ENABLED: options.disabled ? "false" : "true" } },
      { error: (...args: unknown[]) => calls.logs.push(args), log: (...args: unknown[]) => calls.logs.push(args) },
      async (url: URL) => {
        calls.network.push(url.toString());
        if (options.geoThrows) throw new Error("PRIVATE-GEO");
        assert.equal(url.origin, "https://nominatim.openstreetmap.org");
        return new Response(JSON.stringify(options.geo === undefined ? [geographic] : options.geo), { status: options.geoStatus ?? 200 });
      });
    return exports;
  }
  async function invoke(method: "POST" | "GET", options: { body?: unknown; headers?: Record<string, string>; query?: string; detail?: boolean; respond?: boolean; target?: string; raw?: string } = {}) {
    const target = options.target ?? REQUEST;
    const req = new NextRequest(`http://localhost/api/provider-solicitations${options.detail || options.respond ? "/" + target : ""}${options.respond ? "/respond" : ""}${options.query ?? ""}`, {
      method, headers: { origin: "http://localhost", "content-type": "application/json", "idempotency-key": KEY, ...options.headers },
      ...(method === "POST" ? { body: options.raw ?? JSON.stringify(options.body ?? body) } : {}),
    });
    const route = execute(`app/api/provider-solicitations/${options.respond ? "[id]/respond/" : options.detail ? "[id]/" : ""}route.ts`);
    const response = await route[method](req, { params: Promise.resolve({ id: target }) });
    assert.equal(response.headers.get("cache-control"), "no-store");
    return { status: response.status, body: await response.json() };
  }
  return { invoke, calls, execute, state: () => ({ current, history, operations }),
    setActorStatus: (status: string) => { options.status = status; }, setOwnerStatus: (status: string) => { options.ownerStatus = status; } };
}

export { fixture, OWNER, PROVIDER, OTHER, REQUEST, OP, EVENT, KEY, DATE, body, geographic, view, event };
export type { Options, Row };
