import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEVELOPMENT_ITEM_STATUSES, parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

test("parseMasterPlan privilégie le registre structuré pour le cockpit développement", () => {
  const markdown = `# Plan

## Registre structuré du développement

\`\`\`json
{
  "version": 1,
  "items": [
    {
      "id": "PLS-DEV-001",
      "domain": "Produit",
      "title": "Cockpit développement",
      "summary": "Source canonique",
      "status": "IN_PROGRESS",
      "priority": "P1",
      "type": "documentation",
      "persona": "Admin",
      "phase": "Pilotage",
      "updatedAt": "2026-08-24",
      "nextAction": "Valider le cockpit.",
      "validationCriteria": ["Vue branchée"],
      "dependencies": [],
      "blocker": null,
      "routes": ["/dashboard/admin/developpement"],
      "files": ["docs/master-plan-planetls.md"],
      "progressLabel": "Le cockpit est maintenant branché sur un registre structuré.",
      "source": "docs/master-plan-planetls.md#registre-structure-du-developpement",
      "evidence": ["src/app/dashboard/admin/(product-tech)/developpement/masterPlan.ts"]
    }
  ]
}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");

  assert.equal(plan.diagnostics.source, "structured");
  assert.equal(plan.registryItems.length, 1);
  assert.equal(plan.planning[0]?.id, "P1-001");
  assert.equal(plan.diagnostics.nextSuggestedId, "P0-001 · P1-002 · P2-001 · P3-001 · P4-001");
  assert.equal(plan.planning[0]?.status, "🟡 En cours");
  assert.equal(plan.functionalRows[0]?.feature, "Cockpit développement");
});

test("parseMasterPlan remonte les erreurs de validation du registre structuré", () => {
  const markdown = `# Plan

## Registre structuré du développement

\`\`\`json
{
  "version": 1,
  "items": [
    {
      "id": "PLS-DEV-001",
      "domain": "Produit",
      "title": "Cockpit développement",
      "summary": "Source canonique",
      "status": "COMPLETED",
      "priority": "P1",
      "type": "documentation",
      "persona": "Admin",
      "phase": "Pilotage",
      "updatedAt": "2026-08-24",
      "nextAction": "",
      "validationCriteria": ["Vue branchée"],
      "dependencies": ["PLS-DEV-999"],
      "blocker": null,
      "routes": ["/dashboard/admin/developpement"],
      "files": ["docs/master-plan-planetls.md"],
      "progressLabel": "Le cockpit est branché.",
      "source": "docs/master-plan-planetls.md#registre-structure-du-developpement",
      "evidence": []
    }
  ]
}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");

  assert.equal(plan.diagnostics.source, "structured");
  assert.equal(plan.diagnostics.errors.some((error) => error.includes("sans prochaine action")), true);
  assert.equal(plan.diagnostics.errors.some((error) => error.includes("sans preuve")), true);
  assert.equal(plan.diagnostics.errors.some((error) => error.includes("Dépendances inconnues")), true);
});

test("the structured registry maps every status to its cockpit group", () => {
  const expectedLabels = {
    COMPLETED: "✅ Terminé",
    IN_PROGRESS: "🟡 En cours",
    TO_VERIFY: "🟠 Partiel",
    BLOCKED: "⚠️ Bloqué",
    READY: "🔴 À faire",
    TO_PLAN: "Non planifié",
    IDEA: "Idée à étudier",
    DEFERRED: "⏸️ Reporté",
  } as const;
  const markdown = `# Plan

## Registre structuré du développement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: DEVELOPMENT_ITEM_STATUSES.map((status, index) => ({
      id: `PLS-DEV-${String(index + 1).padStart(3, "0")}`,
      domain: "Pilotage",
      title: `Item ${status}`,
      summary: "Representative classification case.",
      status,
      priority: `P${index % 4}`,
      type: "test",
      persona: "Admin",
      phase: "Validation",
      updatedAt: "2026-08-24",
      nextAction: "Check the cockpit section.",
      validationCriteria: ["Status visible"],
      dependencies: [],
      blocker: null,
      routes: ["/dashboard/admin/developpement"],
      files: ["src/tests/master-plan-registry.test.mts"],
      progressLabel: "Registry test case.",
      source: "test",
      evidence: status === "COMPLETED" ? ["Automated test"] : [],
    })),
  }, null, 2)}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");
  const statusByFeature = new Map(plan.planning.map((item) => [item.feature.replace("Item ", ""), item.status]));

  assert.equal(plan.planning.length, DEVELOPMENT_ITEM_STATUSES.length);
  for (const status of DEVELOPMENT_ITEM_STATUSES) {
    assert.equal(statusByFeature.get(status), expectedLabels[status]);
  }
});

test("the registry completes a priority automatically when every criterion is validated", () => {
  const markdown = `# Plan

## Registre structuré du développement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: [
      {
        id: "PLS-DEV-001",
        domain: "Pilotage",
        title: "Validated priority",
        summary: "Status is derived from explicit validation.",
        status: "TO_VERIFY",
        priority: "P0",
        type: "test",
        persona: "Admin",
        phase: "Validation",
        updatedAt: "2026-08-25",
        nextAction: "Keep the automated check running.",
        validationCriteria: ["Criterion A", "Criterion B"],
        validatedCriteria: ["Criterion A", "Criterion B"],
        dependencies: [],
        blocker: null,
        routes: ["/dashboard/admin/developpement"],
        files: ["src/tests/master-plan-registry.test.mts"],
        progressLabel: "Every criterion is explicitly validated.",
        source: "test",
        evidence: ["Automated test"],
      },
      {
        id: "PLS-DEV-002",
        domain: "Pilotage",
        title: "Blocked priority",
        summary: "A blocker must keep precedence over completion automation.",
        status: "BLOCKED",
        priority: "P0",
        type: "test",
        persona: "Admin",
        phase: "Validation",
        updatedAt: "2026-08-25",
        nextAction: "Resolve the explicit blocker.",
        validationCriteria: ["Criterion A"],
        validatedCriteria: ["Criterion A"],
        dependencies: [],
        blocker: "External dependency",
        routes: ["/dashboard/admin/developpement"],
        files: ["src/tests/master-plan-registry.test.mts"],
        progressLabel: "Blocked despite a locally validated criterion.",
        source: "test",
        evidence: ["Automated test"],
      },
    ],
  }, null, 2)}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-25T10:00:00.000Z");

  assert.equal(plan.registryItems[0]?.status, "COMPLETED");
  assert.equal(plan.planning[0]?.status, "✅ Terminé");
  assert.equal(plan.registryItems[1]?.status, "BLOCKED");
});

test("le registre réel conserve des IDs uniques et un prochain numéro exploitable", async () => {
  const markdown = await readFile(new URL("../../docs/master-plan-planetls.md", import.meta.url), "utf8");
  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");
  const ids = plan.registryItems.map((item) => item.id);

  assert.equal(plan.diagnostics.source, "structured");
  assert.equal(plan.diagnostics.errors.length, 0);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.every((id) => /^PLS-[A-Z]+-\d{3}$/.test(id)), true);
  const adminCockpit = plan.registryItems.find((item) => item.id === "PLS-ADM-001");
  assert.equal(adminCockpit?.priority, "P1");
  assert.equal(adminCockpit?.status, "TO_VERIFY");
  assert.equal(adminCockpit?.title, "Provenance KPI et santé technique explicite");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-BIZ-001")?.priority, "P1");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-QUAL-002")?.priority, "P1");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DS-001")?.priority, "P2");
  const gdprAutomation = plan.registryItems.find((item) => item.id === "PLS-SEC-004");
  assert.equal(gdprAutomation?.priority, "P1");
  assert.equal(gdprAutomation?.status, "TO_PLAN");
  assert.equal(gdprAutomation?.title, "Conformité RGPD des demandes automatisées");
  const requestAutomation = plan.registryItems.find((item) => item.id === "PLS-DEV-029");
  assert.equal(requestAutomation?.priority, "P1");
  assert.equal(requestAutomation?.status, "TO_PLAN");
  assert.deepEqual(requestAutomation?.dependencies, ["PLS-SEC-003", "PLS-SEC-004", "PLS-DATA-003", "PLS-TEST-001"]);
  const githubIssues = plan.registryItems.flatMap((item) => item.githubIssues.map((issue) => issue.number));
  assert.equal(new Set(githubIssues).size, githubIssues.length);
  assert.deepEqual(githubIssues.sort((left, right) => left - right), [10, 11, 12, 13, 14, 15, 16, 17]);
  assert.equal(plan.diagnostics.nextSuggestedId, "P0-007 · P1-020 · P2-015 · P3-005 · P4-002");
});

test("le suivi par priorité reste unique et continu avec plusieurs préfixes de registre", () => {
  const markdown = `# Plan

### Registre structuré du développement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: [
      { id: "PLS-DEV-001", domain: "Pilotage", title: "Premier sujet", summary: "Premier sujet de suivi.", status: "READY", priority: "P1", type: "improvement", persona: "Admin", phase: "Pilotage", updatedAt: "2026-08-24", nextAction: "Le réaliser.", progressLabel: "Prêt.", source: "test", evidence: ["test"] },
      { id: "PLS-DATA-001", domain: "Données", title: "Second sujet", summary: "Second sujet de suivi.", status: "IN_PROGRESS", priority: "P1", type: "tech_debt", persona: "Admin", phase: "Pilotage", updatedAt: "2026-08-24", nextAction: "Le poursuivre.", progressLabel: "En cours.", source: "test", evidence: ["test"] },
    ],
  }, null, 2)}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");

  assert.deepEqual(plan.planning.map((item) => item.id), ["P1-001", "P1-002"]);
  assert.equal(new Set(plan.functionalRows.map((item) => item.id)).size, 2);
});

test("le registre structuré accepte et projette une priorité P4", () => {
  const markdown = `# Plan

### Registre structuré du développement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: [{ id: "PLS-DEV-001", domain: "Mobile", title: "Accès hors ligne", summary: "Piste de long terme.", status: "DEFERRED", priority: "P4", type: "feature", persona: "Terrain", phase: "Long terme", updatedAt: "2026-08-25", nextAction: "Valider le besoin terrain.", progressLabel: "Non priorisé pour le pilote.", source: "test", evidence: ["test"] }],
  })}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-25T10:00:00.000Z");

  assert.equal(plan.registryItems[0]?.priorityLabel, "P4 Évolution future");
  assert.equal(plan.planning[0]?.horizon, "Plus tard");
  assert.equal(plan.remainingPriorityCounts["P4 Évolution future"], 1);
});
