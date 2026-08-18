import assert from "node:assert/strict";
import test from "node:test";
import { buildArchitectureDecisionCenter } from "../app/dashboard/admin/(product-tech)/decisions-architecture/architectureDecisions.ts";

test("buildArchitectureDecisionCenter expose les champs de décision et les liens entre décisions", () => {
  const center = buildArchitectureDecisionCenter({
    markdown: `
**2026-07-27 - Pilotage.** Bloc Mission Control ajouté dans /dashboard/admin/developpement pour centraliser progression, santé et décisions.
**2026-07-27 - Workflow.** Spéc Playwright enrichie pour figer les panneaux repliés de la page développement.
`,
    projectVersion: "0.1.0",
    workflowExists: true,
  });

  assert.equal(center.decisions.length >= 6, true);
  assert.equal(center.categories.includes("Architecture"), true);
  assert.equal(center.tags.includes("playwright"), true);

  const supabaseDecision = center.decisions.find((decision) => decision.id === "memory-supabase");
  assert.ok(supabaseDecision);
  assert.equal(supabaseDecision.options.length >= 3, true);
  assert.equal(supabaseDecision.advantages.length >= 2, true);
  assert.equal(supabaseDecision.linkedDecisionIds.length >= 1, true);

  const derivedDecision = center.decisions.find((decision) => decision.source === "master-plan");
  assert.ok(derivedDecision);
  assert.equal(derivedDecision.justification.length > 0, true);
  assert.equal(derivedDecision.consequences.length > 0, true);
});
