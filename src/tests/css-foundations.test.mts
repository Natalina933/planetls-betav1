import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compile } from "sass";

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = join(dir, entry.name);
    return entry.isDirectory() ? sources(file) : /\.(?:css|scss|tsx?|jsx?)$/.test(file) ? [file] : [];
  });
}

test("all referenced DS tokens have a definition in the source tree", () => {
  const files = sources("src").map(file => ({ file, text: readFileSync(file, "utf8") }));
  const definitions = new Set(files.flatMap(({ text }) => [...text.matchAll(/(--ds-[\w-]+)\s*:/g)].map(match => match[1])));
  const missing = files.flatMap(({ file, text }) => [...text.matchAll(/var\((--ds-[\w-]+)/g)]
    .filter(match => !definitions.has(match[1])).map(match => `${file}: ${match[1]}`));
  assert.deepEqual(missing, []);
});

test("global foundations and shared styles compile without corrupted variable suffixes", () => {
  for (const file of ["src/app/styles/main.scss", "src/components/ui/Button/Button.module.scss", "src/components/ui/Container/Container.module.scss", "src/app/dashboard/owner/OwnerDashboardPages.module.scss"]) {
    const css = compile(file, { silenceDeprecations: ["legacy-js-api"] }).css;
    assert.doesNotMatch(css, /var\([^;\r\n]+\)[a-f\d]{2,}/i, file);
  }
});
