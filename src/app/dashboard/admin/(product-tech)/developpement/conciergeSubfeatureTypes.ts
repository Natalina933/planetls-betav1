import { z } from "zod";
import type { DevelopmentRegistryItem } from "./masterPlan";
import { subfeatureSchema, validateSubfeatures } from "./subfeatureTypes.ts";

// Exports historiques conservés pour les données et composants existants.
export { SUBFEATURE_SPACES } from "./subfeatureTypes.ts";
export type { SubfeatureSpace } from "./subfeatureTypes.ts";

export const conciergeSubfeatureSchema = subfeatureSchema.extend({
  id: z.string().regex(/^PLS-SF-CON-\d{3}$/),
  primarySpace: z.literal("Conciergerie"),
});
export type ConciergeSubfeature = z.infer<typeof conciergeSubfeatureSchema>;

export function validateConciergeSubfeatures(
  input: unknown,
  parents: readonly Pick<DevelopmentRegistryItem, "id" | "spaceTracking">[],
): string[] {
  const errors = validateSubfeatures(input, parents);
  const parsed = z.array(conciergeSubfeatureSchema).safeParse(input);
  if (!parsed.success) return [...errors, ...parsed.error.issues.map(issue => issue.path.join(".") + ": " + issue.message)];
  const items = parsed.data;
  const ids = new Set(items.map(item => item.id));
  if (items.length !== 19 || ids.size !== 19) errors.push("19 identifiants uniques requis");
  for (let n = 1; n <= 19; n++) {
    const id = "PLS-SF-CON-" + String(n).padStart(3, "0");
    if (!ids.has(id)) errors.push("Identifiant stable absent : " + n);
  }
  const scope = items.find(item => item.id === "PLS-SF-CON-004");
  if (scope && (scope.recordType !== "scope_to_qualify" || scope.implementation.state !== "not_assessed" || scope.validation.state !== "not_assessed")) {
    errors.push(scope.id + ": Périmètre à qualifier obligatoirement non évalué");
  }
  return errors;
}
