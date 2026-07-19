import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../app/components/dashboard/mobile/DashboardMobileExperience.tsx", import.meta.url),
  "utf8",
);

test("la navigation mobile ne prend pas uniquement l'URL comme clé React", () => {
  assert.doesNotMatch(source, /key=\{action\.href\}/);
  assert.match(source, /key=\{`\$\{action\.label\}-\$\{action\.href\}`\}/);
});

test("les destinations admin dupliquées restent explicitement couvertes", () => {
  const adminControlRoutes = source.match(/return "\/dashboard\/admin\/controle";/g) ?? [];
  assert.equal(adminControlRoutes.length, 2);
});
