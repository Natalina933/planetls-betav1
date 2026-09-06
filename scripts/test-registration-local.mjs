// Connected security verification. Never loads credentials from .env files.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { createClient } from "@supabase/supabase-js";

const report = { date: new Date().toISOString(), target: null, checks: [], cleanup: "not-needed" };
const runId = `sec005-${randomUUID()}`;
const fixtures = [];
let admin;
let child;
let app;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const check = async (name, work, required = false) => {
  try { await work(); report.checks.push({ name, result: "PASS" }); }
  catch (error) {
    report.checks.push({ name, result: "FAIL", error: error.code && error.code !== "ERR_ASSERTION" ? `Prerequisite/process error: ${error.code}` : error.message });
    process.exitCode = 1;
    if (required) throw error;
  }
};
const localUrl = (raw) => {
  const url = new URL(raw);
  assert.equal(url.protocol, "http:", "Only plain HTTP loopback is accepted");
  assert.equal(url.hostname, "127.0.0.1", "Only numeric loopback is accepted");
  assert.equal(url.username + url.password + url.search + url.hash, "");
  return url.origin;
};
function sql(query) {
  return execFileSync("docker", ["exec", "supabase_db_planetls-betav1", "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
const http = async (path, init = {}) => {
  const response = await fetch(`${app}${path}`, { ...init, redirect: "manual", signal: AbortSignal.timeout(90000) });
  report.http ??= [];
  report.http.push({ path, method: init.method ?? "GET", status: response.status });
  return response;
};
async function login(fixture) {
  const jar = new Map();
  const receive = (response) => response.headers.getSetCookie().forEach((value) => {
    const pair = value.split(";", 1)[0];
    const index = pair.indexOf("=");
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  });
  const cookie = () => [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
  const csrf = await http("/api/auth/csrf");
  assert.equal(csrf.status, 200); receive(csrf);
  const { csrfToken } = await csrf.json();
  assert.ok(csrfToken);
  const response = await http("/api/auth/callback/credentials", {
    method: "POST", headers: { cookie: cookie(), "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
    body: new URLSearchParams({ csrfToken, email: fixture.email, password: fixture.password, callbackUrl: app }),
  });
  assert.equal(response.status, 200); receive(response);
  const session = await http("/api/auth/session", { headers: { cookie: cookie() } });
  assert.equal(session.status, 200);
  const data = await session.json();
  assert.equal(data.user?.role, fixture.role);
  assert.equal(data.user?.email, fixture.email);
  return cookie();
}
async function unchanged(fixture) {
  const auth = await admin.auth.admin.getUserById(fixture.id);
  assert.equal(auth.error, null);
  assert.equal(auth.data.user.user_metadata.role, fixture.role);
  const profile = await admin.from("profiles").select("role,category").eq("id", fixture.id).single();
  assert.equal(profile.error, null);
  assert.equal(profile.data.role, fixture.role);
  assert.equal(profile.data.category, fixture.category);
}
async function listFixtures() {
  const found = [];
  for (let page = 1; ; page++) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    assert.equal(result.error, null);
    found.push(...result.data.users.filter((user) => user.email?.startsWith(`${runId}-`)));
    if (result.data.users.length < 1000) return found;
  }
}
try {
  await check("Local Docker and Supabase provenance (no writes)", async () => {
    assert.equal(readFileSync("supabase/config.toml", "utf8").match(/^project_id\s*=\s*"([^"]+)"/m)?.[1], "planetls-betav1");
    execFileSync("docker", ["inspect", "supabase_db_planetls-betav1"], { stdio: ["ignore", "pipe", "pipe"] });
    const status = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const values = Object.fromEntries(status.split(/\r?\n/).map((line) => line.match(/^([A-Z_]+)="(.*)"$/)).filter(Boolean).map((match) => [match[1], match[2]]));
    const target = localUrl(values.API_URL);
    assert.ok(values.ANON_KEY && values.SERVICE_ROLE_KEY);
    report.target = target;
    admin = createClient(target, values.SERVICE_ROLE_KEY, options);
    report.policies = JSON.parse(sql("SELECT coalesce(json_agg(p), '[]') FROM (SELECT policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='profiles') p"));
    await check("profiles RLS enabled with applicable policies", async () => {
      assert.equal(sql("SELECT relrowsecurity FROM pg_class WHERE oid='public.profiles'::regclass"), "t", "profiles RLS must be enabled");
      assert.ok(report.policies.length, "Missing profiles policies");
    });
    const profile = await admin.from("profiles").select("id,role,category").limit(0);
    assert.equal(profile.error, null);
    // Preflight never starts an app and never creates fixtures.
    if (process.argv.includes("--preflight")) return;
    const port = await new Promise((resolve, reject) => {
      const server = createServer(); server.once("error", reject);
      server.listen(0, "127.0.0.1", () => { const port = server.address().port; server.close(() => resolve(port)); });
    });
    app = `http://127.0.0.1:${port}`;
    const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: target, SUPABASE_URL: target,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY, SUPABASE_ANON_KEY: values.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY, NEXTAUTH_URL: app, AUTH_URL: app,
      NEXTAUTH_SECRET: randomUUID(), AUTH_TRUST_HOST: "true", WORKSPACE_QUICK_LOGIN_ENABLED: "false",
      NEXT_DIST_DIR: ".next-sec005", NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "development" };
    child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], { env, stdio: "ignore", windowsHide: true });
    let startError; child.once("error", (error) => { startError = error; });
    const deadline = Date.now() + 120000;
    while (true) {
      if (startError) throw startError;
      assert.equal(child.exitCode, null, "Isolated Next server stopped");
      try { if ((await http("/api/auth/csrf")).status === 200) break; } catch {}
      assert.ok(Date.now() < deadline, "Isolated Next server did not start");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    report.anonKey = values.ANON_KEY; // Removed before writing the report.
    if (process.argv.includes("--browser-check")) {
      mkdirSync("test-results", { recursive: true });
      writeFileSync("test-results/registration-browser-target.json", JSON.stringify({ app, runId }), "utf8");
      console.log("Local app ready; waiting for browser verification.");
      const browserDeadline = Date.now() + 180000;
      while (true) {
        let verified = false;
        try { verified = JSON.parse(readFileSync("test-results/registration-browser-verified.json", "utf8")).runId === runId; } catch {}
        if (verified) break;
        assert.ok(Date.now() < browserDeadline, "Browser verification timed out before any fixture creation");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }, true);
  if (!process.argv.includes("--preflight")) {
    const anonKey = report.anonKey;
    const base = (label) => ({ email: `${runId}-${label}@example.test`, username: `sec005-${randomUUID().slice(0, 20)}`, password: `Fixture!${randomUUID()}`, firstName: "Élodie", lastName: "Test" });
    const register = (body, cookie = "") => http("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body) });
    for (const [category, role] of [["proprietaire", "owner"], ["concierge", "concierge"], ["artisan", "provider"]]) {
      await check(`HTTP 201 + Auth + profiles + login + admin HTTP 403: ${category}`, async () => {
        const fixture = { ...base(category), category, role };
        const { role: _role, ...body } = fixture;
        const response = await register({ ...body, user_metadata: { role: "admin" }, app_metadata: { role: "super_admin" } });
        assert.equal(response.status, 201);
        fixture.id = (await response.json()).user.id;
        fixtures.push(fixture);
        await unchanged(fixture);
        const userClient = createClient(report.target, anonKey, options);
        const signedIn = await userClient.auth.signInWithPassword({ email: fixture.email, password: fixture.password });
        assert.equal(signedIn.error, null);
        assert.equal(signedIn.data.user.user_metadata.role, role);
        fixture.client = userClient;
        fixture.cookie = await login(fixture);
        assert.equal((await http("/api/admin/control-tower", { headers: { cookie: fixture.cookie } })).status, 403);
        const current = await http("/api/profiles/current", { headers: { cookie: fixture.cookie } });
        assert.equal(current.status, 200);
        assert.equal((await current.json()).role, role);
      });
    }
    const negative = ["admin", "super_admin", "super-admin", "PRO", "owner_pro", "proprietaire_pro", "concierge_pro", "provider_pro", "artisan_pro", "service_pro", "unknown", "", null].map((category) => ({ category }));
    negative.push({ category: "proprietaire", role: "admin" }, { category: "concierge", role: "owner" }, { category: "artisan", role: null }, {});
    for (const cookie of ["", fixtures[0].cookie]) {
      for (const [index, payload] of negative.entries()) {
        await check(`HTTP 400 and no persistence: ${JSON.stringify(payload)}; session=${Boolean(cookie)}`, async () => {
          const body = { ...base(`negative-${Boolean(cookie)}-${index}`), ...payload };
          assert.equal((await register(body, cookie)).status, 400);
          assert.equal((await listFixtures()).some((user) => user.email === body.email), false);
          const profiles = await admin.from("profiles").select("id").eq("email", body.email);
          assert.equal(profiles.error, null); assert.deepEqual(profiles.data, []);
          await unchanged(fixtures[0]);
        });
      }
    }
    await check("Existing session loses admin access after role downgrade", async () => {
      const fixture = fixtures[0];
      try {
        assert.equal((await admin.from("profiles").update({ role: "admin" }).eq("id", fixture.id)).error, null);
        const cookie = await login({ ...fixture, role: "admin" });
        assert.equal((await admin.from("profiles").update({ role: fixture.role }).eq("id", fixture.id)).error, null);
        assert.equal((await http("/api/admin/control-tower", { headers: { cookie } })).status, 403);
      } finally {
        assert.equal((await admin.from("profiles").update({ role: fixture.role }).eq("id", fixture.id)).error, null);
      }
    });
    for (const status of ["suspended", "deleted"]) {
      await check(`Existing session is denied after profile status becomes ${status}`, async () => {
        const fixture = fixtures[0];
        const original = await admin.from("profiles").select("status").eq("id", fixture.id).single();
        assert.equal(original.error, null);
        try {
          assert.equal((await admin.from("profiles").update({ status }).eq("id", fixture.id)).error, null);
          const response = await http("/api/profiles/current", { headers: { cookie: fixture.cookie } });
          assert.ok([401, 403].includes(response.status), `Expected revoked access; HTTP ${response.status}`);
        } finally {
          assert.equal((await admin.from("profiles").update({ status: original.data.status }).eq("id", fixture.id)).error, null);
        }
      });
    }
    for (const fixture of fixtures) {
      await check(`Own profile access, active profile isolation and metadata tampering: ${fixture.role}`, async () => {
        const own = await fixture.client.from("profiles").select("id,role").eq("id", fixture.id).single();
        assert.equal(own.error, null); assert.equal(own.data.role, fixture.role);
        const edit = await fixture.client.from("profiles").update({ first_name: "Élodie test RLS" }).eq("id", fixture.id).select("first_name").single();
        assert.equal(edit.error, null); assert.equal(edit.data.first_name, "Élodie test RLS");
        const neighbor = fixtures.find((other) => other.id !== fixture.id);
        const switched = await http("/api/profiles/current", { headers: { cookie: `${fixture.cookie}; planetls_active_profile_id=${neighbor.id}` } });
        assert.equal(switched.status, 200); assert.equal((await switched.json()).id, fixture.id);
        for (const target of [fixture, neighbor]) {
          await check(`RLS denies role update ${fixture.role} -> ${target.role}`, async () => {
          const result = await fixture.client.from("profiles").update({ role: "admin", category: "admin" }).eq("id", target.id).select("id");
          // Record HTTP even where RLS silently filters every row (200 + []).
          report.checks.push({ name: `RLS update ${fixture.role} -> ${target.role}`, http: result.status, rows: result.data?.length ?? 0 });
          try {
            if (target === fixture && !result.error && result.data?.length) {
              await check(`No admin access after direct profile tampering and reconnect: ${fixture.role}`, async () => {
                const escalatedCookie = await login({ ...fixture, role: "admin" });
                assert.equal((await http("/api/admin/control-tower", { headers: { cookie: escalatedCookie } })).status, 403);
              });
            }
            assert.ok(result.error || result.data?.length === 0, "RLS allowed a privileged role update");
            await unchanged(target);
          } finally {
            assert.equal((await admin.from("profiles").update({ role: target.role, category: target.category }).eq("id", target.id)).error, null);
          }
          });
        }
        // Auth user_metadata is user-writable; it must not grant application privileges.
        const metadata = await fixture.client.auth.updateUser({ data: { role: "admin" } });
        assert.equal(metadata.error, null);
        const cookie = await login(fixture);
        assert.equal((await http("/api/admin/control-tower", { headers: { cookie } })).status, 403);
        assert.equal((await fixture.client.auth.updateUser({ data: { role: fixture.role } })).error, null);
        await unchanged(fixture);
      });
    }
    await check("Anonymous client cannot change a profile role", async () => {
      const fixture = fixtures[0];
      try {
        const anonymous = createClient(report.target, anonKey, options);
        const result = await anonymous.from("profiles").update({ role: "admin" }).eq("id", fixture.id).select("id");
        report.checks.push({ name: "Anonymous role update", http: result.status, rows: result.data?.length ?? 0 });
        assert.ok(result.error || result.data?.length === 0, "Anonymous role update was allowed");
        await unchanged(fixture);
      } finally {
        assert.equal((await admin.from("profiles").update({ role: fixture.role }).eq("id", fixture.id)).error, null);
      }
    });
  }
} catch (error) {
  // Avoid child-process output: CLI errors can embed credentials.
  report.error = error.code ? `Prerequisite/process error: ${error.code}` : error.message;
  process.exitCode = 1;
} finally {
  delete report.anonKey;
  if (admin && !process.argv.includes("--preflight")) {
    try {
      for (const user of await listFixtures()) {
        assert.ok(user.email.startsWith(`${runId}-`) && user.email.endsWith("@example.test"));
        assert.equal((await admin.from("profiles").delete().eq("id", user.id)).error, null);
        assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
      }
      assert.equal((await listFixtures()).length, 0);
      const remaining = await admin.from("profiles").select("id").like("email", `${runId}-%`);
      assert.equal(remaining.error, null); assert.deepEqual(remaining.data, []);
      report.cleanup = "PASS";
    } catch { report.cleanup = "FAIL: fixtures may remain for this run"; report.fixturePrefix = runId; process.exitCode = 1; }
  }
  if (child && child.exitCode === null) {
    if (process.platform === "win32") {
      try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); }
      catch { child.kill(); }
    } else child.kill();
  }
  mkdirSync("test-results", { recursive: true });
  writeFileSync("test-results/registration-local.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}
