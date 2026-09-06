/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
if (process.env.E2E_BASE_URL) throw new Error("Les E2E connectés exigent un serveur local dédié ; E2E_BASE_URL est interdit.");
const baseURL = `http://127.0.0.1:${port}`;
if (process.env.E2E_STRIPE_SECRET_KEY && !process.env.E2E_STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error("Seule une clé Stripe de test est autorisée pour les E2E.");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
        command: `node scripts/run-local-dev.mjs --isolated --e2e --webpack --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXTAUTH_URL: baseURL,
          NEXT_DIST_DIR: ".next-e2e",
          WORKSPACE_QUICK_LOGIN_ENABLED: "true",
          STRIPE_SECRET_KEY: process.env.E2E_STRIPE_SECRET_KEY ?? "",
          STRIPE_WEBHOOK_SECRET: process.env.E2E_STRIPE_WEBHOOK_SECRET ?? "whsec_planetls_e2e_only",
        },
      },
});
