import { defineConfig } from "@playwright/test";

// UI réelle, session et API fictives sur un serveur local dédié.
// Aucun accès Supabase : les requêtes API navigateur sont interceptées par le test.
export default defineConfig({
  testDir: ".", testMatch: "owner-dashboard-visual.spec.ts", workers: 1,
  timeout: 180_000, expect: { timeout: 30_000 },
  outputDir: "../test-results/owner-modern",
  reporter: "list",
  webServer: {
    cwd: process.cwd(),
    command: "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3105",
    url: "http://127.0.0.1:3105/login",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_DIST_DIR: "test-results/owner-modern-next",
      NEXTAUTH_SECRET: "planetls-owner-visual-fixture-secret",
      AUTH_SECRET: "planetls-owner-visual-fixture-secret",
      NEXTAUTH_URL: "http://127.0.0.1:3105",
    },
  },
  use: { baseURL: "http://127.0.0.1:3105", browserName: "chromium", channel: "msedge", screenshot: "only-on-failure", trace: "retain-on-failure" },
});
