/**
 * Progression par espace métier — registre canonique du Master Plan.
 *
 * Chaque item du registre structuré porte un champ `domain`. Ce module mappe
 * les domaines vers six catégories : cinq espaces métier plus une catégorie
 * "Transversal" qui recouvre les domaines partagés ou non spécifiquement
 * rattachés à un espace métier.
 *
 * Règles de calcul :
 * - Les items de priorité P4 sont exclus du calcul, quel que soit leur statut.
 * - Une fonctionnalité est "terminée" quand son statut est COMPLETED.
 *   Cela ne présume pas d'une validation fonctionnelle réelle.
 * - Une fonctionnalité est "en cours" quand son statut est IN_PROGRESS.
 * - TO_VERIFY est traité comme "à vérifier", jamais comme terminé.
 * - BLOCKED est traité comme "bloqué", jamais comme terminé.
 * - Les autres statuts (TO_PLAN, READY, DEFERRED, IDEA non P4)
 *   comptent comme "restants".
 * - Le pourcentage = Math.round((terminé / total) * 100). Si total = 0, le
 *   pourcentage est null et la catégorie affiche "Non évalué".
 * - Chaque item appartient à un seul domaine, donc il n'y a pas de double
 *   comptage entre catégories.
 * - Tout domaine non listé dans DOMAIN_TO_SPACE rejoint Transversal.
 */

import type { DevelopmentRegistryItem } from "./masterPlan";

export type SpaceProgressItem = {
  name: string;
  domains: string[];
  total: number;
  completed: number;
  inProgress: number;
  toVerify: number;
  blocked: number;
  remaining: number;
  percentage: number | null;
};

export type SpaceProgressResult = {
  items: SpaceProgressItem[];
  covered: number;
  excluded: number;
  totalRegistryItems: number;
};

export const SPACE_ORDER: string[] = [
  "Conciergerie",
  "Propriétaires",
  "Artisans / Prestataires",
  "Administration",
  "Sécurité et infrastructure",
  "Transversal",
];

// Mapping explicite des domaines du registre vers les cinq espaces métier.
// Les domaines non listés ici rejoignent Transversal par défaut.
export const DOMAIN_TO_SPACE: Record<string, string> = {
  // Conciergerie
  "Conciergerie": "Conciergerie",
  "Conciergerie et accès": "Conciergerie",
  "Rémunération concierge": "Conciergerie",
  // Propriétaires
  "Owner": "Propriétaires",
  // Artisans / Prestataires
  "Provider et artisan": "Artisans / Prestataires",
  "Provider": "Artisans / Prestataires",
  // Administration
  "Admin": "Administration",
  "Admin Ops": "Administration",
  "Admin Platform": "Administration",
  "Cockpit admin": "Administration",
  "Pilotage": "Administration",
  "Pilotage Business": "Administration",
  "Pilotage KPI": "Administration",
  "Pilotage opérationnel": "Administration",
  // Sécurité et infrastructure
  "Plateforme": "Sécurité et infrastructure",
  "Sécurité des dépendances": "Sécurité et infrastructure",
  "Sécurité inscription": "Sécurité et infrastructure",
  "Sécurité logements et médias": "Sécurité et infrastructure",
  "Sécurité profils": "Sécurité et infrastructure",
  "Conformité et données personnelles": "Sécurité et infrastructure",
  "Identité": "Sécurité et infrastructure",
};

const TRANSVERSAL_NAME = "Transversal";

function isP4(item: DevelopmentRegistryItem): boolean {
  return item.priority === "P4";
}

function statusCategory(status: DevelopmentRegistryItem["status"]): "done" | "inProgress" | "toVerify" | "blocked" | "remaining" {
  if (status === "COMPLETED") return "done";
  if (status === "IN_PROGRESS") return "inProgress";
  if (status === "TO_VERIFY") return "toVerify";
  if (status === "BLOCKED") return "blocked";
  return "remaining";
}

export function computeSpaceProgress(
  items: DevelopmentRegistryItem[],
  spaceOrder: string[] = SPACE_ORDER,
  domainToSpace: Record<string, string> = DOMAIN_TO_SPACE,
): SpaceProgressResult {
  const bySpace = new Map<string, DevelopmentRegistryItem[]>();
  for (const space of spaceOrder) {
    bySpace.set(space, []);
  }

  let excluded = 0;

  for (const item of items) {
    // Exclure les idées P4 non planifiées (hors roadmap active).
    if (isP4(item)) {
      excluded += 1;
      continue;
    }

    const space = domainToSpace[item.domain] ?? TRANSVERSAL_NAME;
    if (!bySpace.has(space)) {
      bySpace.set(space, []);
    }
    bySpace.get(space)!.push(item);
  }

  const itemsResult = spaceOrder.map((name) => {
    const spaceItems = bySpace.get(name) ?? [];
    const total = spaceItems.length;
    const completed = spaceItems.filter((i) => statusCategory(i.status) === "done").length;
    const inProgress = spaceItems.filter((i) => statusCategory(i.status) === "inProgress").length;
    const toVerify = spaceItems.filter((i) => statusCategory(i.status) === "toVerify").length;
    const blocked = spaceItems.filter((i) => statusCategory(i.status) === "blocked").length;
    const remaining = total - completed - inProgress - toVerify - blocked;
    const domains = [...new Set(spaceItems.map((i) => i.domain))].sort();
    const percentage = total === 0 ? null : Math.round((completed / total) * 100);

    return {
      name,
      domains,
      total,
      completed,
      inProgress,
      toVerify,
      blocked,
      remaining,
      percentage,
    } satisfies SpaceProgressItem;
  });

  const covered = itemsResult.reduce((sum, item) => sum + item.total, 0);

  return {
    items: itemsResult,
    covered,
    excluded,
    totalRegistryItems: items.length,
  };
}

