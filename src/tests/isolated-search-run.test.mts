import test, { mock } from "node:test";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, lstatSync, readdirSync, existsSync, linkSync, symlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { acceptSearchCopy, allocateSearchRun, assertNoSecret, copyIndependentTree, createDependencyCopySelector, dependencyPackageFingerprint, discoverCopyEntries, preflightCopyTree, preflightExitCode, preflightIsolatedSearch, qualifyCopyEntry, isInside, mayCopyProjectFile, requireIsolatedSearchRun } from "../../scripts/isolated-search-run.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
// The only writes are synthetic files in this atomically allocated lot-specific folder.
const temp = allocateSearchRun(path.join(root, "test-results", "pls-e2e-isolation-02a-09-static")).runRoot;

function reviewFixture(source: string, packageName: string, names: string[]) {
  return {
    packageName,
    packageSha256: dependencyPackageFingerprint(source, packageName, names),
    documents: Object.fromEntries(names.map(name => [name, createHash("sha256").update(readFileSync(path.join(source, "node_modules", packageName, name))).digest("hex")])),
  };
}

test("copies E2E : allocations atomiques distinctes et aucune réutilisation", () => {
  const a = allocateSearchRun(path.join(temp, "runs"));
  const b = allocateSearchRun(path.join(temp, "runs"));
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.artifactsRoot, b.artifactsRoot);
  writeFileSync(path.join(a.artifactsRoot, "existing.txt"), "preserved", { flag: "wx" });
  assert.throws(() => mkdirSync(a.runRoot), { code: "EEXIST" });
  assert.equal(readFileSync(path.join(a.artifactsRoot, "existing.txt"), "utf8"), "preserved");
});

test("copies E2E : fichiers indépendants, refus d’écrasement et source inchangée", () => {
  const source = path.join(temp, "source");
  const target = path.join(temp, "target");
  mkdirSync(source); mkdirSync(target);
  writeFileSync(path.join(source, "next-env.d.ts"), "original", { flag: "wx" });
  copyIndependentTree(source, target, () => true);
  assert.equal(lstatSync(path.join(target, "next-env.d.ts")).isSymbolicLink(), false);
  assert.equal(lstatSync(path.join(target, "next-env.d.ts")).nlink, 1);
  writeFileSync(path.join(target, "next-env.d.ts"), "generated in copy");
  assert.equal(readFileSync(path.join(source, "next-env.d.ts"), "utf8"), "original");
  assert.throws(() => copyIndependentTree(source, target, () => true), { code: "EEXIST" });
});

test("copies E2E : liste fermée, secrets masqués et évasion refusée", () => {
  for (const name of [".env", ".env.local", ".env.development.local", ".git/config", ".next/cache/foo.js", "test-results/old.png", "public/uploads/private.png", "public/avatars/user.png", "data/export.csv", "scripts/seed-owner.mjs", "src/tests/fixture.ts", "src/private-key.pem"]) assert.equal(mayCopyProjectFile(name), false, name);
  for (const name of ["src/app/page.tsx", "src/app/api/private/route.ts", "next-env.d.ts", "public/icons/menu.svg", "scripts/readonly-e2e-network.mjs"]) assert.equal(mayCopyProjectFile(name), true, name);
  assert.throws(() => assertNoSecret(Buffer.from("sample-secret"), [Buffer.from("sample-secret")]), /valeur masquée/);
  assert.equal(isInside(temp, path.resolve(temp, "../escape")), false);
  assert.throws(requireIsolatedSearchRun); // The original checkout is never a runnable copy.
  const code = read("scripts/isolated-search-run.mjs");
  assert.match(code, /stat\.isSymbolicLink\(\)/);
  assert.match(code, /realpathSync\(source\)/);
  assert.match(code, /flag: "wx"/);
  assert.doesNotMatch(code, /\b(?:symlinkSync|linkSync|rmSync|unlinkSync)\s*\(/);
});

test("copies E2E : toutes les captures et sorties appartiennent à l’exécution", () => {
  const spec = read("e2e/owner-concierges-geography.spec.ts");
  const screenshots = spec.split("\n").filter(line => line.includes("page.screenshot("));
  assert.equal(screenshots.length, 7);
  assert.ok(screenshots.every(line => line.includes("testInfo.outputPath(")));
  assert.doesNotMatch(spec, /test-results\//);
  const config = read("e2e/owner-concierges-geography.config.ts");
  assert.match(config, /outputDir: path.join\(run.artifactsRoot, "playwright"\)/);
  assert.match(config, /outputFolder: path.join\(run.artifactsRoot, "report"\)/);
  assert.match(config, /cwd: run.projectRoot/);
  assert.match(config, /reuseExistingServer: false/);
  const launcher = read("scripts/run-isolated-search-e2e.mjs");
  assert.match(launcher, /cwd: run.projectRoot/);
  assert.match(launcher, /--grep-invert=\^API géographique/);
  assert.match(read("scripts/run-readonly-e2e-server.mjs"), /requireIsolatedSearchRun\(\)/);
  assert.equal(readdirSync(temp).length > 0, true);
});

test("copies E2E : exclusions appliquées à une arborescence fictive et dépendances copiées physiquement", () => {
  const source = path.join(temp, "filtered-source");
  const target = path.join(temp, "filtered-target");
  mkdirSync(source); mkdirSync(target);
  for (const name of [".env.local", "next-env.d.ts", "test-results/old.png", "public/uploads/person.png", "node_modules/example/index.js", "node_modules/example/.env", "node_modules/.cache/old.js", "src/app/page.tsx"]) {
    mkdirSync(path.dirname(path.join(source, name)), { recursive: true });
    writeFileSync(path.join(source, name), "synthetic", { flag: "wx" });
  }
  copyIndependentTree(source, target, acceptSearchCopy);
  for (const name of [".env.local", "test-results", "public/uploads", "node_modules/example/.env", "node_modules/.cache"]) assert.equal(existsSync(path.join(target, name)), false, name);
  for (const name of ["next-env.d.ts", "src/app/page.tsx", "node_modules/example/index.js"]) assert.equal(lstatSync(path.join(target, name)).nlink, 1, name);
});

test("documents vérifiés : README dotenv et autre dépendance exclus, ressources et exécution conservées", () => {
  const source = path.join(temp, "dotenv-source");
  const target = path.join(temp, "dotenv-target");
  mkdirSync(source); mkdirSync(target);
  const keyMarker = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----";
  const files = ["node_modules/dotenv/README-es.md", "node_modules/dotenv/README.md", "node_modules/another/README-es.md", "node_modules/dotenv/package.json", "node_modules/dotenv/config.js", "node_modules/dotenv/lib/main.js", "node_modules/dotenv/lib/main.d.ts", "node_modules/dotenv/lib/env-options.js", "node_modules/dotenv/lib/cli-options.js", "node_modules/dotenv/runtime.md", "node_modules/another/package.json", "node_modules/unreviewed/README.md"];
  for (const file of files) {
    mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
    writeFileSync(path.join(source, file), /README/.test(file) && !file.includes("unreviewed") ? keyMarker : "synthetic", { flag: "wx" });
  }
  // A Markdown resource referenced by runtime code is never a documentation candidate.
  writeFileSync(path.join(source, "node_modules/dotenv/lib/main.js"), "require('fs').readFileSync(require('path').join(__dirname, '../runtime.md'))");
  writeFileSync(path.join(source, "node_modules/dotenv/package.json"), JSON.stringify({ exports: { ".": "./lib/main.js", "./resource": "./runtime.md" } }));
  const select = createDependencyCopySelector(source, [reviewFixture(source, "dotenv", ["README-es.md", "README.md"]), reviewFixture(source, "another", ["README-es.md"])]);
  const report = preflightCopyTree(source, select);
  assert.equal(report.status, "PASS");
  assert.equal(report.excluded, 3);
  assert.equal(select(files[0].replaceAll("/", "\\"), true), false);
  copyIndependentTree(source, target, select);
  for (const file of files.slice(0, 3)) assert.equal(existsSync(path.join(target, file)), false);
  for (const file of files.slice(3)) assert.equal(existsSync(path.join(target, file)), true, file);
});

test("document utilisé : changement d’export, code ou document annule l’exclusion", () => {
  const source = path.join(temp, "resource-source");
  const pkg = path.join(source, "node_modules/resource-package");
  mkdirSync(pkg, { recursive: true });
  writeFileSync(path.join(pkg, "README.md"), "synthetic documentation", { flag: "wx" });
  writeFileSync(path.join(pkg, "index.js"), "module.exports = 'synthetic'", { flag: "wx" });
  const metadata = JSON.stringify({ main: "index.js" });
  writeFileSync(path.join(pkg, "package.json"), metadata, { flag: "wx" });
  const review = reviewFixture(source, "resource-package", ["README.md"]);
  const name = "node_modules/resource-package/README.md";
  assert.equal(createDependencyCopySelector(source, [review])(name, false), false);
  writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ exports: "./README.md" }));
  assert.equal(createDependencyCopySelector(source, [review])(name, false), true);
  writeFileSync(path.join(pkg, "package.json"), metadata);
  writeFileSync(path.join(pkg, "index.js"), "module.exports = require('fs').readFileSync(__dirname + '/README.md')");
  const target = path.join(temp, "resource-target"); mkdirSync(target);
  copyIndependentTree(source, target, createDependencyCopySelector(source, [review]));
  assert.equal(readFileSync(path.join(target, name), "utf8"), "synthetic documentation");
  writeFileSync(path.join(pkg, "index.js"), "module.exports = 'synthetic'");
  writeFileSync(path.join(pkg, "README.md"), "changed documentation");
  assert.equal(createDependencyCopySelector(source, [review])(name, false), true);
});

test("configuration sensible : refus maintenu, y compris dans une dépendance vérifiée", () => {
  const source = path.join(temp, "config-source");
  const target = path.join(temp, "config-target");
  const pkg = path.join(source, "node_modules/config-package");
  mkdirSync(pkg, { recursive: true }); mkdirSync(target);
  writeFileSync(path.join(pkg, "README.md"), "synthetic documentation", { flag: "wx" });
  writeFileSync(path.join(pkg, "package.json"), JSON.stringify({ secret: "fictional-config-secret" }), { flag: "wx" });
  const select = createDependencyCopySelector(source, [reviewFixture(source, "config-package", ["README.md"])]);
  assert.throws(() => copyIndependentTree(source, target, select, [Buffer.from("fictional-config-secret")]), /\[secret_connu\].*package\.json/);
  assert.equal(existsSync(path.join(target, "node_modules/config-package/package.json")), false);
  assert.equal(existsSync(path.join(target, "node_modules/config-package/README.md")), false);
});

test("détecteur : arrêt avant copie, chemin relatif et catégorie, sans contenu sensible", () => {
  const source = path.join(temp, "sensitive-source");
  const target = path.join(temp, "sensitive-target");
  mkdirSync(source); mkdirSync(target);
  const sensitive = "-----BEGIN PRIVATE KEY-----\nFICTIONAL_PAYLOAD_DO_NOT_LOG";
  writeFileSync(path.join(source, "example.js"), sensitive, { flag: "wx" });
  assert.throws(() => copyIndependentTree(source, target, () => true), error => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /\[marqueur_secret\].*example\.js/);
    assert.equal(error.message.includes(source), false);
    assert.equal(error.message.includes(sensitive), false);
    assert.equal(error.message.includes("FICTIONAL_PAYLOAD_DO_NOT_LOG"), false);
    return true;
  });
  assert.equal(existsSync(path.join(target, "example.js")), false);
  assert.throws(() => assertNoSecret(Buffer.from("fake-known-secret"), [Buffer.from("fake-known-secret")], "other.txt"), /\[secret_connu\].*other\.txt/);
  for (const file of ["node_modules/dotenv/.env", "node_modules/dotenv/.env.production", ".env.local"]) assert.equal(acceptSearchCopy(file, false), false);
});

test("copie : jonction et fichier à liens physiques multiples refusés", () => {
  const source = path.join(temp, "links-source");
  const target = path.join(temp, "links-target");
  const external = path.join(temp, "external-fixture");
  mkdirSync(source); mkdirSync(target); mkdirSync(external);
  writeFileSync(path.join(source, "original.js"), "synthetic", { flag: "wx" });
  linkSync(path.join(source, "original.js"), path.join(source, "shared.js"));
  assert.throws(() => copyIndependentTree(source, target, () => true, [], "shared.js"), /\[lien_physique_partagé\].*shared\.js/);
  symlinkSync(external, path.join(source, "linked"), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => copyIndependentTree(source, target, () => true, [], "linked"), /\[lien_ou_jonction\].*linked/);
  assert.equal(readdirSync(target).length, 0);
});

test("dry-run : aucun appel d’écriture, comptages exacts et sortie sans contenu ni empreintes", () => {
  const source = path.join(temp, "dry-source"); mkdirSync(source);
  writeFileSync(path.join(source, "ok.js"), "synthetic");
  writeFileSync(path.join(source, "bad.js"), "-----BEGIN PRIVATE KEY-----\nDO_NOT_DISCLOSE_THIS_VALUE");
  writeFileSync(path.join(source, ".env.local"), "ignored fictional fixture");
  mkdirSync(path.join(source, "test-results"));
  writeFileSync(path.join(source, "test-results/old.txt"), "preserved");
  const before = readdirSync(source).sort();
  const select = (name: string, directory: boolean) => name !== "test-results" && !path.basename(name).startsWith(".env");
  let writes = 0;
  try {
    for (const name of ["mkdirSync", "copyFileSync", "writeFileSync", "appendFileSync", "unlinkSync", "rmSync", "renameSync", "mkdtempSync"] as const) mock.method(fs, name, () => { writes++; throw new Error("forbidden write"); });
    const originalOpen = fs.openSync;
    mock.method(fs, "openSync", (file: fs.PathLike, flags: fs.OpenMode, mode?: fs.Mode) => {
      assert.equal(typeof flags, "number");
      assert.equal(Number(flags) & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC), 0);
      return originalOpen(file, flags, mode);
    });
    syncBuiltinESMExports();
    const report = preflightCopyTree(source, select);
    assert.deepEqual({ examined: report.examined, allowed: report.allowed, excluded: report.excluded, refused: report.refused, errors: report.errors, excludedDirectories: report.excludedDirectories },
      { examined: 3, allowed: 1, excluded: 1, refused: 1, errors: 0, excludedDirectories: 1 });
    assert.equal(report.status, "BLOCKED");
    assert.equal(preflightExitCode(report), 1);
    const json = JSON.stringify(report);
    assert.ok(json.includes('"path":"bad.js"'));
    for (const forbidden of ["DO_NOT_DISCLOSE_THIS_VALUE", "BEGIN PRIVATE KEY", "manifest", source]) assert.equal(json.includes(forbidden), false);
    // Exercise the production entry point too, under the same write traps.
    assert.equal(preflightIsolatedSearch(source, {}).errors, 0);
    assert.equal(writes, 0);
    assert.deepEqual(readdirSync(source).sort(), before);
  } finally { mock.restoreAll(); syncBuiltinESMExports(); }
  const target = path.join(temp, "dry-refused-target"); mkdirSync(target);
  assert.throws(() => copyIndependentTree(source, target, select), /marqueur_secret/);
});

test("dry-run : erreurs de lecture distinctes des refus et lecture complète malgré plusieurs incidents", () => {
  const source = path.join(temp, "read-error-source"); mkdirSync(source);
  writeFileSync(path.join(source, "denied.js"), "synthetic");
  const originalRead = fs.readFileSync;
  try {
    mock.method(fs, "readFileSync", (...args: Parameters<typeof fs.readFileSync>) => {
      if (typeof args[0] === "number") throw Object.assign(new Error("DO_NOT_LOG_READER_DETAILS"), { code: "EACCES" });
      return originalRead(...args);
    });
    syncBuiltinESMExports();
    const report = preflightCopyTree(source, () => true);
    assert.equal(report.status, "ERROR"); assert.equal(report.errors, 1); assert.equal(report.refused, 0);
    assert.equal(preflightExitCode(report), 2);
    assert.equal(report.issues[0].category, "erreur_lecture");
    assert.equal(JSON.stringify(report).includes("DO_NOT_LOG_READER_DETAILS"), false);
  } finally { mock.restoreAll(); syncBuiltinESMExports(); }
  const entries = [...discoverCopyEntries(source, () => true)];
  assert.equal(qualifyCopyEntry(source, entries[1]).status, "allowed");
});

test("dry-run : liens refusés comme en copie et aucun parcours de la jonction", () => {
  const source = path.join(temp, "dry-links-source"); mkdirSync(source);
  const external = path.join(temp, "dry-external"); mkdirSync(external);
  writeFileSync(path.join(external, "outside.js"), "synthetic");
  writeFileSync(path.join(source, "original.js"), "synthetic");
  linkSync(path.join(source, "original.js"), path.join(source, "shared.js"));
  symlinkSync(external, path.join(source, "linked"), process.platform === "win32" ? "junction" : "dir");
  const report = preflightCopyTree(source, () => true);
  assert.equal(report.refused, 3);
  assert.equal(report.categories.lien_ou_jonction, 1);
  assert.equal(report.categories.lien_physique_partagé, 2);
  assert.equal(JSON.stringify(report).includes("outside.js"), false);
});

test("copie : requalification et refus des modifications depuis le précontrôle", () => {
  const source = path.join(temp, "changed-source"); mkdirSync(source);
  writeFileSync(path.join(source, "runtime.js"), "initial synthetic");
  const report = preflightCopyTree(source, () => true);
  assert.equal(preflightExitCode(report), 0);
  writeFileSync(path.join(source, "runtime.js"), "changed synthetic");
  const target = path.join(temp, "changed-target"); mkdirSync(target);
  assert.throws(() => copyIndependentTree(source, target, () => true, [], "", Reflect.get(report, "manifest")), /source_modifiée/);
  assert.equal(existsSync(path.join(target, "runtime.js")), false);
  writeFileSync(path.join(source, "runtime.js"), "-----BEGIN PRIVATE KEY-----\nFICTIONAL_CHANGED_SECRET");
  assert.throws(() => copyIndependentTree(source, target, () => true), /marqueur_secret/);
});

test("dry-run intégré : mêmes secrets connus et aucune allocation d’exécution", () => {
  const source = path.join(temp, "known-source"); mkdirSync(source);
  mkdirSync(path.join(source, "src/app"), { recursive: true });
  writeFileSync(path.join(source, "src/app/page.tsx"), "fictional-known-value");
  const before = readdirSync(source);
  const report = preflightIsolatedSearch(source, { API_KEY: "fictional-known-value" });
  assert.equal(report.status, "BLOCKED");
  assert.equal(report.issues[0].category, "secret_connu");
  assert.deepEqual(readdirSync(source), before);
  assert.equal(existsSync(path.join(source, "test-results")), false);
});

test("PEM : seul un délimiteur exact dans une comparaison de validation est inoffensif", () => {
  const marker = "-----BEGIN PRIVATE KEY-----";
  const harmless = `export function validate(input) { return input.indexOf('${marker}') !== 0; }`;
  assert.doesNotThrow(() => assertNoSecret(Buffer.from(harmless), [], "node_modules/any-package/import.js"));
  // Deliberately meaningless base64-like data, never a real cryptographic key.
  const complete = `${marker}\nRklDVElPTkFMX0tFWV9CT0RZX09OTFlfTk9UX0FfUkVBTF9LRVk=\n-----END PRIVATE KEY-----`;
  const cases = [
    `const key = ${JSON.stringify(complete)};`,
    `const key = \`${complete}\`;`,
    `const key = '${marker}' + '\\nRklDVElPTkFMX0tFWQ==';`,
    `${harmless}\nconst key = ${JSON.stringify(complete)};`,
    `input.indexOf('${marker}\\nRklDVElPTkFMX0tFWQ==') !== 0;`,
  ];
  for (const source of cases) assert.throws(() => assertNoSecret(Buffer.from(source), [], "key.js"), /marqueur_secret/);
  assert.throws(() => assertNoSecret(Buffer.from(harmless + "\n// fictional-app-secret"), [Buffer.from("fictional-app-secret")], "import.js"), /secret_connu/);
  assert.throws(() => assertNoSecret(Buffer.from(harmless + "\nconst token = 'sk_live_FICTIONALONLY000000';"), [], "import.js"), /marqueur_secret/);
  assert.throws(() => assertNoSecret(Buffer.from(marker), [], "document.md"), /marqueur_secret/);
  const source = path.join(temp, "pem-source"), target = path.join(temp, "pem-target");
  mkdirSync(source); mkdirSync(target);
  writeFileSync(path.join(source, "import.js"), harmless);
  const report = preflightCopyTree(source, () => true);
  assert.equal(report.status, "PASS");
  copyIndependentTree(source, target, () => true, [], "", report.manifest);
  assert.equal(readFileSync(path.join(target, "import.js"), "utf8"), harmless);
});

test("ressources qualifiées : guide Next et CLI Supabase seuls exclus, empreintes et usages surveillés", () => {
  const source = path.join(temp, "qualified-source"), target = path.join(temp, "qualified-target");
  mkdirSync(source); mkdirSync(target);
  const nextDoc = "dist/docs/01-app/02-guides/environment-variables.md";
  const exe = "bin/supabase.exe";
  const consumer = "scripts/run-readonly-e2e-server.mjs";
  const files = [
    [`node_modules/next/${nextDoc}`, "-----BEGIN PRIVATE KEY-----\n..."],
    ["node_modules/next/dist/docs/another.md", "synthetic resource"],
    ["node_modules/next/package.json", '{"exports":"./runtime.js"}'],
    ["node_modules/next/runtime.js", "module.exports = 'synthetic'"],
    [`node_modules/supabase/${exe}`, "MZ-----BEGIN PRIVATE KEY-----\n..."],
    ["node_modules/supabase/package.json", '{"bin":"bin/supabase.exe"}'],
    ["node_modules/supabase/scripts/postinstall.js", "// synthetic installation metadata"],
    ["node_modules/other/tool.exe", "MZ synthetic other executable"],
    [consumer, "// fixtures only"],
  ];
  for (const [name, bytes] of files) { mkdirSync(path.dirname(path.join(source, name)), { recursive: true }); writeFileSync(path.join(source, name), bytes); }
  const evidence = { [consumer]: createHash("sha256").update(files[8][1]).digest("hex") };
  const reviews = [["next", nextDoc], ["supabase", exe]].map(([pkg, name]) => {
    const review = reviewFixture(source, pkg, [name]);
    return { ...review, resources: review.documents, documents: {}, evidence };
  });
  const select = createDependencyCopySelector(source, reviews);
  const report = preflightCopyTree(source, select);
  assert.equal(report.status, "PASS"); assert.equal(report.excluded, 2);
  copyIndependentTree(source, target, select);
  for (const [name] of files) assert.equal(existsSync(path.join(target, name)), ![files[0][0], files[4][0]].includes(name), name);
  writeFileSync(path.join(source, consumer), "// now requires CLI or guide");
  for (const [pkg, name] of [["next", nextDoc], ["supabase", exe]]) assert.equal(createDependencyCopySelector(source, reviews)(`node_modules/${pkg}/${name}`, false), true);
  writeFileSync(path.join(source, consumer), files[8][1]);
  writeFileSync(path.join(source, `node_modules/next/${nextDoc}`), "changed guide");
  assert.equal(createDependencyCopySelector(source, reviews)(`node_modules/next/${nextDoc}`, false), true);
  writeFileSync(path.join(source, "node_modules/supabase/package.json"), '{"main":"bin/supabase.exe"}');
  assert.equal(createDependencyCopySelector(source, reviews)(`node_modules/supabase/${exe}`, false), true);
});
