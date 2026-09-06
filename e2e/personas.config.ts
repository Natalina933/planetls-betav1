import { defineConfig } from "@playwright/test";

// Serveur isolé : aucune clé ni base distante, aucune création de compte.
export default defineConfig({
  testDir: ".", testMatch: "admin-personas.spec.ts", workers: 1,
  timeout: 120_000, expect: { timeout: 30_000 },
  outputDir: "../test-results/personas", reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3117", browserName: "chromium",
    channel: process.env.PERSONAS_BROWSER_CHANNEL || undefined,
    screenshot: "only-on-failure", trace: "retain-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3117",
    url: "http://127.0.0.1:3117/login", reuseExistingServer: false, timeout: 120_000,
    env: {
      NEXT_DIST_DIR: "test-results/personas-next", NEXTAUTH_URL: "http://127.0.0.1:3117", AUTH_TRUST_HOST: "true",
      NEXTAUTH_SECRET: "personas-local-test-secret-not-for-production", AUTH_SECRET: "personas-local-test-secret-not-for-production",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "personas-local-placeholder", SUPABASE_SERVICE_ROLE_KEY: "personas-local-placeholder",
      WORKSPACE_QUICK_LOGIN_ENABLED: "false", GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "",
    },
  },
});
