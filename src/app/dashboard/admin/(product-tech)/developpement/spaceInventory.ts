import { z } from "zod";
import { SUBFEATURE_SPACES } from "./subfeatureTypes.ts";

export const spaceInventorySchema = z.object({
  id: z.string().min(1),
  name: z.enum(SUBFEATURE_SPACES),
  state: z.enum(["absent", "partial", "reviewed_scope"]),
  scope: z.string().min(1),
  source: z.string().min(1),
  assessedAt: z.iso.date().nullable(),
  limitations: z.array(z.string().min(1)).min(1),
  unknowns: z.array(z.string().min(1)),
});
export type SpaceInventory = z.infer<typeof spaceInventorySchema>;

export const SPACE_INVENTORY_LABELS = {
  absent: "Inventaire détaillé non réalisé dans le catalogue",
  partial: "Inventaire partiel",
  reviewed_scope: "Inventaire relu sur un périmètre défini",
} as const;

// Évaluation du contenu du catalogue au 15 novembre 2026, pas de l'état produit.
// Aucun pourcentage de couverture ; aucun nouvel objet fonctionnel créé.
const absent = (id: string, name: SpaceInventory["name"]): SpaceInventory => ({
  id, name, state: "absent",
  scope: "Inventaire détaillé non réalisé dans le catalogue technique ; les entrées documentaires du Master Plan restent distinctes.",
  source: "DEV-DASHBOARD-06C — lecture de subfeatureCatalog.ts : seul le registre Conciergerie est référencé.",
  assessedAt: "2026-11-15",
  limitations: ["L'absence d'inventaire ne signifie pas l'absence de fonctionnalités, de code ou de tests.", "Aucun état d'implémentation ou de validation de cet espace ne peut être déduit de ce constat."],
  unknowns: ["Périmètre détaillé des fonctionnalités restant à inventorier", "Implémentation et validation non évaluées ici"],
});

export const spaceInventory: readonly SpaceInventory[] = [
  {
    id: "conciergerie", name: "Conciergerie", state: "partial",
    scope: "19 fiches disponibles, dont PLS-SF-CON-004 conservée comme fiche de qualification. Inventaire issu de 05D, sans exhaustivité acquise.",
    source: "DEV-DASHBOARD-05D du 15 novembre 2026 ; registre conciergeSubfeatures.ts et catalogue relus dans DEV-DASHBOARD-06C.",
    assessedAt: "2026-11-15",
    limitations: ["Les évaluations et preuves historiques ne constituent pas une validation actuelle.", "Les 19 fiches ne représentent pas une couverture exhaustive des fonctionnalités Conciergerie.", "La recette navigateur 05E-4 n'a pas pu vérifier l'interface : outils d'accès indisponibles."],
    unknowns: ["Périmètre restant à qualifier dans PLS-SF-CON-004", "Fonctionnalités éventuellement absentes de cet inventaire", "Recette visuelle et fonctionnelle dans un navigateur réel restant à réaliser"],
  },
  absent("proprietaires", "Propriétaires"),
  absent("prestataires", "Artisans / Prestataires"),
  absent("administration", "Administration"),
  absent("securite-infrastructure", "Sécurité et infrastructure"),
  absent("transversal", "Transversal"),
];
