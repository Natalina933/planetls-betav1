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
const ID = uuid(1), OWNER = uuid(2), CONCIERGE = uuid(3), INSPECTION = uuid(4);
const MEDIA = uuid(5), CHECKLIST = uuid(6), DISPUTE = uuid(7), FOREIGN = uuid(8), SELECTED = uuid(9);
const NOW = Date.parse("2026-11-11T12:00:00Z");
const PRIVATE = "synthetic-private-inspection-data";
const compiled = new Map<string, string>();
type Row = Record<string, any>;
type Options = {
  role?: string; claim?: string; actor?: "owner" | "concierge" | "foreign";
  profile?: unknown; token?: Row | null; selected?: Row;
  readError?: boolean; readThrows?: boolean; tokenThrows?: boolean; invalidJwt?: boolean;
  status?: string; locked?: boolean; checkoutAgeMs?: number;
};

function fixture(options: Options = {}) {
  const role = options.role ?? "admin";
  let profile = Object.hasOwn(options, "profile") ? options.profile : { id: ID, role, status: "active", email: "actor@example.invalid" };
  const token = Object.hasOwn(options, "token") ? options.token : { id: ID, role: options.claim ?? role, email: "actor@example.invalid" };
  const owner = options.actor === "owner" ? ID : OWNER;
  const concierge = options.actor === "concierge" ? ID : CONCIERGE;
  const calls = { profiles: [] as string[], business: [] as string[], writes: [] as Row[], storage: [] as Row[], outbound: [] as unknown[], logs: [] as unknown[] };
  const inspection = { id: INSPECTION, housing_id: 1, owner_profile_id: owner, concierge_profile_id: concierge,
    status: options.status ?? "draft", evidence_locked_at: options.locked ? "2026-11-11T11:00:00Z" : null,
    checkout_at: new Date(NOW - (options.checkoutAgeMs ?? 60 * 60 * 1000)).toISOString(),
    submitted_at: "2026-11-11T10:00:00Z", created_at: "2026-11-11T09:00:00Z", metadata: { private: PRIVATE } };
  const tables: Record<string, Row[]> = {
    checkout_inspections: [inspection],
    housing: [{ id: 1, proprietaire: { id: owner }, nom_logement: "Synthetic housing", ville: "Paris" }],
    checkout_checklist_items: [{ id: CHECKLIST, inspection_id: INSPECTION, item_key: "window", item_label: "Window", item_status: "ok" }],
    inspection_media: Array.from({ length: 6 }, (_, index) => ({ id: index === 0 ? MEDIA : `${MEDIA.slice(0, -1)}${index - 1}`,
      inspection_id: INSPECTION, checklist_item_id: CHECKLIST, media_type: index === 5 ? "video" : "photo",
      storage_bucket: "inspection-evidence", storage_path: `inspections/${INSPECTION}/proof-${index}.jpg`, sha256: "synthetic-fingerprint" })),
    damage_disputes: [{ id: DISPUTE, inspection_id: INSPECTION, housing_id: 1, owner_profile_id: owner,
      concierge_profile_id: concierge, status: "open", dispute_type: "damage", title: PRIVATE, description: PRIVATE, currency: "EUR" }],
    dispute_evidence_links: [{ id: FOREIGN, dispute_id: DISPUTE, media_id: MEDIA, checklist_item_id: CHECKLIST }],
    inspection_events: [],
  };
  function profileQuery() {
    let id = "";
    return { select() { return this; }, eq(_key: string, value: string) { id = value; calls.profiles.push(value); return this; },
      async maybeSingle() {
        if (options.readThrows) throw new Error(PRIVATE);
        const data = id === ID ? profile : id === SELECTED ? options.selected ?? null : { id, first_name: "Synthetic", email: "private@example.invalid" };
        return { data, error: options.readError ? { message: PRIVATE } : null };
      } };
  }
  function query(table: string) {
    let operation = "select", payload: Row | Row[] = {};
    const filters: Array<(row: Row) => boolean> = [];
    function result(single = false) {
      calls.business.push(`${table}:${operation}`);
      let rows = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
      if (operation === "insert" || operation === "upsert") {
        rows = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: FOREIGN, ...row }));
        if (operation === "upsert") tables[table] = (tables[table] ?? []).filter(row => !rows.some(item => item.item_key === row.item_key && item.inspection_id === row.inspection_id));
        tables[table] = [...(tables[table] ?? []), ...rows];
      } else if (operation === "update") rows.forEach(row => Object.assign(row, payload));
      else if (operation === "delete") tables[table] = (tables[table] ?? []).filter(row => !rows.includes(row));
      if (operation !== "select") calls.writes.push(...rows.map(row => ({ table, operation, ...row })));
      return { data: single ? rows[0] ?? null : rows, error: null };
    }
    const chain: any = {
      select: () => chain,
      eq: (key: string, value: unknown) => { filters.push(row => row[key] === value); return chain; },
      neq: (key: string, value: unknown) => { filters.push(row => row[key] !== value); return chain; },
      in: (key: string, values: unknown[]) => { filters.push(row => values.includes(row[key])); return chain; },
      or: (value: string) => { const choices = value.split(",").map(part => part.split(".eq.")); filters.push(row => choices.some(([key, id]) => row[key] === id)); return chain; },
      order: () => chain, limit: () => chain,
      insert: (value: Row | Row[]) => { operation = "insert"; payload = value; return chain; },
      upsert: (value: Row[]) => { operation = "upsert"; payload = value; return chain; },
      update: (value: Row) => { operation = "update"; payload = value; return chain; },
      delete: () => { operation = "delete"; return chain; },
      maybeSingle: async () => result(true), single: async () => result(true),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
    };
    return chain;
  }
  const db = { from: (table: string) => table === "profiles" ? profileQuery() : query(table), storage: { from: (bucket: string) => ({
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
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      compiled.set(file, code);
    }
    const exports = {}; modules.set(file, exports);
    function load(id: string): unknown {
      if (id === "server-only") return {};
      if (id === "next/server") return { NextRequest, NextResponse };
      if (id === "zod" || id === "crypto") return native(id);
      if (id === "next-auth/jwt") return { getToken: async (args: Parameters<typeof verifyToken>[0]) => {
        if (options.tokenThrows) throw new Error(PRIVATE);
        return options.invalidJwt ? verifyToken(args) : token;
      } };
      if (id === "./authOptions" || id === "@/server/auth/authOptions") return { auth: async () => null };
      if (id === "@/app/lib/dbServer" || id === "../db/dbServer") return { db, isSupabaseServerConfigured: true };
      if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
      if (id.startsWith("@/")) return execute(id.slice(2) + ".ts");
      if (id.startsWith(".")) return execute(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)).replace(/\.ts$/, "") + ".ts");
      throw new Error(`Unexpected import ${id} in ${file}`);
    }
    new Function("require", "exports", "process", "console", "Date", "fetch", code)(load, exports, {
      env: { NEXTAUTH_SECRET: "synthetic-inspection-only-secret" },
    }, { error: (...args: unknown[]) => calls.logs.push(args) }, class extends Date { static now() { return NOW; } },
    (...args: unknown[]) => { calls.outbound.push(args); throw new Error("Unexpected outbound request"); });
    return exports;
  }
  function bodyFor(route: string) {
    if (route === "inspections") return { housingId: 1, ownerProfileId: owner, conciergeProfileId: concierge };
    if (route.endsWith("/checklist")) return { items: [{ zoneKey: "living", itemKey: "window", itemLabel: "Window", itemStatus: "ok" }], replace: true };
    if (route.endsWith("/submit")) return { signatureName: "Synthetic signer", signatureAccepted: true };
    if (route === "disputes") return { inspectionId: INSPECTION, disputeType: "damage", evidence: { mediaIds: [MEDIA], checklistItemIds: [CHECKLIST] } };
    return { metadata: { note: "Synthetic edit" } };
  }
  async function invoke(route: string, method: string, body?: unknown) {
    const cookie = options.invalidJwt ? "authjs.session-token=invalid" : options.selected ? `planetls_active_profile_id=${SELECTED}` : "";
    let requestBody: string | FormData | undefined;
    if (method !== "GET") {
      if (body instanceof FormData) requestBody = body;
      else if (route.endsWith("/media") && method === "POST" && body === undefined) {
        requestBody = new FormData();
        requestBody.set("file", new File(["synthetic-photo"], "proof.jpg", { type: "image/jpeg" }));
        requestBody.set("checklistItemId", CHECKLIST);
      } else requestBody = JSON.stringify(body ?? bodyFor(route));
    }
    const req = new NextRequest(`http://localhost/api/${route}?userId=${FOREIGN}&role=admin`, {
      method, headers: { cookie, ...(typeof requestBody === "string" ? { "content-type": "application/json" } : {}) }, body: requestBody,
    });
    return execute(`app/api/${route}/route.ts`)[method](req, { params: Promise.resolve({ id: route.startsWith("disputes/") ? DISPUTE : INSPECTION, mediaId: MEDIA }) });
  }
  return { invoke, calls, tables, inspection, setProfile: (value: unknown) => { profile = value; } };
}

const methods: [string, string][] = [
  ["inspections", "GET"], ["inspections", "POST"], ["inspections/[id]", "GET"], ["inspections/[id]", "PATCH"],
  ["inspections/[id]/checklist", "PUT"], ["inspections/[id]/submit", "POST"],
  ["inspections/[id]/media", "POST"], ["inspections/[id]/media/[mediaId]", "DELETE"],
  ["disputes", "GET"], ["disputes", "POST"], ["disputes/[id]/export", "GET"],
];
function assertNoEffects(f: ReturnType<typeof fixture>) {
  assert.deepEqual(f.calls.writes, []);
  assert.deepEqual(f.calls.storage, []);
  assert.deepEqual(f.calls.outbound, []);
}
const denied: [string, Options, number][] = [
  ["old admin downgraded to owner", { role: "owner", claim: "admin", actor: "owner" }, 403],
  ["old super-admin downgraded to concierge", { role: "concierge", claim: "super_admin", actor: "concierge" }, 403],
  ["suspended admin", { profile: { id: ID, role: "admin", status: "suspended" } }, 403],
  ["suspended owner participant", { role: "owner", actor: "owner", profile: { id: ID, role: "owner", status: "suspended" } }, 403],
  ["suspended concierge participant", { role: "concierge", actor: "concierge", profile: { id: ID, role: "concierge", status: "suspended" } }, 403],
  ["deleted participant", { role: "owner", actor: "owner", profile: null }, 401],
  ["deleted administrator", { profile: { id: ID, role: "admin", status: "deleted" } }, 403],
  ["principal missing", { profile: null }, 401],
  ["no application identity despite sub", { token: { sub: ID, role: "admin" } }, 401],
  ["no authentication", { token: null }, 401],
  ["invalid JWT", { invalidJwt: true }, 401],
  ["read unavailable", { readError: true }, 503],
  ["read exception", { readThrows: true }, 503],
  ["JWT transport failure", { tokenThrows: true }, 503],
  ["inconsistent profile id", { profile: { id: FOREIGN, role: "admin", status: "active" } }, 503],
  ["unknown role", { profile: { id: ID, role: "root", status: "active" } }, 403],
  ["unknown status", { profile: { id: ID, role: "admin", status: "unknown" } }, 403],
  ["selected admin cannot authorize ordinary principal", { role: "owner", selected: { id: SELECTED, role: "admin", status: "active", email: "actor@example.invalid" } }, 403],
];
for (const [name, options, status] of denied) {
  test(`${name}: all 11 handlers refuse before business reads, SQL events, Storage or outbound effects`, async () => {
    for (const [route, method] of methods) {
      const f = fixture(options);
      const response = await f.invoke(route, method);
      assert.equal(response.status, status, `${method} ${route}`);
      assert.deepEqual(f.calls.business, []);
      assertNoEffects(f);
      assert.equal((await response.text()).includes(PRIVATE), false);
      assert.deepEqual(f.calls.logs, []);
    }
  });
}
for (const role of ["admin", "super_admin"]) {
  test(`current ${role}, with old owner claim, retains all 11 existing draft permissions`, async () => {
    for (const [route, method] of methods) {
      const f = fixture({ role, claim: "owner" });
      const response = await f.invoke(route, method);
      assert.ok(response.status >= 200 && response.status < 300, `${method} ${route}: ${response.status} ${await response.text()}`);
      assert.deepEqual(f.calls.logs, []);
    }
  });
}
for (const actor of ["owner", "concierge"] as const) {
  test(`${actor}: ordinary private lists, inspection details and dispute exports remain accessible`, async () => {
    for (const [route, method] of methods.filter(([, method]) => method === "GET")) {
      const f = fixture({ role: actor, actor });
      const response = await f.invoke(route, method);
      assert.equal(response.status, 200, route);
      assert.equal((await response.text()).includes(PRIVATE), true, route);
      if (route.includes("export")) {
        assert.equal(f.calls.storage.length, 1);
        assert.equal(f.calls.storage[0].ttl, 600);
        assert.equal(f.calls.storage[0].action, "sign");
      }
      assert.deepEqual(f.calls.writes, []);
    }
  });
}
test("foreign ordinary participants cannot read private details, export, mutate or submit", async () => {
  for (const [route, method] of methods) {
    const f = fixture({ role: "owner", actor: "foreign" });
    const response = await f.invoke(route, method);
    assert.equal(response.status, method === "GET" && !route.includes("[id]") ? 200 : 403, `${method} ${route}`);
    assert.equal((await response.text()).includes(PRIVATE), false);
    assertNoEffects(f);
  }
});
test("concierge assigned to the draft retains creation, patch, checklist, upload, deletion and submission", async () => {
  for (const [route, method] of methods.filter(([, method]) => method !== "GET").filter(([route]) => route !== "disputes")) {
    const f = fixture({ role: "concierge", actor: "concierge" });
    const response = await f.invoke(route, method);
    assert.ok([200, 201].includes(response.status), `${method} ${route}: ${response.status}`);
    assert.ok(f.calls.writes.length > 0);
    assert.deepEqual(f.calls.outbound, []);
  }
});
test("owner cannot collect, submit or remove proofs and cannot edit concierge collection fields", async () => {
  for (const [route, method] of methods.filter(([route]) => route.includes("checklist") || route.includes("media") || route.includes("submit"))) {
    const f = fixture({ role: "owner", actor: "owner" });
    assert.equal((await f.invoke(route, method)).status, 403);
    assertNoEffects(f);
  }
  const f = fixture({ role: "owner", actor: "owner" });
  assert.equal((await f.invoke("inspections/[id]", "PATCH", { bookingReference: "Forbidden" })).status, 403);
  assertNoEffects(f);
});
test("ordinary owner retains allowed review transitions but cannot return inspection to draft", async () => {
  const f = fixture({ role: "owner", actor: "owner", status: "submitted", locked: true });
  assert.equal((await f.invoke("inspections/[id]", "PATCH", { status: "reviewed" })).status, 200);
  const denied = fixture({ role: "owner", actor: "owner", status: "submitted", locked: true });
  assert.equal((await denied.invoke("inspections/[id]", "PATCH", { status: "draft" })).status, 400);
  assertNoEffects(denied);
});
test("concierge collection and evidence remain locked after submission", async () => {
  for (const [route, method] of methods.filter(([route, method]) => route.startsWith("inspections/[id]") && method !== "GET")) {
    const f = fixture({ role: "concierge", actor: "concierge", status: "submitted", locked: true });
    assert.equal((await f.invoke(route, method)).status, 409, `${method} ${route}`);
    assertNoEffects(f);
  }
});
test("even current administrators cannot remove Storage evidence locked by the SQL invariant", async () => {
  for (const role of ["admin", "super_admin"]) for (const status of ["submitted", "draft"]) {
    const f = fixture({ role, status, locked: true });
    assert.equal((await f.invoke("inspections/[id]/media/[mediaId]", "DELETE")).status, 409);
    assertNoEffects(f);
  }
});
test("resubmission is refused even for a current administrator", async () => {
  const f = fixture({ status: "submitted", locked: true });
  assert.equal((await f.invoke("inspections/[id]/submit", "POST")).status, 409);
  assertNoEffects(f);
});
test("48-hour dispute boundary is preserved and remains an existing current-admin exemption", async () => {
  for (const age of [48 * 3600000, 48 * 3600000 + 1]) {
    const f = fixture({ role: "owner", actor: "owner", checkoutAgeMs: age });
    assert.equal((await f.invoke("disputes", "POST")).status, age === 48 * 3600000 ? 201 : 400);
    if (age > 48 * 3600000) assertNoEffects(f);
  }
  const admin = fixture({ checkoutAgeMs: 49 * 3600000 });
  assert.equal((await admin.invoke("disputes", "POST")).status, 201);
  const concierge = fixture({ role: "concierge", actor: "concierge" });
  assert.equal((await concierge.invoke("disputes", "POST")).status, 403);
  assertNoEffects(concierge);
});
test("dispute window falls back to submitted_at then created_at", async () => {
  for (const source of ["submitted_at", "created_at"]) {
    const f = fixture({ role: "owner", actor: "owner" });
    f.inspection.checkout_at = null as any;
    f.inspection.submitted_at = source === "submitted_at" ? new Date(NOW - 49 * 3600000).toISOString() : null as any;
    f.inspection.created_at = new Date(NOW - 49 * 3600000).toISOString();
    assert.equal((await f.invoke("disputes", "POST")).status, 400);
    assertNoEffects(f);
  }
});
test("foreign evidence and media IDs cannot attach, delete or enter Storage operations", async () => {
  const dispute = fixture({ role: "owner", actor: "owner" });
  assert.equal((await dispute.invoke("disputes", "POST", { inspectionId: INSPECTION, disputeType: "damage", evidence: { mediaIds: [FOREIGN] } })).status, 400);
  assertNoEffects(dispute);
  const deletion = fixture({ role: "concierge", actor: "concierge" });
  deletion.tables.inspection_media[0].inspection_id = FOREIGN;
  assert.equal((await deletion.invoke("inspections/[id]/media/[mediaId]", "DELETE")).status, 404);
  assertNoEffects(deletion);
});
test("checklist validation and upload constraints still refuse before effects", async () => {
  const f = fixture({ role: "concierge", actor: "concierge" });
  const item = { zoneKey: "living", itemKey: "same", itemLabel: "Window", itemStatus: "ok" };
  assert.equal((await f.invoke("inspections/[id]/checklist", "PUT", { items: [item, item] })).status, 400);
  assert.equal((await f.invoke("inspections/[id]/media", "POST", new FormData())).status, 400);
  assertNoEffects(f);
});
test("a newly suspended participant cannot continue within a later request", async () => {
  const f = fixture({ role: "concierge", actor: "concierge" });
  assert.equal((await f.invoke("inspections/[id]/media", "POST")).status, 201);
  const writes = f.calls.writes.length, storage = f.calls.storage.length;
  f.setProfile({ id: ID, role: "concierge", status: "suspended" });
  assert.equal((await f.invoke("inspections/[id]/media/[mediaId]", "DELETE")).status, 403);
  assert.equal(f.calls.writes.length, writes);
  assert.equal(f.calls.storage.length, storage);
});
