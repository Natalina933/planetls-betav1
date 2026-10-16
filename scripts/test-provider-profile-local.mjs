// Local browser acceptance only. Never loads .env or applies a migration.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect as baseExpect } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 120000 });

const output = "test-results/sec005-provider-browser";
fs.mkdirSync(output, { recursive: true });
const status = execFileSync(path.resolve("node_modules/supabase/bin/supabase.exe"),
  ["status", "--workdir", "test-results/sec005-lot1-local", "-o", "env"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
const local = Object.fromEntries(status.split(/\r?\n/).map(line => line.match(/^([A-Z_]+)="(.*)"$/))
  .filter(Boolean).map(m => [m[1], m[2]]));
assert.equal(local.API_URL, "http://127.0.0.1:55421", "Non-local Supabase refused");
const client = createClient(local.API_URL, local.SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const report = { date: new Date().toISOString(), target: local.API_URL, checks: [], browserErrors: [], failedRequests: [], retainedSyntheticFixture: true };
const port = await new Promise(resolve => {
  const server = createServer();
  server.listen(0, "127.0.0.1", () => { const port = server.address().port; server.close(() => resolve(port)); });
});
const app = `http://127.0.0.1:${port}`;
const secret = randomUUID();
const log = fs.openSync(`${output}/next.log`, "a");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: { ...process.env, NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    SUPABASE_URL: local.API_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_ANON_KEY: local.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, NEXTAUTH_URL: app, AUTH_URL: app,
    NEXTAUTH_SECRET: secret, AUTH_SECRET: secret, AUTH_TRUST_HOST: "true", WORKSPACE_QUICK_LOGIN_ENABLED: "false",
    NEXT_DIST_DIR: `${output}/next`, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", log, log], windowsHide: true,
});
let browser;
let page;
async function check(name, fn) {
  await fn(); report.checks.push({ name, result: "PASS" }); console.log(`PASS ${name}`);
}
try {
  const deadline = Date.now() + 240000;
  while (true) {
    assert.equal(child.exitCode, null, "Local Next server exited");
    try { if ((await fetch(`${app}/api/auth/csrf`, { signal: AbortSignal.timeout(20000) })).ok) break; } catch { /* startup */ }
    assert.ok(Date.now() < deadline, "Local Next startup timed out");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const fixture = { email: `browser-${randomUUID()}@example.test`, password: `Local!${randomUUID()}` };
  const created = await client.auth.admin.createUser({ email: fixture.email, password: fixture.password, email_confirm: true });
  assert.equal(created.error, null);
  const id = created.data.user.id;
  const availability = JSON.stringify({ schedule: [{ day: "mon", ranges: [{ start: "09:00", end: "17:00" }] }], browser_fixture: true });
  assert.equal((await client.from("profiles").insert({ id, email: fixture.email, role: "provider", category: "artisan", status: "active",
    first_name: "Camille", last_name: "Test", option: '["plumbing_repair"]', availability_hours: availability,
    hourly_rate: 45, company_name: "Atelier local de test", city: "Paris", country: "France" })).error, null);
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ baseURL: app, viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(120000);
  context.setDefaultNavigationTimeout(180000);
  // Browser traffic cannot leave this app; the app itself uses loopback Supabase only.
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.origin === app || ["data:", "blob:"].includes(url.protocol) ? route.continue() : route.abort();
  });
  const csrf = await (await context.request.get("/api/auth/csrf")).json();
  await context.request.post("/api/auth/callback/credentials", { form: { csrfToken: csrf.csrfToken, ...fixture, callbackUrl: app },
    headers: { "X-Auth-Return-Redirect": "1" }, maxRedirects: 0 });
  assert.equal((await (await context.request.get("/api/auth/session")).json()).user?.role, "provider");
  page = await context.newPage();
  page.on("pageerror", error => report.browserErrors.push(error.message.slice(0, 300)));
  page.on("requestfailed", request => report.failedRequests.push({ path: new URL(request.url()).pathname, error: request.failure()?.errorText }));
  const patches = [];
  page.on("request", request => {
    if (request.method() === "PATCH" && new URL(request.url()).pathname === "/api/profiles") patches.push(request.postDataJSON());
  });
  const heading = () => page.getByRole("heading", { name: "Activité, confiance et disponibilité", exact: true });
  const loaded = () => expect(page.locator('label[for="company_name"]').locator("..").getByText("Atelier local de test", { exact: true })).toBeVisible();
  const edit = () => heading().locator("xpath=../../..").getByRole("button", { name: "Modifier", exact: true });
  const save = () => heading().locator("xpath=../../..").getByRole("button", { name: "Sauvegarder", exact: true });
  const read = async () => {
    const result = await client.from("profiles").select("category,role,status,option,availability_hours,hourly_rate").eq("id", id).single();
    assert.equal(result.error, null); return result.data;
  };
  await check("desktop: real Auth.js login, readonly category and persisted declarations", async () => {
    await page.goto(`${app}/dashboard/provider/settings?tab=account`, { waitUntil: "domcontentloaded" });
    await loaded(); // Wait for client hydration and the actual profile read before clicking.
    await expect(heading()).toBeVisible({ timeout: 120000 });
    await edit().click();
    await expect(page.locator('input[name="category"]')).toHaveCount(0);
    await expect(page.locator('textarea[name="skills"]')).not.toHaveValue("");
    await page.locator('textarea[name="skills"]').fill("plumbing_installation; plumbing_repair; plumbing_repair");
    const response = page.waitForResponse(r => r.url() === `${app}/api/profiles` && r.request().method() === "PATCH");
    await save().click(); assert.equal((await response).status(), 200);
    await expect(edit()).toBeVisible();
    assert.ok(!("category" in patches.at(-1)) && !("skills" in patches.at(-1)));
    const persisted = await read();
    assert.deepEqual(JSON.parse(persisted.option), ["plumbing_installation", "plumbing_repair"]);
    assert.equal(persisted.category, "artisan"); assert.equal(persisted.role, "provider"); assert.equal(persisted.status, "active");
    assert.equal(persisted.availability_hours, availability);
    await page.reload(); await loaded(); await edit().click();
    await expect(page.locator('textarea[name="skills"]')).toHaveValue(/; /);
    await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  });
  await check("invalid declaration: error and no partial persisted update", async () => {
    const before = await read();
    await page.locator('textarea[name="skills"]').fill("service_invente");
    await page.locator('input[name="hourly_rate"]').fill("999");
    const response = page.waitForResponse(r => r.url() === `${app}/api/profiles` && r.request().method() === "PATCH");
    await save().click(); assert.equal((await response).status(), 400);
    await expect(page.getByText("Choisissez des prestations ou groupes du référentiel actuel.", { exact: true })).toBeVisible();
    assert.deepEqual(await read(), before);
    await page.screenshot({ path: `${output}/invalid.png`, fullPage: true });
  });
  await check("mobile: clear declarations, preserve availability, reload", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('textarea[name="skills"]').fill("");
    await page.locator('input[name="hourly_rate"]').fill("45");
    const response = page.waitForResponse(r => r.url() === `${app}/api/profiles` && r.request().method() === "PATCH");
    await save().click(); assert.equal((await response).status(), 200);
    await expect(edit()).toBeVisible();
    assert.deepEqual(JSON.parse((await read()).option), []);
    assert.equal((await read()).availability_hours, availability);
    await page.reload(); await loaded(); await edit().click();
    await expect(page.locator('textarea[name="skills"]')).toHaveValue("");
    await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  });
  await check("unchanged historical declarations do not block an ordinary edit", async () => {
    assert.equal((await client.from("profiles").update({ option: "Ancienne déclaration de test" }).eq("id", id)).error, null);
    await page.reload(); await loaded(); await edit().click();
    await expect(page.locator('textarea[name="skills"]')).toHaveValue("Ancienne déclaration de test");
    await page.locator('input[name="hourly_rate"]').fill("55");
    const response = page.waitForResponse(r => r.url() === `${app}/api/profiles` && r.request().method() === "PATCH");
    await save().click(); assert.equal((await response).status(), 200);
    await expect(edit()).toBeVisible();
    assert.ok(!("option" in patches.at(-1)));
    const persisted = await read();
    assert.equal(persisted.option, "Ancienne déclaration de test"); assert.equal(persisted.hourly_rate, 55);
    assert.equal(persisted.availability_hours, availability);
  });
} catch (error) {
  try { await page?.screenshot({ path: `${output}/failure.png`, fullPage: true, timeout: 30000 }); } catch { /* Navigation may still be compiling. */ }
  report.checks.push({ name: "browser acceptance", result: "FAIL", error: error.message }); process.exitCode = 1;
} finally {
  await browser?.close(); child.kill(); fs.closeSync(log);
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.checks.filter(c => c.result === "PASS").length,
    failed: report.checks.filter(c => c.result === "FAIL").length, report: `${output}/report.json` }));
  for (const check of report.checks.filter(c => c.result === "FAIL")) console.log(JSON.stringify(check));
  if (process.exitCode) console.log(JSON.stringify({ browserErrors: report.browserErrors, failedRequests: report.failedRequests }));
}
