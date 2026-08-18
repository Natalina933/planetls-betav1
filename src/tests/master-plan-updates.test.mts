import assert from "node:assert/strict";
import test from "node:test";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

test("parseMasterPlan extrait les mises a jour ciblees pour le cockpit developpement", () => {
  const markdown = `# Plan
## Journal
### Mise à jour ciblée - Nettoyage local

- Statut : \`Terminé\`
- Priorite : \`P3 Confort\`
- Perimetre mis a jour : \`docs/master-plan-planetls.md\`, \`.next-csrf-check/\`
- Réalité produit : le dernier reliquat hors docs a été supprimé.
- Décision de pilotage : considérer les caches de build comme jetables.
- Vérification : \`rg\` ne retourne plus aucune occurrence.
- Prochaine étape recommandée : repartir sur un chantier produit.`;

  const plan = parseMasterPlan(markdown, "2026-08-18T12:00:00.000Z");

  assert.equal(plan.updates.length, 1);
  assert.equal(plan.updates[0].subject, "Nettoyage local");
  assert.equal(plan.updates[0].status, "Terminé");
  assert.equal(plan.updates[0].priority, "P3 Confort");
  assert.equal(plan.updates[0].scope.length, 2);
  assert.equal(plan.updates[0].nextActions[0], "repartir sur un chantier produit.");
  assert.equal(plan.updates[0].isNew, true);
});

test("parseMasterPlan detecte un changement de statut sur un meme lot", () => {
  const markdown = `# Plan
## Journal
### Mise à jour ciblée - Cockpit admin

- Statut : \`En cours\`
- Priorite : \`P1 Prioritaire\`
- Réalité produit : premier cadrage.

### Mise à jour ciblée - Cockpit admin

- Statut : \`Terminé\`
- Priorite : \`P1 Prioritaire\`
- Réalité produit : ajout d'une idée de finition.
- Prochaine étape recommandée : surveiller les effets de bord.`;

  const plan = parseMasterPlan(markdown, "2026-08-18T12:00:00.000Z");

  assert.equal(plan.updates.length, 2);
  assert.equal(plan.updates[0].statusChanged, false);
  assert.equal(plan.updates[1].statusChanged, true);
  assert.equal(plan.updates[1].ideas.length, 1);
});
