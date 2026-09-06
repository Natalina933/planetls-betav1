import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { getLocalSupabaseEnv } from "./local-supabase-env.mjs";

const args = process.argv.slice(2);
const listing = args.length === 1 && args[0] === "--list";
const local = listing ? {} : getLocalSupabaseEnv();
const child = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.stabilization.config.ts", ...args], {
  stdio: "inherit", windowsHide: true,
  env: {
    ...process.env, ...local, E2E_BASE_URL: "", NEXTAUTH_SECRET: randomUUID(),
    TARGET_EMAIL: "stabilization@example.test", WORKSPACE_PASSWORD: `Local!${randomUUID()}`,
    E2E_STRIPE_SECRET_KEY: "", E2E_STRIPE_WEBHOOK_SECRET: "", UPDATE_UI_SNAPSHOTS: "0",
  },
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
