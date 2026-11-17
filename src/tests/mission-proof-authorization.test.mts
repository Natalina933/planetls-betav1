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
const FOREIGN = uuid(8);
const PROOF = 'proof-1';
const FILE_PATH = `missions/${MISSION}/proof.jpg`;
const NOW = Date.parse("2026-11-11T12:00:00Z");
const PRIVATE = "synthetic-private-mission-data";
const compiled = new Map<string, string>();
type Row = Record<string, any>;
type Options = {
  role?: string; claim?: string; actor?: "owner" | "concierge" | "foreign";
  profile?: unknown; token?: Row | null; selected?: Row;
  readError?: boolean; readThrows?: boolean; tokenThrows?: boolean; invalidJwt?: boolean;
  status?: string; session?: Row | null; authThrows?: boolean; objectMissing?: boolean; objectError?: boolean; objectThrows?: boolean; objectMismatch?: boolean;
  rpcError?: string; assignmentReadError?: boolean; assignmentsDisabled?: boolean; rpcReplay?: boolean;
};

function fixture(options: Options = {}) {
  const role = options.role ?? "admin";
  const profile = Object.hasOwn(options, "profile") ? options.profile : { id: ID, role, status: "active", email: "actor@example.invalid" };
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
    contact_conversations: [], contact_messages: [], workflow_events: [], provider_interventions: [], mission_provider_assignments: [],
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
      if (table === "mission_provider_assignments" && options.assignmentReadError) return { data: null, error: { code: "42P01" } };
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
  const db = { from: (table: string) => query(table), rpc: async (name: string, args: Row) => {
    calls.business.push(`rpc:${name}`);
    calls.outbound.push({ name, args });
    if (options.rpcError) return { data: null, error: { code: options.rpcError } };
    const intervention = { id: FOREIGN, provider_profile_id: args.p_provider_id };
    const assignment = { id: FOREIGN, mission_id: args.p_mission_id, provider_profile_id: args.p_provider_id,
      provider_intervention_id: FOREIGN, state: "active", revoked_at: null };
    tables.provider_interventions.push(intervention);
    tables.mission_provider_assignments.push(assignment);
    return { data: { intervention, assignment, replayed: options.rpcReplay ?? false }, error: null };
  }, storage: {
    listBuckets: async () => { calls.storage.push({ action: "list" }); return { data: [{ name: "mission-evidence" }], error: null }; },
    updateBucket: async () => { calls.storage.push({ action: 'configure' }); return { error: null }; },
    from: (bucket: string) => ({
    info: async (file: string) => {
      calls.storage.push({ action: "info", bucket, file });
      if (options.objectThrows) throw new Error(PRIVATE);
      if (options.objectError) return { data: null, error: { statusCode: "500", message: PRIVATE } };
      if (options.objectMissing || !objects.has(file)) return { data: null, error: { statusCode: "404" } };
      return { data: { name: options.objectMismatch ? "foreign/path" : file, bucketId: bucket }, error: null };
    },
    upload: async (file: string) => { objects.add(file); calls.storage.push({ action: "upload", bucket, file }); return { data: { path: file }, error: null }; },
    remove: async (files: string[]) => { calls.storage.push({ action: "remove", bucket, files }); return { error: null }; },
    createSignedUrl: async (file: string, ttl: number) => { calls.storage.push({ action: "sign", bucket, file, ttl }); return { data: { signedUrl: "https://synthetic.invalid/private-proof?token=synthetic" }, error: null }; },
  }) } };
  const objects = new Set<string>([FILE_PATH]);
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
      env: { NEXTAUTH_SECRET: "synthetic-housing-only-secret", SUPABASE_URL: "https://synthetic.invalid", SUPABASE_SERVICE_ROLE_KEY: "synthetic", PLANETLS_MISSION_ASSIGNMENTS_READY: options.assignmentsDisabled ? undefined : "true" },
    }, { warn: (...args: unknown[]) => calls.logs.push(args), error: (...args: unknown[]) => calls.logs.push(args), info: (...args: unknown[]) => calls.outbound.push(args) }, class extends Date { static now() { return NOW; } },
    (...args: unknown[]) => { calls.outbound.push(args); throw new Error("Unexpected outbound request"); });
    return exports;
  }
  async function invoke(route: string, method: string, body?: unknown, json = false, proofId = PROOF, headers: Record<string, string> = {}) {
    let requestBody: string | FormData | undefined;
    if (method !== "GET") {
      if (route === "missions/[id]/files") {
        requestBody = new FormData();
        requestBody.set("file", new File(["synthetic-photo"], "photo.jpg", { type: "image/jpeg" }));
      } else requestBody = JSON.stringify(body ?? { title: "Synthetic creation", concierge_profile_id: concierge });
    }
    const req = new NextRequest(`http://localhost/api/${route}${json ? "?format=json" : ""}`, {
      method, headers: { ...(typeof requestBody === "string" ? { "content-type": "application/json" } : {}), ...headers }, body: requestBody,
    });
    return execute(`app/api/${route}/route.ts`)[method](req, { params: Promise.resolve({ id: MISSION, proofId }) });
  }
  return { invoke, calls, tables, mission, objects };
}

const DOWNLOAD = "missions/[id]/files/[proofId]/download";
const storageProof = (overrides: Row = {}) => ({ id: PROOF, label: "Synthetic proof", storage_bucket: "mission-evidence", storage_path: FILE_PATH, ...overrides });
function proofs(f: ReturnType<typeof fixture>, entries: unknown[]) { f.mission.metadata = { note: "Business note", proof_links: entries } as Row; }
function noWritesOrSign(f: ReturnType<typeof fixture>) {
  assert.deepEqual(f.calls.writes, []);
  assert.ok(f.calls.business.every(call => call.endsWith(":select")));
  assert.ok(f.calls.storage.every(call => call.action === "info"));
  assert.deepEqual(f.calls.outbound, []);
}

test("real upload then JSON download and redirect use the stored server path and 600 seconds", async () => {
  const f = fixture({ role: "concierge", actor: "concierge" });
  const uploaded = await f.invoke("missions/[id]/files", "POST");
  assert.equal(uploaded.status, 201, await uploaded.clone().text());
  const proof = await uploaded.json();
  assert.match(proof.storage_path, new RegExp(`^missions/${MISSION}/`));
  assert.equal(proof.storage_bucket, "mission-evidence");
  const response = await f.invoke(DOWNLOAD, "GET", undefined, true, proof.id);
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal((await response.json()).expires_in, 600);
  assert.deepEqual(f.calls.storage.filter(call => call.action === "sign").map(call => [call.bucket, call.file, call.ttl]),
    [["mission-evidence", proof.storage_path, 600]]);
  assert.equal((await f.invoke(DOWNLOAD, "GET", undefined, false, proof.id)).status, 302);
});

const invalid: [string, unknown[]][] = [
  ["foreign mission path", [storageProof({ storage_path: `missions/${FOREIGN}/proof.jpg` })]],
  ["other namespace in shared bucket", [storageProof({ storage_path: `provider-documents/${ID}/proof.jpg` })]],
  ["foreign bucket", [storageProof({ storage_bucket: "inspection-evidence" })]],
  ["blank bucket", [storageProof({ storage_bucket: "" })]],
  ["traversal", [storageProof({ storage_path: `missions/${MISSION}/../secret.jpg` })]],
  ["encoded traversal", [storageProof({ storage_path: `missions/${MISSION}/%2e%2e%2fsecret.jpg` })]],
  ["double encoding", [storageProof({ storage_path: `missions/${MISSION}/%252e%252e.jpg` })]],
  ["encoded separator", [storageProof({ storage_path: `missions%2f${MISSION}%2fproof.jpg` })]],
  ["backslash", [storageProof({ storage_path: `missions/${MISSION}/a\\proof.jpg` })]],
  ["double slash", [storageProof({ storage_path: `missions/${MISSION}//proof.jpg` })]],
  ["query suffix", [storageProof({ storage_path: FILE_PATH + "?download=1" })]],
  ["null character", [storageProof({ storage_path: FILE_PATH + "\u0000" })]],
  ["path as URL", [storageProof({ storage_path: "https://foreign.invalid/file.jpg" })]],
  ["duplicate ID", [storageProof(), storageProof()]],
  ["duplicate with foreign second target", [storageProof(), storageProof({ storage_path: `missions/${FOREIGN}/private.jpg` })]],
  ["duplicate case variation", [storageProof(), storageProof({ id: PROOF.toUpperCase() })]],
  ["contradictory mission", [storageProof({ mission_id: FOREIGN })]],
  ["storage and URL locators", [storageProof({ url: "https://external.invalid/proof.jpg" })]],
  ["alternative locator", [storageProof({ storagePath: `missions/${FOREIGN}/private.jpg` })]],
  ["forged provenance fields", [storageProof({ source: "mission", created_by: ID, sha256: "forged", storage_path: `missions/${FOREIGN}/private.jpg` })]],
  ["missing proof ID", [{ storage_path: FILE_PATH }]],
  ["malformed proof ID", [storageProof({ id: "proof/1" })]],
  ["empty path", [storageProof({ storage_path: "" })]],
  ["unsafe external scheme", [{ id: PROOF, url: "javascript:alert(1)" }]],
  ["malformed external URL", [{ id: PROOF, url: "https://" }]],
  ["protocol relative URL", [{ id: PROOF, url: "//external.invalid/proof" }]],
  ["credentials in URL", [{ id: PROOF, url: "https://user:password@external.invalid/proof" }]],
  ["URL backslash", [{ id: PROOF, url: "https://external.invalid\\proof" }]],
];
for (const [name, entries] of invalid) {
  test(`${name}: active administrator cannot sign or expose the rejected proof in either detail projection`, async () => {
    const f = fixture({ role: "admin" });
    proofs(f, entries);
    assert.equal((await f.invoke(DOWNLOAD, "GET", undefined, true)).status, 404);
    assert.deepEqual(f.calls.storage, []);
    const detailResponse = await f.invoke("missions/[id]", "GET");
    assert.equal(detailResponse.status, 200, await detailResponse.clone().text());
    const detail = await detailResponse.json();
    assert.deepEqual(detail.mission.metadata.proof_links, []);
    assert.deepEqual(detail.evidence.proof_links, []);
    assert.equal(detail.mission.metadata.note, "Business note");
    assert.deepEqual((f.mission.metadata as Row).proof_links, entries, "Persisted metadata is not rewritten");
    noWritesOrSign(f);
  });
}

for (const role of ["owner", "owner_pro", "concierge", "concierge_pro", "admin", "super_admin"]) {
  test(`${role}: legitimate historical proof without source and absent bucket remains downloadable`, async () => {
    const actor = role.startsWith("owner") ? "owner" : "concierge";
    const f = fixture({ role, actor });
    proofs(f, [{ id: PROOF, label: "Historical", storage_path: FILE_PATH }]);
    assert.equal((await f.invoke(DOWNLOAD, "GET", undefined, true)).status, 200);
    const detail = await (await f.invoke("missions/[id]", "GET")).json();
    assert.equal(detail.evidence.proof_links[0].storage_bucket, "mission-evidence");
    assert.deepEqual(detail.evidence.proof_links, detail.mission.metadata.proof_links);
    assert.equal((f.mission.metadata as Row).proof_links[0].storage_bucket, undefined);
  });
}
test("orphaned object is not signed and is omitted from both projections without deletion", async () => {
  const f = fixture({ objectMissing: true });
  proofs(f, [storageProof()]);
  assert.equal((await f.invoke(DOWNLOAD, "GET")).status, 404);
  const detail = await (await f.invoke("missions/[id]", "GET")).json();
  assert.deepEqual(detail.evidence.proof_links, []);
  assert.deepEqual(detail.mission.metadata.proof_links, []);
  assert.equal((f.mission.metadata as Row).proof_links.length, 1);
  noWritesOrSign(f);
});
for (const option of ["objectError", "objectThrows", "objectMismatch"] as const) {
  test(`${option}: technical verification failure returns controlled 503 without signature or private diagnostics`, async () => {
    const f = fixture({ [option]: true });
    proofs(f, [storageProof()]);
    for (const route of [DOWNLOAD, "missions/[id]"]) {
      const response = await f.invoke(route, "GET");
      assert.equal(response.status, 503);
      assert.equal((await response.text()).includes(PRIVATE), false);
    }
    noWritesOrSign(f);
  });
}
for (const url of ["http://external.invalid/proof.jpg", "https://external.invalid/proof.pdf", "https://external.invalid/proof?x=1#page=2"]) {
  test(`external HTTP(S) reference preserves JSON and redirect without fetching or signing: ${url}`, async () => {
    const f = fixture();
    proofs(f, [{ id: PROOF, url }]);
    const response = await f.invoke(DOWNLOAD, "GET", undefined, true);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { url, external: true });
    assert.equal((await f.invoke(DOWNLOAD, "GET")).headers.get("location"), url);
    assert.deepEqual(f.calls.storage, []);
    noWritesOrSign(f);
  });
}
test("new mission rejects fabricated Storage references before SQL writes", async () => {
  for (const entries of [[storageProof()], [storageProof({ storage_path: `missions/${FOREIGN}/private.jpg` })], [{ id: PROOF, url: "data:text/html,private" }]]) {
    const f = fixture({ role: "owner", actor: "owner" });
    const response = await f.invoke("missions", "POST", { title: "New", concierge_profile_id: CONCIERGE,
      metadata: { business_note: "Keep", proof_links: entries } });
    assert.equal(response.status, 400);
    noWritesOrSign(f);
    assert.deepEqual(f.calls.business, []);
  }
});
test("ordinary mission creation and safe imported external proofs preserve business metadata", async () => {
  for (const withProof of [false, true]) {
    const f = fixture({ role: "owner", actor: "owner" });
    const metadata = { business_note: "Keep", ...(withProof ? { proof_links: [{ id: PROOF, url: "https://external.invalid/proof" }] } : {}) };
    const response = await f.invoke("missions", "POST", { title: "New", concierge_profile_id: CONCIERGE, metadata });
    assert.equal(response.status, 201, await response.clone().text());
    assert.equal((await response.json()).metadata.business_note, "Keep");
    assert.deepEqual(f.calls.storage, []);
  }
});
test("add_proof validates external URLs before mutations and keeps legitimate links", async () => {
  for (const url of ["javascript:alert(1)", "https://", "data:text/plain,private", "https://external.invalid/proof"]) {
    const f = fixture({ role: "concierge", actor: "concierge" });
    const response = await f.invoke("missions/[id]", "PATCH", { action: "add_proof", label: "External", url });
    assert.equal(response.status, url.endsWith("/proof") ? 200 : 400, await response.clone().text());
    if (response.status === 400) noWritesOrSign(f);
    else assert.equal((await response.json()).evidence.proof_links[0].url, url);
    assert.deepEqual(f.calls.storage, []);
  }
});
const denied: [string, Options, number][] = [
  ["suspended", { profile: { id: ID, role: "admin", status: "suspended" } }, 403],
  ["deleted", { profile: null }, 401], ["missing identity", { token: null }, 401],
  ["incomplete JWT", { token: { sub: ID, role: "admin" } }, 401],
  ["demoted", { role: "owner", claim: "admin", actor: "owner" }, 403],
  ["rights error", { readError: true }, 503],
];
for (const [name, options, status] of denied) {
  test(`${name}: download, upload, private projection and creation refuse before Storage or business reads`, async () => {
    for (const [route, method] of [[DOWNLOAD, "GET"], ["missions/[id]/files", "POST"], ["missions/[id]", "GET"], ["missions", "POST"]]) {
      const f = fixture(options);
      proofs(f, [storageProof()]);
      assert.equal((await f.invoke(route, method)).status, status, `${method} ${route}`);
      assert.deepEqual(f.calls.business, []);
      assert.deepEqual(f.calls.storage, []);
      noWritesOrSign(f);
    }
  });
}
test("foreign ordinary actor cannot read, upload or sign", async () => {
  for (const [route, method] of [[DOWNLOAD, "GET"], ["missions/[id]/files", "POST"], ["missions/[id]", "GET"]]) {
    const f = fixture({ role: "concierge", actor: "foreign" });
    proofs(f, [storageProof()]);
    assert.equal((await f.invoke(route, method)).status, 403);
    assert.deepEqual(f.calls.storage, []);
    noWritesOrSign(f);
  }
});
for (const role of ["provider", "provider_pro", "artisan", "artisan_pro"]) {
  test(`${role}: verified active assignment allows upload and download`, async () => {
    const f = fixture({ role });
    f.tables.provider_interventions.push({ id: FOREIGN, provider_profile_id: ID, metadata: { mission_id: MISSION } });
    f.tables.mission_provider_assignments.push({ id: FOREIGN, mission_id: MISSION, provider_profile_id: ID, state: "active", revoked_at: null });
    const uploaded = await f.invoke("missions/[id]/files", "POST");
    assert.equal(uploaded.status, 201);
    const proof = await uploaded.json();
    assert.equal((await f.invoke(DOWNLOAD, "GET", undefined, true, proof.id)).status, 200);
    assert.equal(f.calls.storage.find(call => call.action === "sign")?.ttl, 600);
  });
}
test("owner upload remains forbidden before any Storage operation or mission read", async () => {
  const f = fixture({ role: "owner", actor: "owner" });
  assert.equal((await f.invoke("missions/[id]/files", "POST")).status, 403);
  assert.deepEqual(f.calls.business, []);
  assert.deepEqual(f.calls.storage, []);
  noWritesOrSign(f);
});
test("mixed historical proofs retain only valid references in both projections without altering persistence", async () => {
  const f = fixture();
  const entries = [storageProof(), { id: "external", url: "https://external.invalid/proof" },
    storageProof({ id: "foreign", storage_path: `missions/${FOREIGN}/private.jpg` })];
  proofs(f, entries);
  const detail = await (await f.invoke("missions/[id]", "GET")).json();
  assert.deepEqual(detail.evidence.proof_links.map((proof: Row) => proof.id), [PROOF, "external"]);
  assert.deepEqual(detail.mission.metadata.proof_links, detail.evidence.proof_links);
  assert.deepEqual((f.mission.metadata as Row).proof_links, entries);
  noWritesOrSign(f);
});

// SEC-G03-02: real HTTP handlers; the RPC/SQL transaction remains a transport double.
for (const variant of ["forged", "other-mission", "foreign-provider", "revoked", "revoked-date", "history", "missing-schema"]) {
  test(`G03 ${variant}: denies upload and download before any Storage call`, async () => {
    const f = fixture({ role: "provider", assignmentReadError: variant === "missing-schema" });
    proofs(f, [storageProof()]);
    f.tables.provider_interventions.push({ id: FOREIGN, provider_profile_id: ID, reservation_id: OWNER,
      metadata: { mission_id: MISSION, created_from: "mission_detail", concierge_profile_id: CONCIERGE } });
    if (!["forged", "history", "missing-schema"].includes(variant)) {
      f.tables.mission_provider_assignments.push({ id: FOREIGN,
        mission_id: variant === "other-mission" ? FOREIGN : MISSION,
        provider_profile_id: variant === "foreign-provider" ? FOREIGN : ID,
        state: variant === "revoked" ? "revoked" : "active",
        revoked_at: variant === "revoked-date" || variant === "revoked" ? "2026-11-12" : null });
    }
    for (const [route, method] of [["missions/[id]/files", "POST"], [DOWNLOAD, "GET"]]) {
      const response = await f.invoke(route, method);
      assert.ok(response.status >= 400, await response.text());
    }
    assert.deepEqual(f.calls.storage, []);
    assert.deepEqual(f.calls.writes, []);
  });
}
for (const method of ["POST", "PATCH"]) {
  for (const metadata of [{ mission_id: MISSION }, { missionId: MISSION }, { created_from: "mission_detail" }, { assignment_id: FOREIGN }]) {
    test(`G03 provider ${method} rejects reserved metadata ${Object.keys(metadata)[0]}`, async () => {
      const f = fixture({ role: "provider" });
      const route = method === "POST" ? "provider/interventions" : "provider/interventions/[id]";
      const response = await f.invoke(route, method, { title: "Personal intervention", metadata });
      assert.equal(response.status, 400, await response.text());
      assert.deepEqual(f.calls.writes, []);
      proofs(f, [storageProof()]);
      assert.equal((await f.invoke(DOWNLOAD, "GET")).status, 403);
      assert.deepEqual(f.calls.storage, []);
    });
  }
}
test("G03 changing unrelated metadata cannot move an assignment to another mission", async () => {
  const f = fixture({ role: "provider" });
  f.tables.provider_interventions.push({ id: MISSION, provider_profile_id: ID, metadata: {} });
  f.tables.mission_provider_assignments.push({ id: FOREIGN, mission_id: FOREIGN, provider_profile_id: ID, state: "active", revoked_at: null });
  assert.equal((await f.invoke("provider/interventions/[id]", "PATCH", { metadata: { note: "Personal note" } })).status, 200);
  proofs(f, [storageProof()]);
  assert.equal((await f.invoke(DOWNLOAD, "GET")).status, 403);
  assert.deepEqual(f.calls.storage, []);
});
test("G03 legitimate creation forwards server principal and actor to exactly one atomic RPC", async () => {
  const f = fixture({ role: "concierge", actor: "concierge" });
  const response = await f.invoke("missions/[id]/provider-interventions", "POST", {
    provider_profile_id: FOREIGN, title: "Synthetic assignment", metadata: { mission_id: OWNER },
    p_principal_id: OWNER, p_actor_id: OWNER,
  });
  assert.equal(response.status, 201, await response.clone().text());
  const call = f.calls.outbound[0] as Row;
  assert.equal(call.name, "create_mission_provider_assignment");
  assert.equal(call.args.p_principal_id, ID);
  assert.equal(call.args.p_actor_id, ID);
  assert.equal(call.args.p_mission_id, MISSION);
  assert.deepEqual(call.args.p_parameters, { title: "Synthetic assignment" });
  assert.equal(response.headers.get("Idempotency-Key"), call.args.p_operation_id);
  assert.deepEqual(f.calls.writes, []); // no secondary REST writes
});
for (const code of ["PGRST202", "42P01", "42501", "23514", "40P01"]) {
  test(`G03 RPC ${code}: no REST fallback or partially created state`, async () => {
    const f = fixture({ role: "concierge", actor: "concierge", rpcError: code });
    const response = await f.invoke("missions/[id]/provider-interventions", "POST", { provider_profile_id: FOREIGN });
    assert.ok(response.status >= 400);
    assert.deepEqual(f.tables.provider_interventions, []);
    assert.deepEqual(f.tables.mission_provider_assignments, []);
    assert.deepEqual(f.calls.writes, []);
    assert.deepEqual(f.calls.storage, []);
  });
}
for (const options of [{ role: "provider", profile: { id: ID, role: "provider", status: "suspended" } }, { role: "owner", actor: "foreign" as const }]) {
  test(`G03 ${options.role}: cannot create an assignment`, async () => {
    const f = fixture(options);
    assert.equal((await f.invoke("missions/[id]/provider-interventions", "POST", { provider_profile_id: FOREIGN })).status, 403);
    assert.deepEqual(f.calls.outbound, []);
    assert.deepEqual(f.calls.writes, []);
  });
}
test("G03 suspended provider with active assignment cannot access Storage", async () => {
  const f = fixture({ role: "provider", profile: { id: ID, role: "provider", status: "suspended" } });
  f.tables.mission_provider_assignments.push({ id: FOREIGN, mission_id: MISSION, provider_profile_id: ID, state: "active", revoked_at: null });
  proofs(f, [storageProof()]);
  assert.equal((await f.invoke(DOWNLOAD, "GET")).status, 403);
  assert.equal((await f.invoke("missions/[id]/files", "POST")).status, 403);
  assert.deepEqual(f.calls.storage, []);
});

test("G03 rollout disabled: no RPC, assignment read, upload or signature", async () => {
  const creator = fixture({ role: "concierge", actor: "concierge", assignmentsDisabled: true });
  assert.equal((await creator.invoke("missions/[id]/provider-interventions", "POST", { provider_profile_id: FOREIGN })).status, 503);
  assert.deepEqual(creator.calls.outbound, []);
  const provider = fixture({ role: "provider", assignmentsDisabled: true });
  proofs(provider, [storageProof()]);
  for (const [route, method] of [["missions/[id]/files", "POST"], [DOWNLOAD, "GET"]]) {
    assert.ok((await provider.invoke(route, method)).status >= 400);
  }
  assert.deepEqual(provider.calls.storage, []);
  assert.ok(provider.calls.business.every(call => !call.startsWith("mission_provider_assignments:")));
});
test("G03 linked profile: RPC receives distinct authenticated principal and active actor", async () => {
  const f = fixture({ role: "owner", selected: { id: FOREIGN, role: "concierge", status: "active", email: "actor@example.invalid" } });
  const response = await f.invoke("missions/[id]/provider-interventions", "POST", { provider_profile_id: OWNER }, false, PROOF,
    { cookie: `planetls_active_profile_id=${FOREIGN}` });
  assert.equal(response.status, 201, await response.clone().text());
  const call = f.calls.outbound[0] as Row;
  assert.equal(call.args.p_principal_id, ID);
  assert.equal(call.args.p_actor_id, FOREIGN);
});
test("G03 RPC replay preserves the operation key and legacy intervention response", async () => {
  const f = fixture({ role: "concierge", actor: "concierge", rpcReplay: true });
  const response = await f.invoke("missions/[id]/provider-interventions", "POST", { provider_profile_id: FOREIGN }, false, PROOF,
    { "Idempotency-Key": OWNER });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Idempotency-Key"), OWNER);
  assert.equal((await response.json()).id, FOREIGN);
  assert.equal((f.calls.outbound[0] as Row).args.p_operation_id, OWNER);
});
