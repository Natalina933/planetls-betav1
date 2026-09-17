import { defineConfig } from "@playwright/test";
import base from "./traveler-stays-visual.config";
export default defineConfig({ ...base, testMatch: "concierge-requests-compact.spec.ts", outputDir: "../test-results/concierge-requests" });
