import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sources(path) : /\.(tsx?|css|scss)$/.test(path) ? [path] : [];
  });
}

test("démonstrations : aucun import métier ni appel de données réelles", () => {
  for (const file of sources("src/app/design-system").filter(path => /\.tsx?$/.test(path))) {
    const source = readFileSync(file, "utf8");
    const imports = [...source.matchAll(/(?:from\s+|import\s*\()["'](@\/[^"']+)["']/g)].map(match => match[1]);
    for (const imported of imports) assert.match(imported, /^@\/(?:components\/ui(?:\/|$)|styles\/tokens(?:\/|$))/, `${file}: ${imported}`);
    assert.doesNotMatch(source, /\b(?:fetch|createClient|useSWR)\s*\(|\bsupabase\s*\./, file);
  }
});

test("tokens TypeScript et atelier : chaque référence CSS canonique existe", () => {
  const css = readFileSync("src/styles/tokens/tokens.css", "utf8");
  const declarations = new Set([...css.matchAll(/(--ds-[\w-]+)\s*:/g)].map(match => match[1]));
  const files = ["colors.ts", "spacing.ts", "typography.ts", "shadows.ts"].map(file => `src/styles/tokens/${file}`);
  files.push("src/app/design-system/atelier.module.scss");
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(/var\((--ds-[\w-]+)/g)) assert.ok(declarations.has(match[1]), `${file}: ${match[1]} manquant`);
  }
});
