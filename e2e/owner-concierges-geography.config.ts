import { defineConfig } from "@playwright/test";
import path from "node:path";
import baseConfig from "./traveler-stays-visual.config";
import { buildReadonlyE2EEnv } from "../scripts/readonly-e2e-env.mjs";
import { requireIsolatedSearchRun } from "../scripts/isolated-search-run.mjs";

const run = requireIsolatedSearchRun();
const webServer = baseConfig.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error("Serveur de vérification unique requis.");

export default defineConfig({ ...baseConfig, testMatch: "owner-concierges-geography.spec.ts",
  testDir: path.join(run.projectRoot, "e2e"),
  outputDir: path.join(run.artifactsRoot, "playwright"),
  reporter: [["list"], ["html", { outputFolder: path.join(run.artifactsRoot, "report"), open: "never" }]],
  use: { ...baseConfig.use, serviceWorkers: "block" },
  webServer: { ...webServer,
    cwd: run.projectRoot,
    command: "node scripts/run-readonly-e2e-server.mjs",
    // No HTTP probe against an unknown process: readiness comes from our child's stdout.
    url: undefined, port: undefined,
    wait: { stdout: /Ready in/ },
    reuseExistingServer: false,
    env: buildReadonlyE2EEnv(),
  },
});
