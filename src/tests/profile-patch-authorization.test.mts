import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const native = createRequire(import.meta.url);
const { NextRequest, NextResponse } = native("next/server");
const ID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const PRIVATE = "synthetic-private-database-error";
const compiled = new Map<string, string>();
type Options = {
  claim?: string;
  isAdmin?: boolean;
  profile?: unknown;
  readError?: boolean;
  readThrows?: boolean;
  userId?: string | null;
  principal?: string | null;
  sessionUserId?: string;
};

function fixture(options: Options = {}) {
  const claim = options.claim ?? "admin";
  const userId = options.userId === undefined ? ID : options.userId;
  const principal = options.principal === undefined ? ID : options.principal;
  const profile = Object.hasOwn(options, "profile") ? options.profile : { id: ID, role: "admin", status: "active" };
  const calls = { reads: [] as string[], writes: [] as unknown[], targets: [] as string[], logs: [] as unknown[] };
  const modules = new Map<string, Record<string, any>>();
  const rightsQuery = {
    select: () => rightsQuery,
    eq: (_key: string, id: string) => { calls.reads.push(id); return rightsQuery; },
    maybeSingle: async () => {
      if (options.readThrows) throw new Error(PRIVATE);
      return { data: profile, error: options.readError ? { message: PRIVATE } : null };
    },
  };
  const businessDb = { from: () => ({
    update: (data: unknown) => {
      calls.writes.push(data);
      return { eq: async (_key: string, id: string) => { calls.targets.push(id); return { error: null }; } };
    },
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { onboarding_complete: true, availability_hours: null }, error: null }) }) }),
  }) };
  function execute(file: string): Record<string, any> {
    if (modules.has(file)) return modules.get(file)!;
    let code = compiled.get(file);
    if (!code) {
      code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      compiled.set(file, code);
    }
    const exports = {};
    modules.set(file, exports);
    function requireModule(id: string): unknown {
      if (id === "server-only") return {};
      if (id === "next/server") return { NextRequest, NextResponse };
      if (id === "@/server/auth/apiAuth") return { getApiAuthContext: async () => ({
        userId, sessionUserId: options.sessionUserId ?? ID, role: claim,
        isAdmin: options.isAdmin ?? ["admin", "super_admin"].includes(claim),
      }) };
      if (id === "@/server/auth/adminAccess") return execute("server/auth/adminAccess.ts");
      if (id === "next-auth/jwt") return { getToken: async () => principal ? { id: principal, role: claim, isAdmin: true } : { sub: ID, role: claim } };
      if (id === "./authOptions") return { auth: async () => null };
      if (id === "./principalRights") return execute("server/auth/principalRights.ts");
      if (id === "../db/dbServer") return { db: { from: () => rightsQuery }, isSupabaseServerConfigured: true };
      if (id === "../../app/utils/roles") return execute("app/utils/roles.ts");
      if (id === "@/server/db/dbServer") return { db: businessDb };
      if (id === "./pure") return execute("app/api/profiles/pure.ts");
      if (id === "../../../types/conciergeServiceMode.ts") return execute("types/conciergeServiceMode.ts");
      if (id === "../../lib/profileLocation.ts") return { normalizeProfileLocationFields: (data: unknown) => data };
      if (id === "@/server/profiles/currentProfile") return { fetchCurrentProfile: async (id: string) => ({ data: { id }, error: null }) };
      if (id === "@/features/owner-preferences/profilePreferences") return { mergeOwnerPreferencesIntoAvailabilityHours: () => "synthetic-preferences" };
      if (id === "../../lib/providerSkills.ts") return { isProviderProfileRole: (role: string) => ["provider", "provider_pro", "artisan", "artisan_pro"].includes(role), normalizeProviderSkills: () => ({ invalid: false, services: [] }) };
      throw new Error(`Unexpected import ${id} in ${file}`);
    }
    new Function("require", "exports", "process", "console", code)(requireModule, exports, {
      env: { NEXTAUTH_SECRET: "synthetic-only" },
    }, { info: (...args: unknown[]) => calls.logs.push(args), error: (...args: unknown[]) => calls.logs.push(args) });
    return exports;
  }
  return { calls, patch: (body: unknown) => execute("app/api/profiles/route.ts").PATCH(new NextRequest(`http://localhost/api/profiles?userId=${OTHER}`, {
    method: "PATCH", headers: { "content-type": "application/json", cookie: `planetls_active_profile_id=${OTHER}` }, body: JSON.stringify(body),
  })) };
}

for (const role of ["admin", "super_admin"]) {
  test(`current active ${role} uses current rights, not old claims`, async () => {
    const f = fixture({ claim: "owner", profile: { id: ID, role, status: "active" } });
    const response = await f.patch({ role: role === "super_admin" ? "super_admin" : "provider", category: "artisan" });
    assert.equal(response.status, 200);
    assert.deepEqual(f.calls.reads, [ID]);
    assert.deepEqual(f.calls.targets, [ID]);
    assert.equal(f.calls.writes.length, 1);
  });
}

const refused: [string, Options, number][] = [
  ["downgraded administrator with stale isAdmin", { profile: { id: ID, role: "owner", status: "active" } }, 403],
  ["suspended administrator", { profile: { id: ID, role: "admin", status: "suspended" } }, 403],
  ["deleted administrator", { profile: null }, 401],
  ["deleted status", { profile: { id: ID, role: "admin", status: "deleted" } }, 403],
  ["missing profile", { profile: null }, 401],
  ["unknown role", { profile: { id: ID, role: "root", status: "active" } }, 403],
  ["unknown status", { profile: { id: ID, role: "admin", status: "unknown" } }, 403],
  ["incomplete profile", { profile: { id: ID, role: "admin" } }, 403],
  ["foreign rights row", { profile: { id: OTHER, role: "admin", status: "active" } }, 503],
  ["read failure", { readError: true }, 503],
  ["read exception", { readThrows: true }, 503],
  ["sub without application identity", { principal: null }, 401],
  ["invalid application identity", { principal: "invalid" }, 401],
  ["inconsistent principal", { sessionUserId: OTHER }, 403],
  ["foreign selected profile", { userId: OTHER }, 403],
  ["unauthenticated", { userId: null }, 401],
];
for (const [name, options, status] of refused) {
  test(`PATCH refuses ${name} before every write, without fallback or private errors`, async () => {
    const f = fixture(options);
    const response = await f.patch({ first_name: "Alice", role: "admin" });
    assert.equal(response.status, status);
    assert.deepEqual(f.calls.writes, []);
    assert.deepEqual(f.calls.targets, []);
    assert.equal((await response.text()).includes(PRIVATE), false);
    assert.deepEqual(f.calls.logs, []);
  });
}

for (const claim of ["owner", "owner_pro", "concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro"]) {
  test(`${claim} retains ordinary own-profile edits`, async () => {
    const f = fixture({ claim });
    assert.equal((await f.patch({ first_name: " alice " })).status, 200);
    assert.deepEqual(f.calls.reads, []);
    assert.deepEqual(f.calls.targets, [ID]);
    assert.equal((f.calls.writes[0] as Record<string, unknown>).first_name, "Alice");
  });
}
for (const field of ["role", "category", "status", "id", "user_id", "userId", "profile_id", "profileId", "principalProfileId", "sessionUserId", "activeProfileId", "email"]) {
  test(`ordinary mixed payload with protected ${field} is refused entirely`, async () => {
    const f = fixture({ claim: "owner", profile: { id: ID, role: "owner", status: "active" } });
    assert.equal((await f.patch({ first_name: "Alice", [field]: field === "role" ? "admin" : OTHER })).status, 403);
    assert.deepEqual(f.calls.writes, []);
  });
}
test("a stale administrator cannot silently fall back to an ordinary edit", async () => {
  const f = fixture({ profile: { id: ID, role: "owner", status: "active" } });
  assert.equal((await f.patch({ first_name: "Alice" })).status, 403);
  assert.deepEqual(f.calls.writes, []);
});
test("a selected administrative role cannot grant rights to an ordinary principal", async () => {
  const f = fixture({ profile: { id: ID, role: "owner", status: "active" }, isAdmin: true });
  assert.equal((await f.patch({ category: "admin" })).status, 403);
  assert.deepEqual(f.calls.writes, []);
});
test("current admin cannot assign super_admin despite an old super_admin JWT", async () => {
  const f = fixture({ claim: "super_admin" });
  assert.equal((await f.patch({ role: " SUPER_ADMIN " })).status, 403);
  assert.deepEqual(f.calls.writes, []);
});
test("current admin still rejects unknown roles and status writes", async () => {
  for (const body of [{ role: "root" }, { status: "active" }]) {
    const f = fixture();
    assert.equal((await f.patch(body)).status, "role" in body ? 400 : 403);
    assert.deepEqual(f.calls.writes, []);
  }
});
