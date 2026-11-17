import { conciergeSubfeatures } from "./conciergeSubfeatures.ts";
import { validateSubfeatures } from "./subfeatureTypes.ts";
import type { Subfeature, SubfeatureSpace } from "./subfeatureTypes";
import type { DevelopmentRegistryItem } from "./masterPlan";

export type SubfeatureRegistry = {
  primarySpace: SubfeatureSpace;
  items: readonly Subfeature[];
};

// Ajouter ici uniquement des registres effectivement inventoriés.
// L'absence d'un registre ne signifie pas l'absence de fonctionnalités.
export const subfeatureRegistries: readonly SubfeatureRegistry[] = [
  { primarySpace: "Conciergerie", items: conciergeSubfeatures },
];

// Nouveau tableau d'index, mêmes objets : aucune copie des fiches ou des preuves.
export const subfeatureCatalog: readonly Subfeature[] = subfeatureRegistries.flatMap(registry => registry.items);

/** Validation explicite, sans mutation, accès disque ou calcul de progression. */
export function validateSubfeatureCatalog(
  input: unknown,
  parents: readonly Pick<DevelopmentRegistryItem, "id" | "spaceTracking">[],
): string[] {
  return validateSubfeatures(input, parents);
}
