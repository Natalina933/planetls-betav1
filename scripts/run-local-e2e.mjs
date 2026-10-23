import { spawn } from "node:child_process";
import { buildReadonlyE2EEnv } from "./readonly-e2e-env.mjs";

const args = process.argv.slice(2);
// No arbitrary configuration, projects or file selection in this read-only phase.
if (args.some((arg) => !["--list", "--headed"].includes(arg))) {
  throw new Error("Phase E2E en lecture seule : seuls --list et --headed sont autorisés.");
}
const child = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config=playwright.stabilization.config.ts", ...args], {
  stdio: "inherit", windowsHide: true,
  // The server receives the preload separately; Playwright must retain browser transport.
  env: { ...buildReadonlyE2EEnv(), NODE_OPTIONS: "", PLS_READONLY_E2E: "" },
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
