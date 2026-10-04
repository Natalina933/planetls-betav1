import { defineConfig } from "@playwright/test";
import baseConfig from "./owner-concierges-geography.config";

export default defineConfig({ ...baseConfig, testMatch: "owner-concierge-profile.spec.ts", outputDir: "../test-results/owner-concierge-profile" });
