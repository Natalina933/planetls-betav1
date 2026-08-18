export type PerformanceDataSource = "real" | "estimated" | "demo" | "future";

export type PerformanceMonthlyStatus =
  | "excellent"
  | "good"
  | "watch"
  | "opportunity"
  | "underperforming";

export type PerformanceKpiCard = {
  label: string;
  value: string;
  hint: string;
  source: PerformanceDataSource;
};

export type PerformanceMonthlyRow = {
  month: string;
  occupancyRate: number;
  adr: number;
  grossRevenue: number;
  netRevenue: number;
  status: PerformanceMonthlyStatus;
  source: PerformanceDataSource;
};

export type ProfitabilityBreakdownRow = {
  label: string;
  amount: number;
  source: PerformanceDataSource;
  emphasis?: "positive" | "negative" | "neutral";
};

export type PerformanceScenarioInput = {
  label: string;
  targetOccupancyRate: number;
  adr: number;
};

export type PerformanceScenarioResult = {
  label: string;
  targetOccupancyRate: number;
  bookedNights: number;
  adr: number;
  grossRevenue: number;
  additionalNights: number;
  additionalRevenue: number;
  platformFees: number;
  cleaningCost: number;
  conciergeCost: number;
  consumablesCost: number;
  otherVariableCosts: number;
  netRevenue: number;
  marginRate: number;
  source: PerformanceDataSource;
};

export type OpportunityMonth = {
  month: string;
  tone: PerformanceMonthlyStatus;
  message: string;
  source: PerformanceDataSource;
};

export type PerformanceRecommendation = {
  id: string;
  title: string;
  detail: string;
  source: PerformanceDataSource;
};

export type PerformanceFeatureBucket = {
  label: "MVP" | "V1" | "V2";
  items: string[];
};

export type PerformanceDataAuditSection = {
  title: string;
  items: string[];
};

export type PerformanceModuleStatus = {
  status: string;
  priority: string;
  businessValue: string;
  technicalComplexity: string;
  dependencies: string[];
  requiredData: string[];
  personas: string[];
  monetizationHypothesis: string;
};

export type PerformanceOverview = {
  availableNights: number;
  bookedNights: number;
  blockedNights: number;
  occupancyRate: number;
  targetOccupancyRate: number;
  targetBookedNights: number;
  additionalNightsPotential: number;
  adr: number;
  grossRevenue: number;
  platformFees: number;
  conciergeCost: number;
  cleaningCost: number;
  consumablesCost: number;
  otherVariableCosts: number;
  netRevenue: number;
  marginRate: number;
  revpar: number;
  annualObjectiveRevenue: number;
  annualObjectiveProgressRate: number;
  source: PerformanceDataSource;
};

export type PerformancePilotModule = {
  title: string;
  valueChain: string[];
  overview: PerformanceOverview;
  kpis: PerformanceKpiCard[];
  monthlyRows: PerformanceMonthlyRow[];
  profitabilityRows: ProfitabilityBreakdownRow[];
  scenarios: PerformanceScenarioResult[];
  opportunityCalendar: OpportunityMonth[];
  recommendations: PerformanceRecommendation[];
  featureBuckets: PerformanceFeatureBucket[];
  testsToRun: string[];
  openQuestions: string[];
  risks: string[];
  decisions: string[];
  nextActions: string[];
  dataAudit: PerformanceDataAuditSection[];
  status: PerformanceModuleStatus;
};
