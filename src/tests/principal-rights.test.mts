import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import type { AuthenticatedPrincipalIdentity, PrincipalProfileReader } from "../server/auth/principalRights.ts";

const ID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const identity = { principalProfileId: ID };
const row = (overrides: Record<string, unknown> = {}) => ({ id: ID, role: "owner", status: "active", ...overrides });

// Execute the actual server module, replacing only the server boundary and DB.
// No environment, live client, network, or credentials are loaded.
function fixture(configured = true, data: unknown = row(), error: unknown = null, loadError?: Error) {
  const calls: unknown[][] = [];
  const query = {
    select: (value: string) => { calls.push(["select", value]); return query; },
    eq: (column: string, value: string) => { calls.push(["eq", column, value]); return query; },
    maybeSingle: async () => { calls.push(["maybeSingle"]); return { data, error }; },
  };
  function execute(file: string, requireModule: (id: string) => unknown): Record<string, unknown> {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "exports", code)(requireModule, exports);
    return exports;
  }
  const roles = execute("app/utils/roles.ts", (id) => { throw new Error(`Unexpected roles import ${id}`); });
  const resolverModule = execute("server/auth/principalRights.ts", (id) => {
    if (id === "server-only") return {};
    if (id === "../../app/utils/roles") return roles;
    if (id === "../db/dbServer") {
      if (loadError) throw loadError;
      return {
        isSupabaseServerConfigured: configured,
        db: { from: (table: string) => { calls.push(["from", table]); return query; } },
      };
    }
    throw new Error(`Unexpected resolver import ${id}`);
  }) as typeof import("../server/auth/principalRights.ts");
  return { ...resolverModule, calls };
}

const server = fixture();
function reader(data: unknown, error: unknown = null): PrincipalProfileReader {
  return async () => ({ data, error });
}

for (const role of ["owner", "owner_pro", "concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro", "admin", "super_admin"]) {
  test(`current active ${role} returns only minimal rights`, async () => {
    const resolve = server.createPrincipalRightsResolver(reader(row({ role, secret: "must-not-leak", email: "private@example.invalid" })));
    assert.deepEqual(await resolve(identity), { ok: true, context: { principalProfileId: ID, role, status: "active" } });
  });
}

for (const input of [undefined, null, {}, { sub: ID }, { id: ID }, { principalProfileId: "" }, { principalProfileId: "not-a-uuid" }, { principalProfileId: 42 }]) {
  test(`missing or invalid application identity ${JSON.stringify(input)} never reads`, async () => {
    let reads = 0;
    const resolve = server.createPrincipalRightsResolver(async () => { reads++; return { data: row(), error: null }; });
    assert.deepEqual(await resolve(input as AuthenticatedPrincipalIdentity), { ok: false, kind: "identity", reason: "invalid_identity" });
    assert.equal(reads, 0);
  });
}

test("missing principal is an identity refusal", async () => {
  assert.deepEqual(await server.createPrincipalRightsResolver(reader(null))(identity), { ok: false, kind: "identity", reason: "profile_not_found" });
});

for (const status of ["suspended", "deleted", "pending", "actif", "", null, undefined]) {
  test(`status ${String(status)} grants no rights`, async () => {
    assert.deepEqual(await server.createPrincipalRightsResolver(reader(row({ status })))(identity), { ok: false, kind: "forbidden", reason: "inactive_profile" });
  });
}

for (const role of ["unknown", "", null, undefined, 42]) {
  test(`role ${String(role)} does not fall back to category`, async () => {
    assert.deepEqual(await server.createPrincipalRightsResolver(reader(row({ role, category: "admin" })))(identity), { ok: false, kind: "forbidden", reason: "invalid_role" });
  });
}

for (const data of [undefined, {}, [], "invalid", { role: "admin", status: "active" }, row({ id: OTHER })]) {
  test(`incomplete or mismatched profile ${JSON.stringify(data)} is unavailable`, async () => {
    assert.deepEqual(await server.createPrincipalRightsResolver(reader(data))(identity), { ok: false, kind: "unavailable", reason: "invalid_profile_data" });
  });
}

test("errors take precedence over apparently privileged data and reveal nothing", async () => {
  const error = { message: "secret-service-role", details: "private" };
  const denied = { ok: false, kind: "unavailable", reason: "profile_read_failed" };
  assert.deepEqual(await server.createPrincipalRightsResolver(reader(row({ role: "admin" }), error))(identity), denied);
  assert.deepEqual(await server.createPrincipalRightsResolver(async () => { throw error; })(identity), denied);
  const incompleteReader: PrincipalProfileReader = async () => ({ data: row({ role: "admin" }), error: undefined });
  assert.deepEqual(await server.createPrincipalRightsResolver(incompleteReader)(identity), denied);
});

test("malformed reader response fails closed", async () => {
  for (const result of [undefined, {}, { data: row() }]) {
    const resolve = server.createPrincipalRightsResolver((async () => result) as unknown as PrincipalProfileReader);
    assert.deepEqual(await resolve(identity), { ok: false, kind: "unavailable", reason: "invalid_profile_data" });
  }
});

test("JWT claims and active profile selection cannot override current rights", async () => {
  const claimed = { ...identity, role: "admin", status: "active", sub: OTHER, activeProfileId: OTHER };
  const resolve = server.createPrincipalRightsResolver(reader(row({ role: "provider" })));
  assert.deepEqual(await resolve(claimed), { ok: true, context: { principalProfileId: ID, role: "provider", status: "active" } });
  assert.equal((await server.createPrincipalRightsResolver(reader(row({ status: "suspended" })))(claimed)).ok, false);
});

test("each invocation reads again after role changes and suspension", async () => {
  let current = row({ role: "admin" });
  let reads = 0;
  const resolve = server.createPrincipalRightsResolver(async () => { reads++; return { data: current, error: null }; });
  assert.deepEqual(await resolve(identity), { ok: true, context: { principalProfileId: ID, role: "admin", status: "active" } });
  current = row({ role: "owner" });
  assert.deepEqual(await resolve(identity), { ok: true, context: { principalProfileId: ID, role: "owner", status: "active" } });
  current = row({ status: "suspended" });
  assert.equal((await resolve(identity)).ok, false);
  assert.equal(reads, 3);
});

test("production binding reads minimal columns by authenticated ID", async () => {
  const f = fixture();
  assert.deepEqual(await f.resolvePrincipalRights(identity), { ok: true, context: { principalProfileId: ID, role: "owner", status: "active" } });
  assert.deepEqual(f.calls, [["from", "profiles"], ["select", "id,role,status"], ["eq", "id", ID], ["maybeSingle"]]);
});

test("production binding without server configuration never queries fallback DB", async () => {
  const f = fixture(false);
  assert.deepEqual(await f.resolvePrincipalRights(identity), { ok: false, kind: "unavailable", reason: "profile_read_failed" });
  assert.deepEqual(f.calls, []);
});

test("production transport errors also fail closed", async () => {
  const f = fixture(true, row(), { message: "private-connection-error" });
  assert.deepEqual(await f.resolvePrincipalRights(identity), { ok: false, kind: "unavailable", reason: "profile_read_failed" });
});

test("production client initialization failures are unavailable, not privileged", async () => {
  const f = fixture(true, row(), null, new Error("invalid-private-connection-config"));
  assert.deepEqual(await f.resolvePrincipalRights(identity), { ok: false, kind: "unavailable", reason: "profile_read_failed" });
  assert.deepEqual(f.calls, []);
});
