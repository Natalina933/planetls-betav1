import { readFileSync } from "node:fs";

export const E2E_ORIGIN = "http://127.0.0.1:3109";
export const E2E_AUTH_SECRET = "traveler-stays-fixture-secret";
const root = new URL("../", import.meta.url);
const guard = new URL("./readonly-e2e-network.mjs", import.meta.url).href;
const systemKeys = new Set([
  "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP", "TMPDIR",
  "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)",
  "PROGRAMDATA", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE", "LANG", "LC_ALL",
]);

export function nextEnvKeys() {
  const keys = new Set();
  for (const name of [".env", ".env.development", ".env.local", ".env.development.local"]) {
    let source;
    try { source = readFileSync(new URL(name, root), "utf8"); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    for (const match of source.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)) keys.add(match[1]);
  }
  return [...keys];
}

// Empty values are deliberate: Next.js must not fall back to secrets in .env*.
/** @returns {Record<string, string>} */
export function buildReadonlyE2EEnv(inherited = process.env, fileKeys = nextEnvKeys()) {
  if (inherited.E2E_BASE_URL) throw new Error("Une URL E2E externe ou préexistante est interdite.");
  const env = {};
  for (const [key, value] of Object.entries(inherited)) {
    env[key] = systemKeys.has(key.toUpperCase()) ? value ?? "" : "";
  }
  for (const key of fileKeys) env[key] = "";
  return {
    ...env,
    NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1",
    NODE_OPTIONS: `--import "${guard}"`, PLS_READONLY_E2E: "1",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-fixture-only",
    SUPABASE_SERVICE_ROLE_KEY: "local-fixture-only",
    AUTH_SECRET: E2E_AUTH_SECRET, NEXTAUTH_SECRET: E2E_AUTH_SECRET,
    NEXTAUTH_URL: E2E_ORIGIN, NEXT_PUBLIC_SITE_URL: E2E_ORIGIN,
    NEXT_DIST_DIR: ".next-e2e",
    WORKSPACE_QUICK_LOGIN_ENABLED: "false", LOCAL_E2E_MODE: "false",
    UPDATE_UI_SNAPSHOTS: "0", E2E_BASE_URL: "",
    GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "",
    STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
    E2E_STRIPE_SECRET_KEY: "", E2E_STRIPE_WEBHOOK_SECRET: "",
    DATABASE_URL: "", DIRECT_URL: "", POSTGRES_URL: "", PGHOST: "",
  };
}

export function assertReadonlyE2EEnv(env) {
  const expected = buildReadonlyE2EEnv({}, []);
  for (const key of Object.keys(expected)) {
    if (env[key] !== expected[key]) throw new Error(`Isolation E2E invalide : ${key}.`);
  }
  for (const [key, value] of Object.entries(env)) {
    if (value && !systemKeys.has(key.toUpperCase()) && !(key in expected)) {
      throw new Error(`Variable héritée E2E non neutralisée : ${key}.`);
    }
  }
}
