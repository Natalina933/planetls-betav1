import { defineConfig } from "@playwright/test";

// Isolated CSS contract: no server, account or database access.
export default defineConfig({
  testDir: ".",
  testMatch: "css-foundations.spec.ts",
  workers: 1,
  reporter: "list",
  outputDir: "../test-results/css-foundations",
  use: { browserName: "chromium", channel: "msedge", screenshot: "only-on-failure" },
});
