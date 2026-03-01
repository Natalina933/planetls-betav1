type HousingRow = {
  id: number;
  nom?: string | null;
  statut?: string | null;
};

type MissionRow = {
  id: string;
  priority: string | null;
  status: string | null;
};

type WorkspaceTone = "default" | "warning" | "success";

export type StockItem = {
  title: string;
  meta: string;
  description: string;
  href: string;
  actionLabel: string;
  tone?: WorkspaceTone;
};

export function normalizeStockStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "non renseigné";
}

export function buildStockForecast(housingCount: number, activeMissionCount: number, urgentMissionCount: number) {
  return {
    welcomeKits: housingCount * 2,
    linenSets: Math.max(housingCount * 3, activeMissionCount * 2),
    cleaningUnits: Math.max(housingCount, activeMissionCount),
    backupSets: Math.max(2, urgentMissionCount),
  };
}

export function buildHousingStockChecks(housings: HousingRow[]): StockItem[] {
  return housings.slice(0, 8).map((housing) => ({
    title: housing.nom || `Logement #${housing.id}`,
    meta:
      housing.statut === "active" || housing.statut === "published"
        ? "Actif"
        : "À compléter",
    description:
      "Contrôle rapide du linge, des kits d'accueil et des consommables ménage pour ce bien.",
    href: `/dashboard/concierge/logements/${housing.id}`,
    actionLabel: "Ouvrir la fiche",
    tone:
      housing.statut === "active" || housing.statut === "published"
        ? "success"
        : "warning",
  }));
}

export function buildUrgentMissionItems(urgentMissions: MissionRow[]): StockItem[] {
  return urgentMissions.slice(0, 6).map((mission) => ({
    title: `Mission ${mission.id.slice(0, 8)}`,
    meta: normalizeStockStatus(mission.status),
    description:
      "Prévoir linge, consommables et capacité de réaction adaptés à cette intervention urgente.",
    href: "/dashboard/concierge/profile?tab=missions",
    actionLabel: "Vérifier la mission",
    tone: "warning",
  }));
}

export function buildInactiveHousingItems(inactiveHousings: HousingRow[]): StockItem[] {
  return inactiveHousings.slice(0, 6).map((housing) => ({
    title: housing.nom || `Logement #${housing.id}`,
    meta: housing.statut || "Brouillon",
    description:
      "Ce bien doit être finalisé pour fiabiliser le stock à prévoir et la rotation des consommables.",
    href: `/dashboard/concierge/logements/${housing.id}`,
    actionLabel: "Compléter",
    tone: "warning",
  }));
}

