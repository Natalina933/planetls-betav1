import type { SignupMode } from "./onboardingPayload";
import type { OnboardingPath } from "./types";

export type OnboardingVisualTone = "simple" | "rapide" | "business";

export type OnboardingVisual = {
  src: string;
  alt: string;
  label: string;
  tone: OnboardingVisualTone;
};

export const FALLBACK_ONBOARDING_VISUAL: OnboardingVisual = {
  src: "/images/carousel/planetls-private-accueil.png",
  alt: "Accueil PlanetLS",
  label: "Accueil",
  tone: "simple",
};

export function normalizeOnboardingPath(value?: OnboardingPath | SignupMode | string | null): OnboardingPath {
  if (value === "rapide" || value === "express") return "rapide";
  if (value === "business+" || value === "business") return "business+";
  return "simple";
}

export const ONBOARDING_JOURNEY_VISUALS: Record<OnboardingPath, OnboardingVisual> = {
  simple: {
    src: "/images/carousel/planetls-private-accueil.png",
    alt: "Accueil voyageurs préparé avec soin",
    label: "Accueil guidé",
    tone: "simple",
  },
  rapide: {
    src: "/images/generated/hero-carousel/planetls-hero-prestataires.png",
    alt: "Mise en relation rapide avec des prestataires",
    label: "Mise en route rapide",
    tone: "rapide",
  },
  "business+": {
    src: "/images/carousel/planetls-private-equipe.png",
    alt: "Organisation professionnelle d'une équipe de conciergerie",
    label: "Pilotage business",
    tone: "business",
  },
};

export const PUBLIC_PARCOURS_VISUALS = {
  owner: {
    src: "/images/generated/parcours/planetls-parcours-proprietaire.png",
    alt: "Parcours propriétaire pour piloter ses logements",
    label: "Propriétaire",
    tone: "simple",
  },
  concierge: {
    src: "/images/generated/parcours/planetls-parcours-concierge.png",
    alt: "Parcours concierge pour organiser son activité",
    label: "Concierge",
    tone: "business",
  },
  provider: {
    src: "/images/generated/parcours/planetls-parcours-artisans.png",
    alt: "Parcours artisans pour suivre les interventions",
    label: "Artisans",
    tone: "rapide",
  },
  overview: {
    src: "/images/generated/parcours/planetls-parcours-overview.png",
    alt: "Vue d'ensemble des parcours PlanetLS",
    label: "Parcours",
    tone: "simple",
  },
} satisfies Record<string, OnboardingVisual>;

const ACTION_VISUALS: Record<string, OnboardingVisual> = {
  "set-main-goal": {
    src: "/images/carousel/planetls-original-proprietaires.png",
    alt: "Objectif propriétaire clarifié",
    label: "Objectif",
    tone: "simple",
  },
  "set-collab-type": {
    src: "/images/carousel/planetls-original-conciergeries.png",
    alt: "Collaboration avec une conciergerie",
    label: "Collaboration",
    tone: "simple",
  },
  "set-used-tools": {
    src: "/images/carousel/planetls-private-hero-sheet.png",
    alt: "Outils de suivi centralisés",
    label: "Outils",
    tone: "rapide",
  },
  "set-property-types": {
    src: "/images/carousel/planetls-private-proprietaires.png",
    alt: "Biens de location saisonnière",
    label: "Biens",
    tone: "rapide",
  },
  "configure-packs": {
    src: "/images/carousel/planetls-card-header-sheet.png",
    alt: "Packs de services structurés",
    label: "Packs",
    tone: "business",
  },
  "set-pricing": {
    src: "/images/carousel/planetls-private-hero-sheet.png",
    alt: "Tarification et pilotage financier",
    label: "Tarifs",
    tone: "business",
  },
  "prepare-docs": {
    src: "/images/carousel/planetls-original-hero-sheet.png",
    alt: "Documents commerciaux préparés",
    label: "Documents",
    tone: "business",
  },
  "reply-request": {
    src: "/images/carousel/planetls-card-header-accueil.png",
    alt: "Réponse à une demande voyageur",
    label: "Demande",
    tone: "rapide",
  },
  "configure-zone": {
    src: "/images/carousel/planetls-card-header-exterieur.png",
    alt: "Zone d'intervention locale",
    label: "Zone",
    tone: "simple",
  },
  "activate-services": {
    src: "/images/carousel/planetls-card-header-menage.png",
    alt: "Services de conciergerie activés",
    label: "Services",
    tone: "simple",
  },
  "create-packs": {
    src: "/images/carousel/planetls-card-header-sheet.png",
    alt: "Offres groupées de conciergerie",
    label: "Offres",
    tone: "business",
  },
  "define-pricing": {
    src: "/images/carousel/planetls-private-hero-sheet.png",
    alt: "Grille tarifaire structurée",
    label: "Tarifs",
    tone: "business",
  },
  "add-tools": {
    src: "/images/carousel/planetls-original-hero-sheet.png",
    alt: "Modèles et outils opérationnels",
    label: "Outils",
    tone: "business",
  },
  "invite-owner": {
    src: "/images/carousel/planetls-original-proprietaires.png",
    alt: "Invitation d'un propriétaire",
    label: "Invitation",
    tone: "rapide",
  },
  "create-offer": {
    src: "/images/carousel/planetls-private-concierge-sheet.png",
    alt: "Offre de conciergerie prête à présenter",
    label: "Offre",
    tone: "business",
  },
  "complete-public-profile": {
    src: "/images/carousel/planetls-private-conciergeries.png",
    alt: "Fiche publique de conciergerie",
    label: "Profil",
    tone: "simple",
  },
};

const ACTION_VISUALS_BY_PATH: Partial<Record<OnboardingPath, Partial<Record<string, OnboardingVisual>>>> = {
  simple: {
    "set-main-goal": {
      src: "/images/carousel/planetls-private-accueil.png",
      alt: "Première étape guidée",
      label: "Démarrage",
      tone: "simple",
    },
  },
  rapide: {
    "set-main-goal": {
      src: "/images/generated/hero-carousel/planetls-hero-prestataires.png",
      alt: "Parcours rapide en action",
      label: "Priorité",
      tone: "rapide",
    },
  },
  "business+": {
    "configure-packs": {
      src: "/images/carousel/planetls-private-concierge-sheet.png",
      alt: "Packs de conciergerie professionnels",
      label: "Packs pro",
      tone: "business",
    },
  },
};

export function getOnboardingJourneyVisual(path: OnboardingPath | SignupMode | string | null | undefined) {
  return ONBOARDING_JOURNEY_VISUALS[normalizeOnboardingPath(path)] ?? FALLBACK_ONBOARDING_VISUAL;
}

export function getOnboardingActionVisual(
  actionId: string,
  path?: OnboardingPath | SignupMode | string | null,
) {
  const normalizedPath = normalizeOnboardingPath(path);
  return (
    ACTION_VISUALS_BY_PATH[normalizedPath]?.[actionId] ??
    ACTION_VISUALS[actionId] ??
    ONBOARDING_JOURNEY_VISUALS[normalizedPath] ??
    FALLBACK_ONBOARDING_VISUAL
  );
}
