import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { buildReadonlyE2EEnv, assertReadonlyE2EEnv } from "../../scripts/readonly-e2e-env.mjs";
import { denyE2ENetwork } from "../../scripts/readonly-e2e-network.mjs";

const read = (name: string) => readFileSync(new URL(`../../${name}`, import.meta.url), "utf8");

test("E2E : neutralise les variables héritées et celles chargées par Next, sans révéler leurs valeurs", () => {
  const inherited = Object.fromEntries([
    "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL",
    "DIRECT_URL", "POSTGRES_URL", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "STRIPE_SECRET_KEY",
    "NODE_OPTIONS", "HTTPS_PROXY", "CUSTOM_SERVICE_TOKEN",
  ].map(key => [key, "hostile-value"]));
  const env = buildReadonlyE2EEnv({ ...inherited, PATH: "system-path" }, ["FILE_ONLY_TOKEN", "GOOGLE_CLIENT_ID"]);
  assertReadonlyE2EEnv(env);
  assert.equal(env.PATH, "system-path");
  assert.equal(env.FILE_ONLY_TOKEN, "");
  assert.equal(env.GOOGLE_CLIENT_ID, "");
  assert.equal(env.SUPABASE_URL, "http://127.0.0.1:54321");
  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_URL);
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, "local-fixture-only");
  assert.match(env.NODE_OPTIONS, /^--import "file:\/\//);
  assert.equal(Object.values(env).includes("hostile-value"), false);
});

test("E2E : refuse URL externe, clé remplacée, connexion SQL et secret non neutralisé", () => {
  assert.throws(() => buildReadonlyE2EEnv({ E2E_BASE_URL: "https://example.invalid" }, []), /interdite/);
  const env = buildReadonlyE2EEnv({}, []);
  for (const [key, value] of [["SUPABASE_URL", "https://example.invalid"], ["SUPABASE_SERVICE_ROLE_KEY", "other"], ["DATABASE_URL", "postgres://example.invalid"], ["CUSTOM_TOKEN", "other"]]) {
    assert.throws(() => assertReadonlyE2EEnv({ ...env, [key]: value }), /Isolation|neutralisée/);
  }
  assert.throws(denyE2ENetwork, /avant toute sortie réseau/);
});

test("E2E : serveur neuf, préchargement réseau et exclusion des scénarios qui écrivent", () => {
  const config = read("e2e/owner-concierges-geography.config.ts");
  assert.match(config, /reuseExistingServer:\s*false/);
  assert.match(config, /url: undefined, port: undefined/);
  assert.match(config, /wait: \{ stdout: \/Ready in\//);
  assert.match(config, /run-readonly-e2e-server\.mjs/);
  assert.match(config, /serviceWorkers:\s*"block"/);
  const stabilization = read("playwright.stabilization.config.ts");
  assert.match(stabilization, /owner-concierges-geography\.config/);
  assert.doesNotMatch(stabilization, /critical-workspaces\.spec|registration-owner\.spec/);
  const launcher = read("scripts/run-local-e2e.mjs");
  assert.match(launcher, /args\.some/);
  assert.doesNotMatch(launcher, /getLocalSupabaseEnv|ensure-workspace|seed|supabase status/);
  const server = read("scripts/run-readonly-e2e-server.mjs");
  assert.match(server, /assertReadonlyE2EEnv\(env\)/);
  assert.match(server, /"--port", "3109"/);
  assert.match(server, /exclusive: true/);
  assert.match(server, /port 3109 occupé/);
  const guard = read("scripts/readonly-e2e-network.mjs");
  for (const transport of ["globalThis.fetch", "net.Socket.prototype.connect", "tls.connect", "http.request", "https.request", "http2.connect", "dgram.createSocket", "dns.promises", "syncBuiltinESMExports()"])
    assert.ok(guard.includes(transport), transport);
  const fixture = read("e2e/helpers/isolated-search.ts");
  assert.match(fixture, /routeWebSocket/);
  assert.match(fixture, /route\.abort/);
  assert.match(read("e2e/owner-concierges-geography.spec.ts"), /from "\.\/helpers\/isolated-search"/);
});

test("E2E : syntaxe TypeScript et UTF-8 strict sans BOM des seuls fichiers du lot", () => {
  for (const name of ["src/tests/readonly-e2e-network.test.mts", "scripts/isolated-search-run.mjs", "scripts/run-isolated-search-e2e.mjs", "src/tests/isolated-search-run.test.mts", "scripts/readonly-e2e-env.mjs", "scripts/readonly-e2e-network.mjs", "scripts/run-readonly-e2e-server.mjs", "scripts/run-local-e2e.mjs", "playwright.stabilization.config.ts", "e2e/owner-concierges-geography.config.ts", "e2e/helpers/isolated-search.ts", "e2e/owner-concierges-geography.spec.ts", "src/tests/readonly-e2e-config.test.mts"]) {
    const bytes = readFileSync(new URL(`../../${name}`, import.meta.url));
    assert.notEqual(bytes.subarray(0, 3).toString("hex"), "efbbbf", name);
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/\.tsx?$|\.mts$/.test(name)) {
      const result = ts.transpileModule(bytes.toString("utf8"), { fileName: name, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
      assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, name);
    }
  }
});

test("E2E : typage ciblé en mémoire sans émission ni cache", () => {
  const roots = ["src/tests/readonly-e2e-network.test.mts", "e2e/owner-concierges-geography.config.ts", "e2e/owner-concierges-geography.spec.ts", "e2e/helpers/isolated-search.ts", "playwright.stabilization.config.ts", "src/tests/readonly-e2e-config.test.mts", "src/tests/isolated-search-run.test.mts"]
    .map(name => fileURLToPath(new URL(`../../${name}`, import.meta.url)));
  const program = ts.createProgram(roots, {
    noEmit: true, incremental: false, allowJs: true, checkJs: false, skipLibCheck: true,
    strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, esModuleInterop: true, types: ["node"],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(diagnostics.map(d => `${d.file?.fileName ?? ""}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`), []);
});
