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

test("the registry preserves declared status even when every criterion is validated", () => {
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

  assert.equal(plan.registryItems[0]?.status, "TO_VERIFY");
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
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DS-001")?.priority, "P1");
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
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-SEC-005")?.trackingId, "P0-008");
  const trackingIds = plan.registryItems.map((item) => item.trackingId);
  assert.equal(new Set(trackingIds).size, trackingIds.length);
  const expectedNextIds = ["P0", "P1", "P2", "P3", "P4"].map((priority) => {
    const entries = plan.registryItems.filter((item) => item.priority === priority);
    assert.deepEqual(
      entries.map((item) => item.trackingId),
      entries.map((_, index) => `${priority}-${String(index + 1).padStart(3, "0")}`),
    );
    const nextId = `${priority}-${String(entries.length + 1).padStart(3, "0")}`;
    assert.equal(trackingIds.includes(nextId), false);
    return nextId;
  });
  assert.equal(plan.diagnostics.nextSuggestedId, expectedNextIds.join(" · "));
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


function spaceTrackingFixture(spaceTracking?: unknown) {
  const item: Record<string, unknown> = {
    id: "PLS-DEV-001", domain: "Produit", title: "Metadata fixture",
    summary: "Optional documentary metadata", status: "IN_PROGRESS", priority: "P1",
    type: "feature", persona: "Admin", phase: "Test", updatedAt: "2026-11-14",
    nextAction: "Check metadata", progressLabel: "In progress", source: "test",
  };
  if (spaceTracking !== undefined) item.spaceTracking = spaceTracking;
  return '# Plan\n\n## Registre structure du developpement\n\n' +
    '\x60\x60\x60json\n' + JSON.stringify({ version: 1, items: [item] }) + '\n\x60\x60\x60';
}

test("spaceTracking preserves the four real properties of all 58 entries without changing other projections", async () => {
  const markdown = await readFile(new URL("../../docs/master-plan-planetls.md", import.meta.url), "utf8");
  const block = [...markdown.matchAll(/\x60{3}json\s*([\s\S]*?)\x60{3}/g)]
    .find((match) => match[1].includes('"PLS-DEV-001"'));
  assert.ok(block);
  const raw = JSON.parse(block[1]) as { version: number; items: Array<Record<string, unknown>> };
  const plan = parseMasterPlan(markdown, "2026-11-14T12:00:00Z");
  assert.equal(plan.diagnostics.errors.length, 0);
  assert.equal(plan.registryItems.length, 58);
  assert.equal(new Set(plan.registryItems.map((item) => item.id)).size, 58);
  for (const item of plan.registryItems) {
    const source = raw.items.find((entry) => entry.id === item.id);
    assert.ok(source);
    assert.ok(item.spaceTracking, item.id);
    assert.deepEqual(item.spaceTracking, source.spaceTracking);
    assert.equal(item.status, source.status);
    assert.equal(item.priority, source.priority);
  }
  const stripped = { ...raw, items: raw.items.map(({ spaceTracking: _metadata, ...item }) => item) };
  const baseline = parseMasterPlan(markdown.replace(block[1], () => JSON.stringify(stripped) + "\n"), "2026-11-14T12:00:00Z");
  assert.equal(baseline.diagnostics.errors.length, 0, "Baseline JSON must be valid");
  assert.equal(JSON.stringify(plan.planning) === JSON.stringify(baseline.planning), true, "Planning unchanged");
  assert.deepEqual(plan.registryPriorityCounts, baseline.registryPriorityCounts);
  assert.deepEqual(plan.remainingPriorityCounts, baseline.remainingPriorityCounts);
  assert.deepEqual(plan.registryItems.map(({ spaceTracking: _metadata, ...item }) => item),
    baseline.registryItems.map(({ spaceTracking: _metadata, ...item }) => item));
});

test("spaceTracking missing in legacy structured data stays undefined without a fallback classification", () => {
  const plan = parseMasterPlan(spaceTrackingFixture(), "2026-11-14T12:00:00Z");
  assert.equal(plan.diagnostics.errors.length, 0);
  assert.equal(plan.registryItems.length, 1);
  assert.equal(plan.registryItems[0].spaceTracking, undefined);
  assert.equal(plan.diagnostics.warnings.some((warning) => warning.includes("spaceTracking")), false);
});

test("spaceTracking invalid or incomplete emits a bounded warning and preserves the entry", () => {
  const valid = { primarySpace: "Administration", relatedSpaces: [], trackingType: "livrable", references: [] };
  for (const value of [null, false, "Administration", {},
    { ...valid, primarySpace: " " }, { ...valid, primarySpace: 1 },
    { ...valid, relatedSpaces: "Conciergerie" }, { ...valid, relatedSpaces: [1] },
    { ...valid, trackingType: null }, { ...valid, references: [false] },
    { primarySpace: "Administration", relatedSpaces: [], trackingType: "livrable" }]) {
    const plan = parseMasterPlan(spaceTrackingFixture(value), "2026-11-14T12:00:00Z");
    assert.equal(plan.diagnostics.errors.length, 0);
    assert.equal(plan.registryItems.length, 1);
    assert.equal(plan.registryItems[0].spaceTracking, undefined);
    assert.equal(plan.registryItems[0].status, "IN_PROGRESS");
    assert.equal(plan.registryItems[0].priority, "P1");
    assert.equal(plan.diagnostics.warnings.length, 1);
    assert.match(plan.diagnostics.warnings[0], /PLS-DEV-001.*spaceTracking/);
  }
});
