import assert from "node:assert/strict";
import test from "node:test";
import { parseMasterPlan } from "../app/dashboard/admin/developpement/masterPlan.ts";

test("parseMasterPlan reconnait le tableau fonctionnel meme avec un en-tete degrade", () => {
  const markdown = `# Plan
## Etat actuel
### Tableau fonctionnel construit depuis le code
| FonctionnalitA? | A?tat | Niveau | Observations factuelles |
|---|---|---:|---|
| Authentification | En cours | N3 | Parcours principal disponible |
| Notifications | Partiel | N2 | Push non branche |`;

  const plan = parseMasterPlan(markdown, "2026-08-18T10:00:00.000Z");

  assert.equal(plan.functionalRows.length, 2);
  assert.equal(plan.functionalStatusCounts["ðŸŸ¡ En cours"], 1);
  assert.equal(plan.functionalStatusCounts["ðŸŸ  Partiel"], 1);
});
