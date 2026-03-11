import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT_DIR = process.cwd();
const UI_DIR = join(ROOT_DIR, "src", "components", "ui");
const SNAPSHOT_PATH = join(ROOT_DIR, "src", "tests", "ui-files.snapshot.json");

function walkFiles(dir: string): string[] {
  const entries = readdirSync(dir).sort();
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (!/\.(ts|tsx|scss)$/.test(entry)) continue;
    files.push(fullPath);
  }

  return files;
}

function buildSnapshot() {
  const files = walkFiles(UI_DIR);
  const snapshot: Record<string, string> = {};

  for (const filePath of files) {
    const content = readFileSync(filePath);
    const digest = createHash("sha256").update(content).digest("hex");
    snapshot[relative(ROOT_DIR, filePath).replaceAll("\\", "/")] = digest;
  }

  return snapshot;
}

test("ui files snapshot stays stable", () => {
  const current = buildSnapshot();
  const shouldUpdate = process.env.UPDATE_UI_SNAPSHOTS === "1";

  if (shouldUpdate) {
    mkdirSync(join(ROOT_DIR, "src", "tests"), { recursive: true });
    writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(current, null, 2)}\n`, "utf8");
  }

  assert.equal(existsSync(SNAPSHOT_PATH), true, "Snapshot file missing. Run with UPDATE_UI_SNAPSHOTS=1.");
  const expected = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as Record<string, string>;
  assert.deepEqual(current, expected);
});
