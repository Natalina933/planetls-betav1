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
  onboarding?: Partial<OnboardingDetails> | Record<string, unknown> | null;
  preferences?: Partial<OnboardingDetails> | Record<string, unknown> | null;
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
  assurance_a_preciser: "Assurance a preciser",
  assurance_ok: "Assurance a jour",
  autonome: "Autonome",
  besoin_ponctuel: "Besoin ponctuel",
  business: "Business",
  comparer_concierges: "Comparer plusieurs conciergeries",
  complement_revenu: "Completer les revenus",
  delegate_tasks: "Deleguer certaines taches",
  developper_portefeuille: "Developper le portefeuille",
  express: "Express",
  find_concierge: "Trouver une conciergerie",
  full: "Responsabilite forte",
  full_management: "Gestion complete",
  gestion_complete: "Gestion complete",
  guidage_simple: "Guidage simple",
  interventions_planifiees: "Interventions planifiees",
  les_deux: "Les deux",
  low: "Execution simple",
  missions_qualifiees: "Demandes qualifiees",
  modeles_outils: "Modeles et outils",
  monthly: "Chaque mois",
  occasionnel: "Occasionnel",
  onboarding: "Accompagnement au demarrage",
  one_off: "Mission ponctuelle",
  one_off_quote: "Obtenir un devis ponctuel",
  once: "Une seule fois",
  partial_management: "Gestion partielle",
  prepare_listing: "Preparer une mise en location",
  ponctuelles: "Missions ponctuelles",
  premieres_missions: "Premieres missions",
  regular: "Collaboration reguliere",
  regular_support: "Accompagnement regulier",
  regulier: "Regulier",
  regulieres: "Contrats reguliers",
  replace_current: "Remplacer ma conciergerie",
  saisonnier: "Saisonnier",
  seasonal: "Selon la saison",
  shared: "Responsabilite partagee",
  simple: "Simple",
  soirs_weekends: "Soirs et week-ends",
  structurer_activite: "Structurer l'activite",
  suivi_regulier: "Suivi regulier",
  sur_demande: "Sur demande",
  sur_devis: "Sur devis",
  temporary_replacement: "Urgence ou remplacement",
  temps_partiel: "Temps partiel",
  temps_plein: "Temps plein",
  trial: "Test avant engagement",
  unknown: "A cadrer",
  urgence_24h: "Urgences 24 h",
  urgent: "Urgent",
  weekly: "Chaque semaine",
  year_round: "Toute l'annee",
  moins_50: "Moins de 50 EUR / h",
  "50_80": "50 a 80 EUR / h",
  "80_plus": "80 EUR / h et +",
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseSignupMode = (value: unknown): SignupMode => {
  if (value === "express" || value === "business") return value;
  if (value === "business+") return "business";
  return "simple";
};

export function parseOnboardingDetails(value?: string | null): OnboardingDetails {
  if (!value) return DEFAULT_DETAILS;

  try {
    const payload = JSON.parse(value) as RawPayload;
    const onboardingSource = isRecord(payload.onboarding) ? payload.onboarding : {};
    const preferencesSource = isRecord(payload.preferences) ? payload.preferences : {};
    const source = { ...onboardingSource, ...preferencesSource };

    return {
      availability: asString(source.availability),
      missionPreference: asString(source.collaborationType ?? source.missionPreference),
      signupMode: parseSignupMode(source.signupMode),
      onboardingGoal: asString(source.ownerGoal ?? source.onboardingGoal),
      supportNeed: asString(source.responsibilityLevel ?? source.supportNeed),
      existingTools: asStringArray(source.existingTools),
      propertyTypes: asStringArray(source.propertyTypes),
      propertyType: asString(source.propertyType),
      needVolume: asString(source.frequency ?? source.needVolume),
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
