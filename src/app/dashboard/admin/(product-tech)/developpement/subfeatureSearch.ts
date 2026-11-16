import type { ImplementationState, Subfeature, SubfeatureSpace, ValidationState } from "./subfeatureTypes";

export type SubfeatureSearchCriteria = {
  query: string;
  parent: string;
  primarySpace: SubfeatureSpace | "";
  relatedSpace: SubfeatureSpace | "";
  implementation: ImplementationState | "";
  validation: ValidationState | "";
  evidence: "" | "with" | "without";
};

/** Une nouvelle valeur à chaque appel : aucune réinitialisation par mutation. */
export function resetSubfeatureSearch(): SubfeatureSearchCriteria {
  return { query: "", parent: "", primarySpace: "", relatedSpace: "", implementation: "", validation: "", evidence: "" };
}

// Même normalisation et même recherche de sous-chaîne que la vue Conciergerie.
export function normalizeSubfeatureSearch(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

/** Filtrage technique uniquement : aucune interprétation des statuts documentaires.
 * Tri lexical par identifiant, indépendant de l'ordre des espaces et de la locale.
 * En cas de répétition d'un ID, conserver sa première occurrence. Les conflits
 * entre fiches portant le même ID relèvent du validateur du catalogue.
 */
export function searchSubfeatures(
  items: readonly Subfeature[],
  criteria: Readonly<Partial<SubfeatureSearchCriteria>> = {},
): Subfeature[] {
  const query = normalizeSubfeatureSearch(criteria.query ?? "");
  const unique = new Map<string, Subfeature>();
  for (const item of items) {
    if (!unique.has(item.id)) unique.set(item.id, item);
  }
  return [...unique.values()].filter(item =>
    (!query || normalizeSubfeatureSearch(`${item.id} ${item.name} ${item.description}`).includes(query)) &&
    (!criteria.parent || item.parentMasterPlanId === criteria.parent) &&
    (!criteria.primarySpace || item.primarySpace === criteria.primarySpace) &&
    (!criteria.relatedSpace || item.relatedSpaces.includes(criteria.relatedSpace)) &&
    (!criteria.implementation || item.implementation.state === criteria.implementation) &&
    (!criteria.validation || item.validation.state === criteria.validation) &&
    (!criteria.evidence || (criteria.evidence === "with" ? item.evidence.length > 0 : item.evidence.length === 0))
  ).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}
