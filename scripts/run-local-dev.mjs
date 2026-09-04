import { spawn } from "node:child_process";
import { getLocalSupabaseEnv } from "./local-supabase-env.mjs";
import { getStagingSupabaseEnv } from "./staging-supabase-env.mjs";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const args = process.argv.slice(2);
const staging = args.includes("--staging");
const supabaseEnv = staging ? getStagingSupabaseEnv() : getLocalSupabaseEnv();
const isolated = args.includes("--isolated");
const localE2E = args.includes("--e2e");
const nextArgs = args.filter((arg) => arg !== "--isolated" && arg !== "--e2e" && arg !== "--staging");
const portArgument = nextArgs.findIndex((arg) => arg === "--port" || arg === "-p");
const port = portArgument >= 0 ? nextArgs[portArgument + 1] : "3000";

console.log("Démarrage de PlanetLS avec Supabase local uniquement.");

const child = spawn(npx, ["next", "dev", ...nextArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ...supabaseEnv,
    NEXTAUTH_URL: `http://127.0.0.1:${port}`,
    WORKSPACE_QUICK_LOGIN_ENABLED: "true",
    ...(localE2E ? { LOCAL_E2E_MODE: "true" } : {}),
    ...(isolated ? { NEXT_DIST_DIR: ".next-local-isolated" } : {}),
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
