import assert from "node:assert/strict";
import test from "node:test";
import { buildMissionControlView } from "../app/dashboard/admin/(product-tech)/developpement/missionControl.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

test("buildMissionControlView synthétise progression, charge et santé", () => {
  const markdown = `# Plan
## Journal
| 2026-07-27 | Pilotage/UX | Transformer la page Developer en Mission Control | Donner une lecture en 30 secondes | Cockpit enrichi |
## Maintenance
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Pilotage | Mission Control | Admin | 🟡 En cours | P1 Prioritaire | Vue premium | Finaliser les tests |
| Qualité | Checkout Stripe | Owner | ⚠️ Bloqué | P0 Critique | Clé manquante | Configurer le secret |
| Qualité | Baseline build | Tous | ✅ Terminé | P0 Critique | Build OK | Maintenir |`;
  const plan = parseMasterPlan(markdown, "2026-07-27T10:00:00.000Z");

  const view = buildMissionControlView({
    plan,
    markdown,
    projectVersion: "0.1.0",
    commits: [
      {
        sha: "a".repeat(40),
        shortSha: "aaaaaaa",
        author: "NathHome",
        date: "2026-07-27T09:30:00+02:00",
        subject: "feat(admin): add mission control summary",
      },
    ],
    branch: "main",
    dirtyFileCount: 2,
    repositoryUrl: "https://github.com/Natalina933/planetls-betav1.git",
    workflowExists: true,
    metadataBaseHost: "planetls-betav1.vercel.app",
    supabaseHealth: {
      label: "Santé Supabase",
      status: "healthy",
      detail: "12 profils et 4 missions accessibles au contrôle.",
      checkedAt: "2026-07-27T10:00:00.000Z",
    },
    checkedAt: "2026-07-27T10:00:00.000Z",
  });

  assert.equal(view.progressionPct, 33);
  assert.equal(view.completedFeatures, 1);
  assert.equal(view.inProgressFeatures, 1);
  assert.equal(view.blockedFeatures, 1);
  assert.equal(view.criticalBugs, 1);
  assert.equal(view.lastDecisions[0]?.title, "Transformer la page Developer en Mission Control");
  assert.equal(view.lastCommits[0]?.shortSha, "aaaaaaa");
  assert.equal(view.healthCards[0]?.status, "healthy");
  assert.equal(view.healthCards[1]?.status, "healthy");
  assert.equal(view.healthCards[2]?.status, "warning");
  assert.equal(view.weeklyDevelopmentMinutes > 0, true);
});
