import { defineConfig } from "@playwright/test";
import reference from "./concierge-reference-visual.config";

export default defineConfig(reference, {
  testMatch: ["dashboard-shared-style.spec.ts", "concierge-reference-visual.spec.ts"],
  outputDir: "../test-results/dashboard-shared-style",
});
