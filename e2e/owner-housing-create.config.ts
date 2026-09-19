import { defineConfig } from "@playwright/test";
import base from "./traveler-stays-visual.config";

export default defineConfig({ ...base, testMatch: "owner-housing-create.spec.ts", outputDir: "../test-results/owner-housing-create" });
