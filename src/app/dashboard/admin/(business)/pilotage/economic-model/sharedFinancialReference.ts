import {
  EXISTING_PRODUCTION_OFFERS,
  PRICING_DECISION_LOG,
  PRICING_REVENUE_SCENARIOS,
  PRICING_REVENUE_TIERS,
  PRICING_STRATEGIES,
} from "./data";

export type BenchmarkTier = {
  title: string;
  audience: string;
  range: string;
  examples: string[];
  positioning: string;
};

export type PersonaPricingRow = {
  persona: string;
  sensitivity: string;
  valueMetric: string;
  acceptableRange: string;
};

export type TargetPricingPlan = {
  name: string;
  price: string;
  target: string;
  scope: string;
  highlights: string[];
};

export type VariableCostRow = {
  label: string;
  cost: string;
  note: string;
};

export type UpgradeTriggerRow = {
  trigger: string;
  reason: string;
  outcome: string;
};

export const FINANCIAL_BENCHMARK_TIERS: BenchmarkTier[] = [
  {
    title: "Entree de gamme",
    audience: "Proprietaires 1 a 3 biens",
    range: "15 EUR a 35 EUR / mois",
    examples: ["Smoobu", "Lodgify"],
    positioning: "Prix fixe abordable, logique simple, adoption volume.",
  },
  {
    title: "Milieu de gamme",
    audience: "Independants et portefeuilles 3 a 15 biens",
    range: "25 EUR a 50 EUR / bien / mois",
    examples: ["Guesty for Hosts", "Hospitable"],
    positioning: "Abonnement plus riche, parfois complete par une commission legere.",
  },
  {
    title: "Haut de gamme",
    audience: "Conciergeries 15 a 50+ biens",
    range: "150 EUR a 500 EUR+ / mois",
    examples: ["Hostaway", "Guesty Pro"],
    positioning: "Vente sur devis, setup fees, logique plus consultative.",
  },
];

export const FINANCIAL_PERSONA_PRICING_ROWS: PersonaPricingRow[] = [
  {
    persona: "Owner 1 bien",
    sensitivity: "Tres haute",
    valueMetric: "Temps administratif gagne",
    acceptableRange: "Gratuit ou micro-payant a 9,90 EUR / mois",
  },
  {
    persona: "Owner multi 3 a 8 biens",
    sensitivity: "Moyenne",
    valueMetric: "Centralisation, automatisation, cout par logement",
    acceptableRange: "19,90 EUR a 49 EUR / mois",
  },
  {
    persona: "Concierge independante",
    sensitivity: "Faible a moyenne",
    valueMetric: "Remplacement d'outils + serenite operationnelle",
    acceptableRange: "29 EUR a 59 EUR / mois, avec traction forte a 49 EUR",
  },
  {
    persona: "Conciergerie pro 30+ biens",
    sensitivity: "Tres faible",
    valueMetric: "ROI equipe et productivite",
    acceptableRange: "149 EUR a 399 EUR+ / mois",
  },
  {
    persona: "Artisan / prestataire",
    sensitivity: "Tres haute au depart",
    valueMetric: "Nouvelles missions et gestion simple",
    acceptableRange: "Entree gratuite, commission acceptable sur mission apportee",
  },
];

export const TARGET_PRICING_PLANS: TargetPricingPlan[] = [
  {
    name: "Free",
    price: "0 EUR / mois",
    target: "Decouverte reseau",
    scope: "1 logement",
    highlights: ["Fonctions de base", "Aucun engagement", "Premiere valeur sans friction"],
  },
  {
    name: "Owner Pro",
    price: "19,90 EUR / mois",
    target: "Proprietaires structures",
    scope: "Jusqu'a 3 a 5 biens",
    highlights: ["Automatisations simples", "IA basique sous quota", "Historique illimite"],
  },
  {
    name: "Concierge Pro",
    price: "49 EUR / mois",
    target: "Coeur de cible PlanetLS",
    scope: "Jusqu'a 15 biens",
    highlights: ["Gestion proprietaires", "Facturation & devis", "App prestataires"],
  },
  {
    name: "Business",
    price: "149 EUR / mois",
    target: "Structures multi-biens",
    scope: "Jusqu'a 40 biens",
    highlights: ["Multi-utilisateurs", "Rapports avances", "Support prioritaire"],
  },
];

export const VARIABLE_COST_ROWS: VariableCostRow[] = [
  {
    label: "Base de donnees / serveurs",
    cost: "0,10 EUR a 0,50 EUR / utilisateur / mois",
    note: "Le cout reste faible mais doit etre suivi quand le volume d'usage augmente.",
  },
  {
    label: "IA",
    cost: "0,01 EUR a 0,05 EUR / requete",
    note: "A isoler comme variable sensible si PlanetLS pousse suggestions, lecture de recus ou analyse.",
  },
  {
    label: "Paiement",
    cost: "1,2 % a 1,5 % + 0,25 EUR / transaction",
    note: "Impact direct sur la marge si la monetisation melange abonnement et flux transactionnel.",
  },
  {
    label: "Emails & SMS",
    cost: "SMS autour de 0,07 EUR / envoi",
    note: "Les notifications premium devront rester pilotees pour eviter les derives invisibles.",
  },
];

export const UPGRADE_TRIGGER_ROWS: UpgradeTriggerRow[] = [
  {
    trigger: "Nombre de logements",
    reason: "Le volume est le meilleur indicateur de valeur percue.",
    outcome: "Le 2e logement ou un seuil equivalent peut declencher la sortie du plan gratuit.",
  },
  {
    trigger: "Consommation IA",
    reason: "Les couts variables doivent rester cadres par la valeur.",
    outcome: "Par exemple 10 credits IA gratuits par mois, puis plan payant ou add-on dedie.",
  },
  {
    trigger: "Membres d'equipe",
    reason: "La coordination multi-utilisateurs est une vraie marche de valeur.",
    outcome: "Invitation de collaborateurs reservee au plan Business ou superieur.",
  },
  {
    trigger: "Export comptable / facturation auto",
    reason: "Fonction premium a forte valeur metier.",
    outcome: "Reserver ces usages aux plans Pro et Business.",
  },
];

export const FINANCIAL_NEXT_ACTIONS = [
  "Tester en premier la lisibilite commerciale du palier 19,90 EUR / 49 EUR / 149 EUR.",
  "Confirmer que Concierge Pro reste le coeur de cible le plus monetisable a court terme.",
  "Mesurer separement ce qui releve du SaaS fixe, de la marketplace et des couts d'usage IA/SMS.",
  "Defendre explicitement une logique de value-based pricing : vendre le gain de coordination, de temps et de fiabilite plutot qu'un prix arbitraire.",
];

export const PRIMARY_PRICING_STRATEGY =
  PRICING_STRATEGIES.find((strategy) => strategy.id === "strategy-b") ?? PRICING_STRATEGIES[0];

export const LOCKED_PRODUCTION_OFFER =
  EXISTING_PRODUCTION_OFFERS.find((offer) => offer.isLockedProduction) ?? EXISTING_PRODUCTION_OFFERS[0];

export const SCENARIO_DIRECTOR =
  PRICING_REVENUE_SCENARIOS.find((scenario) => scenario.id === "realistic") ??
  PRICING_REVENUE_SCENARIOS[0];

export const TARGET_SIMULATION_TIERS = PRICING_REVENUE_TIERS.filter((tier) =>
  ["owner_pro", "concierge_pro", "business"].includes(tier.id),
);

export const ACTIVE_PRICING_DECISIONS = PRICING_DECISION_LOG.filter(
  (entry) => entry.status === "open" || entry.status === "tracked",
);

export const FINANCIAL_REFERENCE_NOTE =
  "PlanetLS peut defendre une tarification par valeur creee : un SaaS lisible a l'entree, puis une monetisation de la coordination, du volume gere, de la marketplace et des usages IA.";
