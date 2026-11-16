import { z } from "zod";
import type { DevelopmentRegistryItem } from "./masterPlan";

export const SUBFEATURE_SPACES = ["Conciergerie", "Propriétaires", "Artisans / Prestataires", "Administration", "Sécurité et infrastructure", "Transversal"] as const;
const text = z.string().trim().min(1);
const date = z.iso.date().nullable();

// Les chaînes sources des preuves ne sont pas des références résolubles.
// Les relations supplémentaires doivent annoncer leur nature explicitement.
export const subfeatureReferenceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("subfeature"), id: text }),
  z.object({ kind: z.literal("master_plan"), id: text }),
]);
export type SubfeatureReference = z.infer<typeof subfeatureReferenceSchema>;
export const subfeatureEvidenceSchema = z.object({
  id: text,
  kind: z.enum(["code_review", "static_test", "unit_test", "component_test", "handler_test", "database_rls_test", "browser_test", "manual_acceptance"]),
  source: text,
  description: text,
  observedAt: date,
  executedAt: date,
  commit: text.nullable(),
  environment: text.nullable(),
  result: z.enum(["passed", "failed", "mixed", "not_run", "unknown"]),
  provenance: z.enum(["direct_observation", "historical_report"]),
  scope: z.array(text).min(1),
  limitations: z.array(text),
});

export const subfeatureSchema = z.object({
  id: z.string().regex(/^PLS-SF-[A-Z][A-Z0-9]*-\d{3,}$/),
  parentMasterPlanId: text,
  name: text,
  description: text,
  recordType: z.enum(["feature", "scope_to_qualify"]),
  primarySpace: z.enum(SUBFEATURE_SPACES),
  relatedSpaces: z.array(z.enum(SUBFEATURE_SPACES)),
  implementation: z.object({
    state: z.enum(["not_assessed", "not_started", "partial", "implemented"]),
    rationale: text,
    evidenceIds: z.array(text),
  }),
  validation: z.object({
    state: z.enum(["not_assessed", "not_validated", "partially_validated", "validated"]),
    targetScope: z.array(text).min(1),
    criteria: z.array(z.object({
      id: text,
      description: text,
      state: z.enum(["not_assessed", "unverified", "passed", "failed"]),
      evidenceIds: z.array(text),
    })),
    limitations: z.array(text),
  }),
  routes: z.array(text),
  files: z.array(text),
  evidence: z.array(subfeatureEvidenceSchema),
  dependencies: z.array(text),
  references: z.array(subfeatureReferenceSchema).optional(),
  remainingWork: z.array(text).min(1),
  unknowns: z.array(text),
  nextAction: text,
  assessment: z.object({ source: text, assessedAt: date, assessedCommit: text.nullable() }),
});

export type Subfeature = z.infer<typeof subfeatureSchema>;
export type SubfeatureEvidence = z.infer<typeof subfeatureEvidenceSchema>;
export type SubfeatureSpace = typeof SUBFEATURE_SPACES[number];
export const acceptanceCriterionSchema = subfeatureSchema.shape.validation.shape.criteria.element;
export const assessmentSchema = subfeatureSchema.shape.assessment;
export const implementationStateSchema = subfeatureSchema.shape.implementation.shape.state;
export const validationStateSchema = subfeatureSchema.shape.validation.shape.state;
export type AcceptanceCriterion = z.infer<typeof acceptanceCriterionSchema>;
export type SubfeatureAssessment = z.infer<typeof assessmentSchema>;
export type ImplementationState = z.infer<typeof implementationStateSchema>;
export type ValidationState = z.infer<typeof validationStateSchema>;

/** Contrôle sans mutation ni projection vers les compteurs documentaires.
 * La véracité d'une preuve exige aussi une revue humaine de sa source.
 */
export function validateSubfeatures(
  input: unknown,
  parents: readonly Pick<DevelopmentRegistryItem, "id" | "spaceTracking">[],
): string[] {
  const parsed = z.array(subfeatureSchema).safeParse(input);
  if (!parsed.success) return parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`);
  const items = parsed.data;
  const errors: string[] = [];
  const ids = new Set(items.map(item => item.id));
  if (ids.size !== items.length) errors.push("Identifiants de sous-fonctionnalités dupliqués");
  const parentIds = new Set(parents.map(parent => parent.id));
  for (const item of items) {
    const fail = (message: string) => errors.push(`${item.id}: ${message}`);
    const parent = parents.find(parent => parent.id === item.parentMasterPlanId);
    if (!parent) fail("Parent canonique absent");
    else if (parent.spaceTracking?.primarySpace !== item.primarySpace) fail("Espace responsable incohérent");
    if (new Set(item.relatedSpaces).size !== item.relatedSpaces.length || item.relatedSpaces.includes(item.primarySpace)) fail("Espaces concernés dupliqués ou responsables");
    const evidence = new Map(item.evidence.map(proof => [proof.id, proof]));
    if (evidence.size !== item.evidence.length) fail("Identifiants de preuves dupliqués");
    const criteria = item.validation.criteria;
    if (new Set(criteria.map(c => c.id)).size !== criteria.length) fail("Critères dupliqués");
    for (const ref of [...item.implementation.evidenceIds, ...criteria.flatMap(c => c.evidenceIds)]) {
      if (!evidence.has(ref)) fail(`Référence de preuve inconnue : ${ref}`);
    }
    for (const ref of item.dependencies) {
      if (!ids.has(ref) || ref === item.id) fail(`Dépendance technique invalide : ${ref}`);
    }
    for (const ref of item.references ?? []) {
      if (ref.kind === "subfeature" && (!ids.has(ref.id) || ref.id === item.id)) fail(`Référence technique invalide : ${ref.id}`);
      if (ref.kind === "master_plan" && !parentIds.has(ref.id)) fail(`Référence documentaire invalide : ${ref.id}`);
    }
    if (item.recordType === "scope_to_qualify" &&
      (item.implementation.state !== "not_assessed" || item.validation.state !== "not_assessed")) fail("Périmètre à qualifier obligatoirement non évalué");
    // Une preuve historique ne suffit jamais à valider actuellement un critère.
    const hasCurrentProof = (refs: string[]) => refs.some(ref => {
      const proof = evidence.get(ref);
      return proof?.result === "passed" && proof.provenance === "direct_observation" &&
        proof.kind !== "code_review" && proof.executedAt !== null && proof.commit !== null && proof.environment !== null;
    });
    for (const criterion of criteria) {
      if (criterion.state === "passed" && !hasCurrentProof(criterion.evidenceIds)) fail("Critère validé sans preuve directe datée et contextualisée");
    }
    if (item.validation.state === "validated" &&
      (!criteria.length || criteria.some(c => c.state !== "passed") || item.implementation.state !== "implemented")) fail("Validation complète sans critères suffisants");
    if (item.validation.state === "partially_validated" && !criteria.some(c => c.state === "passed")) fail("Validation partielle sans critère prouvé");
    if (item.validation.state === "validated" && item.evidence.some(p => p.result === "failed" || p.result === "mixed")) fail("Résultat en échec à résoudre avant validation complète");
  }
  return errors;
}
