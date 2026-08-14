export type PricingStrategyType =
  | "profile_based"
  | "tier_based"
  | "hybrid"
  | "subscription_commission"
  | "per_property"
  | "per_user"
  | "freemium"
  | "addons"
  | "usage_based"
  | "enterprise";

export type PricingStrategyStatus =
  | "idea"
  | "under_review"
  | "simulating"
  | "ready_to_test"
  | "testing"
  | "validated"
  | "rejected"
  | "archived";

export type PricingOfferStatus =
  | "draft"
  | "hypothesis"
  | "simulation"
  | "pilot"
  | "active"
  | "archived";

export type PricingScenarioType = "cautious" | "realistic" | "ambitious";
export type PricingAssumptionSource = "real" | "hypothesis" | "simulation";

export type CandidatePricingTierId = "free" | "owner_pro" | "concierge_pro" | "business";

export type PricingProfile = {
  id: string;
  label: string;
  description: string;
};

export type PricingAssumption = {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  source: PricingAssumptionSource;
};

export type PricingScenario = {
  id: string;
  name: string;
  type: PricingScenarioType;
  assumptions: PricingAssumption[];
  projectedMrr: number;
  projectedArr: number;
  projectedGrossMarginPct: number;
};

export type PricingOffer = {
  id: string;
  name: string;
  targetProfileIds: string[];
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  annualDiscountRate: number | null;
  trialDays: number | null;
  includedProperties: number | null;
  includedUsers: number | null;
  includedMissions: number | null;
  commissionRate: number | null;
  modules: string[];
  features: string[];
  limits: string[];
  badge: string | null;
  displayOrder: number;
  status: PricingOfferStatus;
  source: PricingAssumptionSource;
  isExistingStripeOffer: boolean;
  isLockedProduction: boolean;
  stripePlanCode?: string;
};

export type PricingDecisionLogEntry = {
  id: string;
  date: string;
  decision: string;
  strategyType: PricingStrategyType | "shared";
  rationale: string;
  consequence: string;
  nextReview: string;
  status: "open" | "tracked" | "done";
};

export type PricingStrategy = {
  id: string;
  name: string;
  type: PricingStrategyType;
  description: string;
  targetProfileIds: string[];
  targetRevenue: string;
  complexityLabel: string;
  comprehensionLabel: string;
  implementationDelay: string;
  riskLabel: string;
  status: PricingStrategyStatus;
  priorityLabel: string;
  advantages: string[];
  risks: string[];
  offers: PricingOffer[];
  scenarios: PricingScenario[];
};

export type PricingRevenueTier = {
  id: CandidatePricingTierId;
  workingName: string;
  currentReferenceName?: string | null;
  nameStatus: "working" | "existing_reference";
  targetProfiles: string[];
  monthlyPrice: number;
  annualDiscountRate: number;
  features: string[];
  limits: string[];
  commissionRate: number;
  estimatedMonthlyCost: number;
  estimatedConversionRatePct: number;
  source: PricingAssumptionSource;
  notes?: string;
};

export type PricingRevenueScenario = {
  id: PricingScenarioType;
  label: string;
  subscribersByTier: Record<CandidatePricingTierId, number>;
  annualPlanMixPct: number;
  marketplaceGmvMonthly: number;
  notes: string;
  source: PricingAssumptionSource;
};
