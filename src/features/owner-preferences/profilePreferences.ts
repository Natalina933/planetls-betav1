import {
  getServiceRequestBriefDefaults,
  inferRequestTypeFromCollaboration,
  OWNER_REQUEST_GOAL_OPTIONS,
  type OwnerCollaborationType,
  type OwnerRequestFrequency,
  type OwnerRequestGoal,
  type OwnerResponsibilityLevel,
} from "../../app/lib/serviceRequestBrief.ts";

const OWNER_REQUEST_GOALS: OwnerRequestGoal[] = [
  "find_concierge",
  "one_off_quote",
  "compare_concierges",
  "replace_current",
  "delegate_tasks",
  "prepare_listing",
  "regular_support",
];

const OWNER_COLLABORATION_TYPES: OwnerCollaborationType[] = [
  "one_off",
  "regular",
  "full_management",
  "partial_management",
  "temporary_replacement",
  "trial",
  "onboarding",
];

const OWNER_REQUEST_FREQUENCIES: OwnerRequestFrequency[] = [
  "once",
  "weekly",
  "monthly",
  "seasonal",
  "year_round",
  "unknown",
];

const OWNER_RESPONSIBILITY_LEVELS: OwnerResponsibilityLevel[] = [
  "low",
  "shared",
  "full",
  "unknown",
];

export type OwnerOnboardingManagementMode = "autonomous" | "supported" | "full_delegation";

export type OwnerOnboardingNeed =
  | "check_in"
  | "check_out"
  | "cleaning"
  | "linen"
  | "maintenance"
  | "traveler_messages"
  | "full_management"
  | "other";

export type OwnerOnboardingSituation =
  | "first_rental"
  | "already_renting"
  | "looking_for_professional"
  | "already_with_professional";

export type OwnerOnboardingHelpFrequency = "occasional" | "regular" | "very_regular";

export type OwnerOnboardingRequestOrg = "bookings" | "regular" | "both";

export type OwnerOnboardingBillingPref = "per_mission" | "monthly" | "both";

export type OwnerOnboardingProOrg = "main_professional" | "multiple_professionals" | "depending_on_needs";

export type OwnerOnboardingV1 = {
  managementMode: OwnerOnboardingManagementMode | null;
  needs: OwnerOnboardingNeed[];
  situation: OwnerOnboardingSituation | null;
  helpFrequency: OwnerOnboardingHelpFrequency | null;
  requestOrg: OwnerOnboardingRequestOrg | null;
  billingPref: OwnerOnboardingBillingPref | null;
  proOrg: OwnerOnboardingProOrg | null;
};

export type OwnerProfilePreferences = {
  ownerGoal: OwnerRequestGoal;
  collaborationType: OwnerCollaborationType;
  frequency: OwnerRequestFrequency;
  estimatedDuration: string;
  responsibilityLevel: OwnerResponsibilityLevel;
  propertyType: string;
  needVolume: string;
  operatingContext: string;
  recurringExpectations: string;
  firstRequestTemplate: string;
  propertyTypes: string[];
  ownerOnboardingV1: OwnerOnboardingV1 | null;
};

export type OwnerOnboardingProgress = {
  completed: number;
  total: 3;
  isComplete: boolean;
  nextStep: "project" | "housing" | "organization" | "complete";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readObject(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readEnum<Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  fallback: Value,
): Value {
  return typeof value === "string" && allowed.includes(value as Value)
    ? (value as Value)
    : fallback;
}

const OWNER_ONBOARDING_MANAGEMENT_MODES: readonly OwnerOnboardingManagementMode[] = [
  "autonomous",
  "supported",
  "full_delegation",
];

const OWNER_ONBOARDING_NEEDS: readonly OwnerOnboardingNeed[] = [
  "check_in",
  "check_out",
  "cleaning",
  "linen",
  "maintenance",
  "traveler_messages",
  "full_management",
  "other",
];

const OWNER_ONBOARDING_SITUATIONS: readonly OwnerOnboardingSituation[] = [
  "first_rental",
  "already_renting",
  "looking_for_professional",
  "already_with_professional",
];

const OWNER_ONBOARDING_HELP_FREQUENCIES: readonly OwnerOnboardingHelpFrequency[] = [
  "occasional",
  "regular",
  "very_regular",
];

const OWNER_ONBOARDING_REQUEST_ORGS: readonly OwnerOnboardingRequestOrg[] = ["bookings", "regular", "both"];

const OWNER_ONBOARDING_BILLING_PREFS: readonly OwnerOnboardingBillingPref[] = [
  "per_mission",
  "monthly",
  "both",
];

const OWNER_ONBOARDING_PRO_ORGS: readonly OwnerOnboardingProOrg[] = [
  "main_professional",
  "multiple_professionals",
  "depending_on_needs",
];

export const EMPTY_OWNER_ONBOARDING_V1: OwnerOnboardingV1 = {
  managementMode: null,
  needs: [],
  situation: null,
  helpFrequency: null,
  requestOrg: null,
  billingPref: null,
  proOrg: null,
};

function readNullableEnum<Value extends string>(
  value: unknown,
  allowed: readonly Value[],
): Value | null {
  return typeof value === "string" && allowed.includes(value as Value) ? (value as Value) : null;
}

function readOnboardingNeedList(value: unknown): OwnerOnboardingNeed[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(OWNER_ONBOARDING_NEEDS);
  const selected: OwnerOnboardingNeed[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed && allowed.has(trimmed) && !selected.includes(trimmed as OwnerOnboardingNeed)) {
      selected.push(trimmed as OwnerOnboardingNeed);
    }
  }
  return selected;
}

export function parseOwnerOnboardingV1(value: unknown): OwnerOnboardingV1 | null {
  if (!isRecord(value)) return null;
  const hasAnyKey =
    "managementMode" in value ||
    "needs" in value ||
    "situation" in value ||
    "helpFrequency" in value ||
    "requestOrg" in value ||
    "billingPref" in value ||
    "proOrg" in value;
  if (!hasAnyKey) return null;

  return {
    managementMode: readNullableEnum(value.managementMode, OWNER_ONBOARDING_MANAGEMENT_MODES),
    needs: readOnboardingNeedList(value.needs),
    situation: readNullableEnum(value.situation, OWNER_ONBOARDING_SITUATIONS),
    helpFrequency: readNullableEnum(value.helpFrequency, OWNER_ONBOARDING_HELP_FREQUENCIES),
    requestOrg: readNullableEnum(value.requestOrg, OWNER_ONBOARDING_REQUEST_ORGS),
    billingPref: readNullableEnum(value.billingPref, OWNER_ONBOARDING_BILLING_PREFS),
    proOrg: readNullableEnum(value.proOrg, OWNER_ONBOARDING_PRO_ORGS),
  };
}

export function getOwnerOnboardingProgress(
  onboarding: OwnerOnboardingV1 | null | undefined,
): OwnerOnboardingProgress {
  const projectComplete = Boolean(onboarding?.managementMode && onboarding?.situation);
  const housingComplete = Boolean(onboarding?.helpFrequency);
  const organizationComplete = Boolean(onboarding?.requestOrg && onboarding?.billingPref && onboarding?.proOrg);
  const completed = [projectComplete, housingComplete, organizationComplete].filter(Boolean).length;

  return {
    completed,
    total: 3,
    isComplete: completed === 3,
    nextStep: !projectComplete
      ? "project"
      : !housingComplete
        ? "housing"
        : !organizationComplete
          ? "organization"
          : "complete",
  };
}

function sanitizeOwnerOnboardingV1(
  value: unknown,
  current: OwnerOnboardingV1 | null,
): OwnerOnboardingV1 | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isRecord(value)) return current;
  const fallback: OwnerOnboardingV1 = current ?? EMPTY_OWNER_ONBOARDING_V1;
  return {
    managementMode:
      value.managementMode === undefined
        ? fallback.managementMode
        : readNullableEnum(value.managementMode, OWNER_ONBOARDING_MANAGEMENT_MODES),
    needs:
      value.needs === undefined ? [...fallback.needs] : readOnboardingNeedList(value.needs),
    situation:
      value.situation === undefined
        ? fallback.situation
        : readNullableEnum(value.situation, OWNER_ONBOARDING_SITUATIONS),
    helpFrequency:
      value.helpFrequency === undefined
        ? fallback.helpFrequency
        : readNullableEnum(value.helpFrequency, OWNER_ONBOARDING_HELP_FREQUENCIES),
    requestOrg:
      value.requestOrg === undefined
        ? fallback.requestOrg
        : readNullableEnum(value.requestOrg, OWNER_ONBOARDING_REQUEST_ORGS),
    billingPref:
      value.billingPref === undefined
        ? fallback.billingPref
        : readNullableEnum(value.billingPref, OWNER_ONBOARDING_BILLING_PREFS),
    proOrg:
      value.proOrg === undefined
        ? fallback.proOrg
        : readNullableEnum(value.proOrg, OWNER_ONBOARDING_PRO_ORGS),
  };
}
function parseAvailabilityHoursPayload(value?: string | null): Record<string, unknown> {
  if (!value) return {};

  try {
    return readObject(JSON.parse(value));
  } catch {
    return {};
  }
}

function buildRequestTitle(preferences: OwnerProfilePreferences): string {
  const goalLabel =
    OWNER_REQUEST_GOAL_OPTIONS.find((option) => option.value === preferences.ownerGoal)?.label ??
    "Demande concierge";
  const propertyLabel = preferences.propertyType || preferences.propertyTypes[0] || "";
  return [goalLabel, propertyLabel].filter(Boolean).join(" - ");
}

export function getOwnerProfilePreferences(value?: string | null): OwnerProfilePreferences {
  const payload = parseAvailabilityHoursPayload(value);
  const onboarding = readObject(payload.onboarding);
  const preferences = readObject(payload.preferences);
  const source = { ...onboarding, ...preferences };
  const ownerGoal = readEnum(
    source.ownerGoal ?? source.onboardingGoal,
    OWNER_REQUEST_GOALS,
    "find_concierge",
  );
  const defaults = getServiceRequestBriefDefaults(ownerGoal);

  return {
    ownerGoal,
    collaborationType: readEnum(
      source.collaborationType ?? source.missionPreference,
      OWNER_COLLABORATION_TYPES,
      defaults.collaborationType,
    ),
    frequency: readEnum(
      source.frequency ?? source.needVolume,
      OWNER_REQUEST_FREQUENCIES,
      defaults.frequency,
    ),
    estimatedDuration: readString(source.estimatedDuration),
    responsibilityLevel: readEnum(
      source.responsibilityLevel ?? source.supportNeed,
      OWNER_RESPONSIBILITY_LEVELS,
      defaults.responsibilityLevel,
    ),
    propertyType: readString(source.propertyType),
    needVolume: readString(source.needVolume),
    operatingContext: readString(source.operatingContext ?? source.exploitationContext),
    recurringExpectations: readString(source.recurringExpectations ?? source.expectedServices),
    firstRequestTemplate: readString(source.firstRequestTemplate),
    propertyTypes: readStringArray(source.propertyTypes),
    ownerOnboardingV1: parseOwnerOnboardingV1(preferences.ownerOnboardingV1),
  };
}

export function mergeOwnerPreferencesIntoAvailabilityHours(
  currentValue: string | null | undefined,
  input: Record<string, unknown>,
): string {
  const payload = parseAvailabilityHoursPayload(currentValue);
  const onboarding = readObject(payload.onboarding);
  const existingPreferences = readObject(payload.preferences);
  const currentPreferences = getOwnerProfilePreferences(currentValue);
  const nextOwnerGoal = readEnum(
    input.ownerGoal,
    OWNER_REQUEST_GOALS,
    currentPreferences.ownerGoal,
  );
  const nextDefaults = getServiceRequestBriefDefaults(nextOwnerGoal);
  const nextPropertyType = readString(input.propertyType) || currentPreferences.propertyType;
  const nextNeedVolume = readString(input.needVolume) || currentPreferences.needVolume;
  const nextOwnerOnboardingV1 = sanitizeOwnerOnboardingV1(
    input.ownerOnboardingV1,
    currentPreferences.ownerOnboardingV1,
  );
  const nextPreferences: Record<string, unknown> = {
    ...existingPreferences,
    ownerGoal: nextOwnerGoal,
    collaborationType: readEnum(
      input.collaborationType,
      OWNER_COLLABORATION_TYPES,
      currentPreferences.collaborationType || nextDefaults.collaborationType,
    ),
    frequency: readEnum(
      input.frequency,
      OWNER_REQUEST_FREQUENCIES,
      currentPreferences.frequency || nextDefaults.frequency,
    ),
    estimatedDuration: readString(input.estimatedDuration) || null,
    responsibilityLevel: readEnum(
      input.responsibilityLevel,
      OWNER_RESPONSIBILITY_LEVELS,
      currentPreferences.responsibilityLevel || nextDefaults.responsibilityLevel,
    ),
    propertyType: nextPropertyType || null,
    needVolume: nextNeedVolume || null,
    operatingContext: readString(input.operatingContext) || null,
    recurringExpectations: readString(input.recurringExpectations) || null,
    firstRequestTemplate: readString(input.firstRequestTemplate) || null,
    propertyTypes: nextPropertyType
      ? [nextPropertyType]
      : currentPreferences.propertyTypes.length > 0
        ? currentPreferences.propertyTypes
        : readStringArray(existingPreferences.propertyTypes),
  };

  if (nextOwnerOnboardingV1 !== undefined) {
    if (nextOwnerOnboardingV1 === null) {
      delete nextPreferences.ownerOnboardingV1;
    } else {
      nextPreferences.ownerOnboardingV1 = nextOwnerOnboardingV1;
    }
  }

  return JSON.stringify({
    ...payload,
    onboarding,
    preferences: nextPreferences,
  });
}

export function buildOwnerRequestFormDefaults(
  preferences: OwnerProfilePreferences,
): {
  requestType: "ponctuel" | "renfort" | "durable";
  ownerGoal: OwnerRequestGoal;
  collaborationType: OwnerCollaborationType;
  frequency: OwnerRequestFrequency;
  estimatedDuration: string;
  responsibilityLevel: OwnerResponsibilityLevel;
  title: string;
  propertyType: string;
  propertyConstraints: string;
  description: string;
} {
  const description = [
    preferences.firstRequestTemplate,
    preferences.recurringExpectations
      ? `Attentes recurrentes : ${preferences.recurringExpectations}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    requestType: inferRequestTypeFromCollaboration(preferences.collaborationType),
    ownerGoal: preferences.ownerGoal,
    collaborationType: preferences.collaborationType,
    frequency: preferences.frequency,
    estimatedDuration: preferences.estimatedDuration,
    responsibilityLevel: preferences.responsibilityLevel,
    title: buildRequestTitle(preferences),
    propertyType: preferences.propertyType,
    propertyConstraints: preferences.operatingContext,
    description,
  };
}

export function buildOwnerConciergeSearchDefaults(
  preferences: OwnerProfilePreferences,
): {
  propertyType: string;
} {
  return {
    propertyType: preferences.propertyType || preferences.propertyTypes[0] || "",
  };
}
