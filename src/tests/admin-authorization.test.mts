import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { encode, getToken as realGetToken } from "next-auth/jwt";

const native = createRequire(import.meta.url);
const { NextRequest, NextResponse } = native("next/server");
const ID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const SECRET = "synthetic-admin-authorization-only-secret";
const PRIVATE = "private-transport-secret-must-not-leak";
const row = (overrides = {}) => ({ id: ID, role: "admin", status: "active", ...overrides });
const compiled = new Map<string, string>();

type Options = {
  token?: Record<string, unknown> | null;
  session?: unknown;
  profile?: unknown;
  readError?: unknown;
  readThrows?: boolean;
  authThrows?: boolean;
  tokenThrows?: boolean;
  realJwt?: boolean;
  targetRole?: string;
  businessError?: boolean;
  connectionError?: Error;
};

function fixture(options: Options = {}) {
  let profile = Object.hasOwn(options, "profile") ? options.profile : row();
  const calls = { rights: [] as string[], business: [] as unknown[][], logs: [] as unknown[], mixed: 0 };
  const modules = new Map<string, Record<string, any>>();
  const query = {
    select: () => query,
    eq: (_column: string, id: string) => { calls.rights.push(id); return query; },
    maybeSingle: async () => {
      if (options.readThrows) throw new Error(PRIVATE);
      return { data: profile, error: options.readError ?? null };
    },
  };
  function businessQuery(table: string) {
    calls.business.push(["from", table]);
    const chain: any = new Proxy({}, {
      get: (_target, key: string) => {
        if (key === "then") return (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
        if (key === "single" || key === "maybeSingle") return async () => ({ data: { id: OTHER, role: options.targetRole ?? "owner", category: "proprietaire" }, error: null });
        return (...args: unknown[]) => { calls.business.push([key, ...args]); return chain; };
      },
    });
    return chain;
  }
  const businessDb = {
    from: businessQuery,
    storage: { from: () => ({
      list: async (path: string) => {
        calls.business.push(["storage-list", path]);
        return { data: path ? [{ name: "draft.jpg", created_at: "2020-01-01T00:00:00Z" }] : [{ name: "fixture" }], error: null };
      },
      remove: async (paths: string[]) => { calls.business.push(["storage-remove", paths]); return { error: null }; },
    }) },
  };
  const loadPayload = async () => {
    calls.business.push(["load-payload"]);
    if (options.businessError) throw new Error(PRIVATE);
    return { source: "synthetic" };
  };

  function execute(file: string): Record<string, any> {
    if (modules.has(file)) return modules.get(file)!;
    let code = compiled.get(file);
    if (!code) {
      code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText;
      compiled.set(file, code);
    }
    const exports = {};
    modules.set(file, exports);
    function requireModule(id: string): unknown {
      if (id === "server-only") return {};
      if (id === "next/server") return { NextRequest, NextResponse, connection: async () => {
        if (options.connectionError) throw options.connectionError;
      } };
      if (id === "next-auth/jwt") return { getToken: async (args: Parameters<typeof realGetToken>[0]) => {
        if (options.tokenThrows) throw new Error(PRIVATE);
        if (options.realJwt) return realGetToken(args);
        return options.token === undefined ? { id: ID, role: "admin", status: "active" } : options.token;
      } };
      if (id === "./authOptions") return { auth: async () => {
        if (options.authThrows) throw new Error(PRIVATE);
        return options.session ?? null;
      } };
      if (id === "./principalRights") return execute("server/auth/principalRights.ts");
      if (id === "../../app/utils/roles" || id === "@/app/utils/roles") return execute("app/utils/roles.ts");
      if (id === "../db/dbServer") return { db: { from: () => query }, isSupabaseServerConfigured: true };
      if (id === "./adminAccess" && file === "server/auth/roleGuards.ts") return execute("server/auth/adminAccess.ts");
      if (id === "@/server/auth/adminAccess") return execute("server/auth/adminAccess.ts");
      if (id === "@/server/auth/roleGuards") return execute("server/auth/roleGuards.ts");
      if (id === "./apiAuth") return { getApiAuthContext: async () => {
        calls.mixed++;
        return { userId: OTHER, role: "owner", isAdmin: false, activeProfileId: OTHER };
      } };
      if (id === "@/supabase/supabase-js" || id === "@supabase/supabase-js") return { createClient: () => {
        calls.business.push(["create-client"]); return businessDb;
      } };
      if (id === "@/app/lib/dbServer") return { db: businessDb };
      if (id === "@/server/db/dbServer") return { db: businessDb };
      if (id === "zod") return native(id);
      if (id === "@/app/api/_shared/untypedSupabase") return { asLooseSupabaseClient: (value: unknown) => value };
      if (id === "@/server/prompt-library") return { loadPromptLibrary: loadPayload };
      if (id.endsWith("/developpement/workspaceData")) return { loadProjectAdvisorViewForAdmin: loadPayload };
      if (id === "./actions") return execute("app/api/admin/control-tower/actions.ts");
      if (["./health", "./missionHealth", "@/server/admin/problems", "@/server/admin/problemDetectors", "@/app/lib/commercialWorkflow"].includes(id)) return {};
      if (["./shared", "@/app/lib/activationKpis", "@/server/auth/devWorkspace"].includes(id)) return {};
      if (id === "react") return { cache: (fn: unknown) => fn }; // React render-pass caching is not simulated.
      if (id === "react/jsx-runtime") return native(id);
      if (id === "next/navigation") return { redirect: (path: string) => { throw new Error(`redirect:${path}`); } };
      if (id === "../../adminAccess" || id === "./adminAccess") return execute("app/dashboard/admin/adminAccess.ts");
      if (id === "node:path") return native(id);
      if (id === "node:util") return native(id);
      if (id === "node:child_process") return { execFile: () => { calls.business.push(["git"]); throw new Error("Unexpected Git execution"); } };
      if (id === "node:fs" || id === "node:fs/promises") {
        const read = async () => { calls.business.push(["read-file"]); throw new Error("Unexpected document read"); };
        return { promises: { readFile: read, stat: read, access: read }, readFile: read };
      }
      if (id.endsWith(".scss")) return {};
      if (id.startsWith("@/components/") || id.startsWith("@/features/") || id === "lucide-react" || id === "next/link") return {};
      if (["./architectureDecisions", "./DecisionCenterPage", "../../adminNavigation", "./PersonasView", "./personaCoverage", "../pilotage/economic-model/sharedFinancialReference", "./developerLog", "./MasterPlanViewer", "./masterPlan", "./missionControl", "./roadmap", "./technicalMemory"].includes(id)) return {};
      throw new Error(`Unexpected import ${id} in ${file}`);
    }
    new Function("require", "exports", "process", "console", code)(requireModule, exports, {
      env: { NEXTAUTH_SECRET: SECRET, SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_SERVICE_ROLE_KEY: "synthetic-only" },
      cwd: () => "synthetic-workspace",
    }, { error: (...args: unknown[]) => calls.logs.push(args), warn: (...args: unknown[]) => calls.logs.push(args) });
    return exports;
  }
  function request(method = "GET", cookie = `planetls_active_profile_id=${OTHER}`, body: unknown = { userId: OTHER, principalProfileId: OTHER, role: "super_admin" }) {
    return new NextRequest(`http://localhost/api/admin/test?userId=${OTHER}&role=super_admin`, {
      method, headers: { cookie, "content-type": "application/json" }, ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });
  }
  return { execute, calls, request, setProfile: (value: unknown) => { profile = value; } };
}

const handlers = [
  ["users/[id]", "GET"], ["users/[id]", "PATCH"], ["providers/validation", "GET"],
  ["prompt-library", "GET"], ["overview", "GET"], ["operations", "GET"],
  ["project-advisor", "GET"], ["housing-photos/cleanup", "POST"],
  ["control-tower", "GET"], ["control-tower", "POST"],
] as const;

const refused = [
  { name: "unauthenticated", options: { token: null }, status: 401 },
  { name: "owner with stale admin claim", options: { profile: row({ role: "owner" }) }, status: 403 },
  { name: "suspended administrator", options: { profile: row({ status: "suspended" }) }, status: 403 },
  { name: "deleted administrator", options: { profile: row({ status: "deleted" }) }, status: 403 },
  { name: "missing current profile", options: { profile: null }, status: 401 },
  { name: "unknown role", options: { profile: row({ role: "unknown" }) }, status: 403 },
  { name: "unknown status", options: { profile: row({ status: "unknown" }) }, status: 403 },
  { name: "identity absent despite sub and admin role", options: { token: { sub: OTHER, role: "admin" } }, status: 401 },
  { name: "malformed application identity", options: { token: { id: "not-a-profile-id", role: "admin" } }, status: 401 },
  { name: "principal mismatch", options: { profile: row({ id: OTHER }) }, status: 503 },
  { name: "incomplete profile", options: { profile: { id: ID } }, status: 403 },
  { name: "private DB error", options: { readError: { message: PRIVATE } }, status: 503 },
  { name: "thrown DB error", options: { readThrows: true }, status: 503 },
  { name: "authentication exception", options: { token: null, authThrows: true }, status: 503 },
  { name: "JWT reader exception", options: { tokenThrows: true }, status: 503 },
] satisfies Array<{ name: string; options: Options; status: number }>;

for (const scenario of refused) test(`${scenario.name}: all admin handlers deny before business actions`, async () => {
  const f = fixture(scenario.options);
  for (const [route, method] of handlers) {
    const response = await f.execute(`app/api/admin/${route}/route.ts`)[method](f.request(method), { params: Promise.resolve({ id: OTHER }) });
    assert.equal(response.status, scenario.status, `${method} ${route}`);
    assert.doesNotMatch(await response.text(), new RegExp(`${PRIVATE}|${OTHER}|synthetic-only`));
  }
  // This admin-only action lives outside /api/admin, but shares the same guard.
  const providerResponse = await f.execute("app/api/provider/profile-documents/[id]/route.ts").PATCH(f.request("PATCH"), { params: Promise.resolve({ id: OTHER }) });
  assert.equal(providerResponse.status, scenario.status);
  for (const [path, method] of [["kpis/overview", "GET"], ["onboarding-events", "GET"], ["services/services-catalog", "POST"]] as const) {
    const response = await f.execute(`app/api/${path}/route.ts`)[method](f.request(method));
    assert.equal(response.status, scenario.status, `${method} ${path}`);
    assert.doesNotMatch(await response.text(), new RegExp(PRIVATE));
  }
  assert.deepEqual(f.calls.business, []);
  assert.deepEqual(f.calls.logs, []);
  assert.equal(f.calls.mixed, 0);
  assert.ok(f.calls.rights.every((id) => id === ID));
});

for (const role of ["admin", "super_admin"]) test(`active ${role}: real guard, read handlers and cleanup remain usable`, async () => {
  const f = fixture({ profile: row({ role }), token: { id: ID, role: "owner" } });
  const guard = await f.execute("server/auth/adminAccess.ts").requireAdminApiAccess(f.request());
  assert.deepEqual(guard, { ok: true, auth: { userId: ID, sessionUserId: ID, role, isAdmin: true } });
  for (const route of ["prompt-library", "project-advisor"]) {
    const response = await f.execute(`app/api/admin/${route}/route.ts`).GET(f.request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { source: "synthetic" });
  }
  const cleanup = await f.execute("app/api/admin/housing-photos/cleanup/route.ts").POST(new NextRequest("http://localhost/api/admin/housing-photos/cleanup?dryRun=false", { method: "POST" }));
  assert.equal(cleanup.status, 200);
  assert.equal((await cleanup.json()).removed, 1);
  assert.ok(f.calls.business.some(([action]) => action === "storage-remove"));
  assert.equal(f.calls.mixed, 0);
});

test("current super-admin restrictions survive an old super-admin JWT", async () => {
  const f = fixture({ token: { id: ID, role: "super_admin" }, profile: row({ role: "admin" }), targetRole: "super_admin" });
  const response = await f.execute("app/api/admin/users/[id]/route.ts").PATCH(f.request("PATCH"), { params: Promise.resolve({ id: OTHER }) });
  assert.equal(response.status, 403);
  assert.ok(!f.calls.business.some(([action]) => action === "update"));
});

test("an authorized account update keeps the existing handler behavior", async () => {
  const f = fixture({ profile: row({ role: "super_admin" }) });
  const response = await f.execute("app/api/admin/users/[id]/route.ts").PATCH(f.request("PATCH", "", { status: "suspended" }), { params: Promise.resolve({ id: OTHER }) });
  assert.equal(response.status, 200);
  assert.ok(f.calls.business.some(([action]) => action === "update"));
  assert.deepEqual(f.calls.rights, [ID]);
});

test("admin-only guard respects a super-admin-only role set", async () => {
  const f = fixture();
  const guard = await f.execute("server/auth/roleGuards.ts").requireApiRole(f.request(), new Set(["super_admin"]));
  assert.equal(guard.ok, false);
  assert.equal(guard.response.status, 403);
});

test("mixed business guards retain their existing profile-selection behavior", async () => {
  const f = fixture({ profile: null });
  const guard = await f.execute("server/auth/roleGuards.ts").requireApiRole(f.request(), new Set(["owner", "admin"]));
  assert.equal(guard.ok, true);
  assert.equal(guard.auth.userId, OTHER);
  assert.equal(f.calls.mixed, 1);
  assert.deepEqual(f.calls.rights, []);
});

test("successive requests revalidate downgrade and suspension without cached rights", async () => {
  const f = fixture();
  const gate = f.execute("server/auth/adminAccess.ts").requireAdminApiAccess;
  assert.equal((await gate(f.request())).ok, true);
  f.setProfile(row({ role: "owner" }));
  assert.equal((await gate(f.request())).response.status, 403);
  f.setProfile(row({ status: "suspended" }));
  assert.equal((await gate(f.request())).response.status, 403);
  assert.deepEqual(f.calls.rights, [ID, ID, ID]);
});

test("the installed JWT verifier rejects expired and invalid tokens", async () => {
  for (const cookieValue of ["invalid", await encode({ token: { id: ID, role: "admin" }, secret: SECRET, salt: "authjs.session-token", maxAge: -3600 })]) {
    const f = fixture({ realJwt: true });
    const result = await f.execute("server/auth/adminAccess.ts").requireAdminApiAccess(f.request("GET", `authjs.session-token=${cookieValue}`));
    assert.equal(result.response.status, 401);
    assert.deepEqual(f.calls.rights, []);
  }
  const token = await encode({ token: { id: ID, role: "admin" }, secret: SECRET, salt: "authjs.session-token" });
  const f = fixture({ realJwt: true });
  assert.equal((await f.execute("server/auth/adminAccess.ts").requireAdminApiAccess(f.request("GET", `authjs.session-token=${token}`))).ok, true);
});

test("the session fallback checks principal ID and current rights", async () => {
  const f = fixture({ token: null, session: { user: { id: ID, role: "admin" } }, profile: row({ role: "owner" }) });
  assert.equal((await f.execute("server/auth/adminAccess.ts").requireAdminApiAccess(f.request())).response.status, 403);
});

for (const scenario of [
  { profile: row({ role: "owner" }), expected: /redirect:\/unauthorized/ },
  { profile: row({ status: "suspended" }), expected: /redirect:\/unauthorized/ },
  { profile: null, expected: /redirect:\/login/ },
  { readError: { message: PRIVATE }, expected: /Vérification des droits administratifs indisponible/ },
]) test(`server layout and sensitive pages deny before reads: ${String(scenario.expected)}`, async () => {
  const f = fixture({ ...scenario, session: { user: { id: ID, role: "admin", name: "Synthetic" } } });
  for (const path of [
    "layout.tsx", "(product-tech)/decisions-architecture/page.tsx", "(business)/modele-financier/page.tsx", "(product-tech)/developpement/page.tsx", "(business)/personas/page.tsx",
  ]) {
    await assert.rejects(() => f.execute(`app/dashboard/admin/${path}`).default({ children: "private" }), scenario.expected);
  }
  assert.deepEqual(f.calls.business, []);
  assert.deepEqual(f.calls.logs, []);
});

test("admin prerender interruption propagates before authentication and private reads", async () => {
  const interruption = new Error("synthetic Next.js prerender interruption");
  const f = fixture({ connectionError: interruption, authThrows: true });
  await assert.rejects(
    () => f.execute("app/dashboard/admin/adminAccess.ts").requireAdminAccess(),
    (error) => error === interruption,
  );
  assert.deepEqual(f.calls.rights, []);
  assert.deepEqual(f.calls.business, []);
});

test("server admin access preserves authorized session presentation with current role", async () => {
  const f = fixture({ session: { expires: "2030-01-01", user: { id: ID, role: "super_admin", status: "suspended", name: "Synthetic", email: "fixture@example.invalid" } } });
  const session = await f.execute("app/dashboard/admin/adminAccess.ts").requireAdminAccess();
  assert.equal(session.user.role, "admin");
  assert.equal(session.user.status, "active");
  assert.equal(session.user.name, "Synthetic");
  assert.equal(session.user.email, "fixture@example.invalid");
});

test("server access rejects truthy auth errors and sessions without application identity", async () => {
  for (const session of [{ message: PRIVATE }, { user: { role: "admin" } }]) {
    const f = fixture({ session });
    await assert.rejects(() => f.execute("app/dashboard/admin/adminAccess.ts").requireAdminAccess(), /redirect:\/login/);
    assert.deepEqual(f.calls.rights, []);
    assert.deepEqual(f.calls.business, []);
    assert.deepEqual(f.calls.logs, []);
  }
});

test("private business-load errors are not returned by prompt/advisor handlers", async () => {
  const f = fixture({ businessError: true });
  for (const path of ["prompt-library", "project-advisor"]) {
    const response = await f.execute(`app/api/admin/${path}/route.ts`).GET(f.request());
    assert.equal(response.status, 500);
    assert.doesNotMatch(await response.text(), new RegExp(PRIVATE));
  }
});
