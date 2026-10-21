import { defineConfig } from "@playwright/test";
import reference from "./concierge-reference-visual.config";

export default defineConfig({ ...reference, testMatch: "concierge-sidebar.spec.ts", outputDir: "../test-results/concierge-sidebar" });
