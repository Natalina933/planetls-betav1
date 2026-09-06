import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");
// Execute the actual route, replacing only external services. No live credentials or network.
const compiledRoute = ts.transpileModule(
  readFileSync(new URL("../app/api/auth/register/route.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function loadRoute(profileFailure = false) {
  const calls = { clients: 0, network: 0, auth: [] as Record<string, unknown>[], profiles: [] as Record<string, unknown>[], deleted: [] as string[] };
  const client = {
    auth: { admin: {
      createUser: async (input: Record<string, unknown>) => {
        calls.auth.push(input);
        return { data: { user: { id: "fixture-user" } }, error: null };
      },
      deleteUser: async (id: string) => { calls.deleted.push(id); return { error: null }; },
    } },
    from: (table: string) => {
      assert.equal(table, "profiles");
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert: async (input: Record<string, unknown>) => {
          calls.profiles.push(input);
          return { error: profileFailure ? new Error("Fixture profile failure") : null };
        },
      };
    },
  };
  const exports: { POST?: (request: Request) => Promise<Response> } = {};
  runInNewContext(compiledRoute, {
    exports,
    require: (name: string) => {
      if (name === "next/server") return { NextRequest, NextResponse };
      if (name === "zod") return require("zod");
      if (name === "@supabase/supabase-js") return { createClient: () => { calls.clients++; return client; } };
      throw new Error(`Unexpected route dependency: ${name}`);
    },
    process: { env: { NODE_ENV: "production" } },
    console: { error: () => {} },
    URL,
    fetch: async () => { calls.network++; throw new Error("Network forbidden in registration tests"); },
  });
  assert.ok(exports.POST);
  return { post: exports.POST, calls };
}

const validBody = {
  username: "signup-fixture", password: "Fixture-password-2026", email: "signup@example.test",
  firstName: "Élodie", lastName: "Martin", category: "proprietaire",
};

function request(body: unknown) {
  return new NextRequest("https://planetls.example.test/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

for (const category of [
  "admin", "super_admin", "owner_pro", "proprietaire_pro", "concierge_pro", "provider_pro", "artisan_pro", "service_pro",
  "super-admin", "PRO", "ADMIN", " admin ", "concierge_pro_extra", "proprietaire-anything", "artisan-anything",
  "owner", "provider", "service", "merchant", "__proto__", "constructor", "", null, 1, {}, ["concierge"],
]) {
  test(`public registration rejects category ${JSON.stringify(category)} before any external call`, async () => {
    const { post, calls } = loadRoute();
    const response = await post(request({ ...validBody, category, location: "Paris" }));
    assert.equal(response.status, 400);
    assert.ok((await response.json()).details.category);
    assert.equal(calls.clients, 0);
    assert.equal(calls.network, 0);
    assert.equal(calls.auth.length, 0);
    assert.equal(calls.profiles.length, 0);
  });
}

for (const role of ["admin", "super_admin", "owner_pro", "concierge_pro", "provider_pro", "owner", null]) {
  test(`public registration refuses explicit role ${JSON.stringify(role)} even with a public category`, async () => {
    const { post, calls } = loadRoute();
    const response = await post(request({ ...validBody, role }));
    assert.equal(response.status, 400);
    assert.ok((await response.json()).details.role);
    assert.equal(calls.clients, 0);
    assert.equal(calls.auth.length, 0);
  });
}

test("missing category and malformed JSON fail closed without Supabase", async () => {
  const { post, calls } = loadRoute();
  const { category: _category, ...body } = validBody;
  assert.equal((await post(request(body))).status, 400);
  assert.equal((await post(new NextRequest("https://planetls.example.test/api/auth/register", { method: "POST", body: "{" }))).status, 400);
  assert.equal(calls.clients, 0);
});

for (const [category, role] of [["proprietaire", "owner"], ["concierge", "concierge"], ["artisan", "provider"]]) {
  test(`public registration persists only server role ${role} for ${category}`, async () => {
    const { post, calls } = loadRoute();
    const response = await post(request({ ...validBody, category, user_metadata: { role: "admin" }, app_metadata: { role: "super_admin" } }));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).user.role, role);
    assert.equal(calls.auth.length, 1);
    assert.equal((calls.auth[0].user_metadata as { role: string }).role, role);
    assert.equal(calls.auth[0].app_metadata, undefined);
    assert.equal(calls.profiles.length, 1);
    assert.equal(calls.profiles[0].role, role);
    assert.equal(calls.profiles[0].category, category);
    assert.equal(calls.profiles[0].first_name, "Élodie");
    assert.equal(calls.network, 0);
  });
}

test("profile persistence failure still compensates the newly created Auth account", async () => {
  const { post, calls } = loadRoute(true);
  assert.equal((await post(request(validBody))).status, 500);
  assert.deepEqual(calls.deleted, ["fixture-user"]);
});
