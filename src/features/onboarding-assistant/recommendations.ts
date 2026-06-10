import type { OnboardingDetails } from "./onboardingPayload";

export type SmartDashboardAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

type SmartPlan = {
  badge: string;
  title: string;
  description: string;
  actions: SmartDashboardAction[];
  checklist: SmartDashboardAction[];
};

const ACTIONS: Record<string, SmartDashboardAction> = {
  replyRequest: {
    id: "reply-request",
    title: "Répondre à une demande",
    detail: "Traitez une opportunité proche et qualifiée.",
    href: "/dashboard/concierge/demandes",
  },
  configureZone: {
    id: "configure-zone",
    title: "Configurer ma zone",
    detail: "Ajustez rayon, secteurs et disponibilité.",
    href: "/dashboard/concierge/profile?tab=missions",
  },
  activateServices: {
    id: "activate-services",
    title: "Activer mes services",
    detail: "Vérifiez les prestations visibles sur votre profil.",
    href: "/dashboard/concierge/profile?tab=missions",
  },
  createPacks: {
    id: "create-packs",
    title: "Créer mes packs",
    detail: "Regroupez vos prestations en offres lisibles.",
    href: "/dashboard/concierge/services-packages",
  },
  definePricing: {
    id: "define-pricing",
    title: "Définir mes tarifs",
    detail: "Cadrez vos prix pour répondre plus vite.",
    href: "/dashboard/concierge/pricing",
  },
  addTools: {
    id: "add-tools",
    title: "Ajouter mes outils",
    detail: "Préparez modèles, documents et méthodes.",
    href: "/dashboard/concierge/billing",
  },
  inviteOwner: {
    id: "invite-owner",
    title: "Inviter un propriétaire",
    detail: "Transformez un contact existant en relation active.",
    href: "/dashboard/concierge/contacts",
  },
  createOffer: {
    id: "create-offer",
    title: "Créer une offre",
    detail: "Présentez une offre claire pour votre portefeuille.",
    href: "/dashboard/concierge/services-packages",
  },
  completePublicProfile: {
    id: "complete-public-profile",
    title: "Compléter ma fiche publique",
    detail: "Rendez votre profil plus rassurant et visible.",
    href: "/dashboard/concierge/profile?tab=fiche",
  },
};

const goalPlan = (goal: string | null): Pick<SmartPlan, "badge" | "title" | "description" | "actions"> => {
  switch (goal) {
    case "premieres_missions":
      return {
        badge: "Objectif : premières missions",
        title: "Passez vite en mode opportunités.",
        description: "On met en avant les actions qui rendent votre profil trouvable et prêt à répondre.",
        actions: [ACTIONS.replyRequest, ACTIONS.configureZone, ACTIONS.activateServices],
      };
    case "structurer_activite":
      return {
        badge: "Objectif : structure",
        title: "Posez une activité claire et vendable.",
        description: "Priorité aux offres, tarifs et outils qui rendent votre conciergerie plus robuste.",
        actions: [ACTIONS.createPacks, ACTIONS.definePricing, ACTIONS.addTools],
      };
    case "developper_portefeuille":
      return {
        badge: "Objectif : portefeuille",
        title: "Accélérez la relation propriétaire.",
        description: "On privilégie les actions commerciales qui ouvrent de nouvelles relations.",
        actions: [ACTIONS.inviteOwner, ACTIONS.createOffer, ACTIONS.completePublicProfile],
      };
    default:
      return {
        badge: "Orientation personnalisée",
        title: "Construisez une base exploitable.",
        description: "Fiche, zone et services suffisent pour déclencher des opportunités plus pertinentes.",
        actions: [ACTIONS.completePublicProfile, ACTIONS.configureZone, ACTIONS.activateServices],
      };
  }
};

const supportChecklist = (supportNeed: string | null): SmartDashboardAction[] => {
  switch (supportNeed) {
    case "guidage_simple":
      return [ACTIONS.completePublicProfile, ACTIONS.configureZone, ACTIONS.activateServices];
    case "modeles_outils":
      return [ACTIONS.createPacks, ACTIONS.definePricing, ACTIONS.addTools];
    case "missions_qualifiees":
      return [ACTIONS.configureZone, ACTIONS.activateServices, ACTIONS.replyRequest];
    case "autonome":
      return [ACTIONS.replyRequest, ACTIONS.definePricing, ACTIONS.inviteOwner];
    default:
      return [];
  }
};

export const buildSmartDashboardPlan = (onboarding: OnboardingDetails): SmartPlan => {
  const base = goalPlan(onboarding.onboardingGoal);
  const support = supportChecklist(onboarding.supportNeed);
  const checklist = support.length > 0 ? support : base.actions;

  return {
    ...base,
    checklist,
  };
};
