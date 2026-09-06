import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: ["critical-workspaces.spec.ts", "registration-owner.spec.ts"],
});
