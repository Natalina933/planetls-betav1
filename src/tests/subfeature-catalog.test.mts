import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { conciergeSubfeatures } from "../app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatures.ts";
import { subfeatureCatalog, subfeatureRegistries, validateSubfeatureCatalog } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureCatalog.ts";
import { SUBFEATURE_SPACES, subfeatureSchema } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureTypes.ts";
import type { Subfeature } from "../app/dashboard/admin/(product-tech)/developpement/subfeatureTypes.ts";
import { validateConciergeSubfeatures } from "../app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatureTypes.ts";
import { parseMasterPlan } from "../app/dashboard/admin/(product-tech)/developpement/masterPlan.ts";
import { computeSpaceProgress } from "../app/dashboard/admin/(product-tech)/developpement/spaceProgressData.ts";

const parents = parseMasterPlan(readFileSync("docs/master-plan-planetls.md", "utf8"), "2026-11-15T12:00:00Z").registryItems;
const copy = (): Subfeature[] => structuredClone([...subfeatureCatalog]);

test("catalogue : 19 fiches existantes référencées directement, sans copie d'objet ou de preuve", () => {
  assert.equal(subfeatureRegistries.length, 1);
  assert.equal(subfeatureRegistries[0].primarySpace, "Conciergerie");
  assert.strictEqual(subfeatureRegistries[0].items, conciergeSubfeatures);
  assert.equal(subfeatureCatalog.length, 19);
  subfeatureCatalog.forEach((item, index) => {
    assert.strictEqual(item, conciergeSubfeatures[index]);
    assert.strictEqual(item.evidence, conciergeSubfeatures[index].evidence);
    assert.strictEqual(item.validation, conciergeSubfeatures[index].validation);
    assert.strictEqual(item.implementation, conciergeSubfeatures[index].implementation);
  });
  assert.deepEqual(validateSubfeatureCatalog(subfeatureCatalog, parents), []);
  assert.deepEqual(validateConciergeSubfeatures(conciergeSubfeatures, parents), []);
});

test("schéma commun compatible avec six espaces sans contrainte de volume Conciergerie", () => {
  for (const space of SUBFEATURE_SPACES) {
    // Fixture uniquement : aucune fiche supplémentaire enregistrée dans le catalogue.
    const fixture: Subfeature = {
      ...structuredClone(subfeatureCatalog[0]), id: "PLS-SF-TST-001", primarySpace: space,
      relatedSpaces: [], parentMasterPlanId: "PARENT-FIXTURE", dependencies: [],
    };
    assert.equal(subfeatureSchema.safeParse(fixture).success, true);
    assert.deepEqual(validateSubfeatureCatalog([fixture], [{ id: "PARENT-FIXTURE", spaceTracking: { primarySpace: space, relatedSpaces: [], trackingType: "livrable", references: [] } }]), []);
  }
  assert.deepEqual(validateSubfeatureCatalog([], parents), []);
  assert.ok(validateConciergeSubfeatures([], parents).length > 0);
});

test("unicité globale, parents absents et responsabilité incohérente signalés", () => {
  assert.ok(validateSubfeatureCatalog([...subfeatureCatalog, subfeatureCatalog[0]], parents).some(e => e.includes("dupliqués")));
  const missing = copy();
  missing[0].parentMasterPlanId = "PLS-ABSENT";
  assert.ok(validateSubfeatureCatalog(missing, parents).some(e => e.includes("Parent canonique absent")));
  const wrong = copy();
  wrong[0].primarySpace = "Administration";
  wrong[0].relatedSpaces = [];
  assert.ok(validateSubfeatureCatalog(wrong, parents).some(e => e.includes("Espace responsable incohérent")));
});

test("dépendances techniques et références documentaires résolues selon leur nature", () => {
  const items = copy();
  items[0].references = [
    { kind: "master_plan", id: "PLS-DEV-004" },
    { kind: "subfeature", id: "PLS-SF-CON-002" },
  ];
  assert.deepEqual(validateSubfeatureCatalog(items, parents), []);
  items[0].dependencies = ["PLS-DEV-004"];
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("Dépendance technique invalide : PLS-DEV-004")));
  items[0].dependencies = [];
  items[0].references = [{ kind: "subfeature", id: "PLS-DEV-004" }];
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("Référence technique invalide")));
  items[0].references = [{ kind: "master_plan", id: "PLS-SF-CON-002" }];
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("Référence documentaire invalide")));
  items[0].references = [{ kind: "master_plan", id: "PLS-ABSENT" }];
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("PLS-ABSENT")));
  items[0].references = [{ kind: "subfeature", id: items[0].id }];
  assert.ok(validateSubfeatureCatalog(items, parents).length > 0);
});

test("références de preuves locales et discriminants invalides signalés explicitement", () => {
  const items = copy();
  items[0].implementation.evidenceIds = [items[1].evidence[0].id];
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("Référence de preuve inconnue")));
  const malformed = { ...subfeatureCatalog[0], references: [{ kind: "ambiguous", id: "PLS-DEV-004" }] };
  assert.ok(validateSubfeatureCatalog([malformed], parents).some(e => e.includes("references")));
});

test("règles communes de validation conservées : aucune promotion des preuves historiques", () => {
  const items = copy();
  const item = items[14];
  item.validation.state = "validated";
  item.validation.criteria = [{ id: "criterion", description: "Garde-fou uniquement", state: "passed", evidenceIds: [item.evidence[1].id] }];
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("preuve directe")));
  item.evidence[1].provenance = "direct_observation";
  item.evidence[1].commit = "fixture";
  item.evidence[1].environment = "fixture isolée";
  assert.deepEqual(validateSubfeatureCatalog(items, parents), []);
  item.evidence[1].result = "failed";
  assert.ok(validateSubfeatureCatalog(items, parents).some(e => e.includes("Résultat en échec")));
  const scope = copy();
  scope[3].validation.state = "validated";
  assert.ok(validateSubfeatureCatalog(scope, parents).some(e => e.includes("Périmètre à qualifier")));
});

test("règles spécifiques CON et fiche 004 restent dans la compatibilité Conciergerie", () => {
  const items = copy();
  items[3].recordType = "feature";
  assert.deepEqual(validateSubfeatureCatalog(items, parents), []);
  assert.ok(validateConciergeSubfeatures(items, parents).some(e => e.includes("Périmètre à qualifier")));
  items[3].recordType = "scope_to_qualify";
  items[3].id = "PLS-SF-TST-004";
  assert.deepEqual(validateSubfeatureCatalog(items, parents), []);
  assert.ok(validateConciergeSubfeatures(items, parents).length > 0);
});

test("validation sans mutation des états, preuves, inconnues et compteurs documentaires", () => {
  const before = JSON.stringify({ parents, conciergeSubfeatures });
  const progress = computeSpaceProgress(parents);
  validateSubfeatureCatalog(subfeatureCatalog, parents);
  assert.equal(JSON.stringify({ parents, conciergeSubfeatures }), before);
  assert.ok(subfeatureCatalog.every(item => item.validation.state === "not_assessed" && item.assessment.assessedCommit === null));
  assert.deepEqual(computeSpaceProgress(parents), progress);
  assert.equal(progress.covered, 53);
  assert.equal(progress.excluded, 5);
});
