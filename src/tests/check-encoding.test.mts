import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const script = resolve("scripts/check-encoding.mjs");
const evidence = resolve("build-error.txt");

test("le contrôle protège la preuve et refuse les nouveaux fichiers non conformes", () => {
  const root = mkdtempSync(join(tmpdir(), "planetls-encoding-"));
  const run = () => spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
  try {
    mkdirSync(join(root, "src"));
    copyFileSync(evidence, join(root, "build-error.txt"));
    writeFileSync(join(root, "src", "correct.ts"), "export const titre = 'Séjour';\n");
    let result = run();
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Preuve historique préservée/);

    writeFileSync(join(root, "src", "nouveau.ts"), Buffer.from([0xef, 0xbb, 0xbf, 0x61]));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /BOM UTF-8/);

    writeFileSync(join(root, "src", "nouveau.ts"), "const titre = '\u00c3\u00a9';\n");
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /mojibake/);

    writeFileSync(join(root, "src", "nouveau.ts"), Buffer.from([0xff, 0xfe, 0x61, 0x00]));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /UTF-16LE/);

    rmSync(join(root, "src", "nouveau.ts"));
    writeFileSync(join(root, "build-error.txt"), "preuve modifiée");
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Empreinte SHA-256 modifiée/);

    rmSync(join(root, "build-error.txt"));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Preuve historique absente/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
