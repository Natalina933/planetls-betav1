import { defineConfig } from "@playwright/test";
import base from "./traveler-stays-visual.config";

export default defineConfig({ ...base, testMatch: "owner-requests.spec.ts", outputDir: "../test-results/owner-requests" });
