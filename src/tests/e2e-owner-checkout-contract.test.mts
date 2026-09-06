import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scenario = readFileSync("e2e/owner-concierge-service-request.spec.ts", "utf8");
const playwrightConfig = readFileSync("playwright.config.ts", "utf8");
const workflow = readFileSync(".github/workflows/e2e.yml", "utf8");

test("owner E2E uses hosted Stripe Checkout when a test key is provided", () => {
  assert.match(scenario, /E2E_STRIPE_SECRET_KEY\?\.startsWith\("sk_test_"\)/);
  assert.ok(scenario.includes("checkout\\.stripe\\.com"));
  assert.match(scenario, /4242424242424242/);
  assert.match(scenario, /payment=success/);
  assert.match(playwrightConfig, /STRIPE_SECRET_KEY: process\.env\.E2E_STRIPE_SECRET_KEY/);
});

test("stabilization CI uses local Supabase without remote secrets; checkout retains its test-key guard", () => {
  assert.doesNotMatch(workflow, /secrets\./);
  assert.match(workflow, /supabase start/);
  assert.match(workflow, /inputs\.run_local_e2e/);
  assert.match(playwrightConfig, /startsWith\("sk_test_"\)/);
});
