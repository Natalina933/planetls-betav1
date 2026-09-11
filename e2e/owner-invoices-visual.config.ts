import { defineConfig } from "@playwright/test";
import baseConfig from "./traveler-stays-visual.config";
export default defineConfig({ ...baseConfig, testMatch: "owner-invoices-visual.spec.ts", outputDir: "../test-results/owner-invoices" });
