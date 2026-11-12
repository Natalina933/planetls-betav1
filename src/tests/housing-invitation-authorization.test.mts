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
const ID = uuid(1), OWNER = uuid(2), CONCIERGE = uuid(3), INVITATION = uuid(4);
const FOREIGN = uuid(8), SELECTED = uuid(9);
const NOW = Date.parse("2026-11-11T12:00:00Z");
const PRIVATE = "synthetic-private-housing-data";
const compiled = new Map<string, string>();
type Row = Record<string, any>;
type Options = {
  role?: string; claim?: string; actor?: "owner" | "concierge" | "foreign";
  profile?: unknown; token?: Row | null; selected?: Row;
  readError?: boolean; readThrows?: boolean; tokenThrows?: boolean; invalidJwt?: boolean;
  foreignInvitation?: boolean;
};

function fixture(options: Options = {}) {
  const role = options.role ?? "admin";
  let profile = Object.hasOwn(options, "profile") ? options.profile : { id: ID, role, status: "active", email: "actor@example.invalid" };
  const token = Object.hasOwn(options, "token") ? options.token : { id: ID, role: options.claim ?? role, email: "actor@example.invalid" };
  const owner = options.actor === "owner" ? ID : OWNER;
  const concierge = options.actor === "concierge" ? ID : CONCIERGE;
  const calls = { profiles: [] as string[], business: [] as string[], writes: [] as Row[], storage: [] as Row[], outbound: [] as unknown[], logs: [] as unknown[] };
  const photoPath = ID + '/1/proof.jpg';
  const tables: Record<string, Row[]> = {
    housing: [{ id: 1, proprietaire: { owner_profile_id: owner, manager_profile_id: concierge }, nom_logement: 'Synthetic housing', notes: PRIVATE, photo_principale: photoPath, infos: { photos: [photoPath] } }],
    owner_invitations: [{ id: INVITATION, concierge_profile_id: options.foreignInvitation ? FOREIGN : ID, housing_id: 1, invited_email: 'owner@example.invalid', invited_email_normalized: 'owner@example.invalid', status: 'sent', cancelled_at: null, relaunch_count: 0, metadata: {} }],
    owner_invitation_events: [],
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
      if (operation === "insert") {
        rows = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: FOREIGN, ...row }));
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
      order: () => chain, limit: () => chain, ilike: () => chain,
      is: (key: string, value: unknown) => { filters.push(row => row[key] === value); return chain; },
      insert: (value: Row | Row[]) => { operation = "insert"; payload = value; return chain; },
      update: (value: Row) => { operation = "update"; payload = value; return chain; },
      delete: () => { operation = "delete"; return chain; },
      maybeSingle: async () => result(true), single: async () => result(true),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
    };
    return chain;
  }
  const db = { from: (table: string) => table === "profiles" ? profileQuery() : query(table), storage: {
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
      if (id === "./authOptions" || id === "@/server/auth/authOptions") return { auth: async () => null };
      if (id === "@/app/lib/dbServer" || id === "../db/dbServer") return { db, isSupabaseServerConfigured: true };
      if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
      if (id.startsWith("@/")) return execute(id.slice(2) + ".ts");
      if (id.startsWith(".")) return execute(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)).replace(/\.ts$/, "") + ".ts");
      throw new Error(`Unexpected import ${id} in ${file}`);
    }
    new Function("require", "exports", "process", "console", "Date", "fetch", code)(load, exports, {
      env: { NEXTAUTH_SECRET: "synthetic-housing-only-secret", SUPABASE_URL: "https://synthetic.invalid", SUPABASE_SERVICE_ROLE_KEY: "synthetic" },
    }, { error: (...args: unknown[]) => calls.logs.push(args), info: (...args: unknown[]) => calls.outbound.push(args) }, class extends Date { static now() { return NOW; } },
    (...args: unknown[]) => { calls.outbound.push(args); throw new Error("Unexpected outbound request"); });
    return exports;
  }
  async function invoke(route: string, method: string, body?: unknown, draft = false) {
    const cookie = options.invalidJwt ? "authjs.session-token=invalid" : options.selected ? `planetls_active_profile_id=${SELECTED}` : "";
    let requestBody: string | FormData | undefined;
    if (method !== "GET" && method !== "DELETE") {
      if (route === "housing/photos") {
        requestBody = new FormData();
        requestBody.set("file", new File(["synthetic-photo"], "proof.jpg", { type: "image/jpeg" }));
        requestBody.set("housingId", draft ? "draft" : "1");
      } else requestBody = JSON.stringify(body ?? (route.startsWith("owner-invitations")
        ? { housingId: "1", email: "owner@example.invalid" }
        : { nom_logement: "Synthetic edit" }));
    }
    const storagePath = draft ? `${ID}/draft/proof.jpg` : photoPath;
    const req = new NextRequest(`http://localhost/api/${route}?housingId=${draft ? "draft" : "1"}&path=${storagePath}`, {
      method, headers: { cookie, ...(typeof requestBody === "string" ? { "content-type": "application/json" } : {}) }, body: requestBody,
    });
    return execute(`app/api/${route}/route.ts`)[method](req, { params: Promise.resolve({ id: route.startsWith("housing") ? "1" : INVITATION }) });
  }
  return { invoke, calls, tables, setProfile: (value: unknown) => { profile = value; } };
}

const methods: [string, string][] = [
  ["housing", "GET"], ["housing", "POST"],
  ["housing/[id]", "GET"], ["housing/[id]", "PATCH"], ["housing/[id]", "DELETE"],
  ["housing/photos", "GET"], ["housing/photos", "POST"], ["housing/photos", "DELETE"],
  ["owner-invitations", "GET"], ["owner-invitations", "POST"], ["owner-invitations/[id]/resend", "POST"],
];
function assertNoEffects(f: ReturnType<typeof fixture>) {
  assert.deepEqual(f.calls.writes, []);
  assert.deepEqual(f.calls.storage, []);
  assert.deepEqual(f.calls.outbound, []);
}
const denied: [string, Options, number][] = [
  ["demoted admin", { role: "owner", claim: "admin", actor: "owner" }, 403],
  ["demoted super admin", { role: "concierge", claim: "super_admin", actor: "concierge" }, 403],
  ["suspended", { profile: { id: ID, role: "admin", status: "suspended" } }, 403],
  ["deleted", { profile: null }, 401],
  ["sub alone", { token: { sub: ID, role: "admin" } }, 401],
  ["no principal", { token: null }, 401],
  ["invalid JWT", { invalidJwt: true }, 401],
  ["rights read error", { readError: true }, 503],
  ["rights read throws", { readThrows: true }, 503],
  ["authentication error", { tokenThrows: true }, 503],
  ["ambiguous identity", { profile: { id: FOREIGN, role: "admin", status: "active" } }, 503],
  ["invalid role", { profile: { id: ID, role: "root", status: "active" } }, 403],
  ["selected admin alone", { role: "owner", selected: { id: SELECTED, role: "admin", status: "active", email: "actor@example.invalid" } }, 403],
  ["unlinked selection", { role: "owner", selected: { id: SELECTED, role: "owner", status: "active", email: "other@example.invalid" } }, 403],
  ["inactive selection", { selected: { id: SELECTED, role: "owner", status: "suspended", email: "actor@example.invalid" } }, 403],
];
for (const [name, options, status] of denied) {
  test(`${name}: all 11 handlers refuse before private reads or effects`, async () => {
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
  test(`current ${role} with obsolete owner claim retains all 11 permissions`, async () => {
    for (const [route, method] of methods) {
      const f = fixture({ role, claim: "owner" });
      const response = await f.invoke(route, method);
      assert.ok(response.status >= 200 && response.status < 400, `${method} ${route}: ${response.status} ${await response.clone().text()}`);
      if (route.startsWith("owner-invitations") && method === "POST") {
        assert.ok(f.calls.writes.some(row => row.table === "owner_invitations"));
        assert.ok(f.calls.writes.some(row => row.table === "owner_invitation_events"));
        assert.equal(f.calls.outbound.length, 1);
      }
    }
  });
}
for (const role of ["owner", "owner_pro", "concierge", "concierge_pro"]) {
  const actor = role.startsWith("owner") ? "owner" : "concierge";
  test(`${role}: legitimate housing reads, creation, edits, deletion and photos preserved`, async () => {
    for (const [route, method] of methods.filter(([route]) => route.startsWith("housing"))) {
      const f = fixture({ role, actor });
      const response = await f.invoke(route, method);
      assert.ok(response.status >= 200 && response.status < 400, `${method} ${route}: ${response.status} ${await response.clone().text()}`);
      if (method === "GET" && route !== "housing/photos") assert.equal((await response.text()).includes(PRIVATE), true);
      if (route === "housing/photos" && method === "GET") assert.equal(f.calls.storage[0].ttl, 300);
    }
  });
  test(`${role}: foreign housing remains inaccessible`, async () => {
    for (const [route, method] of methods.filter(([route]) => route.startsWith("housing"))) {
      const f = fixture({ role, actor: "foreign" });
      const body = { nom_logement: "Foreign", proprietaire: f.tables.housing[0].proprietaire };
      const response = await f.invoke(route, method, body);
      assert.equal(response.status, route === "housing" && method === "GET" ? 200 : 403, `${method} ${route}`);
      assert.equal((await response.text()).includes(PRIVATE), false);
      assertNoEffects(f);
    }
  });
  test(`${role}: own draft photos remain isolated`, async () => {
    for (const method of ["GET", "POST", "DELETE"]) {
      const f = fixture({ role, actor });
      const response = await f.invoke("housing/photos", method, undefined, true);
      assert.ok(response.status >= 200 && response.status < 400, `${method}: ${response.status}`);
    }
  });
}
for (const role of ["concierge", "concierge_pro"]) {
  test(`${role}: housing manager can list, create and resend invitations`, async () => {
    for (const [route, method] of methods.filter(([route]) => route.startsWith("owner-invitations"))) {
      const f = fixture({ role, actor: "concierge" });
      assert.equal((await f.invoke(route, method)).status, 200, route);
    }
  });
  test(`${role}: foreign invitation cannot be resent even on managed housing`, async () => {
    const f = fixture({ role, actor: "concierge", foreignInvitation: true });
    assert.equal((await f.invoke("owner-invitations/[id]/resend", "POST")).status, 403);
    assertNoEffects(f);
  });
  test(`${role}: foreign housing blocks invitations before writes or email`, async () => {
    for (const [route, method] of methods.filter(([route]) => route.startsWith("owner-invitations"))) {
      const f = fixture({ role, actor: "foreign" });
      assert.equal((await f.invoke(route, method)).status, 400, route);
      assertNoEffects(f);
    }
  });
}
test("owners cannot use concierge-only invitation operations", async () => {
  for (const [route, method] of methods.filter(([route]) => route.startsWith("owner-invitations"))) {
    const f = fixture({ role: "owner", actor: "owner" });
    assert.equal((await f.invoke(route, method)).status, 403);
    assert.deepEqual(f.calls.business, []);
    assertNoEffects(f);
  }
});
test("rights are reread after suspension on the same loaded handlers", async () => {
  const f = fixture({ role: "owner", actor: "owner" });
  assert.equal((await f.invoke("housing/[id]", "GET")).status, 200);
  f.setProfile({ id: ID, role: "owner", status: "suspended" });
  f.calls.business.length = 0;
  assert.equal((await f.invoke("housing/[id]", "PATCH")).status, 403);
  assert.deepEqual(f.calls.business, []);
  assertNoEffects(f);
});
test("linked active owner selection retains housing access without administrative exemption", async () => {
  const selected = { id: SELECTED, role: "owner", status: "active", email: "actor@example.invalid" };
  const f = fixture({ role: "owner", selected });
  f.tables.housing[0].proprietaire.owner_profile_id = SELECTED;
  assert.equal((await f.invoke("housing/[id]", "GET")).status, 200);
  assert.ok(f.calls.profiles.includes(ID));
  assert.ok(f.calls.profiles.includes(SELECTED));
  f.tables.housing[0].proprietaire.owner_profile_id = FOREIGN;
  assert.equal((await f.invoke("housing/[id]", "PATCH")).status, 403);
  assertNoEffects(f);
});
test("administrator selecting an ordinary linked profile keeps its ordinary resource restrictions", async () => {
  const f = fixture({ role: "admin", selected: { id: SELECTED, role: "owner", status: "active", email: "actor@example.invalid" } });
  assert.equal((await f.invoke("housing/[id]", "PATCH")).status, 403);
  assert.equal((await f.invoke("owner-invitations", "POST")).status, 403);
  assertNoEffects(f);
});
test("current ordinary user gains no housing or invitation privilege", async () => {
  for (const [route, method] of methods) {
    const f = fixture({ role: "provider", actor: "owner" });
    const response = await f.invoke(route, method);
    assert.equal(response.status, route === "housing" && method === "GET" ? 200 : 403, `${method} ${route}`);
    assert.equal((await response.text()).includes(PRIVATE), false);
    assertNoEffects(f);
  }
});
