import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: ".", testMatch: "design-05d-sidebar.spec.ts", workers: 1, reporter: "list", use: { browserName: "chromium", serviceWorkers: "block" } });
