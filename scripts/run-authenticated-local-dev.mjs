import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { buildReadonlyE2EEnv } from "./readonly-e2e-env.mjs";

const localSupabase = "http://127.0.0.1:54321";
const appOrigin = "http://127.0.0.1:3100";
const anonKey = process.env.PLS_LOCAL_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.PLS_LOCAL_SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!anonKey || !serviceKey || anonKey === serviceKey) {
  throw new Error("Renseignez les deux clés distinctes de Supabase local dans PLS_LOCAL_SUPABASE_ANON_KEY et PLS_LOCAL_SUPABASE_SERVICE_ROLE_KEY.");
}

const health = await fetch(`${localSupabase}/auth/v1/health`, {
  redirect: "error",
  signal: AbortSignal.timeout(5_000),
}).catch(() => null);
if (!health?.ok) throw new Error("Supabase Auth local ne répond pas sur le port 54321.");

const secret = randomBytes(32).toString("hex");
const child = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3100",
], {
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...buildReadonlyE2EEnv(),
    // This suite uses real local Auth and API reads.
    NODE_OPTIONS: "",
    PLS_READONLY_E2E: "",
    NEXT_PUBLIC_SUPABASE_URL: localSupabase,
    SUPABASE_URL: localSupabase,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    NEXTAUTH_URL: appOrigin,
    NEXT_PUBLIC_SITE_URL: appOrigin,
    AUTH_SECRET: secret,
    NEXTAUTH_SECRET: secret,
    NEXT_DIST_DIR: "test-results/authenticated-local-next",
  },
});

child.on("error", () => {
  console.error("Impossible de démarrer le serveur de recette locale.");
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
