import { defineConfig } from "@playwright/test";
import path from "node:path";

// Prototypes sans comptes ni fixtures. Serveur local déjà ouvert par l'utilisateur.
export default defineConfig({
  testDir: ".", testMatch: ["dashboard-prototypes.spec.ts", "design-system-references.spec.ts", "design-organization.spec.ts", "artdeco-workspaces.spec.ts"], workers: 1,
  timeout: 120_000, expect: { timeout: 25_000 },
  outputDir: "../test-results/dashboard-prototypes",
  reporter: [["list"], ["json", { outputFile: path.resolve("test-results/dashboard-prototypes-report.json") }]],
  use: { baseURL: "http://127.0.0.1:3000", browserName: "chromium", channel: process.env.PROTOTYPE_BROWSER_CHANNEL || undefined, screenshot: "only-on-failure", trace: "retain-on-failure" },
});
