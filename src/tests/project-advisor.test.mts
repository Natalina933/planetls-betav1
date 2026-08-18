import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectAdvisorView } from "../app/dashboard/admin/(product-tech)/developpement/projectAdvisor.ts";
import { buildMissionControlView } from "../app/dashboard/admin/(product-tech)/developpement/missionControl.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { buildRoadmapView, projectRoadmap } from "../app/dashboard/admin/(product-tech)/developpement/roadmap.ts";
import { buildTechnicalMemoryView } from "../app/dashboard/admin/(product-tech)/developpement/technicalMemory.ts";

test("buildProjectAdvisorView priorise les réponses utiles du conseiller projet", () => {
  const markdown = `# Plan
## Journal
**2026-07-28 - Pilotage.** Mission Control devient le cockpit prioritaire du projet.
## Registre
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Paiement | Checkout hébergé Stripe | Owner | 🟡 En cours | P1 Prioritaire | Route checkout et webhook | Ajouter la couverture E2E |
| QA | Baseline build | Tous | ✅ Terminé | P0 Critique | Build Next OK | Maintenir |
| Réseau | Carte locale | Owner | ⚠️ Bloqué | P1 Prioritaire | Prototype carte | Débloquer après densité locale |`;

  const plan = parseMasterPlan(markdown, "2026-07-29T09:00:00.000Z");
  const roadmap = projectRoadmap(buildRoadmapView(plan), []);
  const missionControl = buildMissionControlView({
    plan,
    markdown,
    projectVersion: "0.1.0",
    commits: [],
    branch: "main",
    dirtyFileCount: 0,
    repositoryUrl: null,
    workflowExists: true,
    metadataBaseHost: "planetls-betav1.vercel.app",
    supabaseHealth: {
      label: "Santé Supabase",
      status: "healthy",
      detail: "OK",
      checkedAt: "2026-07-29T09:00:00.000Z",
    },
    checkedAt: "2026-07-29T09:00:00.000Z",
  });
  const technicalMemory = buildTechnicalMemoryView({
    markdown,
    projectVersion: "0.1.0",
    workflowExists: true,
  });

  const view = buildProjectAdvisorView({
    checkedAt: "2026-07-29T09:00:00.000Z",
    plan,
    missionControl,
    roadmap,
    technicalMemory,
    codeInsights: {
      designSystemDriftPages: [
        {
          route: "/dashboard/owner/legacy",
          file: "src/app/dashboard/owner/legacy/page.tsx",
          lines: 420,
          signals: ["Aucun import UI partagé"],
          testReferences: [],
        },
      ],
      productionReadyPages: [
        {
          route: "/dashboard/admin/developpement",
          file: "src/app/dashboard/admin/(product-tech)/developpement/page.tsx",
          lines: 180,
          signals: ["Tests présents", "Mission Control branché"],
          testReferences: ["src/tests/mission-control.test.mts"],
        },
      ],
      largeFiles: [
        { file: "src/app/dashboard/admin/(product-tech)/developpement/MasterPlanViewer.tsx", lines: 2200 },
      ],
      underusedComponents: [
        {
          component: "ShowcaseFlipCard",
          count: 1,
          evidence: ["src/components/ui/ShowcaseFlipCard/ShowcaseFlipCard.tsx"],
        },
      ],
      missingTestCandidates: [
        {
          title: "Checkout hébergé Stripe",
          priority: "P1 Prioritaire",
          nextAction: "Ajouter la couverture E2E",
          evidence: "Route checkout et webhook",
        },
      ],
    },
  });

  assert.equal(view.answers.length, 8);
  assert.equal(view.answers[0]?.id, "next-profitable-feature");
  assert.match(view.answers[0]?.answer ?? "", /Checkout hébergé Stripe/);
  assert.match(view.answers[1]?.answer ?? "", /Aucune dépendance bloquante majeure|chantier/);
  assert.match(view.answers[6]?.detail ?? "", /MasterPlanViewer/);
  assert.match(view.answers[7]?.detail ?? "", /Checkout hébergé Stripe/);
});
