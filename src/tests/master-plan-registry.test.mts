import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEVELOPMENT_ITEM_STATUSES, parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";

test("parseMasterPlan privilegie le registre structure pour le cockpit developpement", () => {
  const markdown = `# Plan

## Registre structure du developpement

\`\`\`json
{
  "version": 1,
  "items": [
    {
      "id": "PLS-DEV-001",
      "domain": "Produit",
      "title": "Cockpit developpement",
      "summary": "Source canonique",
      "status": "IN_PROGRESS",
      "priority": "P1",
      "type": "documentation",
      "persona": "Admin",
      "phase": "Pilotage",
      "updatedAt": "2026-08-24",
      "nextAction": "Valider le cockpit.",
      "validationCriteria": ["Vue branchee"],
      "dependencies": [],
      "blocker": null,
      "routes": ["/dashboard/admin/developpement"],
      "files": ["docs/master-plan-planetls.md"],
      "progressLabel": "Le cockpit est maintenant branche sur un registre structure.",
      "source": "docs/master-plan-planetls.md#registre-structure-du-developpement",
      "evidence": ["src/app/dashboard/admin/(product-tech)/developpement/masterPlan.ts"]
    }
  ]
}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");

  assert.equal(plan.diagnostics.source, "structured");
  assert.equal(plan.registryItems.length, 1);
  assert.equal(plan.registryItems[0]?.addedAt, "2026-08-24");
  assert.equal(plan.planning[0]?.id, "P1-001");
  assert.equal(plan.diagnostics.nextSuggestedId, "P0-001 · P1-002 · P2-001 · P3-001 · P4-001");
  assert.equal(plan.functionalRows[0]?.feature, "Cockpit developpement");
});

test("parseMasterPlan conserve une date d'ajout explicite lorsqu'elle est renseignee", () => {
  const markdown = `# Plan

## Registre structure du developpement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: [{ id: "PLS-DEV-001", domain: "Pilotage", title: "Date d'ajout", summary: "Une date d'ajout explicite.", status: "READY", priority: "P1", type: "improvement", persona: "Admin", phase: "Pilotage", addedAt: "2026-08-20", updatedAt: "2026-08-24", nextAction: "La verifier.", progressLabel: "Pret.", source: "test", evidence: ["test"] }],
  })}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");

  assert.equal(plan.registryItems[0]?.addedAt, "2026-08-20");
});

test("parseMasterPlan remonte les erreurs de validation du registre structure", () => {
  const markdown = `# Plan

## Registre structure du developpement

\`\`\`json
{
  "version": 1,
  "items": [
    {
      "id": "PLS-DEV-001",
      "domain": "Produit",
      "title": "Cockpit developpement",
      "summary": "Source canonique",
      "status": "COMPLETED",
      "priority": "P1",
      "type": "documentation",
      "persona": "Admin",
      "phase": "Pilotage",
      "updatedAt": "2026-08-24",
      "nextAction": "",
      "validationCriteria": ["Vue branchee"],
      "dependencies": ["PLS-DEV-999"],
      "blocker": null,
      "routes": ["/dashboard/admin/developpement"],
      "files": ["docs/master-plan-planetls.md"],
      "progressLabel": "Le cockpit est branche.",
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
  assert.equal(plan.diagnostics.errors.some((error) => error.includes("Dependances inconnues") || error.includes("Dépendances inconnues")), true);
});

test("the structured registry maps every status to its cockpit group", () => {
  const markdown = `# Plan

## Registre structure du developpement

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

  assert.equal(plan.planning.length, DEVELOPMENT_ITEM_STATUSES.length);
});

test("the registry completes a priority automatically when every criterion is validated", () => {
  const markdown = `# Plan

## Registre structure du developpement

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
  assert.equal(plan.registryItems[1]?.status, "BLOCKED");
});

test("le registre reel conserve des IDs uniques et un prochain numero exploitable", async () => {
  const markdown = await readFile(new URL("../../docs/master-plan-planetls.md", import.meta.url), "utf8");
  const plan = parseMasterPlan(markdown, "2026-09-02T10:00:00.000Z");
  const ids = plan.registryItems.map((item) => item.id);

  assert.equal(plan.diagnostics.source, "structured");
  assert.equal(plan.diagnostics.errors.length, 0);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.every((id) => /^PLS-[A-Z]+-\d{3}$/.test(id)), true);
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-BIZ-001")?.priority, "P1");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-QUAL-002")?.priority, "P1");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DS-001")?.priority, "P2");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-SEC-004")?.priority, "P1");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DEV-029")?.priority, "P1");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DEV-029")?.status, "TO_PLAN");
  assert.deepEqual(plan.registryItems.find((item) => item.id === "PLS-DEV-029")?.dependencies, ["PLS-SEC-003", "PLS-SEC-004", "PLS-DATA-003", "PLS-TEST-001"]);
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-AI-001")?.priority, "P4");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-OPS-001")?.priority, "P3");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DATA-005")?.priority, "P3");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-OPS-002")?.priority, "P3");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-PRO-001")?.priority, "P3");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-BIZ-002")?.priority, "P4");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-AI-002")?.priority, "P4");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DATA-004")?.trackingId, "P0-005");
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DATA-004")?.status, "COMPLETED");
  assert.match(plan.registryItems.find((item) => item.id === "PLS-DEV-031")?.progressLabel ?? "", /Popup existante/i);
  const githubIssues = plan.registryItems.flatMap((item) => item.githubIssues.map((issue) => issue.number));
  assert.equal(new Set(githubIssues).size, githubIssues.length);
  assert.deepEqual(githubIssues.sort((left, right) => left - right), [10, 11, 12, 13, 14, 15, 16, 17]);
  assert.equal(plan.diagnostics.nextSuggestedId, "P0-008 · P1-021 · P2-016 · P3-009 · P4-006");
});

test("le suivi par priorite reste unique et continu avec plusieurs prefixes de registre", () => {
  const markdown = `# Plan

### Registre structure du developpement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: [
      { id: "PLS-DEV-001", domain: "Pilotage", title: "Premier sujet", summary: "Premier sujet de suivi.", status: "READY", priority: "P1", type: "improvement", persona: "Admin", phase: "Pilotage", updatedAt: "2026-08-24", nextAction: "Le realiser.", progressLabel: "Pret.", source: "test", evidence: ["test"] },
      { id: "PLS-DATA-001", domain: "Donnees", title: "Second sujet", summary: "Second sujet de suivi.", status: "IN_PROGRESS", priority: "P1", type: "tech_debt", persona: "Admin", phase: "Pilotage", updatedAt: "2026-08-24", nextAction: "Le poursuivre.", progressLabel: "En cours.", source: "test", evidence: ["test"] },
    ],
  }, null, 2)}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-24T10:00:00.000Z");

  assert.deepEqual(plan.planning.map((item) => item.id), ["P1-001", "P1-002"]);
  assert.equal(new Set(plan.functionalRows.map((item) => item.id)).size, 2);
});

test("le registre structure accepte et projette une priorite P4", () => {
  const markdown = `# Plan

### Registre structure du developpement

\`\`\`json
${JSON.stringify({
    version: 1,
    items: [{ id: "PLS-DEV-001", domain: "Mobile", title: "Acces hors ligne", summary: "Piste de long terme.", status: "DEFERRED", priority: "P4", type: "feature", persona: "Terrain", phase: "Long terme", updatedAt: "2026-08-25", nextAction: "Valider le besoin terrain.", progressLabel: "Non priorise pour le pilote.", source: "test", evidence: ["test"] }],
  })}
\`\`\``;

  const plan = parseMasterPlan(markdown, "2026-08-25T10:00:00.000Z");

  assert.equal(plan.registryItems[0]?.priorityLabel, "P4 Idée / À étudier");
  assert.equal(plan.planning[0]?.horizon, "Plus tard");
  const p4Key = Object.keys(plan.remainingPriorityCounts).find((key) => key.startsWith("P4"));
  assert.equal(p4Key ? plan.remainingPriorityCounts[p4Key] : undefined, 1);
});
