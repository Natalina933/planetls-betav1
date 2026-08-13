import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = process.cwd();
const INCLUDE_DIRS = ["src", "scripts"];
const INCLUDE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".scss",
  ".json",
]);
const SKIP_DIRS = new Set([".git", ".next", "node_modules", "coverage", "dist", "build"]);
const MOJIBAKE_PATTERNS = [
  "\u00c3\u20ac",
  "\u00c3\u201a",
  "\u00c3\u00a9",
  "\u00c3\u00a8",
  "\u00c3\u00aa",
  "\u00c3\u00a2",
  "\u00c3\u00b4",
  "\u00c3\u00ae",
  "\u00c3\u00af",
  "\u00c3\u00a7",
  "\u00c3\u00b9",
  "\u00c2\u00b7",
  "\u00e2\u20ac\u2122",
  "\u00e2\u20ac\u201c",
  "\u00e2\u20ac\u201d",
  "\u00e2\u20ac\u0153",
  "\u00e2\u20ac\ufffd",
  "\u00e2\u20ac\u00a2",
];

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

const matches = [];

for (const relativeDir of INCLUDE_DIRS) {
  const directory = join(ROOT, relativeDir);
  try {
    if (!statSync(directory).isDirectory()) continue;
  } catch {
    continue;
  }

  for (const file of walk(directory)) {
    const content = readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const pattern = MOJIBAKE_PATTERNS.find((token) => line.includes(token));
      if (!pattern) return;

      matches.push({
        file,
        line: index + 1,
        pattern,
        preview: line.trim(),
      });
    });
  }
}

if (matches.length > 0) {
  console.error("Mojibake détecté :");
  for (const match of matches) {
    console.error(`- ${match.file}:${match.line} [${match.pattern}] ${match.preview}`);
  }
  process.exit(1);
}

console.log("Aucun motif d'encodage corrompu détecté.");
