import { formatCurrencyAmount } from "../../../utils/formatters.ts";
import { takeFirst } from "../../shared/collections.ts";

type MissionRow = {
  id: string;
  status: string | null;
  amount: number | null;
  title?: string | null;
};

type HousingRow = {
  id: number;
  statut: string | null;
};

type WorkspaceTone = "default" | "warning" | "success";

export type ObjectifItem = {
  title: string;
  meta: string;
  description: string;
  href: string;
  actionLabel: string;
  tone?: WorkspaceTone;
};

export function countActiveHousing(housings: HousingRow[]) {
  return housings.filter((housing) => housing.statut === "active" || housing.statut === "published").length;
}

export function sumTrackedRevenue(missions: MissionRow[]) {
  return missions.reduce(
    (sum, mission) => sum + (typeof mission.amount === "number" ? mission.amount : 0),
    0,
  );
}

export function computeAverageRevenue(trackedRevenue: number, completedCount: number) {
  return completedCount > 0 ? trackedRevenue / completedCount : 0;
}

export function computeCompletionRate(totalMissions: number, completedCount: number) {
  if (totalMissions === 0) return 0;
  return Math.round((completedCount / totalMissions) * 100);
}

export function buildObjectiveChecklist(input: {
  activeHousing: number;
  activeMissionCount: number;
  averageRevenue: number;
  completionRate: number;
}): ObjectifItem[] {
  return [
    {
      title: "Développer le portefeuille actif",
      meta: `${input.activeHousing} logement(s) actif(s)`,
      description:
        input.activeHousing >= 5
          ? "Votre base active commence à être solide. Continuez à qualifier les nouveaux biens."
          : "Captez ou activez davantage de logements pour lisser votre charge et vos revenus.",
      href: "/dashboard/concierge/recherche",
      actionLabel: "Voir la recherche",
      tone: input.activeHousing >= 5 ? "success" : "warning",
    },
    {
      title: "Maintenir le pipe missions",
      meta: `${input.activeMissionCount} mission(s) en cours`,
      description:
        input.activeMissionCount > 0
          ? "Votre pipe est actif. Gardez du rythme dans les confirmations et les clôtures."
          : "Aucune mission active. Relancez vos contacts et réveillez le pipe commercial.",
      href: "/dashboard/concierge/profile?tab=missions",
      actionLabel: "Voir les missions",
      tone: input.activeMissionCount > 0 ? "success" : "warning",
    },
    {
      title: "Valoriser votre revenu moyen",
      meta:
        input.averageRevenue > 0
          ? `${formatCurrencyAmount(input.averageRevenue, { maximumFractionDigits: 0 })} / mission`
          : "Aucun historique",
      description:
        input.averageRevenue > 0
          ? "Analysez vos prix et vos forfaits pour protéger la marge sur chaque intervention."
          : "Commencez à tracer les montants de mission pour piloter vos objectifs financiers.",
      href: "/dashboard/concierge/profile?tab=tarifs",
      actionLabel: "Revoir mes tarifs",
    },
    {
      title: "Améliorer le taux de clôture",
      meta: `${input.completionRate} % de missions clôturées`,
      description:
        input.completionRate >= 60
          ? "Votre cadence de livraison est saine. Continuez à fermer rapidement les dossiers terminés."
          : "Travaillez le suivi des missions ouvertes pour éviter l'accumulation de tâches non clôturées.",
      href: "/dashboard/concierge/planning",
      actionLabel: "Voir le planning",
      tone: input.completionRate >= 60 ? "success" : "warning",
    },
  ];
}

export function buildCompletedMissionHighlights(completedMissions: MissionRow[]): ObjectifItem[] {
  return takeFirst(completedMissions, 6).map((mission) => ({
    title: mission.title || `Mission ${mission.id.slice(0, 8)}`,
    meta:
      typeof mission.amount === "number"
        ? formatCurrencyAmount(mission.amount, { maximumFractionDigits: 0 })
        : "Montant non renseigné",
    description:
      "Mission clôturée. Utilisez ces données pour évaluer votre rythme de livraison et votre rentabilité.",
    href: "/dashboard/concierge/profile?tab=missions",
    actionLabel: "Analyser",
    tone: "success",
  }));
}
