import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const local = "http://127.0.0.1:54321";
const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server");

function compile(path: string) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
}

const routeSource = compile("../app/api/auth/dev-workspace-login/route.ts");
const helperSource = compile("../server/auth/devWorkspace.ts");
const authSource = compile("../server/auth/authOptions.ts");

function load(source: string, env: Record<string, string>, dependencies: Record<string, unknown>) {
  const exports: Record<string, unknown> = {};
  runInNewContext(source, {
    exports, process: { env }, console: { error() {} },
    require(name: string) {
      assert.ok(Object.hasOwn(dependencies, name), name);
      return dependencies[name];
    },
  });
  return exports;
}

function loadRoute(overrides: Record<string, string> = {}) {
  const env = {
    NODE_ENV: "development", WORKSPACE_QUICK_LOGIN_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: local, SUPABASE_SERVICE_ROLE_KEY: "fixture-key",
    TARGET_EMAIL: "workspace@example.test", ...overrides,
  };
  const filters: [string, string][] = [];
  const query = {
    select(field: string) { assert.equal(field, "email"); return this; },
    eq(field: string, value: string) { filters.push([field, value]); return this; },
    maybeSingle() { return { data: { email: "workspace+owner@example.test" }, error: null }; },
  };
  const handlers = load(routeSource, env, {
    "next/server": { NextRequest, NextResponse },
    "@/server/auth/devWorkspace": load(helperSource, env, {}),
    "@supabase/supabase-js": { createClient(url: string) {
      assert.equal(url, local);
      return { from(table: string) { assert.equal(table, "profiles"); return query; } };
    } },
  }) as Record<"GET" | "POST", (req: Request) => Promise<Response>>;
  return { handlers, filters };
}

function request(method: "GET" | "POST", host = "127.0.0.1") {
  return new NextRequest(`http://${host}:3100/api/auth/dev-workspace-login`, {
    method, ...(method === "POST" ? { body: JSON.stringify({ workspace: "owner" }) } : {}),
  });
}

test("le sélecteur est fermé en production, en recette authentifiée et sur une cible distante", async () => {
  for (const [env, host] of [
    [{ NODE_ENV: "production" }, "127.0.0.1"],
    [{ WORKSPACE_QUICK_LOGIN_ENABLED: "false" }, "127.0.0.1"],
    [{ NEXT_PUBLIC_SUPABASE_URL: "https://example.test" }, "127.0.0.1"],
    [{}, "example.test"],
  ] as const) {
    const { handlers, filters } = loadRoute(env);
    for (const method of ["GET", "POST"] as const) {
      assert.equal((await handlers[method](request(method, host))).status, 404);
    }
    assert.deepEqual(filters, []);
  }
});

test("la sélection locale lit un seul profil actif et renvoie uniquement son adresse et les métadonnées d’espace", async () => {
  const { handlers, filters } = loadRoute();
  const response = await handlers.POST(request("POST"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(await response.json()).sort(), ["email", "href", "label", "workspace"]);
  assert.deepEqual(filters, [["role", "owner"], ["status", "active"], ["email", "workspace+owner@example.test"]]);
});

test("NextAuth refuse les identifiants rejetés et conserve la connexion Supabase standard", async () => {
  for (const outcome of ["refus", "erreur", "succès"]) {
    const client = {
      auth: { signInWithPassword() {
        if (outcome === "erreur") throw new Error("Transport indisponible");
        return outcome === "succès"
          ? { data: { user: { id: "profile-id" } }, error: null }
          : { data: { user: null }, error: new Error("Identifiants refusés") };
      } },
      from(table: string) {
        assert.equal(outcome, "succès");
        assert.equal(table, "profiles");
        return { select: () => ({ eq: () => ({ single: () => ({
          data: { id: "profile-id", email: "workspace+owner@example.test", role: "owner", status: "active" },
          error: null,
        }) }) }) };
      },
    };
    const config = load(authSource, { WORKSPACE_QUICK_LOGIN_ENABLED: "true" }, {
      "next-auth": () => ({}),
      "next-auth/providers/credentials": (options: unknown) => options,
      "next-auth/providers/github": () => ({}),
      "next-auth/providers/google": () => ({}),
      "@supabase/supabase-js": { createClient: () => client },
      "@/app/utils/roles": { resolveUserRole: (role: string) => role },
      "@/server/logging/authDebug": { logAuthDebug() {} },
    }).authOptions as { providers: [{ authorize: (input: unknown) => Promise<{ id: string } | null> }] };
    const result = await config.providers[0].authorize({ email: "workspace+owner@example.test", password: "fixture-only" });
    assert.equal(result?.id ?? null, outcome === "succès" ? "profile-id" : null);
  }
});
