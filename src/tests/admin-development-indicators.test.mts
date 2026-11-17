import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { buildMissionControlView } from "../app/dashboard/admin/(product-tech)/developpement/missionControl.ts";

const now = "2026-11-11T12:00:00.000Z";
function entry(id: string, fields: Record<string, unknown> = {}) {
  return { id, domain: "Pilotage", title: id, summary: "Indicateur de test", status: "TO_VERIFY", priority: "P0", type: "feature", persona: "Admin", phase: "Test", updatedAt: "2026-08-24", nextAction: "Recetter le parcours", validationCriteria: ["Critère"], validatedCriteria: ["Critère"], progressLabel: "À vérifier", source: "test", evidence: ["test"], ...fields };
}
function markdown(items: ReturnType<typeof entry>[]) {
  return '# Plan\n## Registre structuré du développement\n```json\n' + JSON.stringify({ version: 1, items }) + '\n```';
}
function control(plan: ReturnType<typeof parseMasterPlan>, source = "") {
  return buildMissionControlView({ plan, markdown: source, projectVersion: "0.1.0", commits: [], branch: "test", dirtyFileCount: 0, repositoryUrl: "https://github.com/test/test", workflowExists: true, metadataBaseHost: "test.vercel.app", supabaseHealth: { label: "Supabase", status: "unverifiable", detail: "Non mesuré", checkedAt: now }, checkedAt: now });
}

test("canonical status is preserved; completion does not certify N4", () => {
  const plan = parseMasterPlan(markdown([entry("PLS-DEV-011"), entry("PLS-DEV-012", { status: "COMPLETED" })]), now);
  assert.equal(plan.registryItems[0].status, "TO_VERIFY");
  assert.equal(plan.registryItems[1].status, "COMPLETED");
  assert.equal(plan.functionalRows[0].level, "Non évalué");
  assert.equal(plan.functionalRows[1].level, "Non évalué");
  assert.equal(control(plan).progressionPct, 50);
});

test("active blocks, dependencies and bug qualification remain independent", () => {
  const plan = parseMasterPlan(markdown([
    entry("PLS-DEV-001", { status: "COMPLETED" }),
    entry("PLS-DEV-002", { status: "IN_PROGRESS", dependencies: ["PLS-DEV-001"], blocker: "Dépendance à qualifier" }),
    entry("PLS-DEV-003", { status: "BLOCKED", blocker: "Recette impossible" }),
    entry("PLS-DEV-004", { type: "bug" }),
    entry("PLS-DEV-005", { type: "bug", priority: "P2" }),
  ]), now);
  const view = control(plan);
  assert.equal(view.indicatorsAvailable, true);
  assert.equal(view.completedFeatures, 1);
  assert.equal(view.inProgressFeatures, 3);
  assert.equal(view.blockedFeatures, 1);
  assert.equal(view.dependencyFeatures, 1);
  assert.equal(view.unqualifiedBlockers, 1);
  assert.equal(view.criticalBugs, 1);
  assert.equal(view.minorBugs, 1);
  assert.equal(view.healthCards[1].status, "unverifiable");
  assert.equal(view.healthCards[2].status, "unverifiable");
  assert.equal(view.lastCommitAt, null);
  assert.match(view.weeklyDevelopmentLabel, /indisponible/);
});

test("invalid registry never falls back to a reassuring historical progression", () => {
  for (const block of ['```json\n{\n```', '```json\n{', '```json\n```', 'no fenced registry', '```json\n{"version":1,"items":[{}]}\n```']) {
    const source = '# Plan\n## Registre structuré du développement\n' + block + '\n## Historique\n| Fonctionnalité | Statut | Niveau | Observations |\n|---|---|---|---|\n| Ancienne livraison | Terminé | N4 | Historique |';
    const plan = parseMasterPlan(source, now);
    assert.ok(plan.diagnostics.errors.length > 0);
    assert.deepEqual(plan.functionalRows, []);
    assert.deepEqual(plan.planning, []);
    assert.equal(control(plan).indicatorsAvailable, false);
  }
  const invalid = parseMasterPlan(markdown([entry("PLS-DEV-001", { dependencies: ["PLS-UNKNOWN"] })]), now);
  assert.equal(control(invalid).indicatorsAvailable, false);
  const missing = parseMasterPlan("# Plan\n## Historique\n| Fonctionnalité | Statut | Niveau | Observations |\n|---|---|---|---|\n| Ancien | Terminé | N4 | Archive |", now);
  assert.equal(control(missing).indicatorsAvailable, false);
  assert.equal(control(missing).completedFeatures, 0);
  assert.equal(control(parseMasterPlan(markdown([]), now)).indicatorsAvailable, false);
});

test("staleness uses an explicit current reference, not August 2026", () => {
  const source = markdown([entry("PLS-DEV-001")]);
  assert.deepEqual(parseMasterPlan(source, now, new Date("2026-08-25")).diagnostics.staleItems, []);
  assert.deepEqual(parseMasterPlan(source, now, new Date(now)).diagnostics.staleItems, ["PLS-DEV-001"]);
});

test("real registry keeps PLS-DEV-011 and stable canonical identifiers", () => {
  const source = readFileSync(new URL("../../docs/master-plan-planetls.md", import.meta.url), "utf8");
  const plan = parseMasterPlan(source, now);
  assert.equal(plan.diagnostics.errors.length, 0);
  assert.equal(plan.registryItems.find((item) => item.id === "PLS-DEV-011")?.status, "TO_VERIFY");
  assert.equal(control(plan).completedFeatures, 3);
  assert.equal(control(plan).progressionPct, 5);
  assert.ok(plan.planning.every((item) => item.planetLsId.startsWith("PLS-")));
});

test("compact display labels calculated and unavailable indicators explicitly", () => {
  const source = readFileSync(new URL("../app/dashboard/admin/(product-tech)/developpement/MasterPlanViewer.tsx", import.meta.url), "utf8");
  assert.match(source, /<th>Mis à jour<\/th>/);
  assert.match(source, /Calcul déclaratif/);
  assert.match(source, /Registre invalide : indicateurs indisponibles/);
  assert.match(source, /Dernier commit/);
  assert.doesNotMatch(source, /Dernière sauvegarde|Aucune sauvegarde détectée|lastBackupAt/);
});
