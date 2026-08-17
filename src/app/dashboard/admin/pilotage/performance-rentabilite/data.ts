import {
  buildPerformanceRecommendations,
  buildScenarioResult,
  computeGrossRevenue,
  computeMarginRate,
  computeNetRevenue,
  computeOccupancyRate,
  computePotentialAdditionalNights,
  computeRevPar,
  computeTargetBookedNights,
} from "./calculations";
import type { PerformanceMonthlyRow, PerformancePilotModule } from "./types";

const AVAILABLE_NIGHTS = 364;
const BOOKED_NIGHTS = 130;
const BLOCKED_NIGHTS = 26;
const TARGET_OCCUPANCY_RATE = 45;
const ADR = 100;
const PLATFORM_FEE_RATE = 0.12;
const CLEANING_COST_PER_NIGHT = 9;
const CONCIERGE_COST_PER_NIGHT = 18;
const CONSUMABLES_COST_PER_NIGHT = 3;
const OTHER_VARIABLE_COST_PER_NIGHT = 4;
const ANNUAL_OBJECTIVE_REVENUE = 16400;

const grossRevenue = computeGrossRevenue(BOOKED_NIGHTS, ADR);
const platformFees = Math.round(grossRevenue * PLATFORM_FEE_RATE * 100) / 100;
const cleaningCost = Math.round(BOOKED_NIGHTS * CLEANING_COST_PER_NIGHT * 100) / 100;
const conciergeCost = Math.round(BOOKED_NIGHTS * CONCIERGE_COST_PER_NIGHT * 100) / 100;
const consumablesCost = Math.round(BOOKED_NIGHTS * CONSUMABLES_COST_PER_NIGHT * 100) / 100;
const otherVariableCosts = Math.round(BOOKED_NIGHTS * OTHER_VARIABLE_COST_PER_NIGHT * 100) / 100;
const netRevenue = computeNetRevenue({
  grossRevenue,
  platformFees,
  conciergeCost,
  cleaningCost,
  consumablesCost,
  otherVariableCosts,
});

const monthlyRows: PerformanceMonthlyRow[] = [
  {
    month: "Mai",
    occupancyRate: 28,
    adr: 88,
    grossRevenue: 1760,
    netRevenue: 842,
    status: "underperforming",
    source: "demo",
  },
  {
    month: "Juin",
    occupancyRate: 42,
    adr: 96,
    grossRevenue: 2880,
    netRevenue: 1458,
    status: "opportunity",
    source: "demo",
  },
  {
    month: "Juillet",
    occupancyRate: 78,
    adr: 125,
    grossRevenue: 4875,
    netRevenue: 2712,
    status: "good",
    source: "demo",
  },
  {
    month: "Août",
    occupancyRate: 92,
    adr: 145,
    grossRevenue: 6380,
    netRevenue: 3689,
    status: "excellent",
    source: "demo",
  },
  {
    month: "Septembre",
    occupancyRate: 38,
    adr: 98,
    grossRevenue: 2744,
    netRevenue: 1416,
    status: "opportunity",
    source: "demo",
  },
];

const targetBookedNights = computeTargetBookedNights(AVAILABLE_NIGHTS, TARGET_OCCUPANCY_RATE);
const additionalNightsPotential = computePotentialAdditionalNights(
  BOOKED_NIGHTS,
  AVAILABLE_NIGHTS,
  TARGET_OCCUPANCY_RATE,
);

const scenarios = [
  buildScenarioResult(
    { label: "Scénario A", targetOccupancyRate: 45, adr: 105 },
    {
      availableNights: AVAILABLE_NIGHTS,
      currentBookedNights: BOOKED_NIGHTS,
      platformFeeRate: PLATFORM_FEE_RATE,
      cleaningCostPerNight: CLEANING_COST_PER_NIGHT,
      conciergeCostPerNight: CONCIERGE_COST_PER_NIGHT,
      consumablesCostPerNight: CONSUMABLES_COST_PER_NIGHT,
      otherVariableCostPerNight: OTHER_VARIABLE_COST_PER_NIGHT,
    },
  ),
  buildScenarioResult(
    { label: "Scénario B", targetOccupancyRate: 50, adr: 90 },
    {
      availableNights: AVAILABLE_NIGHTS,
      currentBookedNights: BOOKED_NIGHTS,
      platformFeeRate: PLATFORM_FEE_RATE,
      cleaningCostPerNight: CLEANING_COST_PER_NIGHT,
      conciergeCostPerNight: CONCIERGE_COST_PER_NIGHT,
      consumablesCostPerNight: CONSUMABLES_COST_PER_NIGHT,
      otherVariableCostPerNight: OTHER_VARIABLE_COST_PER_NIGHT,
    },
  ),
  buildScenarioResult(
    { label: "Scénario C", targetOccupancyRate: 55, adr: 75 },
    {
      availableNights: AVAILABLE_NIGHTS,
      currentBookedNights: BOOKED_NIGHTS,
      platformFeeRate: PLATFORM_FEE_RATE,
      cleaningCostPerNight: CLEANING_COST_PER_NIGHT,
      conciergeCostPerNight: CONCIERGE_COST_PER_NIGHT,
      consumablesCostPerNight: CONSUMABLES_COST_PER_NIGHT,
      otherVariableCostPerNight: OTHER_VARIABLE_COST_PER_NIGHT,
    },
  ),
];

export const PERFORMANCE_RENTABILITY_PILOT: PerformancePilotModule = {
  title: "Performance & rentabilité locative",
  valueChain: [
    "Données de réservation",
    "Analyse de performance",
    "Benchmark",
    "Calcul de rentabilité",
    "Détection d'opportunités",
    "Recommandation",
    "Action",
    "Mesure du résultat",
  ],
  overview: {
    availableNights: AVAILABLE_NIGHTS,
    bookedNights: BOOKED_NIGHTS,
    blockedNights: BLOCKED_NIGHTS,
    occupancyRate: computeOccupancyRate(BOOKED_NIGHTS, AVAILABLE_NIGHTS),
    targetOccupancyRate: TARGET_OCCUPANCY_RATE,
    targetBookedNights,
    additionalNightsPotential,
    adr: ADR,
    grossRevenue,
    platformFees,
    conciergeCost,
    cleaningCost,
    consumablesCost,
    otherVariableCosts,
    netRevenue,
    marginRate: computeMarginRate(netRevenue, grossRevenue),
    revpar: computeRevPar(grossRevenue, AVAILABLE_NIGHTS),
    annualObjectiveRevenue: ANNUAL_OBJECTIVE_REVENUE,
    annualObjectiveProgressRate: Math.round((grossRevenue / ANNUAL_OBJECTIVE_REVENUE) * 1000) / 10,
    source: "demo",
  },
  kpis: [
    {
      label: "Occupation actuelle",
      value: `${computeOccupancyRate(BOOKED_NIGHTS, AVAILABLE_NIGHTS)} %`,
      hint: "130 nuits réservées sur 364 disponibles",
      source: "demo",
    },
    {
      label: "Objectif annuel",
      value: `${TARGET_OCCUPANCY_RATE} %`,
      hint: `${targetBookedNights} nuits visées`,
      source: "estimated",
    },
    {
      label: "Potentiel",
      value: `+${additionalNightsPotential} nuits`,
      hint: "Écart entre situation actuelle et cible",
      source: "estimated",
    },
    {
      label: "CA supplémentaire estimé",
      value: `+${additionalNightsPotential * ADR} EUR`,
      hint: "À ADR constant",
      source: "estimated",
    },
    {
      label: "Revenu net estimé",
      value: `${netRevenue} EUR`,
      hint: "Après commissions et coûts variables",
      source: "estimated",
    },
    {
      label: "Progression vers l'objectif",
      value: `${Math.round((grossRevenue / ANNUAL_OBJECTIVE_REVENUE) * 1000) / 10} %`,
      hint: "Base démonstration Barcarès",
      source: "demo",
    },
  ],
  monthlyRows,
  profitabilityRows: [
    { label: "Chiffre d'affaires brut", amount: grossRevenue, source: "demo", emphasis: "positive" },
    { label: "Commission plateforme", amount: -platformFees, source: "estimated", emphasis: "negative" },
    { label: "Coût conciergerie", amount: -conciergeCost, source: "estimated", emphasis: "negative" },
    { label: "Coût ménage", amount: -cleaningCost, source: "estimated", emphasis: "negative" },
    { label: "Consommables", amount: -consumablesCost, source: "estimated", emphasis: "negative" },
    { label: "Autres coûts variables", amount: -otherVariableCosts, source: "estimated", emphasis: "negative" },
    { label: "Revenu net estimé", amount: netRevenue, source: "estimated", emphasis: "positive" },
  ],
  scenarios,
  opportunityCalendar: [
    { month: "Mai", tone: "underperforming", message: "Période à optimiser", source: "demo" },
    { month: "Juin", tone: "opportunity", message: "Potentiel activable", source: "demo" },
    { month: "Juillet", tone: "good", message: "Bonne performance", source: "demo" },
    { month: "Août", tone: "excellent", message: "Ne pas casser les prix", source: "demo" },
    { month: "Septembre", tone: "opportunity", message: "Potentiel important", source: "demo" },
  ],
  recommendations: buildPerformanceRecommendations({
    overview: {
      occupancyRate: computeOccupancyRate(BOOKED_NIGHTS, AVAILABLE_NIGHTS),
      targetOccupancyRate: TARGET_OCCUPANCY_RATE,
      additionalNightsPotential,
      adr: ADR,
    },
    monthlyRows,
  }),
  featureBuckets: [
    {
      label: "MVP",
      items: [
        "Dashboard de performance",
        "Analyse mensuelle et annuelle",
        "Rentabilité nette estimée",
        "Détection des mois sous-performants",
        "Objectifs de taux d'occupation",
        "Alertes de performance",
      ],
    },
    {
      label: "V1",
      items: [
        "Calendrier d'opportunités",
        "Simulateur Et si... avec scénarios comparés",
        "Mesure du résultat après action",
        "Recommandations IA branchées sur règles métier puis API",
      ],
    },
    {
      label: "V2",
      items: [
        "Benchmark marché local",
        "Comparaison année N / N-1 enrichie",
        "Scénarios multi-logements",
        "Prévisions saisonnières et recommandations avancées",
      ],
    },
  ],
  testsToRun: [
    "Valider les calculs purs d'occupation, RevPAR, net et scénarios",
    "Tester la distinction réel / estimé / démonstration dans l'interface",
    "Confirmer l'ergonomie desktop/mobile des tableaux et badges de statut",
    "Brancher ensuite un premier flux réel depuis reservations + invoices sur un pilote owner",
  ],
  openQuestions: [
    "Quels coûts doivent être saisis par le propriétaire et quels coûts peuvent être inférés ?",
    "Le revenu net doit-il être calculé au séjour, au logement ou au portefeuille ?",
    "Quel niveau de benchmark local est crédible sans données externes partenaires ?",
  ],
  risks: [
    "Faire passer une estimation pour une donnée réelle si la source n'est pas explicitement affichée",
    "Dupliquer la finance owner déjà présente sans relier clairement le nouveau module au cockpit existant",
    "Coder trop tôt des règles locales spécifiques au Barcarès au lieu d'un modèle générique",
    "Sous-estimer les données manquantes sur coûts, canaux et objectifs propriétaires",
  ],
  decisions: [
    "Commencer par un cockpit de pilotage produit plutôt que par un moteur métier complet",
    "Utiliser un cas pilote Barcarès uniquement comme démonstration UX clairement étiquetée",
    "Garder les calculs métiers purs et testables hors des composants React",
    "Ne pas modifier immédiatement la tarification existante: documenter d'abord l'hypothèse business",
  ],
  nextActions: [
    "Brancher une lecture réelle reservations + invoices pour un owner pilote",
    "Décider le modèle minimal de coûts persistés côté logement ou séjour",
    "Relier ensuite le module owner à un premier tableau de performance par logement",
    "Définir les seuils d'alertes et la cadence de mesure mensuelle",
  ],
  dataAudit: [
    {
      title: "Données existantes",
      items: [
        "Réservations et séjours canoniques via reservations",
        "Missions liées à l'exploitation et au séjour",
        "Devis et factures owner avec montants et statuts",
        "Housing avec informations de logement et quelques réglages",
      ],
    },
    {
      title: "Données calculées",
      items: [
        "Nuits réservées, taux d'occupation, ADR, CA brut",
        "Revenu net estimé si les coûts variables sont fournis",
        "RevPAR, progression vers l'objectif, potentiel de nuits supplémentaires",
      ],
    },
    {
      title: "Données manquantes",
      items: [
        "Coûts de conciergerie réellement persistés et historisés",
        "Commissions par plateforme et revenus par canal",
        "Charges variables détaillées par séjour",
        "Objectifs propriétaires persistés et historisés",
      ],
    },
    {
      title: "Données externes futures",
      items: [
        "Benchmark local de destination",
        "Tendances de marché et saisonnalité externe",
        "Références tarifaires et concurrence par zone",
      ],
    },
  ],
  status: {
    status: "Prototype de pilotage",
    priority: "P1 Prioritaire",
    businessValue: "Très élevée côté propriétaire payant",
    technicalComplexity: "Moyenne aujourd'hui, élevée pour le moteur final",
    dependencies: [
      "reservations",
      "invoices",
      "housing",
      "objectifs propriétaires",
      "coûts variables persistés",
    ],
    requiredData: [
      "nuits disponibles / réservées / bloquées",
      "ADR",
      "coûts conciergerie / ménage / consommables",
      "revenus par plateforme",
    ],
    personas: ["Propriétaire", "Conciergerie", "Administrateur"],
    monetizationHypothesis:
      "La lecture de rentabilité, les objectifs, le simulateur et les recommandations peuvent justifier une offre propriétaire payante sans modifier encore la grille tarifaire en production.",
  },
};
