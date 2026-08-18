import assert from "node:assert/strict";
import test from "node:test";
import { buildDeveloperLogView } from "../app/dashboard/admin/(product-tech)/developpement/developerLog.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

test("buildDeveloperLogView combine commits et planning avec metadata exploitables", () => {
  const plan = parseMasterPlan(`# Plan
## Maintenance
| Domaine | Fonctionnalité | Profil concerné | Statut | Priorité | Preuves dans le code | Prochaine action |
|---|---|---|---|---|---|---|
| Qualité | Checkout Stripe | Owner | 🟠 Partiel | P0 Critique | Webhook validé | Exécuter le scénario |`, "2026-07-27T10:00:00.000Z");

  const view = buildDeveloperLogView({
    plan,
    projectVersion: "0.1.0",
    repositoryUrl: "https://github.com/Natalina933/planetls-betav1.git",
    changedFiles: [
      "src/app/dashboard/admin/(product-tech)/developpement/MasterPlanViewer.tsx",
      "src/app/dashboard/admin/(product-tech)/developpement/developerLog.ts",
      "docs/master-plan-planetls.md",
      "e2e/admin-development.spec.ts",
    ],
    branch: "master",
    dirtyFileCount: 4,
    commits: [
      {
        sha: "14031c7512c9b9436fe3703ae88f42ae8faf060a",
        shortSha: "14031c7",
        author: "NathHome",
        date: "2026-07-19T18:57:45+02:00",
        subject: "feat(admin): add activation alerts to dashboard and enhance KPI overview",
      },
    ],
  });

  assert.equal(view.entries.length, 3);
  assert.equal(view.entries[0]?.author, "Codex");
  assert.equal(view.entries[0]?.modifiedFiles.length, 4);
  assert.equal(view.entries[0]?.roadmapUpdates.length > 0, true);
  assert.equal(view.entries[0]?.potentialRegressions.length > 0, true);
  assert.equal(view.entries[1]?.category, "Pilotage");
  assert.equal(view.entries[0]?.version, "0.1.0");
  assert.equal(view.entries[2]?.category, "Administration");
  assert.equal(view.entries[1]?.priority, "P0 Critique");
  assert.equal(view.entries[2]?.priority, "P1 Prioritaire");
  assert.equal(view.entries[2]?.links[0]?.href.includes("/commit/14031c7512c9b9436fe3703ae88f42ae8faf060a"), true);
  assert.equal(view.features.includes("Checkout Stripe"), true);
  assert.equal(view.features.includes("Espace Développement"), true);
  assert.equal(view.authors.includes("NathHome"), true);
  assert.equal(view.dailySummaries.length > 0, true);
  assert.equal(view.dailySummaries[0]?.modifiedFilesCount, 4);
});
