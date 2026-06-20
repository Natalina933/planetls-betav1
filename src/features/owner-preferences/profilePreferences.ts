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
  const nextPreferences = {
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
