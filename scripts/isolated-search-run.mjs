import { closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectFiles = new Set([
  "package.json", "tsconfig.json", "tsconfig.playwright.json", "next-env.d.ts", "next.config.mjs",
  "e2e/owner-concierges-geography.config.ts", "e2e/traveler-stays-visual.config.ts",
  "e2e/owner-concierges-geography.spec.ts", "e2e/helpers/isolated-search.ts",
  "scripts/readonly-e2e-env.mjs", "scripts/readonly-e2e-network.mjs",
  "scripts/run-readonly-e2e-server.mjs", "scripts/isolated-search-run.mjs",
]);
const codeExtension = /\.(?:[cm]?[jt]sx?|scss|css|svg|woff2?|ttf|otf)$/i;
const secretName = /\.(?:pem|key|p12|sql|sqlite|db|csv|xlsx?|dump|bak)$/i;
const credentialKey = /(?:SECRET|TOKEN|PASSWORD|API_KEY|SERVICE_ROLE_KEY|ANON_KEY|DATABASE_URL)/i;

// Reviewed package-local documentation only. Never infer dispensability from .md.
// dotenv: multiline-key examples; @playwright/test: introductory usage guide.
// Their entry points, exports, generators and runtime files do not load these documents.
// Pin every other package file (including package.json) so a new resource reference,
// export or generator invalidates the exclusion instead of silently losing a resource.
const fixtureConsumers = {
  "package.json": "f5f90260cf60bdf4b79bb47991a256652e145db9203ad867f35c8aa8fe902046",
  "scripts/run-isolated-search-e2e.mjs": "90b35896d5666428853a040aebf338d7bd0a3c3e6616e3e431d4f1a96f3fcda5",
  "scripts/run-readonly-e2e-server.mjs": "37db19e1388db04ae9297afc3ebb6bf29ce4b8581c6cef35f74fc04d3c05f707",
  "scripts/readonly-e2e-env.mjs": "274e941a5ef1c718ce01ed3653c8f002f5e564aa72e2f13f6e01869062ff734c",
  "e2e/owner-concierges-geography.config.ts": "acb0694d9ccca051fd7c8f9819336652cbc487325e1aa9a3064bd82edac95584",
  "e2e/owner-concierges-geography.spec.ts": "8ac6a5c8b799f042df7df51f45d4ab1198781deba26af5dd641d7e87d6c67609",
};
/** @type {Array<{packageName: string, packageSha256: string, documents: Record<string, string>, resources?: Record<string, string>, evidence?: Record<string, string>}>} */
const reviewedDependencyDocs = [
  {
    packageName: "dotenv",
    packageSha256: "1670e569374a0610ce4867a00318eb495dcdfda15580f06821e0774ae1d054f6",
    documents: {
      "README.md": "85e0365223e6a394e01d9190dccf56e37e7c387a95069063436d3e5f61f3df58",
      "README-es.md": "ebd056721b1ae95fe7c515f0497aab239775574d5e6be1971d03aae44d5163c7",
    },
  },
  {
    packageName: "@playwright/test",
    packageSha256: "d5dc7c098e718d5ed2fac364b076c569e7e7cb2d17e5c30578f84f74b3b3a96a",
    documents: { "README.md": "d753d8f27fe36f705efad3199201148b8b55a41de977329d33c1ca81a744c6ef" },
  },
  {
    // The only bundled-doc reference in Next's JS points agents to the directory;
    // next dev does not load this guide. Every other Next file is fingerprinted.
    packageName: "next", documents: {}, evidence: fixtureConsumers,
    packageSha256: "86710ceae0ff93a09db8ce3139fb294decbde05ac276db6ac02b324de1293a71",
    resources: { "dist/docs/01-app/02-guides/environment-variables.md": "089542c335bc9da8799e86a1696a3941a3b46d0cbedc01ebd234c3a1a2c587c2" },
  },
  {
    // CLI-only bin/postinstall, not a Next/Playwright dependency. The pinned
    // fixtures launch neither this CLI nor npm installation; retain other files.
    packageName: "supabase", documents: {}, evidence: fixtureConsumers,
    packageSha256: "5026c23badf0ac1cd1dbac77c663f89be22fab0c2a9033e5080a63230c299919",
    resources: { "bin/supabase.exe": "1ff62b03c999ce51ba5eacdf9dc637a13006ffc2b0db2b02128245c5dfed2cd4" },
  },
];

export function dependencyPackageFingerprint(sourceRoot, packageName, documentNames) {
  const packageRelative = `node_modules/${packageName}`;
  if (!/^(?:@[\w.-]+\/)?[\w.-]+$/.test(packageName)) throw new Error("Nom de package invalide.");
  let current = sourceRoot;
  for (const segment of packageRelative.split("/")) {
    current = path.join(current, segment);
    if (lstatSync(current).isSymbolicLink() || !isInside(sourceRoot, realpathSync(current))) throw copyRefusal("lien_ou_jonction", packageRelative);
  }
  const hash = createHash("sha256");
  function visit(relative = "") {
    const source = path.join(current, relative);
    const stat = lstatSync(source);
    if (stat.isSymbolicLink() || !isInside(current, realpathSync(source))) throw copyRefusal("lien_ou_jonction", `${packageRelative}/${relative}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(source).sort()) visit(relative ? `${relative}/${name}` : name);
    } else if (stat.isFile()) {
      if (stat.nlink !== 1) throw copyRefusal("lien_physique_partagé", `${packageRelative}/${relative}`);
      if (!documentNames.includes(relative)) {
        const bytes = readFileSync(source);
        hash.update(`${relative}\0${bytes.length}\0`); hash.update(bytes);
      }
    } else throw new Error("Ressource de package non qualifiée.");
  }
  visit();
  return hash.digest("hex");
}

export function createDependencyCopySelector(sourceRoot, reviews = reviewedDependencyDocs) {
  const excluded = new Set();
  for (const review of reviews) {
    try {
      if (review.evidence && !Object.entries(review.evidence).every(([name, digest]) => {
        const source = path.resolve(sourceRoot, name);
        if (!isInside(sourceRoot, source)) return false;
        const stat = lstatSync(source);
        return stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
          isInside(sourceRoot, realpathSync(source)) && createHash("sha256").update(readFileSync(source)).digest("hex") === digest;
      })) continue;
      const candidates = { ...review.documents, ...review.resources };
      const names = Object.keys(candidates);
      if (dependencyPackageFingerprint(sourceRoot, review.packageName, names) !== review.packageSha256) continue;
      for (const name of names) {
        const reviewedResource = (review.packageName === "next" && name === "dist/docs/01-app/02-guides/environment-variables.md") ||
          (review.packageName === "supabase" && name === "bin/supabase.exe");
        if (!reviewedResource && !/^(?:README(?:-[a-z]+)?|CHANGELOG|HISTORY)\.(?:md|txt)$/i.test(name)) continue;
        const relative = `node_modules/${review.packageName}/${name}`;
        const source = path.join(sourceRoot, relative);
        const stat = lstatSync(source);
        if (stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 &&
            createHash("sha256").update(readFileSync(source)).digest("hex") === candidates[name]) excluded.add(relative);
      }
    } catch {
      // Missing/changed/linked package: retain its documents under the usual guards.
    }
  }
  return (relative, directory) => !excluded.has(relative.replaceAll("\\", "/")) && acceptSearchCopy(relative, directory);
}

export function isInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export function mayCopyProjectFile(relative) {
  const parts = relative.replaceAll("\\", "/").split("/");
  if (parts.some(part => part.startsWith(".") && part !== "" || secretName.test(part))) return false;
  const name = parts.join("/");
  if (projectFiles.has(name)) return true;
  if (parts[0] === "src" && parts[1] !== "tests" && !/\.(?:test|spec)\./.test(name)) return codeExtension.test(name);
  if (/^public\/(?:icons|logo|ornements|textures)\//.test(name)) return /\.(?:svg|png|jpe?g|webp|woff2?)$/i.test(name);
  return /^public\/default-profile(?:F|M)?\.png$/.test(name);
}

function knownSecrets(sourceRoot, inherited) {
  const values = [];
  for (const [key, value] of Object.entries(inherited)) if (credentialKey.test(key) && value?.length >= 8) values.push(value);
  for (const name of readdirSync(sourceRoot).filter(name => name.startsWith(".env"))) {
    const source = path.join(sourceRoot, name);
    if (lstatSync(source).isSymbolicLink()) throw copyRefusal("lien_ou_jonction", name);
    if (!lstatSync(source).isFile()) continue;
    for (const line of readFileSync(source, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([\w]+)\s*=\s*(.*?)\s*$/);
      if (!match || !credentialKey.test(match[1])) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
      if (value.length >= 8) values.push(value);
    }
  }
  return [...new Set(values)].map(value => Buffer.from(value));
}

function copyRefusal(category, relative) {
  const name = relative.replaceAll("\\", "/").replace(/[\r\n\x00-\x1f\x7f]/g, "?");
  const error = new Error(`Copie refusée [${category}] : ${name} (valeur masquée).`);
  error.code = category;
  error.relative = name;
  return error;
}

function unsafePrivateKeyMarker(text, relative) {
  const marker = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g;
  const occurrences = [...text.matchAll(marker)];
  if (!occurrences.length) return false;
  if (!/\.[cm]?[jt]sx?$/i.test(relative)) return true;
  // Only the inspected validation idiom is harmless: value.indexOf(exactDelimiter)
  // compared with zero. No package exemption, variable assignment, concatenation,
  // template literal or marker containing payload is accepted by this rule.
  const ast = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true);
  if (ast.parseDiagnostics.length) return true;
  const safe = [];
  function visit(node) {
    if (ts.isStringLiteral(node) && /^-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----$/.test(node.text)) {
      const call = node.parent;
      const comparison = call?.parent;
      if (ts.isCallExpression(call) && call.arguments.length === 1 && call.arguments[0] === node &&
          ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "indexOf" &&
          ts.isBinaryExpression(comparison) && comparison.left === call &&
          [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(comparison.operatorToken.kind) &&
          ts.isNumericLiteral(comparison.right) && comparison.right.text === "0") safe.push([node.getStart(ast), node.end]);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return occurrences.some(match => !safe.some(([start, end]) => match.index >= start && match.index + match[0].length <= end));
}

export function assertNoSecret(bytes, secrets = [], relative = "<contenu>") {
  if (secrets.some(secret => bytes.includes(secret))) throw copyRefusal("secret_connu", relative);
  const text = bytes.toString("utf8");
  if (unsafePrivateKeyMarker(text, relative) || /\b(?:sk_live_|sb_secret_|ghp_|github_pat_)[A-Za-z0-9_]{12,}/.test(text)) {
    throw copyRefusal("marqueur_secret", relative);
  }
}

const securityCategories = new Set(["secret_connu", "marqueur_secret", "lien_ou_jonction", "lien_physique_partagé", "source_modifiée", "type_interdit"]);
const normalized = relative => relative.replaceAll("\\", "/").replace(/[\x00-\x1f\x7f]/g, "?") || ".";
const identity = stat => `${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}:${stat.nlink}`;
// Windows can report dev=0 for path metadata and a real volume ID for a handle.
const sameSource = (a, b) => identity(a) === identity(b) && (!a.dev || !b.dev || a.dev === b.dev);

function safeIssue(error, relative) {
  const security = securityCategories.has(error?.code);
  return { kind: security ? "security" : "technical", category: security ? error.code : "erreur_lecture",
    path: normalized(error?.relative ?? relative), ...(security ? {} : { code: /^[A-Z0-9_]+$/.test(error?.code ?? "") ? error.code : "UNKNOWN" }) };
}

// Discovery prunes excluded directories without following their links. Counts concern
// discovered files only; pruned directories are reported separately, never traversed.
export function* discoverCopyEntries(sourceRoot, accept, relative = "") {
  if (!isInside(sourceRoot, path.resolve(sourceRoot, relative))) {
    yield { relative, error: copyRefusal("lien_ou_jonction", relative) }; return;
  }
  let stat;
  try { stat = lstatSync(path.join(sourceRoot, relative)); }
  catch (error) { yield { relative, error }; return; }
  const excluded = Boolean(relative) && !accept(relative, stat.isDirectory());
  yield { relative, stat, excluded };
  if (excluded || !stat.isDirectory() || stat.isSymbolicLink()) return;
  let names;
  try { names = readdirSync(path.join(sourceRoot, relative)).sort(); }
  catch (error) { yield { relative, error }; return; }
  for (const name of names) yield* discoverCopyEntries(sourceRoot, accept, path.join(relative, name));
}

// Pure qualification with respect to the filesystem: metadata checks and reads only.
export function qualifyCopyEntry(sourceRoot, entry, secrets = []) {
  const { relative, stat } = entry;
  if (entry.error) return { status: "issue", ...safeIssue(entry.error, relative) };
  if (entry.excluded) return { status: "excluded", directory: stat.isDirectory() };
  const source = path.join(sourceRoot, relative);
  let fd;
  try {
    if (stat.isSymbolicLink() || !isInside(sourceRoot, realpathSync(source))) throw copyRefusal("lien_ou_jonction", relative);
    if (stat.isDirectory()) return { status: "allowed", directory: true };
    if (!stat.isFile()) throw copyRefusal("type_interdit", relative);
    if (stat.nlink !== 1) throw copyRefusal("lien_physique_partagé", relative);
    fd = openSync(source, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    if (!sameSource(fstatSync(fd), stat)) throw copyRefusal("source_modifiée", relative);
    const bytes = readFileSync(fd);
    if (!sameSource(fstatSync(fd), stat) || !sameSource(lstatSync(source), stat) || !isInside(sourceRoot, realpathSync(source))) throw copyRefusal("source_modifiée", relative);
    assertNoSecret(bytes, secrets, relative);
    return { status: "allowed", directory: false, bytes,
      fingerprint: `${identity(stat)}:${createHash("sha256").update(bytes).digest("hex")}` };
  } catch (error) { return { status: "issue", ...safeIssue(error, relative) }; }
  finally { if (fd !== undefined) closeSync(fd); }
}

function emptyPreflight() {
  const report = { status: "PASS", examined: 0, allowed: 0, excluded: 0, excludedDirectories: 0, refused: 0, errors: 0,
    categories: /** @type {Record<string, number>} */ ({}),
    issues: /** @type {Array<{kind: string, category: string, path: string, code?: string}>} */ ([]), manifest: new Map() };
  // Source fingerprints stay in memory; never log them or trust a saved JSON report.
  Object.defineProperty(report, "manifest", { enumerable: false });
  return report;
}

export function preflightCopyTree(sourceRoot, accept, secrets = []) {
  const report = emptyPreflight();
  for (const entry of discoverCopyEntries(sourceRoot, accept)) {
    const result = qualifyCopyEntry(sourceRoot, entry, secrets);
    if (entry.stat && !entry.stat.isDirectory()) report.examined++;
    if (result.status === "excluded") {
      if (result.directory) report.excludedDirectories++; else report.excluded++;
    } else if (result.status === "allowed") {
      report.manifest.set(normalized(entry.relative), result.directory ? "directory" : result.fingerprint);
      if (!result.directory) report.allowed++;
    } else {
      const { status, ...issue } = result;
      report.issues.push(issue);
      if (issue.kind === "security") report.refused++; else report.errors++;
      report.categories[issue.category] = (report.categories[issue.category] ?? 0) + 1;
    }
  }
  report.status = report.errors ? "ERROR" : report.refused ? "BLOCKED" : "PASS";
  return report;
}

export function preflightIsolatedSearch(sourceRoot, inherited = process.env) {
  try {
    sourceRoot = realpathSync(sourceRoot);
    return preflightCopyTree(sourceRoot, createDependencyCopySelector(sourceRoot), knownSecrets(sourceRoot, inherited));
  } catch (error) {
    const report = emptyPreflight();
    const issue = safeIssue(error, ".");
    report.status = issue.kind === "security" ? "BLOCKED" : "ERROR";
    report.refused = issue.kind === "security" ? 1 : 0;
    report.errors = issue.kind === "technical" ? 1 : 0;
    report.categories[issue.category] = 1; report.issues.push(issue);
    return report;
  }
}

export const preflightExitCode = report => report.errors ? 2 : report.refused ? 1 : 0;

// Requalify on every copy. Write the very bytes scanned, never reopen the source
// with copyFile() after scanning. wx creates a fresh independent file exclusively.
/** @param {Map<string, string> | null} expected */
export function copyIndependentTree(sourceRoot, targetRoot, accept, secrets = [], relative = "", expected = null) {
  const seen = new Set();
  for (const entry of discoverCopyEntries(sourceRoot, accept, relative)) {
    const result = qualifyCopyEntry(sourceRoot, entry, secrets);
    if (result.status === "excluded") continue;
    if (result.status === "issue") throw copyRefusal(result.category, normalized(entry.relative));
    const name = normalized(entry.relative);
    seen.add(name);
    if (expected && expected.get(name) !== (result.directory ? "directory" : result.fingerprint)) throw copyRefusal("source_modifiée", name);
    if (result.directory) {
      if (entry.relative) mkdirSync(path.join(targetRoot, entry.relative));
    } else writeFileSync(path.join(targetRoot, entry.relative), result.bytes, { flag: "wx" });
  }
  if (expected && [...expected.keys()].some(name => !seen.has(name))) throw copyRefusal("source_modifiée", ".");
}

function ensurePhysicalDirectory(directory) {
  directory = path.resolve(directory);
  let stat;
  try { stat = lstatSync(directory); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    ensurePhysicalDirectory(path.dirname(directory));
    mkdirSync(directory);
    stat = lstatSync(directory);
  }
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(directory) !== directory) throw new Error("Racine des copies liée interdite.");
}

export function allocateSearchRun(base) {
  ensurePhysicalDirectory(base);
  const id = `run-${randomUUID()}`;
  const runRoot = path.join(base, id);
  mkdirSync(runRoot); // Atomic, exclusive; EEXIST is an explicit failure.
  const projectRoot = path.join(runRoot, "project");
  const artifactsRoot = path.join(runRoot, "artifacts");
  mkdirSync(projectRoot);
  mkdirSync(artifactsRoot);
  mkdirSync(path.join(runRoot, "tmp"));
  return { id, runRoot, projectRoot, artifactsRoot };
}

export function acceptSearchCopy(relative, directory) {
  const name = relative.replaceAll("\\", "/");
  if (name.split("/").some(part => part.startsWith(".env") || [".git", ".next", ".next-e2e", "test-results", "playwright-report", "uploads"].includes(part))) return false;
  if (name === "node_modules" || name.startsWith("node_modules/")) {
    return !name.split("/").some(part => part.startsWith(".") || /\.(?:pem|key|p12|sql|sqlite|db|dump|bak)$/.test(part));
  }
  if (name === "src/tests" || name.startsWith("src/tests/")) return false;
  if (!directory) return mayCopyProjectFile(name);
  return ["src", "public/icons", "public/logo", "public/ornements", "public/textures"].some(prefix => name === prefix || name.startsWith(prefix + "/") || prefix.startsWith(name + "/")) ||
    [...projectFiles].some(file => file === name || file.startsWith(name + "/"));
}

export function prepareIsolatedSearchRun(sourceRoot, inherited = process.env) {
  sourceRoot = realpathSync(sourceRoot);
  const secrets = knownSecrets(sourceRoot, inherited);
  const run = allocateSearchRun(path.join(sourceRoot, "test-results", "e2e-isolated-search"));
  copyIndependentTree(sourceRoot, run.projectRoot, createDependencyCopySelector(sourceRoot), secrets);
  for (const required of [...projectFiles, "node_modules/next/dist/bin/next", "node_modules/@playwright/test/cli.js"]) {
    if (!lstatSync(path.join(run.projectRoot, required)).isFile()) throw new Error("Copie E2E incomplète.");
  }
  writeFileSync(path.join(run.projectRoot, ".pls-readonly-run.json"), JSON.stringify({ ...run, sourceRoot }), { flag: "wx" });
  return run;
}

export function requireIsolatedSearchRun() {
  const projectRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));
  const marker = path.join(projectRoot, ".pls-readonly-run.json");
  if (lstatSync(marker).isSymbolicLink()) throw new Error("Manifeste E2E lié interdit.");
  const run = JSON.parse(readFileSync(marker, "utf8"));
  if (!/^run-[0-9a-f-]{36}$/.test(run.id) ||
      path.basename(run.runRoot) !== run.id || run.projectRoot !== projectRoot ||
      run.runRoot !== path.dirname(projectRoot) ||
      run.artifactsRoot !== path.join(run.runRoot, "artifacts") ||
      realpathSync(run.artifactsRoot) !== run.artifactsRoot ||
      realpathSync(process.cwd()) !== projectRoot || projectRoot === run.sourceRoot) {
    throw new Error("Exécution E2E interdite hors de sa copie isolée.");
  }
  return run;
}
