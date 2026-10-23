import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { buildReadonlyE2EEnv, assertReadonlyE2EEnv } from "./readonly-e2e-env.mjs";
import { requireIsolatedSearchRun } from "./isolated-search-run.mjs";

const run = requireIsolatedSearchRun();
const env = buildReadonlyE2EEnv();
assertReadonlyE2EEnv(env);
// Reserve then release without making any connection to a possibly unknown server.
// Next receives an explicit port and also refuses a race-time EADDRINUSE.
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", () => reject(new Error("E2E : port 3109 occupé ou indisponible ; aucune instance existante ne sera utilisée.")));
  probe.listen({ host: "127.0.0.1", port: 3109, exclusive: true }, () => probe.close(resolve));
});
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3109"], {
  cwd: run.projectRoot, env, stdio: "inherit", windowsHide: true,
});
child.on("error", () => { console.error("Impossible de démarrer le serveur E2E isolé."); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
