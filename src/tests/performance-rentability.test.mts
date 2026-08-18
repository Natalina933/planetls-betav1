import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPerformanceRecommendations,
  buildScenarioResult,
  computeMarginRate,
  computeOccupancyRate,
  computePotentialAdditionalNights,
  computeRevPar,
} from "../app/dashboard/admin/(business)/pilotage/performance-rentabilite/calculations.ts";

test("les calculs de performance renvoient des métriques cohérentes", () => {
  assert.equal(computeOccupancyRate(130, 364), 35.7);
  assert.equal(computePotentialAdditionalNights(130, 364, 45), 34);
  assert.equal(computeRevPar(13000, 364), 35.71);
  assert.equal(computeMarginRate(6560, 13000), 50.5);
});

test("le simulateur montre qu'un taux d'occupation plus élevé n'est pas forcément le plus rentable", () => {
  const baseConfig = {
    availableNights: 364,
    currentBookedNights: 130,
    platformFeeRate: 0.12,
    cleaningCostPerNight: 9,
    conciergeCostPerNight: 18,
    consumablesCostPerNight: 3,
    otherVariableCostPerNight: 4,
  };

  const scenarioA = buildScenarioResult({ label: "A", targetOccupancyRate: 45, adr: 105 }, baseConfig);
  const scenarioC = buildScenarioResult({ label: "C", targetOccupancyRate: 55, adr: 75 }, baseConfig);

  assert.equal(scenarioC.targetOccupancyRate > scenarioA.targetOccupancyRate, true);
  assert.equal(scenarioA.netRevenue > scenarioC.netRevenue, true);
});

test("les recommandations mettent en avant les mois faibles et les mois à protéger", () => {
  const recommendations = buildPerformanceRecommendations({
    overview: {
      occupancyRate: 35.7,
      targetOccupancyRate: 45,
      additionalNightsPotential: 34,
      adr: 100,
    },
    monthlyRows: [
      { month: "Mai", occupancyRate: 28, adr: 88, grossRevenue: 1760, netRevenue: 842, status: "underperforming", source: "demo" },
      { month: "Août", occupancyRate: 92, adr: 145, grossRevenue: 6380, netRevenue: 3689, status: "excellent", source: "demo" },
      { month: "Septembre", occupancyRate: 38, adr: 98, grossRevenue: 2744, netRevenue: 1416, status: "opportunity", source: "demo" },
    ],
  });

  assert.equal(recommendations.some((item) => item.title.includes("Mai")), true);
  assert.equal(recommendations.some((item) => item.title.includes("Août")), true);
  assert.equal(recommendations.some((item) => item.title.includes("Septembre")), true);
});
