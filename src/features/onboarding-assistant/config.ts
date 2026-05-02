import type { OnboardingActionItem, OnboardingDisplayContext, OnboardingPath } from "./types";

export interface OnboardingJourneyConfig {
  title: string;
  subtitle: string;
  hook: string;
  body: string;
  secondaryLabel: string;
  actions: OnboardingActionItem[];
}

export const ONBOARDING_JOURNEYS: Record<OnboardingPath, OnboardingJourneyConfig> = {
  simple: {
    title: "Prochaine étape",
    subtitle: "Parcours simple",
    hook: "Démarrons sans friction.",
    body: "Finalisez l’essentiel pour débloquer rapidement votre tableau de bord et vos premières actions.",
    secondaryLabel: "Masquer",
    actions: [
      { id: "set-main-goal", label: "Définir mon objectif principal", href: "/dashboard/owner/objectifs" },
      { id: "set-collab-type", label: "Définir ma collaboration", href: "/dashboard/owner/conciergerie" },
    ],
  },
  rapide: {
    title: "Prochaine étape",
    subtitle: "Parcours rapide",
    hook: "Accélérez votre mise en route.",
    body: "Vous avez déjà avancé. Ajoutez les points clés restants pour activer un suivi plus fiable des priorités.",
    secondaryLabel: "Masquer",
    actions: [
      { id: "set-main-goal", label: "Mettre mon objectif principal", href: "/dashboard/owner/objectifs" },
      { id: "set-used-tools", label: "Renseigner mes outils utilisés", href: "/dashboard/owner/conciergerie" },
      { id: "set-property-types", label: "Choisir mes types de biens", href: "/dashboard/owner/logements" },
    ],
  },
  "business+": {
    title: "Prochaine étape",
    subtitle: "Parcours business+",
    hook: "Préparons votre cockpit de gestion.",
    body: "Votre inscription contient déjà des signaux pro. Le dashboard peut maintenant vous aider à structurer vos packs, vos tarifs et vos documents commerciaux.",
    secondaryLabel: "Masquer",
    actions: [
      { id: "configure-packs", label: "Configurer mes packs", href: "/dashboard/owner/conciergerie" },
      { id: "set-pricing", label: "Mettre mes tarifs", href: "/dashboard/owner/finances/overview" },
      { id: "prepare-docs", label: "Préparer devis et contrats", href: "/dashboard/owner/documents" },
    ],
  },
};

export function shouldShowFirstLoginPopup(context: OnboardingDisplayContext) {
  return context.firstLogin;
}

export function getPendingActions(path: OnboardingPath, actionStatus: OnboardingDisplayContext["actionStatus"]) {
  return ONBOARDING_JOURNEYS[path].actions.filter((action) => actionStatus[action.id] !== "done");
}

export function shouldShowDashboardReminder(path: OnboardingPath, context: OnboardingDisplayContext) {
  if (context.completionState === "completed") return false;
  return getPendingActions(path, context.actionStatus).length > 0;
}
