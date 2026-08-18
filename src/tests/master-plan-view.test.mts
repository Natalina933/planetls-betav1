import assert from "node:assert/strict";
import test from "node:test";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

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

test("parseMasterPlan construit un planning ordonné depuis le registre de maintenance", () => {
  const markdown = `# Plan
## Maintenance
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Produit | Paiement | Owner | 🟠 Partiel | P0 Critique | Webhook validé | Tester Checkout |
| Confort | Carte | Tous | 🔴 À faire | P3 Confort | Prototype | Cadrer le pilote |
| Qualité | Tests | Tous | ✅ Terminé | P0 Critique | 192 tests | Maintenir |`;
  const plan = parseMasterPlan(markdown, "2026-07-19T12:00:00.000Z");
  assert.equal(plan.planning.length, 2);
  assert.equal(plan.planning[0].feature, "Paiement");
  assert.equal(plan.planning[0].horizon, "Maintenant");
  assert.equal(plan.planning[1].horizon, "Plus tard");
  assert.equal(plan.planning.some((item) => item.feature === "Tests"), false);
  assert.equal(plan.registryPriorityCounts["P0 Critique"], 2);
  assert.equal(plan.remainingPriorityCounts["P0 Critique"], 1);
});

test("parseMasterPlan extrait le tableau fonctionnel avec statuts et niveaux", () => {
  const markdown = `# Plan
## État actuel
### Tableau fonctionnel construit depuis le code
| Fonctionnalité | État | Niveau | Observations factuelles |
|---|---|---:|---|
| Authentification | En cours | N3 | Parcours principal disponible |
| Notifications | Partiel | N2 | Push non branché |`;
  const plan = parseMasterPlan(markdown, "2026-08-18T10:00:00.000Z");
  assert.equal(plan.functionalRows.length, 2);
  assert.deepEqual(plan.functionalRows[0], {
    feature: "Authentification",
    status: "En cours",
    level: "N3",
    observations: "Parcours principal disponible",
  });
  assert.equal(plan.functionalLevelCounts.N3, 1);
  assert.equal(plan.functionalLevelCounts.N2, 1);
  assert.equal(plan.functionalStatusCounts["🟡 En cours"], 1);
  assert.equal(plan.functionalStatusCounts["🟠 Partiel"], 1);
});

test("parseMasterPlan ne compte pas les mentions historiques comme des P0 à réaliser", () => {
  const markdown = `# Plan
## Journal
Ancienne décision P0 Critique.
## Maintenance
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Qualité | Terminé | Tous | ✅ Terminé | P0 Critique | OK | Maintenir |
| Produit | À livrer | Owner | 🟠 Partiel | P0 Critique | Partiel | Finir |`;
  const plan = parseMasterPlan(markdown, "2026-07-19T12:00:00.000Z");
  assert.equal(plan.priorityCounts["P0 Critique"], 2);
  assert.equal(plan.registryPriorityCounts["P0 Critique"], 2);
  assert.equal(plan.remainingPriorityCounts["P0 Critique"], 1);
});
