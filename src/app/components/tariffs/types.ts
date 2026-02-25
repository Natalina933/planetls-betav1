export interface SeasonalPricingConfig {
  checkInFee: number;
  checkOutFee: number;
  cleaningStudioFee: number;
  cleaningTwoRoomsFee: number;
  linenKitFee: number;
  welcomePackFee: number;
  urgentPercent: number;
  nightPercent: number;
  weekendPercent: number;
  highSeasonPercent: number;
  extraKmFee: number;
  minimumInvoice: number;
}

export type PricingModifierKey =
  | "urgentPercent"
  | "nightPercent"
  | "weekendPercent"
  | "highSeasonPercent";

export interface PricingBaseConfig {
  hourlyRate: number;
  travelFee: number;
  minimumInvoice: number;
}

export interface PricingGlobalModifiers {
  urgentPercent: number;
  nightPercent: number;
  weekendPercent: number;
  highSeasonPercent: number;
}

export interface PricingOverrideValue {
  mode: "replace" | "delta";
  value: number;
}

export interface PricingBaseOverrideConfig {
  mode: "replace" | "delta";
  hourlyRate?: number;
  travelFee?: number;
  minimumInvoice?: number;
}

export interface PricingServiceOverride {
  enabled: boolean;
  pricingType?: "hourly" | "fixed";
  baseOverride?: PricingBaseOverrideConfig;
  modifierOverride?: Partial<Record<PricingModifierKey, PricingOverrideValue>>;
  priority?: number;
}

export interface PricingRuleScope {
  serviceId?: string | null;
  propertyType?: string | null;
  isUrgent?: boolean;
  isNight?: boolean;
  isWeekend?: boolean;
  isHighSeason?: boolean;
}

export interface PricingRuleAdjustments {
  flatAmount?: number;
  multiplier?: number;
  minimumInvoice?: number;
  modifierDelta?: Partial<Record<PricingModifierKey, number>>;
}

export interface PricingContextRule {
  id: string;
  enabled: boolean;
  priority: number;
  scope: PricingRuleScope;
  adjustments: PricingRuleAdjustments;
}

export interface PricingV2Config {
  version: 2;
  currency: string;
  base: PricingBaseConfig;
  globalModifiers: PricingGlobalModifiers;
  serviceOverrides: Record<string, PricingServiceOverride>;
  contextRules: PricingContextRule[];
}
