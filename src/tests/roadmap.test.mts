import assert from "node:assert/strict";
import test from "node:test";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { buildRoadmapView, projectRoadmap } from "../app/dashboard/admin/(product-tech)/developpement/roadmap.ts";

test("la roadmap intelligente recalcule la prochaine fonctionnalité quand un chantier est terminé", () => {
  const markdown = `# Plan
## Maintenance
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Qualité | Smoke E2E des espaces critiques | Owner, concierge, provider | 🟡 En cours | P0 Critique | Playwright Chromium 3/3 PASS | Consolider le passage continu |
| Qualité | E2E transactionnel commercial | Owner, concierge | ⚠️ Bloqué | P0 Critique | Checkout hébergé prêt | Ajouter la clé de test |
| Qualité | Paiement Stripe différé | Owner | ⏸️ Reporté | P0 Critique | Clé indisponible | Reprendre quand une clé de test sera disponible |
| Pilotage | Vue de développement du Master Plan | Admin | ✅ Terminé | P1 Prioritaire | Route admin sécurisée | Observer l'usage |
| Pilotage | Roadmap intelligente | Admin | 🟡 En cours | P1 Prioritaire | Mission Control déjà présent | Recalculer les dépendances |`;
  const plan = parseMasterPlan(markdown, "2026-07-27T10:00:00.000Z");
  const roadmap = buildRoadmapView(plan);

  const initial = projectRoadmap(roadmap, []);
  assert.equal(initial.readyItems[0]?.title, "Smoke E2E des espaces critiques");
  assert.equal(initial.blockedItems[0]?.title, "E2E transactionnel commercial");
  assert.equal(initial.readyItems.some((item) => item.title === "Paiement Stripe différé"), false);
  assert.equal(initial.blockedItems.some((item) => item.title === "Paiement Stripe différé"), false);
  assert.deepEqual(initial.blockedItems[0]?.dependencyLabels, ["Smoke E2E des espaces critiques"]);

  const afterCompletion = projectRoadmap(roadmap, [initial.readyItems[0]!.id]);
  assert.equal(afterCompletion.completedItems[0]?.title, "Smoke E2E des espaces critiques");
  assert.equal(afterCompletion.nextSuggestion?.title, "E2E transactionnel commercial");
  assert.equal(afterCompletion.readyItems.some((item) => item.title === "E2E transactionnel commercial"), true);
});

test("la roadmap active exclut les idees P4", () => {
  const markdown = `# Plan
## Maintenance
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Produit | Socle actif | Admin | 🟡 En cours | P1 Prioritaire | Test | Le poursuivre |
| IA | Idee future | Owner | 🟠 À faire | P4 Idée / À étudier | Hypothese | L'etudier |`;
  const plan = parseMasterPlan(markdown, "2026-09-02T10:00:00.000Z");
  const roadmap = buildRoadmapView(plan);

  assert.equal(roadmap.items.some((item) => item.title === "Idee future"), false);
  assert.equal(roadmap.items.some((item) => item.title === "Socle actif"), true);
});
