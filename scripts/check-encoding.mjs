import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const INCLUDE_DIRS = [".", "src", "scripts", "docs", "database", "public", "supabase", ".vscode"];
const INCLUDE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".scss",
  ".css",
  ".json",
  ".md",
  ".sql",
  ".yml",
  ".yaml",
  ".txt",
]);
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".next-e2e",
  ".continue",
  ".codex",
  "node_modules",
  "coverage",
  "dist",
  "build",
  "test-results",
  ".tsbuild",
]);
const SUSPICIOUS_PATTERNS = [
  "Ã",
  "Â",
  "ï¿½",
  "\ufffd",
  "â€™",
  "â€œ",
  "â€",
  "â€“",
  "â€”",
  "Ã¢â‚¬",
  "Ãƒ",
];
const IGNORE_FILE_PATTERNS = [
  /^src[\\/]+types[\\/]+supabase(?:\.generated)?\.ts$/,
  /^scripts[\\/]check-encoding\.mjs$/,
];

// Sortie de build suivie, conservée comme preuve, créée au commit 30cd5f03.
// Toute modification ou suppression impose une révision explicite de cette référence.
const HISTORICAL_EVIDENCE = new Map([
  ["build-error.txt", "f3f206fffad9ae7dc30b7710e6c43cfd5d9ae86e83d9e6b7044604b74474b237"],
]);

function shouldIgnore(relativePath) {
  return IGNORE_FILE_PATTERNS.some((pattern) => pattern.test(relativePath));
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!INCLUDE_EXTENSIONS.has(extname(entry.name))) continue;
    files.push(fullPath);
  }

  return files;
}

function hasUtf8Bom(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function detectEncoding(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) return "utf-16le";
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) return "utf-16be";
  if (hasUtf8Bom(buffer)) return "utf-8-bom";
  return "utf-8";
}

function decodeUtf8(buffer) {
  return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
}

const directories = Array.from(new Set(INCLUDE_DIRS.map((dir) => join(ROOT, dir))));
const files = [];

for (const directory of directories) {
  try {
    if (!statSync(directory).isDirectory()) continue;
  } catch {
    continue;
  }

  walk(directory, files);
}

const visited = new Set();
const issues = [];

for (const file of files) {
  const relativePath = relative(ROOT, file);
  if (visited.has(relativePath) || shouldIgnore(relativePath)) continue;
  visited.add(relativePath);

  const buffer = readFileSync(file);
  const normalizedPath = relativePath.replaceAll("\\", "/");
  const expectedHash = HISTORICAL_EVIDENCE.get(normalizedPath);
  if (expectedHash) {
    const actualHash = createHash("sha256").update(buffer).digest("hex");
    if (actualHash !== expectedHash) {
      issues.push({ file: relativePath, detectedEncoding: "preuve historique", issues: ["Empreinte SHA-256 modifiée : révision explicite requise."] });
    } else {
      console.log(`Preuve historique préservée : ${normalizedPath} (SHA-256 vérifié).`);
    }
    continue;
  }
  const detectedEncoding = detectEncoding(buffer);
  const fileIssues = [];

  if (detectedEncoding === "utf-16le" || detectedEncoding === "utf-16be") {
    fileIssues.push(`Encodage ${detectedEncoding.toUpperCase()} détecté ; convertir en UTF-8 sans BOM.`);
  }

  if (detectedEncoding === "utf-8-bom") {
    fileIssues.push("BOM UTF-8 indésirable détecté.");
  }

  let content = "";
  try {
    content = decodeUtf8(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fileIssues.push(`Fichier non lisible en UTF-8 strict : ${message}`);
  }

  if (content) {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (content.includes(pattern)) {
        fileIssues.push(`Motif de mojibake détecté : ${JSON.stringify(pattern)}`);
      }
    }
  }

  if (fileIssues.length > 0) {
    issues.push({
      file: relativePath,
      detectedEncoding,
      issues: Array.from(new Set(fileIssues)),
    });
  }
}

for (const file of HISTORICAL_EVIDENCE.keys()) {
  if (![...visited].some((path) => path.replaceAll("\\", "/") === file)) {
    issues.push({ file, detectedEncoding: "preuve historique", issues: ["Preuve historique absente : révision explicite requise."] });
  }
}

if (issues.length > 0) {
  console.error("Problèmes d'encodage détectés :");
  for (const entry of issues) {
    console.error(`- ${entry.file} [${entry.detectedEncoding}]`);
    for (const issue of entry.issues) {
      console.error(`  - ${issue}`);
    }
  }
  process.exit(1);
}

console.log("Aucun problème d'encodage détecté.");
