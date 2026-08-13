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
    title: "Entrée de gamme",
    audience: "Propriétaires 1 à 3 biens",
    range: "15 € à 35 € / mois",
    examples: ["Smoobu", "Lodgify"],
    positioning: "Prix fixe abordable, logique simple, adoption volume.",
  },
  {
    title: "Milieu de gamme",
    audience: "Indépendants et portefeuilles 3 à 15 biens",
    range: "25 € à 50 € / bien / mois",
    examples: ["Guesty for Hosts", "Hospitable"],
    positioning: "Abonnement plus riche, parfois complété par une commission légère.",
  },
  {
    title: "Haut de gamme",
    audience: "Conciergeries 15 à 50+ biens",
    range: "150 € à 500 €+ / mois",
    examples: ["Hostaway", "Guesty Pro"],
    positioning: "Vente sur devis, setup fees, logique plus consultative.",
  },
];

export const FINANCIAL_PERSONA_PRICING_ROWS: PersonaPricingRow[] = [
  {
    persona: "Owner 1 bien",
    sensitivity: "Très haute",
    valueMetric: "Temps administratif gagné",
    acceptableRange: "Gratuit ou micro-payant à 9,90 € / mois",
  },
  {
    persona: "Owner multi 3 à 8 biens",
    sensitivity: "Moyenne",
    valueMetric: "Coût par logement et automatisation",
    acceptableRange: "29 € à 49 € / mois",
  },
  {
    persona: "Concierge indépendante",
    sensitivity: "Faible à moyenne",
    valueMetric: "Remplacement d'outils + sérénité opérationnelle",
    acceptableRange: "29 € à 59 € / mois",
  },
  {
    persona: "Conciergerie pro 30+ biens",
    sensitivity: "Très faible",
    valueMetric: "ROI équipe et productivité",
    acceptableRange: "149 € à 399 €+ / mois",
  },
  {
    persona: "Artisan / prestataire",
    sensitivity: "Très haute au départ",
    valueMetric: "Nouvelles missions et gestion simple",
    acceptableRange: "Entrée gratuite, commission acceptable sur mission apportée",
  },
];

export const TARGET_PRICING_PLANS: TargetPricingPlan[] = [
  {
    name: "Free",
    price: "0 € / mois",
    target: "Découverte réseau",
    scope: "1 logement",
    highlights: ["Fonctions de base", "Aucun engagement", "Première valeur sans friction"],
  },
  {
    name: "Owner Pro",
    price: "19,90 € / mois",
    target: "Propriétaires structurés",
    scope: "Jusqu'à 3 à 5 biens",
    highlights: ["Automatisations simples", "IA basique", "Historique illimité"],
  },
  {
    name: "Concierge Pro",
    price: "49 € / mois",
    target: "Cœur de cible PlanetLS",
    scope: "Jusqu'à 15 biens",
    highlights: ["Gestion propriétaires", "Facturation & devis", "App prestataires"],
  },
  {
    name: "Business",
    price: "149 € / mois",
    target: "Structures multi-biens",
    scope: "Jusqu'à 40 biens",
    highlights: ["Multi-utilisateurs", "Rapports avancés", "Support prioritaire"],
  },
];

export const VARIABLE_COST_ROWS: VariableCostRow[] = [
  {
    label: "Base de données / serveurs",
    cost: "0,10 € à 0,50 € / utilisateur / mois",
    note: "Le coût reste faible mais doit être suivi quand le volume d'usage augmente.",
  },
  {
    label: "IA",
    cost: "0,01 € à 0,05 € / requête",
    note: "À isoler comme variable sensible si PlanetLS pousse suggestions, lecture de reçus ou analyse.",
  },
  {
    label: "Paiement",
    cost: "1,2 % à 1,5 % + 0,25 € / transaction",
    note: "Impact direct sur la marge si la monétisation mélange abonnement et flux transactionnel.",
  },
  {
    label: "Emails & SMS",
    cost: "SMS autour de 0,07 € / envoi",
    note: "Les notifications premium devront rester pilotées pour éviter les dérives invisibles.",
  },
];

export const UPGRADE_TRIGGER_ROWS: UpgradeTriggerRow[] = [
  {
    trigger: "Nombre de logements",
    reason: "Le volume est le meilleur indicateur de valeur perçue.",
    outcome: "Le 2e logement ou un seuil équivalent peut déclencher la sortie du plan gratuit.",
  },
  {
    trigger: "Consommation IA",
    reason: "Les coûts variables doivent rester cadrés par la valeur.",
    outcome: "Un quota gratuit limité puis un plan payant ou un add-on dédié.",
  },
  {
    trigger: "Membres d'équipe",
    reason: "La coordination multi-utilisateurs est une vraie marche de valeur.",
    outcome: "Invitation de collaborateurs réservée au plan Business ou supérieur.",
  },
  {
    trigger: "Export comptable / facturation auto",
    reason: "Fonction premium à forte valeur métier.",
    outcome: "Réserver ces usages aux plans Pro et Business.",
  },
];

export const FINANCIAL_NEXT_ACTIONS = [
  "Tester en premier la lisibilité commerciale du palier 19,90 € / 49 € / 149 €.",
  "Confirmer que Concierge Pro reste le cœur de cible le plus monétisable à court terme.",
  "Mesurer séparément ce qui relève du SaaS fixe, de la marketplace et des coûts d'usage IA/SMS.",
];

export const PRIMARY_PRICING_STRATEGY =
  PRICING_STRATEGIES.find((strategy) => strategy.id === "strategy-b") ?? PRICING_STRATEGIES[0];

export const LOCKED_PRODUCTION_OFFER =
  EXISTING_PRODUCTION_OFFERS.find((offer) => offer.isLockedProduction) ?? EXISTING_PRODUCTION_OFFERS[0];

export const SCENARIO_DIRECTOR =
  PRICING_REVENUE_SCENARIOS.find((scenario) => scenario.id === "realistic") ??
  PRICING_REVENUE_SCENARIOS[0];

export const TARGET_SIMULATION_TIERS = PRICING_REVENUE_TIERS.filter((tier) =>
  ["essential", "pro", "business"].includes(tier.id),
);

export const ACTIVE_PRICING_DECISIONS = PRICING_DECISION_LOG.filter(
  (entry) => entry.status === "open" || entry.status === "tracked",
);

export const FINANCIAL_REFERENCE_NOTE =
  "PlanetLS peut défendre un SaaS lisible à l'entrée tout en gardant la valeur avancée sur la coordination, la marketplace et les usages IA.";
