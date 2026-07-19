import assert from "node:assert/strict";
import test from "node:test";
import { parseMasterPlan } from "../app/dashboard/admin/developpement/masterPlan.ts";

test("parseMasterPlan indexe les sections, statuts et priorités", () => {
  const plan = parseMasterPlan("# Plan\n\n## Livraison\n\n🟡 En cours | P0 Critique\n\n### Suite\n\n✅ Terminé", "2026-07-19T12:00:00.000Z");
  assert.equal(plan.title, "Plan");
  assert.equal(plan.sections.length, 2);
  assert.equal(plan.statusCounts["🟡 En cours"], 1);
  assert.equal(plan.statusCounts["✅ Terminé"], 1);
  assert.equal(plan.priorityCounts["P0 Critique"], 1);
  assert.deepEqual(plan.sections[0].statuses, ["🟡 En cours"]);
});

test("parseMasterPlan génère des ancres uniques", () => {
  const plan = parseMasterPlan("# Plan\n## Même titre\nA\n## Même titre\nB", "2026-07-19T12:00:00.000Z");
  assert.deepEqual(plan.sections.map((section) => section.id), ["meme-titre", "meme-titre-2"]);
});
