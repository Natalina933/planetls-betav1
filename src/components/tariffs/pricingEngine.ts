import type {
  PricingBaseConfig,
  PricingContextRule,
  PricingGlobalModifiers,
  PricingModifierKey,
  PricingV2Config,
  SeasonalPricingConfig,
} from "./types";

export interface PricingFallbackInput {
  hourlyRate: number;
  travelFee: number;
  seasonalPricing: SeasonalPricingConfig;
  currency?: string;
}

export interface PricingCalculationContext {
  serviceId?: string | null;
  propertyType?: string | null;
  durationHours?: number;
  fixedFees?: number;
  isUrgent?: boolean;
  isNight?: boolean;
  isWeekend?: boolean;
  isHighSeason?: boolean;
}

export interface PricingComputationResult {
  baseAmount: number;
  modifierPercentTotal: number;
  totalBeforeMinimum: number;
  minimumInvoice: number;
  total: number;
  appliedRules: string[];
  appliedModifiers: PricingGlobalModifiers;
}

const toNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clampPercent = (value: number): number => Math.max(-100, Math.min(500, value));

const defaultGlobalModifiers = (
  seasonalPricing: SeasonalPricingConfig,
): PricingGlobalModifiers => ({
  urgentPercent: seasonalPricing.urgentPercent,
  nightPercent: seasonalPricing.nightPercent,
  weekendPercent: seasonalPricing.weekendPercent,
  highSeasonPercent: seasonalPricing.highSeasonPercent,
});

const defaultBaseConfig = (
  hourlyRate: number,
  travelFee: number,
  seasonalPricing: SeasonalPricingConfig,
): PricingBaseConfig => ({
  hourlyRate: Math.max(0, hourlyRate),
  travelFee: Math.max(0, travelFee),
  minimumInvoice: Math.max(0, seasonalPricing.minimumInvoice),
});

export const createPricingV2FromLegacy = (
  fallback: PricingFallbackInput,
): PricingV2Config => ({
  version: 2,
  currency: fallback.currency ?? "EUR",
  base: defaultBaseConfig(
    fallback.hourlyRate,
    fallback.travelFee,
    fallback.seasonalPricing,
  ),
  globalModifiers: defaultGlobalModifiers(fallback.seasonalPricing),
  serviceOverrides: {},
  contextRules: [],
});

export const parsePricingV2FromAvailabilityHours = (
  availabilityHours: string | null | undefined,
  fallback: PricingFallbackInput,
): PricingV2Config => {
  const legacy = createPricingV2FromLegacy(fallback);
  if (!availabilityHours) return legacy;

  try {
    const raw = JSON.parse(availabilityHours) as Record<string, unknown>;
    const candidate = raw?.pricing_v2;
    if (!candidate || typeof candidate !== "object") return legacy;

    const c = candidate as Record<string, unknown>;
    const baseRaw =
      c.base && typeof c.base === "object" ? (c.base as Record<string, unknown>) : {};
    const modifiersRaw =
      c.globalModifiers && typeof c.globalModifiers === "object"
        ? (c.globalModifiers as Record<string, unknown>)
        : {};

    const contextRulesRaw = Array.isArray(c.contextRules) ? c.contextRules : [];
    const serviceOverridesRaw =
      c.serviceOverrides && typeof c.serviceOverrides === "object"
        ? (c.serviceOverrides as Record<string, unknown>)
        : {};

    const contextRules: PricingContextRule[] = contextRulesRaw
      .filter((rule): rule is Record<string, unknown> => Boolean(rule) && typeof rule === "object")
      .map((rule, index) => ({
        id: typeof rule.id === "string" ? rule.id : `rule_${index + 1}`,
        enabled: rule.enabled !== false,
        priority: Math.max(0, Math.floor(toNumber(rule.priority, 100))),
        scope:
          rule.scope && typeof rule.scope === "object"
            ? (rule.scope as PricingContextRule["scope"])
            : {},
        adjustments:
          rule.adjustments && typeof rule.adjustments === "object"
            ? (rule.adjustments as PricingContextRule["adjustments"])
            : {},
      }));

    return {
      version: 2,
      currency: typeof c.currency === "string" ? c.currency : legacy.currency,
      base: {
        hourlyRate: Math.max(0, toNumber(baseRaw.hourlyRate, legacy.base.hourlyRate)),
        travelFee: Math.max(0, toNumber(baseRaw.travelFee, legacy.base.travelFee)),
        minimumInvoice: Math.max(
          0,
          toNumber(baseRaw.minimumInvoice, legacy.base.minimumInvoice),
        ),
      },
      globalModifiers: {
        urgentPercent: clampPercent(
          toNumber(modifiersRaw.urgentPercent, legacy.globalModifiers.urgentPercent),
        ),
        nightPercent: clampPercent(
          toNumber(modifiersRaw.nightPercent, legacy.globalModifiers.nightPercent),
        ),
        weekendPercent: clampPercent(
          toNumber(modifiersRaw.weekendPercent, legacy.globalModifiers.weekendPercent),
        ),
        highSeasonPercent: clampPercent(
          toNumber(
            modifiersRaw.highSeasonPercent,
            legacy.globalModifiers.highSeasonPercent,
          ),
        ),
      },
      serviceOverrides: serviceOverridesRaw as PricingV2Config["serviceOverrides"],
      contextRules,
    };
  } catch {
    return legacy;
  }
};

const scopeMatches = (ctx: PricingCalculationContext, rule: PricingContextRule): boolean => {
  const scope = rule.scope;
  if (scope.serviceId != null && scope.serviceId !== ctx.serviceId) return false;
  if (scope.propertyType != null && scope.propertyType !== ctx.propertyType) return false;
  if (scope.isUrgent != null && scope.isUrgent !== Boolean(ctx.isUrgent)) return false;
  if (scope.isNight != null && scope.isNight !== Boolean(ctx.isNight)) return false;
  if (scope.isWeekend != null && scope.isWeekend !== Boolean(ctx.isWeekend)) return false;
  if (scope.isHighSeason != null && scope.isHighSeason !== Boolean(ctx.isHighSeason))
    return false;
  return true;
};

const applyModifierOverride = (
  current: number,
  override: { mode: "replace" | "delta"; value: number } | undefined,
): number => {
  if (!override) return current;
  return override.mode === "replace" ? override.value : current + override.value;
};

export const computeMissionPrice = (
  pricingV2: PricingV2Config,
  context: PricingCalculationContext,
): PricingComputationResult => {
  const durationHours = Math.max(0, context.durationHours ?? 0);
  const fixedFees = Math.max(0, context.fixedFees ?? 0);

  const base: PricingBaseConfig = { ...pricingV2.base };
  const modifiers: PricingGlobalModifiers = { ...pricingV2.globalModifiers };
  const appliedRules: string[] = [];
  let servicePricingType: "hourly" | "fixed" = "hourly";

  const serviceOverride =
    context.serviceId ? pricingV2.serviceOverrides[context.serviceId] : undefined;
  if (serviceOverride?.enabled) {
    if (serviceOverride.pricingType === "fixed") {
      servicePricingType = "fixed";
    }

    const baseOverride = serviceOverride.baseOverride;
    if (baseOverride) {
      const mode = baseOverride.mode;
      if (typeof baseOverride.hourlyRate === "number") {
        base.hourlyRate =
          mode === "replace"
            ? baseOverride.hourlyRate
            : base.hourlyRate + baseOverride.hourlyRate;
      }
      if (typeof baseOverride.travelFee === "number") {
        base.travelFee =
          mode === "replace"
            ? baseOverride.travelFee
            : base.travelFee + baseOverride.travelFee;
      }
      if (typeof baseOverride.minimumInvoice === "number") {
        base.minimumInvoice =
          mode === "replace"
            ? baseOverride.minimumInvoice
            : base.minimumInvoice + baseOverride.minimumInvoice;
      }
    }

    if (serviceOverride.modifierOverride) {
      (Object.keys(serviceOverride.modifierOverride) as PricingModifierKey[]).forEach((key) => {
        modifiers[key] = applyModifierOverride(
          modifiers[key],
          serviceOverride.modifierOverride?.[key],
        );
      });
    }
  }

  let workingMinimum = Math.max(0, base.minimumInvoice);
  let flatAmount = 0;
  let multiplier = 1;

  const matchedRules = pricingV2.contextRules
    .filter((rule) => rule.enabled)
    .filter((rule) => scopeMatches(context, rule))
    .sort((a, b) => a.priority - b.priority);

  matchedRules.forEach((rule) => {
    appliedRules.push(rule.id);
    const adjustments = rule.adjustments ?? {};

    if (typeof adjustments.flatAmount === "number") {
      flatAmount += adjustments.flatAmount;
    }
    if (typeof adjustments.multiplier === "number") {
      multiplier *= adjustments.multiplier;
    }
    if (typeof adjustments.minimumInvoice === "number") {
      workingMinimum = adjustments.minimumInvoice;
    }
    if (adjustments.modifierDelta) {
      (Object.keys(adjustments.modifierDelta) as PricingModifierKey[]).forEach((key) => {
        const delta = adjustments.modifierDelta?.[key];
        if (typeof delta === "number") {
          modifiers[key] += delta;
        }
      });
    }
  });

  const baseAmount =
    servicePricingType === "fixed"
      ? Math.max(0, base.hourlyRate) + Math.max(0, base.travelFee) + fixedFees
      : Math.max(0, base.hourlyRate) * durationHours + Math.max(0, base.travelFee) + fixedFees;

  const modifierPercentTotal =
    (context.isUrgent ? modifiers.urgentPercent : 0) +
    (context.isNight ? modifiers.nightPercent : 0) +
    (context.isWeekend ? modifiers.weekendPercent : 0) +
    (context.isHighSeason ? modifiers.highSeasonPercent : 0);

  const totalBeforeMinimum =
    (baseAmount * (1 + modifierPercentTotal / 100) + flatAmount) * multiplier;

  const minimumInvoice = Math.max(0, workingMinimum);
  const total = Math.max(totalBeforeMinimum, minimumInvoice);

  return {
    baseAmount,
    modifierPercentTotal,
    totalBeforeMinimum,
    minimumInvoice,
    total,
    appliedRules,
    appliedModifiers: modifiers,
  };
};
