export type StrategyStatus = "draft" | "testing" | "active" | "archived";
export type FeatureAvailability = "included" | "limited" | "option" | "unavailable";
export type TimelineStage = "idea" | "testing" | "prototype" | "validation" | "production" | "abandoned";

export type BusinessProfile = { id: string; name: string };
export type BusinessOffer = { id: string; name: string; description: string; monthlyPrice: number; annualPrice: number; promotionalPrice: number; trialDays: number; commissionPct: number; displayOrder: number; color: string; badge: string; popularity: number; active: boolean; profileIds: string[] };
export type BusinessFeature = { id: string; name: string; description: string; availability: Record<string, FeatureAvailability> };
export type SimulatorInputs = { clients: number; conversionPct: number; monthlyGrowthPct: number; churnPct: number; stripePct: number; vatPct: number; cac: number; variableCostPerClient: number };
export type Competitor = { id: string; name: string; price: number; commissionPct: number; trial: string; features: string; strengths: string; weaknesses: string; positioning: string };
export type TimelineItem = { id: string; title: string; stage: TimelineStage; date: string; note: string };
export type DecisionItem = { id: string; date: string; author: string; reason: string; consequences: string; documents: string };
export type BusinessScores = { technicalComplexity: number; commercialClarity: number; revenuePotential: number; salesEase: number; maintenanceCost: number; scalability: number; risk: number };
export type BusinessStrategy = { id: string; name: string; description: string; status: StrategyStatus; favorite: boolean; createdAt: string; profiles: BusinessProfile[]; offers: BusinessOffer[]; features: BusinessFeature[]; simulator: SimulatorInputs; competitors: Competitor[]; timeline: TimelineItem[]; decisions: DecisionItem[]; scores: BusinessScores };

export const DEFAULT_SIMULATOR: SimulatorInputs = { clients: 0, conversionPct: 0, monthlyGrowthPct: 0, churnPct: 0, stripePct: 1.5, vatPct: 20, cac: 0, variableCostPerClient: 0 };
export const DEFAULT_SCORES: BusinessScores = { technicalComplexity: 50, commercialClarity: 50, revenuePotential: 50, salesEase: 50, maintenanceCost: 50, scalability: 50, risk: 50 };
export const availabilityLabels: Record<FeatureAvailability, string> = { included: "Inclus", limited: "Limité", option: "Option", unavailable: "Indisponible" };
export const timelineLabels: Record<TimelineStage, string> = { idea: "Idée", testing: "À tester", prototype: "Prototype", validation: "Validation", production: "Production", abandoned: "Abandonné" };

export function makeId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
export function createStrategy(name = "Nouvelle stratégie"): BusinessStrategy { return { id: makeId("strategy"), name, description: "", status: "draft", favorite: false, createdAt: new Date().toISOString(), profiles: [], offers: [], features: [], simulator: { ...DEFAULT_SIMULATOR }, competitors: [], timeline: [], decisions: [], scores: { ...DEFAULT_SCORES } }; }
export function formatMoney(value: number) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0); }