export type SignupMode = "simple" | "express" | "business";

export type OnboardingDetails = {
  availability: string | null;
  missionPreference: string | null;
  signupMode: SignupMode;
  onboardingGoal: string | null;
  supportNeed: string | null;
  existingTools: string[];
  propertyTypes: string[];
  propertyType: string | null;
  needVolume: string | null;
  tradeBody: string | null;
  startingPriceRange: string | null;
  firstRequestTemplate: string | null;
};

type RawPayload = {
  onboarding?: Partial<OnboardingDetails> | null;
  preferences?: Partial<OnboardingDetails> | null;
};

const DEFAULT_DETAILS: OnboardingDetails = {
  availability: null,
  missionPreference: null,
  signupMode: "simple",
  onboardingGoal: null,
  supportNeed: null,
  existingTools: [],
  propertyTypes: [],
  propertyType: null,
  needVolume: null,
  tradeBody: null,
  startingPriceRange: null,
  firstRequestTemplate: null,
};

const LABELS: Record<string, string> = {
  assurance_a_preciser: "Assurance à préciser",
  assurance_ok: "Assurance à jour",
  autonome: "Autonome",
  besoin_ponctuel: "Besoin ponctuel",
  business: "Business",
  comparer_concierges: "Comparer plusieurs conciergeries",
  complement_revenu: "Compléter les revenus",
  developper_portefeuille: "Développer le portefeuille",
  express: "Express",
  gestion_complete: "Gestion complète",
  guidage_simple: "Guidage simple",
  interventions_planifiees: "Interventions planifiées",
  les_deux: "Les deux",
  missions_qualifiees: "Demandes qualifiées",
  modeles_outils: "Modèles et outils",
  occasionnel: "Occasionnel",
  ponctuelles: "Missions ponctuelles",
  premieres_missions: "Premières missions",
  regulier: "Régulier",
  regulieres: "Contrats réguliers",
  saisonnier: "Saisonnier",
  simple: "Simple",
  soirs_weekends: "Soirs et week-ends",
  structurer_activite: "Structurer l'activité",
  suivi_regulier: "Suivi régulier",
  sur_demande: "Sur demande",
  sur_devis: "Sur devis",
  temps_partiel: "Temps partiel",
  temps_plein: "Temps plein",
  urgence_24h: "Urgences 24 h",
  urgent: "Urgent",
  moins_50: "Moins de 50 EUR / h",
  "50_80": "50 à 80 EUR / h",
  "80_plus": "80 EUR / h et +",
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const parseSignupMode = (value: unknown): SignupMode => {
  if (value === "express" || value === "business") return value;
  if (value === "business+") return "business";
  return "simple";
};

export function parseOnboardingDetails(value?: string | null): OnboardingDetails {
  if (!value) return DEFAULT_DETAILS;

  try {
    const payload = JSON.parse(value) as RawPayload;
    const source = payload.onboarding ?? payload.preferences ?? {};

    return {
      availability: asString(source.availability),
      missionPreference: asString(source.missionPreference),
      signupMode: parseSignupMode(source.signupMode),
      onboardingGoal: asString(source.onboardingGoal),
      supportNeed: asString(source.supportNeed),
      existingTools: asStringArray(source.existingTools),
      propertyTypes: asStringArray(source.propertyTypes),
      propertyType: asString(source.propertyType),
      needVolume: asString(source.needVolume),
      tradeBody: asString(source.tradeBody),
      startingPriceRange: asString(source.startingPriceRange),
      firstRequestTemplate: asString(source.firstRequestTemplate),
    };
  } catch {
    return DEFAULT_DETAILS;
  }
}

export function formatOnboardingChoice(value?: string | null): string {
  if (!value) return "";
  return LABELS[value] ?? value;
}
