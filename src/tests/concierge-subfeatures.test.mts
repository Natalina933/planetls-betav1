import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { conciergeSubfeatures } from "../app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatures.ts";
import { validateConciergeSubfeatures } from "../app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatureTypes.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { computeSpaceProgress } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";

const parents = parseMasterPlan(readFileSync("docs/master-plan-planetls.md", "utf8"), "2026-11-15T12:00:00Z").registryItems;
const copy = () => structuredClone(conciergeSubfeatures);
const expectedParents = ["004", "004", "004", "004", "009", "009", "009", "009", "015", "015", "020", "020", "021", "030", "032", "032"].map(id => `PLS-DEV-${id}`).concat(["PLS-OPS-001", "PLS-OPS-002", "PLS-BIZ-002"]);

test("19 fiches stables, dix parents canoniques et chemins associés existants", () => {
  assert.deepEqual(validateConciergeSubfeatures(conciergeSubfeatures, parents), []);
  assert.deepEqual(conciergeSubfeatures.map(item => item.id), Array.from({ length: 19 }, (_, i) => `PLS-SF-CON-${String(i + 1).padStart(3, "0")}`));
  assert.deepEqual(conciergeSubfeatures.map(item => item.parentMasterPlanId), expectedParents);
  assert.equal(new Set(expectedParents).size, 10);
  for (const item of conciergeSubfeatures) {
    const parent = parents.find(parent => parent.id === item.parentMasterPlanId)!;
    assert.equal(parent.spaceTracking?.primarySpace, item.primarySpace);
    assert.ok(item.relatedSpaces.every(space => parent.spaceTracking?.relatedSpaces.includes(space)));
    for (const file of item.files) assert.ok(existsSync(file), file);
    assert.ok(item.routes.every(route => route.startsWith("/")));
    assert.ok(item.remainingWork.includes(item.nextAction));
  }
});

test("évaluations historiques seulement, inconnues null et périmètre 004 non évalué", () => {
  for (const item of conciergeSubfeatures) {
    assert.equal(item.validation.state, "not_assessed");
    assert.deepEqual(item.validation.criteria, []);
    assert.equal(item.assessment.assessedCommit, null);
    assert.ok(item.unknowns.length > 0);
    for (const proof of item.evidence) {
      assert.equal(proof.provenance, "historical_report");
      assert.equal(proof.commit, null);
      assert.equal(proof.environment, null);
      assert.ok(proof.limitations.length > 0);
      if (proof.kind === "code_review") {
        assert.equal(proof.executedAt, null);
        assert.equal(proof.result, "unknown");
        assert.match(proof.source, /DEV-DASHBOARD-05D/);
      }
    }
  }
  const scope = conciergeSubfeatures[3];
  assert.equal(scope.recordType, "scope_to_qualify");
  assert.equal(scope.implementation.state, "not_assessed");
});

test("résultats historiques bornés au rapport 05D, sans date d'exécution inventée", () => {
  const runs = conciergeSubfeatures.flatMap(item => item.evidence.filter(p => p.result === "passed").map(proof => ({ number: item.id, proof })));
  assert.deepEqual(runs.map(({ number, proof }) => [number, proof.description, proof.executedAt]), [
    ["PLS-SF-CON-007", "100 tests ciblés réussis, zéro échec", null],
    ["PLS-SF-CON-009", "Campagnes 4/4 et 8/8 PASS", null],
    ["PLS-SF-CON-015", "10/10 PASS", "2026-10-10"],
    ["PLS-SF-CON-016", "Campagne 74/74 PASS", null],
  ]);
});

test("identifiants, structure, parents, espaces et références invalides sont refusés", () => {
  const cases: Array<(items: ReturnType<typeof copy>) => void> = [
    items => { items.pop(); },
    items => { items[1].id = items[0].id; },
    items => { items[0].parentMasterPlanId = "PLS-ABSENT"; },
    items => { items[0].parentMasterPlanId = "PLS-DEV-001"; },
    items => { items[0].relatedSpaces.push("Conciergerie"); },
    items => { items[0].relatedSpaces.push(items[0].relatedSpaces[0]); },
    items => { items[0].implementation.evidenceIds.push("inconnue"); },
    items => { items[0].evidence.push(items[0].evidence[0]); },
    items => { items[0].dependencies.push(items[0].id); },
    items => { items[0].dependencies.push("PLS-SF-CON-999"); },
    items => { items[3].implementation.state = "implemented"; },
    items => { items[3].recordType = "feature"; },
    items => { items[0].assessment.assessedAt = "2026-99-99"; },
  ];
  for (const mutate of cases) {
    const items = copy();
    mutate(items);
    assert.ok(validateConciergeSubfeatures(items, parents).length > 0, mutate.toString());
  }
  assert.ok(validateConciergeSubfeatures([{}], parents).length > 0);
});

test("aucune promotion historique en validation actuelle ; critères et preuves directes obligatoires", () => {
  const items = copy();
  const item = items[14];
  item.validation.state = "validated";
  assert.ok(validateConciergeSubfeatures(items, parents).some(e => e.includes("Validation complète")));
  const proof = item.evidence[1];
  item.validation.criteria = [{ id: "criterion", description: "Périmètre du garde-fou uniquement", state: "passed", evidenceIds: [proof.id] }];
  assert.ok(validateConciergeSubfeatures(items, parents).some(e => e.includes("preuve directe")));
  // Fixture synthétique de validation : jamais enregistrée dans les données.
  proof.provenance = "direct_observation";
  proof.commit = "fixture-commit";
  proof.environment = "fixture isolée";
  assert.deepEqual(validateConciergeSubfeatures(items, parents), []);
  proof.executedAt = null;
  assert.ok(validateConciergeSubfeatures(items, parents).length > 0);
  proof.executedAt = "2026-10-10";
  proof.result = "failed";
  assert.ok(validateConciergeSubfeatures(items, parents).length > 0);
  item.validation.state = "partially_validated";
  item.validation.criteria = [];
  assert.ok(validateConciergeSubfeatures(items, parents).length > 0);
});

test("registre indépendant, P4 consultable et compteurs inchangés sans mutation", () => {
  const before = JSON.stringify(parents);
  const progress = computeSpaceProgress(parents);
  assert.deepEqual(validateConciergeSubfeatures(conciergeSubfeatures, parents), []);
  assert.equal(JSON.stringify(parents), before);
  assert.deepEqual(computeSpaceProgress(parents), progress);
  assert.equal(progress.totalRegistryItems, 58);
  assert.equal(progress.covered, 53);
  assert.equal(progress.excluded, 5);
  const p4 = conciergeSubfeatures.find(item => item.id === "PLS-SF-CON-019")!;
  assert.equal(parents.find(p => p.id === p4.parentMasterPlanId)?.priority, "P4");
  assert.equal(conciergeSubfeatures.some(item => item.id === item.parentMasterPlanId), false);
  // Le registre détaillé peut être affiché ; le parseur et le calcul restent indépendants.
  for (const file of ["spaceProgressData.ts", "masterPlan.ts"]) {
    const source = readFileSync(`src/app/dashboard/admin/(product-tech)/developpement/${file}`, "utf8");
    assert.doesNotMatch(source, /(?:from|import\s*\()[^\n]*conciergeSubfeature/);
  }
});
