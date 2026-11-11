import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { getToken as verifyToken } from "next-auth/jwt";

const native = createRequire(import.meta.url);
const { NextRequest, NextResponse } = native("next/server");
const ID = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const SELECTED = "33333333-3333-4333-8333-333333333333";
const PRIVATE = "synthetic-private-transport-error";
const compiled = new Map<string, string>();
type Row = Record<string, any>;
type Options = {
  role?: string; claim?: string; profile?: unknown; token?: Row | null;
  readError?: boolean; readThrows?: boolean; tokenThrows?: boolean;
  session?: unknown; authThrows?: boolean; invalidJwt?: boolean;
  selected?: Row; resourceOwner?: string; collaboration?: boolean;
};

function fixture(options: Options = {}) {
  const role = options.role ?? "admin";
  const claim = options.claim ?? role;
  let profile = Object.hasOwn(options, "profile") ? options.profile : { id: ID, role, status: "active", email: "fixture@example.invalid" };
  const token = Object.hasOwn(options, "token") ? options.token : { id: ID, role: claim, email: "fixture@example.invalid" };
  const calls = { rights: [] as string[], business: [] as string[], mutations: [] as Row[], logs: [] as unknown[] };
  const modules = new Map<string, Row>();
  const owner = options.resourceOwner ?? OTHER;
  const base = { id: OTHER, profile_id: owner, concierge_profile_id: owner, name: "Existing", title: "Existing", label: "Existing", amount: 10, notes: PRIVATE };
  const tables: Record<string, Row[]> = Object.fromEntries([
    "services_contracts", "services_pricing", "services_packages", "pricing_packages", "contract_templates", "pricing_segments", "pricing_property_rules", "pricing_strategy_scenarios", "services_package_items",
  ].map(table => [table, [{ ...base, ...(table === "services_contracts" ? { collaboration_id: options.collaboration ? OTHER : null } : {}) }]]));

  function profileQuery() {
    let id = "";
    return {
      select() { return this; },
      eq(_column: string, value: string) { id = value; calls.rights.push(value); return this; },
      async maybeSingle() {
        if (options.readThrows) throw new Error(PRIVATE);
        return { data: id === SELECTED ? options.selected ?? null : profile, error: options.readError ? { message: PRIVATE } : null };
      },
    };
  }
  function businessQuery(table: string) {
    let operation = "select";
    let payload: Row | Row[] = {};
    const filters: Array<(row: Row) => boolean> = [];
    function result(single = false) {
      calls.business.push(`${table}:${operation}`);
      let rows = tables[table] ?? [];
      const matching = rows.filter(row => filters.every(filter => filter(row)));
      if (operation === "insert") {
        const inserted = (Array.isArray(payload) ? payload : [payload]).map(row => ({ id: SELECTED, ...row }));
        calls.mutations.push(...inserted.map(row => ({ table, operation, ...row })));
        tables[table] = [...rows, ...inserted];
        rows = inserted;
      } else {
        rows = matching;
        if (operation !== "select") {
          calls.mutations.push(...matching.map(row => ({ table, operation, id: row.id, payload })));
          if (operation === "update") matching.forEach(row => Object.assign(row, payload));
          if (operation === "delete") tables[table] = (tables[table] ?? []).filter(row => !matching.includes(row));
        }
      }
      return { data: single ? rows[0] ?? null : rows, error: null, count: rows.length };
    }
    const query: any = {
      select: () => query,
      eq: (column: string, value: unknown) => { filters.push(row => row[column] === value); return query; },
      is: (column: string, value: unknown) => { filters.push(row => row[column] === value); return query; },
      order: () => query,
      gte: () => query,
      lte: () => query,
      insert: (value: Row | Row[]) => { operation = "insert"; payload = value; return query; },
      update: (value: Row) => { operation = "update"; payload = value; return query; },
      delete: () => { operation = "delete"; return query; },
      single: async () => result(true),
      maybeSingle: async () => result(true),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
    };
    return query;
  }
  const db = { from: (table: string) => table === "profiles" ? profileQuery() : businessQuery(table) };
  function execute(file: string): Row {
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
      if (id === "next-auth/jwt") return { getToken: async (args: Parameters<typeof verifyToken>[0]) => {
        if (options.tokenThrows) throw new Error(PRIVATE);
        return options.invalidJwt ? verifyToken(args) : token;
      } };
      if (id === "./authOptions" || id === "@/server/auth/authOptions") return { auth: async () => {
        if (options.authThrows) throw new Error(PRIVATE);
        return options.session ?? null;
      } };
      if (id === "./apiAuth") return execute("server/auth/apiAuth.ts");
      if (id === "./principalRights") return execute("server/auth/principalRights.ts");
      if (id === "../db/dbServer") return { db, isSupabaseServerConfigured: true };
      if (id === "../../app/utils/roles" || id === "@/app/utils/roles") return execute("app/utils/roles.ts");
      if (id === "@/app/lib/dbServer") return { db };
      if (id === "@/server/auth/commercialAccess") return execute("server/auth/commercialAccess.ts");
      if (id.startsWith("@/app/api/")) return execute(id.slice(2) + ".ts");
      throw new Error(`Unexpected import ${id} in ${file}`);
    }
    new Function("require", "exports", "process", "console", code)(requireModule, exports, {
      env: { NEXTAUTH_SECRET: "synthetic-commercial-test-secret" },
    }, { error: (...args: unknown[]) => calls.logs.push(args) });
    return exports;
  }
  async function invoke(path: string, method: string, body: unknown = {}, query = "") {
    const cookies = options.invalidJwt ? "authjs.session-token=invalid" : options.selected ? `planetls_active_profile_id=${SELECTED}` : "";
    const request = new NextRequest(`http://localhost/api/${path.replace("/[id]", "/" + OTHER)}?id=${OTHER}${query}`, {
      method, headers: { cookie: cookies, "content-type": "application/json" }, ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });
    return execute(`app/api/${path}/route.ts`)[method](request, { params: Promise.resolve({ id: OTHER }) });
  }
  return { invoke, calls, setProfile: (row: unknown) => { profile = row; }, tables };
}

const endpoints: [string, string[]][] = [
  ["services/contracts", ["GET", "POST"]], ["services/contracts/[id]", ["GET", "PATCH", "DELETE"]],
  ["services/service_pricing", ["GET", "POST", "DELETE"]], ["services/service_pricing/[id]", ["GET", "PATCH", "DELETE"]],
  ["services/pricing-packages", ["GET", "POST"]], ["services/pricing-packages/[id]", ["DELETE"]],
  ["services/contract-templates", ["GET", "POST"]], ["services/packages", ["GET", "POST"]],
  ["pricing", ["GET", "POST"]], ["pricing/[id]", ["GET", "PATCH", "DELETE"]],
  ...["segments", "property-rules", "strategy-scenarios"].flatMap(name => [
    [`pricing/${name}`, ["GET", "POST"]], [`pricing/${name}/[id]`, ["PATCH", "DELETE"]],
  ] as [string, string[]][]),
];
const validBody = {
  title: "Synthetic contract", start_date: "2026-11-11", label: "Synthetic tariff", amount: 20,
  package_id: OTHER, content: "Synthetic template", name: "New package", category: "cleaning", service_ids: [1],
  property_type: "apartment", delta_pct: 5, simulation: { amount: 20 },
};
const deniedScenarios: [string, Options, number][] = [
  ["old admin downgraded to owner", { claim: "admin", role: "owner" }, 403],
  ["old admin downgraded to concierge, including own resources", { claim: "admin", role: "concierge", resourceOwner: ID }, 403],
  ["suspended admin", { profile: { id: ID, role: "admin", status: "suspended" } }, 403],
  ["suspended ordinary professional on own resources", { role: "provider", profile: { id: ID, role: "provider", status: "suspended" }, resourceOwner: ID }, 403],
  ["deleted ordinary professional on own resources", { role: "concierge", profile: null, resourceOwner: ID }, 401],
  ["deleted admin", { profile: null }, 401],
  ["deleted status", { profile: { id: ID, role: "admin", status: "deleted" } }, 403],
  ["unknown status", { profile: { id: ID, role: "admin", status: "unknown" } }, 403],
  ["missing application id, despite sub", { token: { sub: ID, role: "admin" } }, 401],
  ["invalid id", { token: { id: "invalid", role: "admin" } }, 401],
  ["unauthenticated", { token: null }, 401],
  ["invalid encrypted JWT", { invalidJwt: true }, 401],
  ["profile read error", { readError: true }, 503],
  ["profile read exception", { readThrows: true }, 503],
  ["JWT transport failure", { tokenThrows: true }, 503],
  ["session transport failure", { token: null, authThrows: true }, 503],
  ["incoherent row", { profile: { id: OTHER, role: "admin", status: "active" } }, 503],
  ["unknown role", { profile: { id: ID, role: "root", status: "active" } }, 403],
  ["selected admin never grants admin to an ordinary principal", { role: "concierge", selected: { id: SELECTED, role: "admin", status: "active", email: "fixture@example.invalid" } }, 403],
  ["selected suspended profile", { role: "concierge", selected: { id: SELECTED, role: "provider", status: "suspended", email: "fixture@example.invalid" } }, 403],
];
for (const [name, options, status] of deniedScenarios) {
  test(`${name}: all 35 commercial handlers refuse before business queries or writes`, async () => {
    for (const [path, methods] of endpoints) for (const method of methods) {
      const f = fixture(options);
      const response = await f.invoke(path, method, validBody);
      assert.equal(response.status, status, `${method} ${path}`);
      assert.deepEqual(f.calls.business, [], `${method} ${path}`);
      assert.deepEqual(f.calls.mutations, []);
      assert.equal((await response.text()).includes(PRIVATE), false);
      assert.deepEqual(f.calls.logs, []);
    }
  });
}
for (const role of ["admin", "super_admin", "concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro"]) {
  test(`${role}: all 35 valid own-resource operations remain available`, async () => {
    for (const [path, methods] of endpoints) for (const method of methods) {
      const f = fixture({ role, resourceOwner: ID });
      const response = await f.invoke(path, method, validBody);
      assert.ok(response.status >= 200 && response.status < 300, `${role} ${method} ${path}: ${response.status} ${await response.text()}`);
      assert.deepEqual(f.calls.logs, []);
    }
  });
}
for (const role of ["admin", "super_admin"]) {
  test(`current ${role}, despite an old owner claim, retains only existing foreign-resource exemptions`, async () => {
    for (const [path, method] of [
      ["services/contracts/[id]", "PATCH"], ["services/contracts/[id]", "DELETE"],
      ["services/service_pricing/[id]", "PATCH"], ["services/service_pricing/[id]", "DELETE"],
      ["services/pricing-packages/[id]", "DELETE"], ["services/contract-templates", "POST"],
      ["services/pricing-packages", "POST"], ["pricing/[id]", "PATCH"], ["pricing/[id]", "DELETE"],
      ...["segments", "property-rules", "strategy-scenarios"].flatMap(name => [[`pricing/${name}/[id]`, "PATCH"], [`pricing/${name}/[id]`, "DELETE"]]),
    ]) {
      const f = fixture({ role, claim: "owner" });
      assert.ok((await f.invoke(path, method, validBody)).status < 300, `${method} ${path}`);
      assert.ok(f.calls.mutations.length > 0);
    }
  });
}
for (const role of ["concierge", "provider"]) {
  test(`${role}: foreign modifications, deletes and package attachments remain forbidden`, async () => {
    for (const [path, method] of [
      ["services/contracts/[id]", "PATCH"], ["services/contracts/[id]", "DELETE"],
      ["services/service_pricing", "DELETE"], ["services/service_pricing/[id]", "PATCH"], ["services/service_pricing/[id]", "DELETE"],
      ["services/pricing-packages/[id]", "DELETE"], ["services/pricing-packages", "POST"], ["services/contract-templates", "POST"],
      ["pricing/[id]", "PATCH"], ["pricing/[id]", "DELETE"],
      ...["segments", "property-rules", "strategy-scenarios"].flatMap(name => [[`pricing/${name}/[id]`, "PATCH"], [`pricing/${name}/[id]`, "DELETE"]]),
    ]) {
      const f = fixture({ role });
      const response = await f.invoke(path, method, validBody);
      assert.ok([403, 404].includes(response.status), `${method} ${path}`);
      assert.deepEqual(f.calls.mutations, []);
    }
  });
}
test("private lists and individual reads retain ordinary ownership scopes", async () => {
  for (const [path, methods] of endpoints) if (methods.includes("GET")) {
    const f = fixture({ role: "concierge" });
    const response = await f.invoke(path, "GET");
    assert.ok([200, 403, 404].includes(response.status));
    assert.equal((await response.text()).includes(PRIVATE), false, path);
    assert.deepEqual(f.calls.mutations, []);
  }
});
test("current administrative private reads retain their existing visibility", async () => {
  for (const path of ["services/contracts", "services/contracts/[id]", "services/service_pricing", "services/service_pricing/[id]", "services/packages", "services/pricing-packages", "services/contract-templates", "pricing/[id]"]) {
    const f = fixture();
    const response = await f.invoke(path, "GET");
    assert.equal(response.status, 200, path);
    assert.equal((await response.text()).includes(PRIVATE), true, path);
  }
});
test("pricing list target parameters do not grant ordinary cross-profile access", async () => {
  const ordinary = fixture({ role: "provider" });
  assert.equal((await ordinary.invoke("services/service_pricing", "GET", {}, `&profile_id=${OTHER}`)).status, 403);
  assert.equal((await ordinary.invoke("pricing", "GET", {}, `&profileId=${OTHER}`)).status, 200);
  const admin = fixture();
  const response = await admin.invoke("pricing", "GET", {}, `&profileId=${OTHER}`);
  assert.equal((await response.text()).includes(PRIVATE), true);
});
test("collaboration contracts remain excluded even for an active administrator", async () => {
  for (const role of ["admin", "super_admin", "concierge"]) for (const method of ["GET", "PATCH", "DELETE"]) {
    const f = fixture({ role, resourceOwner: ID, collaboration: true });
    const response = await f.invoke("services/contracts/[id]", method, validBody);
    assert.equal(response.status, 404);
    assert.deepEqual(f.calls.mutations, []);
  }
});
test("contract patch still ignores ownership and collaboration fields", async () => {
  const f = fixture({ role: "concierge", resourceOwner: ID });
  assert.equal((await f.invoke("services/contracts/[id]", "PATCH", { title: "Updated", profile_id: OTHER, collaboration_id: OTHER, role: "admin" })).status, 200);
  const row = f.tables.services_contracts[0];
  assert.equal(row.profile_id, ID);
  assert.equal(row.collaboration_id, null);
  assert.equal(row.role, undefined);
});
test("existing service pricing amount and service-id checks remain enforced", async () => {
  for (const path of ["services/service_pricing", "services/service_pricing/[id]"]) {
    const method = path.endsWith("[id]") ? "PATCH" : "POST";
    for (const body of [{ label: "Invalid", amount: -1 }, { label: "Invalid", amount: 20, service_id: "invalid" }]) {
      const f = fixture({ role: "provider", resourceOwner: ID });
      assert.equal((await f.invoke(path, method, body)).status, 400);
      assert.deepEqual(f.calls.mutations, []);
    }
  }
});
test("required fields and package-name duplicate check remain enforced", async () => {
  const f = fixture({ role: "concierge", resourceOwner: ID });
  assert.equal((await f.invoke("services/packages", "POST", { ...validBody, name: "Existing" })).status, 409);
  assert.equal((await f.invoke("services/contracts", "POST", {})).status, 400);
  assert.deepEqual(f.calls.mutations, []);
});
test("a linked ordinary professional stays scoped to that selected profile", async () => {
  const selected = { id: SELECTED, email: "fixture@example.invalid", role: "provider", status: "active" };
  const f = fixture({ role: "owner", selected, resourceOwner: SELECTED });
  assert.equal((await f.invoke("services/service_pricing/[id]", "PATCH", { amount: 22 })).status, 200);
  assert.equal(f.calls.mutations.length, 1);
  assert.equal(f.tables.services_pricing[0].profile_id, SELECTED);
});
test("an unrelated selected profile is not used as an identity", async () => {
  const f = fixture({ role: "provider", selected: { id: SELECTED, email: "stranger@example.invalid", role: "admin", status: "active" } });
  assert.equal((await f.invoke("services/service_pricing/[id]", "PATCH", { amount: 22 })).status, 403);
  assert.deepEqual(f.calls.mutations, []);
});
test("a linked administrative profile requires a current administrative principal", async () => {
  const selected = { id: SELECTED, email: "fixture@example.invalid", role: "super_admin", status: "active" };
  const f = fixture({ role: "admin", selected, resourceOwner: SELECTED });
  assert.equal((await f.invoke("services/contracts", "POST", validBody)).status, 201);
  assert.equal(f.calls.mutations[0].profile_id, SELECTED);
});
test("an administrative principal selecting an ordinary profile does not gain an extra exemption there", async () => {
  const selected = { id: SELECTED, email: "fixture@example.invalid", role: "provider", status: "active" };
  const f = fixture({ role: "admin", selected });
  assert.equal((await f.invoke("services/service_pricing/[id]", "PATCH", { amount: 22 })).status, 403);
  assert.deepEqual(f.calls.mutations, []);
});
test("rights are read again after suspension, without a cross-request cache", async () => {
  const f = fixture({ role: "provider", resourceOwner: ID });
  assert.equal((await f.invoke("services/service_pricing/[id]", "PATCH", { amount: 22 })).status, 200);
  const count = f.calls.mutations.length;
  f.setProfile({ id: ID, role: "provider", status: "suspended" });
  assert.equal((await f.invoke("services/service_pricing/[id]", "PATCH", { amount: 23 })).status, 403);
  assert.equal(f.calls.mutations.length, count);
});
test("session fallback authenticates the application id and revalidates it", async () => {
  const f = fixture({ token: null, role: "concierge", session: { user: { id: ID, role: "concierge" } }, resourceOwner: ID });
  assert.equal((await f.invoke("services/contracts", "POST", validBody)).status, 201);
});
