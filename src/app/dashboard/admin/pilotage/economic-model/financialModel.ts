import { PRICING_REVENUE_TIERS } from "./data";
import type { CandidatePricingTierId, PricingRevenueTier } from "./types";

export type FinancialScenarioId = "prudent" | "central" | "ambitious";

export type FinancialAssumptions = {
  startingCash: number;
  newFreeClientsYear1: number;
  annualAcquisitionGrowthPct: number;
  freeToPaidConversionPct: number;
  monthlyPaidChurnPct: number;
  annualPlanMixPct: number;
  tierMixEssentialPct: number;
  tierMixProPct: number;
  tierMixBusinessPct: number;
  marketplaceActivePaidPct: number;
  marketplaceGmvPerActiveClientMonthly: number;
  marketplaceCommissionPct: number;
  servicesAttachRatePct: number;
  servicesRevenuePerClientMonthly: number;
  otherRevenueMonthly: number;
  developmentMonthly: number;
  hostingMonthly: number;
  supabaseMonthly: number;
  vercelMonthly: number;
  aiFixedMonthly: number;
  aiVariablePerPaidClientMonthly: number;
  paymentFeePct: number;
  marketingMonthly: number;
  freelancersMonthly: number;
  supportFixedMonthly: number;
  supportVariablePerPaidClientMonthly: number;
  legalMonthly: number;
  accountingMonthly: number;
  otherSaasMonthly: number;
};

export type FinancialScenarioDefinition = {
  id: FinancialScenarioId;
  label: string;
  source: "hypothesis" | "simulation";
  assumptions: FinancialAssumptions;
};

export type FinancialMonthResult = {
  monthIndex: number;
  year: number;
  monthOfYear: number;
  freeClients: number;
  paidClients: number;
  newFreeClients: number;
  newPaidClients: number;
  churnedClients: number;
  subscriptionMrr: number;
  marketplaceRevenue: number;
  servicesRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  directCosts: number;
  operatingCosts: number;
  totalCosts: number;
  grossMarginPct: number;
  netCashFlow: number;
  burnRate: number;
  cashBalance: number;
  cac: number;
  arpu: number;
  ltv: number;
  ltvToCac: number | null;
};

export type FinancialYearResult = {
  year: number;
  endingFreeClients: number;
  endingPaidClients: number;
  annualNewPaidClients: number;
  annualChurnedClients: number;
  endMrr: number;
  arr: number;
  annualRevenue: number;
  annualSubscriptionRevenue: number;
  annualMarketplaceRevenue: number;
  annualServicesRevenue: number;
  annualOtherRevenue: number;
  annualCosts: number;
  grossMarginPct: number;
  cac: number;
  arpu: number;
  ltv: number;
  ltvToCac: number | null;
  burnRate: number;
  runwayMonths: number | null;
  breakEvenReached: boolean;
  endingCashBalance: number;
};

export type FinancialScenarioResult = {
  scenario: FinancialScenarioDefinition;
  months: FinancialMonthResult[];
  years: FinancialYearResult[];
  breakEvenMonth: number | null;
  latest: FinancialYearResult;
};

function getTierPriceMap(tiers: PricingRevenueTier[]) {
  return Object.fromEntries(tiers.map((tier) => [tier.id, tier.monthlyPrice])) as Record<
    CandidatePricingTierId,
    number
  >;
}

function getAnnualDiscountMap(tiers: PricingRevenueTier[]) {
  return Object.fromEntries(tiers.map((tier) => [tier.id, tier.annualDiscountRate])) as Record<
    CandidatePricingTierId,
    number
  >;
}

function getEffectiveMonthlySubscriptionPrice(
  tierPrices: Record<CandidatePricingTierId, number>,
  annualDiscounts: Record<CandidatePricingTierId, number>,
  annualPlanMixPct: number,
  assumptions: FinancialAssumptions,
) {
  const annualMix = annualPlanMixPct / 100;
  const ownerProPrice =
    tierPrices.owner_pro * (1 - annualMix * (annualDiscounts.owner_pro / 100));
  const conciergeProPrice =
    tierPrices.concierge_pro * (1 - annualMix * (annualDiscounts.concierge_pro / 100));
  const businessPrice =
    tierPrices.business * (1 - annualMix * (annualDiscounts.business / 100));

  return (
    ownerProPrice * (assumptions.tierMixEssentialPct / 100) +
    conciergeProPrice * (assumptions.tierMixProPct / 100) +
    businessPrice * (assumptions.tierMixBusinessPct / 100)
  );
}

export const DEFAULT_FINANCIAL_SCENARIOS: FinancialScenarioDefinition[] = [
  {
    id: "prudent",
    label: "Prudent",
    source: "simulation",
    assumptions: {
      startingCash: 0,
      newFreeClientsYear1: 180,
      annualAcquisitionGrowthPct: 20,
      freeToPaidConversionPct: 3.5,
      monthlyPaidChurnPct: 4.5,
      annualPlanMixPct: 10,
      tierMixEssentialPct: 70,
      tierMixProPct: 25,
      tierMixBusinessPct: 5,
      marketplaceActivePaidPct: 18,
      marketplaceGmvPerActiveClientMonthly: 350,
      marketplaceCommissionPct: 8,
      servicesAttachRatePct: 6,
      servicesRevenuePerClientMonthly: 40,
      otherRevenueMonthly: 0,
      developmentMonthly: 3500,
      hostingMonthly: 120,
      supabaseMonthly: 80,
      vercelMonthly: 40,
      aiFixedMonthly: 0,
      aiVariablePerPaidClientMonthly: 1,
      paymentFeePct: 2.9,
      marketingMonthly: 500,
      freelancersMonthly: 400,
      supportFixedMonthly: 250,
      supportVariablePerPaidClientMonthly: 2,
      legalMonthly: 120,
      accountingMonthly: 140,
      otherSaasMonthly: 150,
    },
  },
  {
    id: "central",
    label: "Central",
    source: "simulation",
    assumptions: {
      startingCash: 0,
      newFreeClientsYear1: 320,
      annualAcquisitionGrowthPct: 32,
      freeToPaidConversionPct: 5.5,
      monthlyPaidChurnPct: 3.2,
      annualPlanMixPct: 18,
      tierMixEssentialPct: 58,
      tierMixProPct: 30,
      tierMixBusinessPct: 12,
      marketplaceActivePaidPct: 28,
      marketplaceGmvPerActiveClientMonthly: 550,
      marketplaceCommissionPct: 8,
      servicesAttachRatePct: 10,
      servicesRevenuePerClientMonthly: 55,
      otherRevenueMonthly: 0,
      developmentMonthly: 4500,
      hostingMonthly: 160,
      supabaseMonthly: 120,
      vercelMonthly: 60,
      aiFixedMonthly: 50,
      aiVariablePerPaidClientMonthly: 1.8,
      paymentFeePct: 2.9,
      marketingMonthly: 900,
      freelancersMonthly: 700,
      supportFixedMonthly: 350,
      supportVariablePerPaidClientMonthly: 2.5,
      legalMonthly: 150,
      accountingMonthly: 180,
      otherSaasMonthly: 220,
    },
  },
  {
    id: "ambitious",
    label: "Ambitieux",
    source: "simulation",
    assumptions: {
      startingCash: 0,
      newFreeClientsYear1: 520,
      annualAcquisitionGrowthPct: 45,
      freeToPaidConversionPct: 7.5,
      monthlyPaidChurnPct: 2.4,
      annualPlanMixPct: 28,
      tierMixEssentialPct: 48,
      tierMixProPct: 34,
      tierMixBusinessPct: 18,
      marketplaceActivePaidPct: 38,
      marketplaceGmvPerActiveClientMonthly: 800,
      marketplaceCommissionPct: 8,
      servicesAttachRatePct: 14,
      servicesRevenuePerClientMonthly: 70,
      otherRevenueMonthly: 150,
      developmentMonthly: 6500,
      hostingMonthly: 220,
      supabaseMonthly: 170,
      vercelMonthly: 90,
      aiFixedMonthly: 120,
      aiVariablePerPaidClientMonthly: 2.5,
      paymentFeePct: 2.9,
      marketingMonthly: 1600,
      freelancersMonthly: 1100,
      supportFixedMonthly: 500,
      supportVariablePerPaidClientMonthly: 3.2,
      legalMonthly: 220,
      accountingMonthly: 250,
      otherSaasMonthly: 320,
    },
  },
];

export function computeFinancialScenario(
  scenario: FinancialScenarioDefinition,
  tiers: PricingRevenueTier[] = PRICING_REVENUE_TIERS,
  years = 5,
): FinancialScenarioResult {
  const tierPrices = getTierPriceMap(tiers);
  const annualDiscounts = getAnnualDiscountMap(tiers);
  const assumptions = scenario.assumptions;

  let freeClients = 0;
  let paidClients = 0;
  let cashBalance = assumptions.startingCash;
  let breakEvenMonth: number | null = null;
  const months: FinancialMonthResult[] = [];

  for (let monthIndex = 1; monthIndex <= years * 12; monthIndex += 1) {
    const year = Math.ceil(monthIndex / 12);
    const monthOfYear = ((monthIndex - 1) % 12) + 1;
    const annualFreeClients =
      assumptions.newFreeClientsYear1 *
      Math.pow(1 + assumptions.annualAcquisitionGrowthPct / 100, year - 1);
    const newFreeClients = annualFreeClients / 12;
    const newPaidClients = freeClients * (assumptions.freeToPaidConversionPct / 100);
    const churnedClients = paidClients * (assumptions.monthlyPaidChurnPct / 100);

    freeClients = Math.max(0, freeClients + newFreeClients - newPaidClients);
    paidClients = Math.max(0, paidClients + newPaidClients - churnedClients);

    const effectivePrice = getEffectiveMonthlySubscriptionPrice(
      tierPrices,
      annualDiscounts,
      assumptions.annualPlanMixPct,
      assumptions,
    );

    const subscriptionMrr = paidClients * effectivePrice;
    const marketplaceRevenue =
      paidClients *
      (assumptions.marketplaceActivePaidPct / 100) *
      assumptions.marketplaceGmvPerActiveClientMonthly *
      (assumptions.marketplaceCommissionPct / 100);
    const servicesRevenue =
      paidClients *
      (assumptions.servicesAttachRatePct / 100) *
      assumptions.servicesRevenuePerClientMonthly;
    const otherRevenue = assumptions.otherRevenueMonthly;
    const totalRevenue = subscriptionMrr + marketplaceRevenue + servicesRevenue + otherRevenue;

    const directCosts =
      assumptions.hostingMonthly +
      assumptions.supabaseMonthly +
      assumptions.vercelMonthly +
      assumptions.aiFixedMonthly +
      paidClients * assumptions.aiVariablePerPaidClientMonthly +
      totalRevenue * (assumptions.paymentFeePct / 100) +
      assumptions.supportFixedMonthly +
      paidClients * assumptions.supportVariablePerPaidClientMonthly;
    const operatingCosts =
      assumptions.developmentMonthly +
      assumptions.marketingMonthly +
      assumptions.freelancersMonthly +
      assumptions.legalMonthly +
      assumptions.accountingMonthly +
      assumptions.otherSaasMonthly;
    const totalCosts = directCosts + operatingCosts;
    const grossMarginPct = totalRevenue > 0 ? ((totalRevenue - directCosts) / totalRevenue) * 100 : 0;
    const netCashFlow = totalRevenue - totalCosts;
    const burnRate = Math.max(0, -netCashFlow);
    cashBalance += netCashFlow;
    if (breakEvenMonth === null && totalRevenue >= totalCosts) {
      breakEvenMonth = monthIndex;
    }
    const cac = newPaidClients > 0 ? assumptions.marketingMonthly / newPaidClients : 0;
    const arpu = paidClients > 0 ? totalRevenue / paidClients : 0;
    const ltv =
      assumptions.monthlyPaidChurnPct > 0
        ? arpu * (grossMarginPct / 100) / (assumptions.monthlyPaidChurnPct / 100)
        : 0;
    const ltvToCac = cac > 0 ? ltv / cac : null;

    months.push({
      monthIndex,
      year,
      monthOfYear,
      freeClients,
      paidClients,
      newFreeClients,
      newPaidClients,
      churnedClients,
      subscriptionMrr,
      marketplaceRevenue,
      servicesRevenue,
      otherRevenue,
      totalRevenue,
      directCosts,
      operatingCosts,
      totalCosts,
      grossMarginPct,
      netCashFlow,
      burnRate,
      cashBalance,
      cac,
      arpu,
      ltv,
      ltvToCac,
    });
  }

  const yearResults: FinancialYearResult[] = [];

  for (let year = 1; year <= years; year += 1) {
    const yearMonths = months.filter((month) => month.year === year);
    const lastMonth = yearMonths[yearMonths.length - 1];
    const annualRevenue = yearMonths.reduce((total, month) => total + month.totalRevenue, 0);
    const annualSubscriptionRevenue = yearMonths.reduce(
      (total, month) => total + month.subscriptionMrr,
      0,
    );
    const annualMarketplaceRevenue = yearMonths.reduce(
      (total, month) => total + month.marketplaceRevenue,
      0,
    );
    const annualServicesRevenue = yearMonths.reduce(
      (total, month) => total + month.servicesRevenue,
      0,
    );
    const annualOtherRevenue = yearMonths.reduce((total, month) => total + month.otherRevenue, 0);
    const annualCosts = yearMonths.reduce((total, month) => total + month.totalCosts, 0);
    const annualNewPaidClients = yearMonths.reduce(
      (total, month) => total + month.newPaidClients,
      0,
    );
    const annualChurnedClients = yearMonths.reduce(
      (total, month) => total + month.churnedClients,
      0,
    );
    const annualDirectCosts = yearMonths.reduce((total, month) => total + month.directCosts, 0);
    const averageBurnRate =
      yearMonths.reduce((total, month) => total + month.burnRate, 0) / yearMonths.length;
    const annualGrossMarginPct =
      annualRevenue > 0 ? ((annualRevenue - annualDirectCosts) / annualRevenue) * 100 : 0;
    const runwayMonths =
      averageBurnRate > 0 && lastMonth.cashBalance > 0 ? lastMonth.cashBalance / averageBurnRate : null;
    const averageCac =
      annualNewPaidClients > 0
        ? (scenario.assumptions.marketingMonthly * 12) / annualNewPaidClients
        : 0;
    const arpu = lastMonth.paidClients > 0 ? lastMonth.totalRevenue / lastMonth.paidClients : 0;
    const ltv =
      scenario.assumptions.monthlyPaidChurnPct > 0
        ? arpu * (annualGrossMarginPct / 100) / (scenario.assumptions.monthlyPaidChurnPct / 100)
        : 0;
    const ltvToCac = averageCac > 0 ? ltv / averageCac : null;

    yearResults.push({
      year,
      endingFreeClients: lastMonth.freeClients,
      endingPaidClients: lastMonth.paidClients,
      annualNewPaidClients,
      annualChurnedClients,
      endMrr: lastMonth.totalRevenue,
      arr: lastMonth.totalRevenue * 12,
      annualRevenue,
      annualSubscriptionRevenue,
      annualMarketplaceRevenue,
      annualServicesRevenue,
      annualOtherRevenue,
      annualCosts,
      grossMarginPct: annualGrossMarginPct,
      cac: averageCac,
      arpu,
      ltv,
      ltvToCac,
      burnRate: averageBurnRate,
      runwayMonths,
      breakEvenReached: yearMonths.some((month) => month.totalRevenue >= month.totalCosts),
      endingCashBalance: lastMonth.cashBalance,
    });
  }

  return {
    scenario,
    months,
    years: yearResults,
    breakEvenMonth,
    latest: yearResults[yearResults.length - 1],
  };
}
