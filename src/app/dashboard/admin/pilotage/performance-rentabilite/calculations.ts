import type {
  PerformanceMonthlyRow,
  PerformanceRecommendation,
  PerformanceScenarioInput,
  PerformanceScenarioResult,
} from "./types";

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function round1(value: number) {
  return roundTo(value, 1);
}

export function round2(value: number) {
  return roundTo(value, 2);
}

export function computeOccupancyRate(bookedNights: number, availableNights: number) {
  if (availableNights <= 0) return 0;
  return round1((bookedNights / availableNights) * 100);
}

export function computeTargetBookedNights(availableNights: number, targetOccupancyRate: number) {
  if (availableNights <= 0) return 0;
  return Math.round((availableNights * targetOccupancyRate) / 100);
}

export function computePotentialAdditionalNights(
  bookedNights: number,
  availableNights: number,
  targetOccupancyRate: number,
) {
  const targetBookedNights = computeTargetBookedNights(availableNights, targetOccupancyRate);
  return Math.max(targetBookedNights - bookedNights, 0);
}

export function computeGrossRevenue(bookedNights: number, adr: number) {
  return round2(bookedNights * adr);
}

export function computeNetRevenue(input: {
  grossRevenue: number;
  platformFees: number;
  conciergeCost: number;
  cleaningCost: number;
  consumablesCost: number;
  otherVariableCosts: number;
}) {
  const net =
    input.grossRevenue -
    input.platformFees -
    input.conciergeCost -
    input.cleaningCost -
    input.consumablesCost -
    input.otherVariableCosts;
  return round2(net);
}

export function computeMarginRate(netRevenue: number, grossRevenue: number) {
  if (grossRevenue <= 0) return 0;
  return round1((netRevenue / grossRevenue) * 100);
}

export function computeRevPar(grossRevenue: number, availableNights: number) {
  if (availableNights <= 0) return 0;
  return round2(grossRevenue / availableNights);
}

export function buildScenarioResult(
  input: PerformanceScenarioInput,
  config: {
    availableNights: number;
    currentBookedNights: number;
    platformFeeRate: number;
    cleaningCostPerNight: number;
    conciergeCostPerNight: number;
    consumablesCostPerNight: number;
    otherVariableCostPerNight: number;
  },
): PerformanceScenarioResult {
  const bookedNights = computeTargetBookedNights(config.availableNights, input.targetOccupancyRate);
  const grossRevenue = computeGrossRevenue(bookedNights, input.adr);
  const additionalNights = Math.max(bookedNights - config.currentBookedNights, 0);
  const currentRevenue = computeGrossRevenue(config.currentBookedNights, input.adr);
  const additionalRevenue = Math.max(grossRevenue - currentRevenue, 0);
  const platformFees = round2(grossRevenue * config.platformFeeRate);
  const cleaningCost = round2(bookedNights * config.cleaningCostPerNight);
  const conciergeCost = round2(bookedNights * config.conciergeCostPerNight);
  const consumablesCost = round2(bookedNights * config.consumablesCostPerNight);
  const otherVariableCosts = round2(bookedNights * config.otherVariableCostPerNight);
  const netRevenue = computeNetRevenue({
    grossRevenue,
    platformFees,
    conciergeCost,
    cleaningCost,
    consumablesCost,
    otherVariableCosts,
  });

  return {
    label: input.label,
    targetOccupancyRate: input.targetOccupancyRate,
    bookedNights,
    adr: input.adr,
    grossRevenue,
    additionalNights,
    additionalRevenue,
    platformFees,
    cleaningCost,
    conciergeCost,
    consumablesCost,
    otherVariableCosts,
    netRevenue,
    marginRate: computeMarginRate(netRevenue, grossRevenue),
    source: "demo",
  };
}

export function buildPerformanceRecommendations(input: {
  overview: {
    occupancyRate: number;
    targetOccupancyRate: number;
    additionalNightsPotential: number;
    adr: number;
  };
  monthlyRows: PerformanceMonthlyRow[];
}): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = [];
  const underperformingMonth = input.monthlyRows.find((row) => row.status === "underperforming");
  const opportunityMonth = input.monthlyRows.find((row) => row.status === "opportunity");
  const excellentMonth = input.monthlyRows.find((row) => row.status === "excellent");

  if (underperformingMonth) {
    recommendations.push({
      id: "underperforming-month",
      title: `${underperformingMonth.month} reste sous le niveau attendu`,
      detail: `${underperformingMonth.month} affiche ${underperformingMonth.occupancyRate} % d'occupation. Il faut tester un levier ciblé avant une baisse tarifaire globale.`,
      source: underperformingMonth.source,
    });
  }

  if (excellentMonth) {
    recommendations.push({
      id: "protect-high-season",
      title: `Ne pas casser les prix en ${excellentMonth.month}`,
      detail: `${excellentMonth.month} combine ${excellentMonth.occupancyRate} % d'occupation et un ADR de ${excellentMonth.adr} EUR. Le signal suggère de protéger la marge plutôt que de chercher plus de volume.`,
      source: excellentMonth.source,
    });
  }

  if (opportunityMonth) {
    recommendations.push({
      id: "rear-season-opportunity",
      title: `${opportunityMonth.month} présente encore un potentiel activable`,
      detail: `${opportunityMonth.month} reste lisible comme mois d'opportunité. Une action ciblée peut convertir une partie des ${input.overview.additionalNightsPotential} nuits potentielles encore non captées.`,
      source: opportunityMonth.source,
    });
  }

  recommendations.push({
    id: "annual-gap",
    title: "L'objectif annuel n'est pas encore atteint",
    detail: `Le logement se situe à ${input.overview.occupancyRate} % pour un objectif de ${input.overview.targetOccupancyRate} %. Le principal enjeu est d'améliorer le remplissage sans dégrader l'ADR moyen de ${input.overview.adr} EUR.`,
    source: "demo",
  });

  return recommendations.slice(0, 4);
}
