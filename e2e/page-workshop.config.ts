import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".", testMatch: ["page-workshop.spec.ts", "owner-detail-workshop.spec.ts"], workers: 1,
  timeout: 120_000, expect: { timeout: 25_000 },
  outputDir: "../test-results/page-workshop",
  use: { baseURL: "http://127.0.0.1:3000", browserName: "chromium", channel: process.env.PROTOTYPE_BROWSER_CHANNEL || undefined, screenshot: "only-on-failure", trace: "retain-on-failure" },
});
