// PLS-SEC-005 LOT 1. Dedicated loopback Supabase only; never loads .env files.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const workdir = "test-results/sec005-lot1-local";
const migration = "20261016100000_profiles_authorization_guard.sql";
const dir = `${workdir}/supabase`;
if (process.argv.includes("--prepare")) {
  fs.mkdirSync(`${dir}/migrations`, { recursive: true });
  const config = fs.readFileSync("supabase/config.toml", "utf8")
    .replace('project_id = "planetls-betav1"', 'project_id = "planetls-sec005-lot1"')
    .replace(/5432([0-9])/g, "5542$1")
    .replace(/(\[db.seed\][\s\S]*?enabled = )true/, "$1false");
  fs.writeFileSync(`${dir}/config.toml`, config);
  for (const file of ["20260219120000_bootstrap_legacy_core_schema.sql", "20260922120000_add_profiles_service_mode.sql", migration]) {
    fs.copyFileSync(`supabase/migrations/${file}`, `${dir}/migrations/${file}`);
  }
  console.log("Dedicated local config prepared (ports 5542x); no remote target.");
  process.exit(0);
}

const container = "supabase_db_planetls-sec005-lot1";
const docker = (args, input) => execFileSync("docker", args, {
  encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
});
function sql(query, database = "postgres") {
  return docker(["exec", "-i", container, "psql", "-U", "postgres", "-d", database, "-At", "-v", "ON_ERROR_STOP=1"], query).trim();
}
const config = fs.readFileSync(`${dir}/config.toml`, "utf8");
assert.match(config, /project_id = "planetls-sec005-lot1"/);
const cli = path.resolve("node_modules/supabase/bin/supabase.exe");
const status = execFileSync(cli, ["status", "--workdir", workdir, "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const env = Object.fromEntries(status.split(/\r?\n/).map(line => line.match(/^([A-Z_]+)="(.*)"$/)).filter(Boolean).map(m => [m[1], m[2]]));
assert.equal(env.API_URL, "http://127.0.0.1:55421");
assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY);
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
// Existing UI prerequisite, not a change to the LOT 1 migration. Idempotent for
// an already-running dedicated stack created before this fixture was added.
sql(fs.readFileSync("supabase/migrations/20260922120000_add_profiles_service_mode.sql", "utf8"));
sql(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"));
sql("NOTIFY pgrst, 'reload schema';");
const report = { date: new Date().toISOString(), target: env.API_URL, checks: [], retainedFixtures: true };
async function check(name, work) {
  try { await work(); report.checks.push({ name, result: "PASS" }); }
  catch (error) { report.checks.push({ name, result: "FAIL", error: error.message }); process.exitCode = 1; }
}
const run = randomUUID();
const people = [];
await check("client destructive/trigger privileges revoked without executing destructive SQL", async () => {
  for (const role of ["anon", "authenticated"]) {
    for (const privilege of ["DELETE", "TRUNCATE", "TRIGGER"]) {
      assert.equal(sql(`SELECT has_table_privilege('${role}','public.profiles','${privilege}')`), "f");
    }
  }
});
for (const [role, category] of [["owner", "proprietaire"], ["concierge", "concierge"], ["provider", "artisan"]]) {
  const email = `${run}-${role}@example.test`, password = `Local!${randomUUID()}`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null);
  const id = created.data.user.id;
  const inserted = await admin.from("profiles").insert({ id, email, role, category, status: "active" });
  assert.equal(inserted.error, null);
  const client = createClient(env.API_URL, env.ANON_KEY, options);
  assert.equal((await client.auth.signInWithPassword({ email, password })).error, null);
  people.push({ id, role, category, email, password, client });
}

for (const person of people) {
  await check(`${person.role}: ordinary own edit`, async () => {
    const res = await person.client.from("profiles").update({ first_name: "Élodie" }).eq("id", person.id).select("first_name").single();
    assert.equal(res.error, null); assert.equal(res.data.first_name, "Élodie");
  });
  await check(`${person.role}: unchanged protected attributes remain editable`, async () => {
    const res = await person.client.from("profiles").update({ role: person.role, category: person.category, status: "active", first_name: "Élodie" }).eq("id", person.id);
    assert.equal(res.error, null);
  });
  await check(`${person.role}: ordinary upsert with unchanged persona`, async () => {
    const res = await person.client.from("profiles").upsert({ id: person.id, role: person.role, category: person.category, status: "active", first_name: "Élodie" });
    assert.equal(res.error, null);
  });
  for (const [field, value] of [["role", "admin"], ["role", "super_admin"], ["role", null], ["status", "suspended"], ["status", null], ["category", "admin"], ["id", randomUUID()]]) {
    await check(`${person.role}: refuses ${field} mutation (${String(value)})`, async () => {
      const res = await person.client.from("profiles").update({ [field]: value }).eq("id", person.id);
      assert.equal(res.error?.code, "42501");
    });
  }
  await check(`${person.role}: rejects upsert promotion`, async () => {
    const res = await person.client.from("profiles").upsert({ id: person.id, role: "admin", category: person.category, status: "active" });
    assert.equal(res.error?.code, "42501");
  });
  await check(`${person.role}: cannot edit neighbour`, async () => {
    const other = people.find(p => p.id !== person.id);
    const res = await person.client.from("profiles").update({ role: "admin" }).eq("id", other.id).select("id");
    assert.equal(res.error, null); assert.deepEqual(res.data, []);
  });
  await check(`${person.role}: metadata cannot grant profile role`, async () => {
    assert.equal((await person.client.auth.updateUser({ data: { role: "admin", status: "active" } })).error, null);
    const res = await person.client.from("profiles").select("role,status,category").eq("id", person.id).single();
    assert.equal(res.error, null); assert.equal(res.data.role, person.role); assert.equal(res.data.status, "active");
  });
  await check(`${person.role}: real Supabase login still returns ordinary profile after attack`, async () => {
    const client = createClient(env.API_URL, env.ANON_KEY, options);
    assert.equal((await client.auth.signInWithPassword({ email: person.email, password: person.password })).error, null);
    const res = await client.from("profiles").select("role,status").eq("id", person.id).single();
    assert.equal(res.error, null); assert.equal(res.data.role, person.role); assert.equal(res.data.status, "active");
  });
}
await check("anon cannot mutate profile", async () => {
  const anon = createClient(env.API_URL, env.ANON_KEY, options);
  const res = await anon.from("profiles").update({ role: "admin" }).eq("id", people[0].id);
  assert.equal(res.error?.code, "42501");
});
await check("direct insert permits basic signup but rejects privileged and fallback personas", async () => {
  const email = `${run}-direct@example.test`, password = `Local!${randomUUID()}`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.equal(created.error, null);
  const client = createClient(env.API_URL, env.ANON_KEY, options);
  assert.equal((await client.auth.signInWithPassword({ email, password })).error, null);
  for (const attrs of [{ role: "admin", category: "admin" }, { role: "owner_pro", category: "proprietaire" }, { role: null, category: "super_admin" }, { role: "owner", category: "proprietaire", status: "suspended" }]) {
    const res = await client.from("profiles").insert({ id: created.data.user.id, status: "active", ...attrs });
    assert.equal(res.error?.code, "42501");
  }
  const res = await client.from("profiles").insert({ id: created.data.user.id, role: "owner", category: "proprietaire", status: "active" }).select("role").single();
  assert.equal(res.error, null); assert.equal(res.data.role, "owner");
});

// Existing representative database: clone the local pre-lot profile DDL and
// seed only synthetic rows. Keep it for review; no reset, drop or cleanup DELETE.
const existing = `sec005_existing_${run.replaceAll("-", "")}`;
const fresh = `sec005_fresh_${run.replaceAll("-", "")}`;
sql(`CREATE DATABASE ${fresh};`);
sql(`CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO authenticated,anon,service_role;`, fresh);
sql(fs.readFileSync("supabase/migrations/20260219120000_bootstrap_legacy_core_schema.sql", "utf8"), fresh);
sql(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"), fresh);
await check("final migration on fresh database: safe insert/edit and protected mutation refusal", async () => {
  sql(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${people[0].id}',true); INSERT INTO public.profiles(id,role,category,status) VALUES ('${people[0].id}','owner','proprietaire','active'); UPDATE public.profiles SET first_name='Élodie' WHERE id='${people[0].id}'; COMMIT;`, fresh);
  assert.throws(() => sql(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${people[0].id}',true); UPDATE public.profiles SET status='suspended'; COMMIT;`, fresh), error => String(error.stderr).includes("protected"));
  assert.equal(sql("SELECT status||'|'||first_name FROM public.profiles", fresh), "active|Élodie");
  assert.equal(sql("SELECT pg_has_role('authenticated','service_role','MEMBER')", fresh), "f");
});
const profileDdl = docker(["exec", "supabase_db_planetls-betav1", "pg_dump", "-U", "postgres", "-d", "postgres", "--schema-only", "--table=public.profiles", "--no-owner", "--no-privileges"]);
sql(`CREATE DATABASE ${existing};`);
sql(`CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO authenticated,anon,service_role;`, existing);
sql(profileDdl, existing);
sql(`GRANT ALL ON public.profiles TO authenticated,anon,service_role; INSERT INTO public.profiles(id,role,category,status,first_name) VALUES ('${people[0].id}','owner','proprietaire','active','Avant migration');`, existing);
await check("existing base reproduces pre-migration promotion", async () => {
  sql(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${people[0].id}',true); UPDATE public.profiles SET role='admin' WHERE id='${people[0].id}'; ROLLBACK;`, existing);
});
sql(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"), existing);
await check("existing profile data preserved", async () => {
  assert.equal(sql("SELECT role||'|'||status||'|'||first_name FROM public.profiles", existing), "owner|active|Avant migration");
});
await check("guard survives permissive RLS and forged role claims", async () => {
  sql(`CREATE POLICY sec005_test_legacy_permissive ON public.profiles FOR ALL TO authenticated USING(true) WITH CHECK(true);`, existing);
  assert.throws(() => sql(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${people[0].id}',true); SELECT set_config('request.jwt.claim.role','service_role',true); UPDATE public.profiles SET role='admin'; COMMIT;`, existing), error => String(error.stderr).includes("protected"));
});
await check("migration can be reapplied without data changes", async () => {
  sql(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"), existing);
  assert.equal(sql("SELECT role||'|'||status||'|'||first_name FROM public.profiles", existing), "owner|active|Avant migration");
});
await check("emergency rollback fails closed; reapplication restores guard", async () => {
  sql(fs.readFileSync("scripts/rollback-profiles-authorization-guard.sql", "utf8"), existing);
  assert.equal(sql("SELECT has_column_privilege('authenticated','public.profiles','role','UPDATE')", existing), "f");
  assert.throws(() => sql(`SET ROLE authenticated; UPDATE public.profiles SET role='admin';`, existing), error => String(error.stderr).includes("permission denied"));
  sql(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"), existing);
  assert.equal(sql("SELECT tgenabled FROM pg_trigger WHERE tgname='profiles_authorization_attributes_guard'", existing), "O");
  assert.equal(sql("SELECT role||'|'||status||'|'||first_name FROM public.profiles", existing), "owner|active|Avant migration");
});

// Real HTTP registration and Auth.js credentials, against the dedicated Supabase.
if (!process.argv.includes("--database-only")) {
const port = await new Promise((resolve, reject) => {
  const server = createServer(); server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const port = server.address().port; server.close(() => resolve(port)); });
});
const app = `http://127.0.0.1:${port}`;
const appEnv = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: env.API_URL, SUPABASE_URL: env.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY, SUPABASE_ANON_KEY: env.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY, NEXTAUTH_URL: app, AUTH_URL: app,
  NEXTAUTH_SECRET: randomUUID(), AUTH_TRUST_HOST: "true", WORKSPACE_QUICK_LOGIN_ENABLED: "false",
  NEXT_DIST_DIR: "test-results/sec005-lot1-next", NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "development" };
const log = fs.openSync("test-results/sec005-lot1-next.log", "a");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], { env: appEnv, stdio: ["ignore", log, log], windowsHide: true });
const http = (route, init = {}) => fetch(`${app}${route}`, { ...init, redirect: "manual", signal: AbortSignal.timeout(90000) });
async function login(person, expectedRole = person.role) {
  const jar = new Map();
  const receive = res => res.headers.getSetCookie().forEach(value => { const pair = value.split(";", 1)[0]; const i = pair.indexOf("="); jar.set(pair.slice(0, i), pair.slice(i + 1)); });
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const csrf = await http("/api/auth/csrf"); receive(csrf); const { csrfToken } = await csrf.json(); assert.ok(csrfToken);
  const response = await http("/api/auth/callback/credentials", { method: "POST", headers: { cookie: cookie(), "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" }, body: new URLSearchParams({ csrfToken, email: person.email, password: person.password, callbackUrl: app }) });
  receive(response);
  const session = await http("/api/auth/session", { headers: { cookie: cookie() } });
  const data = await session.json();
  if (expectedRole === null) assert.equal(data?.user, undefined);
  else assert.equal(data.user?.role, expectedRole);
  return cookie();
}
try {
  const deadline = Date.now() + 180000;
  while (true) {
    assert.equal(child.exitCode, null, "Isolated Next server exited");
    try { if ((await http("/api/auth/csrf")).status === 200) break; } catch { /* Startup only. */ }
    assert.ok(Date.now() < deadline, "Isolated app startup timed out");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  for (const person of people) {
    await check(`${person.role}: Auth.js ignores malicious Auth metadata`, async () => {
      const cookie = await login(person);
      const response = await http("/api/profiles", { method: "PATCH", headers: { cookie, Origin: app, "Content-Type": "application/json" }, body: JSON.stringify({ first_name: "Élodie", role: "admin", status: "suspended", category: "admin" }) });
      assert.equal(response.status, 200);
      const res = await person.client.from("profiles").select("role,status,category,first_name").eq("id", person.id).single();
      assert.equal(res.error, null); assert.equal(res.data.role, person.role); assert.equal(res.data.status, "active"); assert.equal(res.data.category, person.category);
      await login(person);
      const denied = await http(`/api/admin/users/${person.id}`, { method: "PATCH", headers: { cookie, Origin: app, "Content-Type": "application/json" }, body: JSON.stringify({ role: "admin" }) });
      assert.equal(denied.status, 403);
    });
  }
  for (const [category, role] of [["proprietaire", "owner"], ["concierge", "concierge"], ["artisan", "provider"]]) {
    await check(`${role}: HTTP registration + Auth.js login`, async () => {
      const person = { email: `${run}-signup-${role}@example.test`, password: `Local!${randomUUID()}`, role };
      const response = await http("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...person, role: undefined, username: `lot1-${randomUUID().slice(0, 20)}`, category, firstName: "Élodie", lastName: "Test" }) });
      assert.equal(response.status, 201);
      const id = (await response.json()).user.id;
      const profile = await admin.from("profiles").select("role,status").eq("id", id).single();
      assert.equal(profile.error, null); assert.equal(profile.data.role, role); assert.equal(profile.data.status, "active");
      await login(person);
    });
  }
  const managers = [];
  for (const role of ["admin", "super_admin"]) {
    const person = { email: `${run}-${role}@example.test`, password: `Local!${randomUUID()}`, role };
    const created = await admin.auth.admin.createUser({ email: person.email, password: person.password, email_confirm: true });
    assert.equal(created.error, null); person.id = created.data.user.id;
    assert.equal((await admin.from("profiles").insert({ id: person.id, email: person.email, role, category: role, status: "active" })).error, null);
    person.cookie = await login(person); managers.push(person);
  }
  const patchAdmin = (manager, target, body) => http(`/api/admin/users/${target}`, { method: "PATCH", headers: { cookie: manager.cookie, Origin: app, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  await check("admin API preserves ordinary role/status management and fresh login", async () => {
    assert.equal((await patchAdmin(managers[0], people[0].id, { role: " OWNER_PRO ", status: "suspended" })).status, 200);
    await login(people[0], null);
    assert.equal((await patchAdmin(managers[0], people[0].id, { status: "active" })).status, 200);
    await login(people[0], "owner_pro");
  });
  await check("admin cannot promote itself through either API", async () => {
    assert.equal((await patchAdmin(managers[0], managers[0].id, { role: "super_admin" })).status, 403);
    assert.equal((await patchAdmin(managers[0], people[1].id, { role: " SUPER_ADMIN " })).status, 403);
    const res = await http("/api/profiles", { method: "PATCH", headers: { cookie: managers[0].cookie, Origin: app, "Content-Type": "application/json" }, body: JSON.stringify({ role: "super_admin" }) });
    assert.equal(res.status, 403);
  });
  await check("super admin operation preserved", async () => {
    assert.equal((await patchAdmin(managers[1], people[0].id, { role: "admin" })).status, 200);
    await login(people[0], "admin");
  });
  await check("unknown role/category fails closed in Auth.js", async () => {
    assert.equal((await admin.from("profiles").update({ role: "unrecognized", category: "unrecognized" }).eq("id", people[2].id)).error, null);
    await login(people[2], null);
  });
} finally {
  child.kill(); fs.closeSync(log);
}
}

// An explicit local target for the HTTP/Auth.js regression runner. Never contains credentials.
const reportPath = process.argv.includes("--database-only") ? "test-results/profile-authorization-database.json" : "test-results/profile-authorization-local.json";
fs.writeFileSync(reportPath, JSON.stringify({ ...report, databases: { fresh, existing } }, null, 2));
console.log(JSON.stringify({ passed: report.checks.filter(c => c.result === "PASS").length, failed: report.checks.filter(c => c.result === "FAIL").length, representativeDatabase: existing, report: reportPath }));
for (const failure of report.checks.filter(c => c.result === "FAIL")) console.log(JSON.stringify(failure));
