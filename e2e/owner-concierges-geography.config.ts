import { defineConfig } from "@playwright/test";
import baseConfig from "./traveler-stays-visual.config";

const webServer = baseConfig.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error("Serveur de vérification unique requis.");

export default defineConfig({ ...baseConfig, testMatch: "owner-concierges-geography.spec.ts", outputDir: "../test-results/owner-concierges-geography",
  webServer: { ...webServer, env: { ...webServer.env,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-fixture-only", SUPABASE_SERVICE_ROLE_KEY: "local-fixture-only" } },
});
