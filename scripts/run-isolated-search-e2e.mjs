import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { preflightExitCode, preflightIsolatedSearch, prepareIsolatedSearchRun } from "./isolated-search-run.mjs";
import { buildReadonlyE2EEnv } from "./readonly-e2e-env.mjs";

const args = process.argv.slice(2);
if (args.some(arg => !["--minimal", "--headed", "--dry-run"].includes(arg)) || (args.includes("--dry-run") && args.length !== 1)) throw new Error("Utiliser --minimal, --headed ou --dry-run seul.");
const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
if (args.includes("--dry-run")) {
  const report = preflightIsolatedSearch(sourceRoot);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = preflightExitCode(report);
} else {
const env = buildReadonlyE2EEnv();
const run = prepareIsolatedSearchRun(sourceRoot);
console.log(`Recette isolée : ${run.id}`);
const child = spawn(process.execPath, [path.join(run.projectRoot, "node_modules/@playwright/test/cli.js"),
  "test", "--config=e2e/owner-concierges-geography.config.ts",
  ...(args.includes("--minimal") ? ["--grep=^recherche commune"] : ["--grep-invert=^API géographique"]),
  ...(args.includes("--headed") ? ["--headed"] : []),
], { cwd: run.projectRoot, env: { ...env, NODE_OPTIONS: "", PLS_READONLY_E2E: "",
  TEMP: path.join(run.runRoot, "tmp"), TMP: path.join(run.runRoot, "tmp"), TMPDIR: path.join(run.runRoot, "tmp"),
}, stdio: "inherit", windowsHide: true });
child.on("error", () => { console.error("Lancement de la recette isolée impossible."); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
// No cleanup: the copy and artifacts remain available until separately authorized.
}
