export type OwnerRequestGoal =
  | "find_concierge"
  | "one_off_quote"
  | "compare_concierges"
  | "replace_current"
  | "delegate_tasks"
  | "prepare_listing"
  | "regular_support";

export type OwnerCollaborationType =
  | "one_off"
  | "regular"
  | "full_management"
  | "partial_management"
  | "temporary_replacement"
  | "trial"
  | "onboarding";

export type OwnerRequestFrequency = "once" | "weekly" | "monthly" | "seasonal" | "year_round" | "unknown";
export type OwnerResponsibilityLevel = "low" | "shared" | "full" | "unknown";

export type ServiceRequestBriefInput = {
  ownerGoal?: string | null;
  collaborationType?: string | null;
  frequency?: string | null;
  estimatedDuration?: string | null;
  responsibilityLevel?: string | null;
  city?: string | null;
  propertyName?: string | null;
  propertyAddress?: string | null;
  propertyType?: string | null;
  sleepingCapacity?: string | number | null;
  propertyConstraints?: string | null;
  requestedServices?: string[] | null;
  desiredDate?: string | null;
  urgency?: boolean | null;
  description?: string | null;
};

export type ServiceRequestBrief = {
  owner_goal: OwnerRequestGoal;
  owner_goal_label: string;
  collaboration_type: OwnerCollaborationType;
  collaboration_type_label: string;
  frequency: OwnerRequestFrequency;
  frequency_label: string;
  estimated_duration: string | null;
  responsibility_level: OwnerResponsibilityLevel;
  responsibility_level_label: string;
  pricing_expectation: string;
  summary: string;
  missing_information: string[];
};

export type ServiceRequestBriefDefaults = {
  collaborationType: OwnerCollaborationType;
  frequency: OwnerRequestFrequency;
  responsibilityLevel: OwnerResponsibilityLevel;
};

export type ServiceRequestBriefFormGuidance = {
  titleLabel: string;
  titlePlaceholder: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  frequencyHelper: string;
  durationPlaceholder: string;
  responsibilityHelper: string;
  dateHelper: string;
  confirmationHint: string;
};

type Option<Value extends string> = {
  value: Value;
  label: string;
  helper: string;
  example: string;
};

export const OWNER_REQUEST_GOAL_OPTIONS: Array<Option<OwnerRequestGoal>> = [
  {
    value: "find_concierge",
    label: "Trouver une conciergerie",
    helper: "Pour cadrer une prise en charge du logement.",
    example: "Je cherche une equipe fiable pour gerer mon logement.",
  },
  {
    value: "one_off_quote",
    label: "Obtenir un devis ponctuel",
    helper: "Pour chiffrer une intervention precise.",
    example: "J'ai besoin d'un menage apres depart voyageur.",
  },
  {
    value: "compare_concierges",
    label: "Comparer plusieurs concierges",
    helper: "Pour recevoir plusieurs approches avant de choisir.",
    example: "Je veux comparer les services et tarifs dans ma region.",
  },
  {
    value: "replace_current",
    label: "Remplacer ma conciergerie",
    helper: "Pour organiser une transition sans rupture.",
    example: "Je cherche un relais pour reprendre la gestion actuelle.",
  },
  {
    value: "delegate_tasks",
    label: "Deleguer certaines taches",
    helper: "Pour confier seulement une partie de l'exploitation.",
    example: "Je garde la relation voyageurs mais delegue menage et linge.",
  },
  {
    value: "prepare_listing",
    label: "Preparer une mise en location",
    helper: "Pour lancer un bien avant les premiers voyageurs.",
    example: "Je veux preparer le logement avant publication.",
  },
  {
    value: "regular_support",
    label: "Accompagnement regulier",
    helper: "Pour une relation suivie avec rythme et responsabilites.",
    example: "Je cherche un partenaire recurrent toute l'annee.",
  },
];

export const OWNER_COLLABORATION_TYPE_OPTIONS: Array<Option<OwnerCollaborationType>> = [
  {
    value: "one_off",
    label: "Mission ponctuelle",
    helper: "Engagement limite a une intervention.",
    example: "Un menage, un check-in ou une visite de controle.",
  },
  {
    value: "regular",
    label: "Collaboration reguliere",
    helper: "Missions recurrentes avec rythme a definir.",
    example: "Interventions chaque semaine ou a chaque reservation.",
  },
  {
    value: "full_management",
    label: "Gestion complete",
    helper: "Responsabilite large sur le logement et les voyageurs.",
    example: "Accueil, menage, linge, coordination et suivi.",
  },
  {
    value: "partial_management",
    label: "Gestion partielle",
    helper: "Services prioritaires seulement.",
    example: "Menage et linge, mais pas la messagerie voyageurs.",
  },
  {
    value: "temporary_replacement",
    label: "Urgence ou remplacement",
    helper: "Relais temporaire ou besoin rapide.",
    example: "Remplacer une equipe indisponible pendant deux semaines.",
  },
  {
    value: "trial",
    label: "Test avant engagement",
    helper: "Premier essai avant collaboration longue.",
    example: "Tester une mission avant forfait mensuel.",
  },
  {
    value: "onboarding",
    label: "Accompagnement au demarrage",
    helper: "Aide au lancement du bien ou du process.",
    example: "Mettre en place les routines avant les premieres locations.",
  },
];

export const OWNER_REQUEST_FREQUENCY_OPTIONS: Array<Option<OwnerRequestFrequency>> = [
  { value: "once", label: "Une seule fois", helper: "Mission isolee.", example: "Cette intervention uniquement." },
  { value: "weekly", label: "Chaque semaine", helper: "Rythme recurrent.", example: "Une ou plusieurs fois par semaine." },
  { value: "monthly", label: "Chaque mois", helper: "Suivi regulier leger.", example: "Controle mensuel ou entretien." },
  { value: "seasonal", label: "Selon la saison", helper: "Pic d'activite ponctuel.", example: "Vacances, ete, haute saison." },
  { value: "year_round", label: "Toute l'annee", helper: "Collaboration continue.", example: "Gestion recurrente annuelle." },
  { value: "unknown", label: "A definir", helper: "Le concierge peut proposer.", example: "Je ne connais pas encore le rythme." },
];

export const OWNER_RESPONSIBILITY_LEVEL_OPTIONS: Array<Option<OwnerResponsibilityLevel>> = [
  { value: "low", label: "Execution simple", helper: "Le concierge realise des taches precises.", example: "Menage uniquement." },
  { value: "shared", label: "Responsabilite partagee", helper: "Le proprietaire garde une partie du pilotage.", example: "Je gere les voyageurs, vous gerez le terrain." },
  { value: "full", label: "Responsabilite forte", helper: "Le concierge pilote largement l'operationnel.", example: "Gestion complete du logement." },
  { value: "unknown", label: "A cadrer ensemble", helper: "A clarifier dans la reponse.", example: "Je souhaite vos recommandations." },
];

const GOAL_LABELS = new Map(OWNER_REQUEST_GOAL_OPTIONS.map((option) => [option.value, option.label]));
const COLLABORATION_LABELS = new Map(OWNER_COLLABORATION_TYPE_OPTIONS.map((option) => [option.value, option.label]));
const FREQUENCY_LABELS = new Map(OWNER_REQUEST_FREQUENCY_OPTIONS.map((option) => [option.value, option.label]));
const RESPONSIBILITY_LABELS = new Map(OWNER_RESPONSIBILITY_LEVEL_OPTIONS.map((option) => [option.value, option.label]));

const GOAL_DEFAULTS: Record<OwnerRequestGoal, ServiceRequestBriefDefaults> = {
  find_concierge: {
    collaborationType: "partial_management",
    frequency: "unknown",
    responsibilityLevel: "shared",
  },
  one_off_quote: {
    collaborationType: "one_off",
    frequency: "once",
    responsibilityLevel: "low",
  },
  compare_concierges: {
    collaborationType: "trial",
    frequency: "unknown",
    responsibilityLevel: "unknown",
  },
  replace_current: {
    collaborationType: "temporary_replacement",
    frequency: "seasonal",
    responsibilityLevel: "shared",
  },
  delegate_tasks: {
    collaborationType: "partial_management",
    frequency: "unknown",
    responsibilityLevel: "shared",
  },
  prepare_listing: {
    collaborationType: "onboarding",
    frequency: "unknown",
    responsibilityLevel: "shared",
  },
  regular_support: {
    collaborationType: "regular",
    frequency: "year_round",
    responsibilityLevel: "shared",
  },
};

const GOAL_GUIDANCE: Record<OwnerRequestGoal, ServiceRequestBriefFormGuidance> = {
  find_concierge: {
    titleLabel: "Besoin principal",
    titlePlaceholder: "Ex : trouver une conciergerie pour gerer mon logement",
    detailsLabel: "Contexte de gestion",
    detailsPlaceholder:
      "Precisez le logement, les services a reprendre, le volume attendu et ce que vous souhaitez garder ou deleguer.",
    frequencyHelper: "Indiquez le rythme probable pour aider le concierge a dimensionner son offre.",
    durationPlaceholder: "Ex : a cadrer ensemble, saison ete, toute l'annee",
    responsibilityHelper: "Precise si vous gardez le pilotage ou si le concierge doit prendre plus de responsabilite.",
    dateHelper: "Si vous ne connaissez pas la date, laissez vide: la mission restera a planifier.",
    confirmationHint: "Le concierge doit comprendre le perimetre attendu avant de proposer une formule.",
  },
  one_off_quote: {
    titleLabel: "Mission ponctuelle",
    titlePlaceholder: "Ex : menage apres depart voyageur",
    detailsLabel: "Details de l'intervention",
    detailsPlaceholder:
      "Decrivez la mission, le logement, les contraintes d'acces, le delai et le resultat attendu.",
    frequencyHelper: "Une mission ponctuelle doit rester sur une frequence unique sauf besoin recurrent explicite.",
    durationPlaceholder: "Ex : 1 intervention, 2 heures, avant samedi",
    responsibilityHelper: "Le concierge execute une intervention precise avec un resultat clair.",
    dateHelper: "Ajoutez la date si elle est connue; sinon le concierge pourra proposer une premiere date.",
    confirmationHint: "Le concierge doit pouvoir repondre avec un devis ponctuel.",
  },
  compare_concierges: {
    titleLabel: "Comparaison souhaitee",
    titlePlaceholder: "Ex : comparer plusieurs concierges pour Paris 15",
    detailsLabel: "Criteres de comparaison",
    detailsPlaceholder:
      "Indiquez ce que vous voulez comparer: services, forfait, disponibilite, experience, zone ou methode de travail.",
    frequencyHelper: "Le rythme aide les concierges a proposer des offres comparables.",
    durationPlaceholder: "Ex : test initial, haute saison, engagement a definir",
    responsibilityHelper: "Laissez a cadrer si vous attendez surtout plusieurs propositions.",
    dateHelper: "La date peut rester a definir pendant la phase de comparaison.",
    confirmationHint: "Le concierge doit comprendre qu'il est en comparaison et proposer une approche claire.",
  },
  replace_current: {
    titleLabel: "Remplacement ou transition",
    titlePlaceholder: "Ex : remplacer ma conciergerie actuelle en juillet",
    detailsLabel: "Contexte de reprise",
    detailsPlaceholder:
      "Expliquez ce qui doit etre repris, les urgences, les acces, les prestataires actuels et la date de bascule.",
    frequencyHelper: "Le rythme permet d'evaluer la charge de reprise.",
    durationPlaceholder: "Ex : 2 semaines, saison ete, reprise durable",
    responsibilityHelper: "La responsabilite est souvent partagee au debut d'une transition.",
    dateHelper: "La date de bascule est importante si elle est connue.",
    confirmationHint: "Le concierge doit identifier les risques de transition et le niveau d'urgence.",
  },
  delegate_tasks: {
    titleLabel: "Taches a deleguer",
    titlePlaceholder: "Ex : deleguer menage et linge uniquement",
    detailsLabel: "Perimetre delegue",
    detailsPlaceholder:
      "Listez les taches que vous deleguez, celles que vous gardez et les priorites operationnelles.",
    frequencyHelper: "La frequence distingue une aide ponctuelle d'une gestion partielle.",
    durationPlaceholder: "Ex : a chaque reservation, tous les mois, saison ete",
    responsibilityHelper: "Le concierge doit savoir si son role est execution ou pilotage partiel.",
    dateHelper: "La premiere date peut etre definie plus tard si le rythme depend des reservations.",
    confirmationHint: "Le concierge doit proposer une offre centree sur les services prioritaires.",
  },
  prepare_listing: {
    titleLabel: "Preparation de mise en location",
    titlePlaceholder: "Ex : preparer un appartement avant publication",
    detailsLabel: "Travaux de demarrage",
    detailsPlaceholder:
      "Precisez l'etat du bien, les actions avant mise en ligne, les photos, equipements, linge et controles attendus.",
    frequencyHelper: "Le lancement peut etre ponctuel puis devenir recurrent.",
    durationPlaceholder: "Ex : avant publication, 1 mois de lancement",
    responsibilityHelper: "Indiquez si le concierge conseille seulement ou pilote le lancement.",
    dateHelper: "La date cible de publication ou premiere mission aide a organiser le demarrage.",
    confirmationHint: "Le concierge doit savoir s'il chiffre un lancement, une gestion future ou les deux.",
  },
  regular_support: {
    titleLabel: "Accompagnement regulier",
    titlePlaceholder: "Ex : accompagnement regulier toute l'annee",
    detailsLabel: "Organisation recurrente",
    detailsPlaceholder:
      "Decrivez le rythme, les services prioritaires, le volume de reservations et le niveau de responsabilite attendu.",
    frequencyHelper: "Un rythme annuel, saisonnier ou hebdomadaire aide a proposer un forfait.",
    durationPlaceholder: "Ex : toute l'annee, saison haute, 6 mois renouvelables",
    responsibilityHelper: "Precise si l'offre doit etre un forfait mensuel ou un accompagnement plus leger.",
    dateHelper: "La premiere date peut etre a definir, mais le rythme doit etre clair.",
    confirmationHint: "Le concierge doit pouvoir proposer un forfait ou un accompagnement mensuel.",
  },
};

function normalizeOption<Value extends string>(value: unknown, allowed: readonly Value[], fallback: Value): Value {
  return typeof value === "string" && allowed.includes(value as Value) ? (value as Value) : fallback;
}

export function inferRequestTypeFromCollaboration(value: OwnerCollaborationType): "ponctuel" | "renfort" | "durable" {
  if (value === "temporary_replacement") return "renfort";
  if (value === "regular" || value === "full_management" || value === "partial_management") return "durable";
  return "ponctuel";
}

export function getServiceRequestBriefDefaults(ownerGoal: OwnerRequestGoal): ServiceRequestBriefDefaults {
  return GOAL_DEFAULTS[ownerGoal] ?? GOAL_DEFAULTS.find_concierge;
}

export function getServiceRequestBriefFormGuidance(ownerGoal: OwnerRequestGoal): ServiceRequestBriefFormGuidance {
  return GOAL_GUIDANCE[ownerGoal] ?? GOAL_GUIDANCE.find_concierge;
}

export function getPricingExpectation(value: OwnerCollaborationType) {
  if (value === "regular" || value === "full_management" || value === "partial_management") {
    return "forfait ou accompagnement mensuel";
  }
  if (value === "trial" || value === "onboarding") return "devis ponctuel avec option d'accompagnement";
  if (value === "temporary_replacement") return "devis de remplacement temporaire";
  return "devis ponctuel";
}

export function buildServiceRequestBrief(input: ServiceRequestBriefInput): ServiceRequestBrief {
  const ownerGoal = normalizeOption(
    input.ownerGoal,
    OWNER_REQUEST_GOAL_OPTIONS.map((option) => option.value),
    "find_concierge",
  );
  const collaborationType = normalizeOption(
    input.collaborationType,
    OWNER_COLLABORATION_TYPE_OPTIONS.map((option) => option.value),
    "one_off",
  );
  const frequency = normalizeOption(
    input.frequency,
    OWNER_REQUEST_FREQUENCY_OPTIONS.map((option) => option.value),
    collaborationType === "one_off" ? "once" : "unknown",
  );
  const responsibilityLevel = normalizeOption(
    input.responsibilityLevel,
    OWNER_RESPONSIBILITY_LEVEL_OPTIONS.map((option) => option.value),
    collaborationType === "full_management" ? "full" : collaborationType === "partial_management" ? "shared" : "unknown",
  );
  const services = (input.requestedServices ?? []).filter(Boolean);
  const city = input.city?.trim() || "ville a preciser";
  const serviceLabel = services.length > 0 ? services.slice(0, 4).join(", ") : "services a preciser";
  const dateLabel = input.desiredDate ? "date renseignee" : "a definir";
  const collaborationLabel = COLLABORATION_LABELS.get(collaborationType) ?? "Collaboration";
  const frequencyLabel = FREQUENCY_LABELS.get(frequency) ?? "A definir";
  const responsibilityLabel = RESPONSIBILITY_LABELS.get(responsibilityLevel) ?? "A cadrer ensemble";
  const propertyLabel = input.propertyName?.trim() || "un logement";
  const addressLabel = input.propertyAddress?.trim();
  const propertyTypeLabel = input.propertyType?.trim();
  const sleepingCapacityLabel =
    typeof input.sleepingCapacity === "number"
      ? `${input.sleepingCapacity} couchage(s)`
      : input.sleepingCapacity?.trim()
        ? `${input.sleepingCapacity.trim()} couchage(s)`
        : "";
  const propertyDetails = [propertyTypeLabel, sleepingCapacityLabel].filter(Boolean).join(", ");
  const constraints = input.propertyConstraints?.trim();
  const summaryParts = [
    `Le proprietaire recherche ${collaborationLabel.toLowerCase()} pour ${propertyLabel} situe a ${city}${propertyDetails ? ` (${propertyDetails})` : ""}.`,
    addressLabel ? `Adresse ou repere : ${addressLabel}.` : null,
    `Les services prioritaires sont : ${serviceLabel}.`,
    `Rythme estime : ${frequencyLabel.toLowerCase()}.`,
    input.estimatedDuration?.trim() ? `Duree estimee : ${input.estimatedDuration.trim()}.` : null,
    `Responsabilite attendue : ${responsibilityLabel.toLowerCase()}.`,
    `Premiere mission souhaitee : ${dateLabel}.`,
    constraints ? `Contraintes a prendre en compte : ${constraints}.` : null,
  ].filter((value): value is string => Boolean(value));
  const summary = summaryParts.join(" ");

  const missingInformation = [
    !input.propertyName?.trim() ? "logement_concerne" : null,
    !addressLabel ? "adresse_ou_repere" : null,
    !input.propertyType?.trim() ? "type_logement" : null,
    !String(input.sleepingCapacity ?? "").trim() ? "couchages" : null,
    services.length === 0 ? "services_prioritaires" : null,
    !input.city?.trim() ? "ville" : null,
    !input.desiredDate ? "date_premiere_mission" : null,
    !input.description?.trim() ? "attentes_particulieres" : null,
    !constraints ? "contraintes_logement" : null,
    frequency === "unknown" ? "frequence" : null,
    responsibilityLevel === "unknown" ? "niveau_responsabilite" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    owner_goal: ownerGoal,
    owner_goal_label: GOAL_LABELS.get(ownerGoal) ?? "Objectif a preciser",
    collaboration_type: collaborationType,
    collaboration_type_label: collaborationLabel,
    frequency,
    frequency_label: frequencyLabel,
    estimated_duration: input.estimatedDuration?.trim() || null,
    responsibility_level: responsibilityLevel,
    responsibility_level_label: responsibilityLabel,
    pricing_expectation: getPricingExpectation(collaborationType),
    summary,
    missing_information: missingInformation,
  };
}

export function readServiceRequestBriefMetadata(metadata: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}
