import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".", testMatch: "traveler-stays-visual.spec.ts", workers: 1,
  timeout: 120_000, expect: { timeout: 25_000 },
  outputDir: "../test-results/traveler-stays", reporter: "list",
  webServer: {
    cwd: process.cwd(),
    command: "node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3109",
    url: "http://127.0.0.1:3109/login", reuseExistingServer: !process.env.CI, timeout: 180_000,
    env: { NEXT_DIST_DIR: "test-results/traveler-stays-next", AUTH_SECRET: "traveler-stays-fixture-secret", NEXTAUTH_SECRET: "traveler-stays-fixture-secret", NEXTAUTH_URL: "http://127.0.0.1:3109" },
  },
  use: { baseURL: "http://127.0.0.1:3109", browserName: "chromium", channel: "msedge", screenshot: "only-on-failure", trace: "retain-on-failure" },
});
