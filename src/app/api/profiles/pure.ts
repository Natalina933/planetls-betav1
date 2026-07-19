const OWNER_ROLES = new Set(["owner", "owner_pro"]);
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);
const PROVIDER_ROLES = new Set(["provider", "provider_pro", "artisan", "artisan_pro"]);

const COMMON_STRING_FIELDS = [
  "username",
  "first_name",
  "last_name",
  "phone",
  "avatar_url",
  "image",
  "additional_info",
  "street_address",
  "postal_code",
  "city",
  "country",
  "website",
  "linkedin",
  "instagram",
  "facebook",
] as const;

const COMMON_NUMBER_FIELDS = [
  "avatar_scale",
  "avatar_offset_x",
  "avatar_offset_y",
  "avatar_rotation",
] as const;

const COMMON_BOOLEAN_FIELDS = ["onboarding_complete"] as const;

const OWNER_STRING_FIELDS = [
  ...COMMON_STRING_FIELDS,
  "company_name",
  "search_target",
] as const;

const OWNER_PRO_EXTRA_STRING_FIELDS = [
  "legal_form",
  "siret",
  "siren",
  "vat_number",
] as const;

const CONCIERGE_STRING_FIELDS = [
  ...COMMON_STRING_FIELDS,
  "company_name",
  "legal_form",
  "siret",
  "siren",
  "vat_number",
  "location",
  "insurance_number",
  "insurance_company",
  "certifications",
  "service_area",
  "availability_hours",
  "iban",
  "bic",
  // Legacy service field kept during transition.
  "option",
] as const;

const CONCIERGE_NUMBER_FIELDS = [
  ...COMMON_NUMBER_FIELDS,
  "travel_fee",
  "service_radius_km",
  "hourly_rate",
  "monthly_rate",
  "years_experience",
] as const;

const CONCIERGE_BOOLEAN_FIELDS = [
  ...COMMON_BOOLEAN_FIELDS,
  "emergency_service",
] as const;

const PROVIDER_STRING_FIELDS = [
  ...COMMON_STRING_FIELDS,
  "company_name",
  "legal_form",
  "siret",
  "siren",
  "vat_number",
  "location",
  "category",
  "insurance_number",
  "insurance_company",
  "certifications",
  "service_area",
  "availability_hours",
  // Legacy service field kept during transition.
  "option",
] as const;

const PROVIDER_NUMBER_FIELDS = [
  ...COMMON_NUMBER_FIELDS,
  "service_radius_km",
  "hourly_rate",
  "travel_fee",
  "years_experience",
] as const;

type ProfilePatchPolicy = {
  stringFields: ReadonlySet<string>;
  numberFields: ReadonlySet<string>;
  booleanFields: ReadonlySet<string>;
  allowRoleMutation: boolean;
  allowExperienceLevel: boolean;
  allowOwnerPreferencesObject: boolean;
};

type ProfilePatchPrimitive = string | number | boolean | null;
type ProfilePatchRecord = Record<string, unknown>;

export type SanitizedProfilePatch = {
  ignoredFields: string[];
  invalidNumberFields: string[];
  onboardingCompleteInput: boolean | null;
  ownerPreferencesInput: Record<string, unknown> | null;
  updateData: Partial<Record<string, ProfilePatchPrimitive>>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function getProfilePatchPolicy(role: string | null | undefined, isAdmin: boolean): ProfilePatchPolicy {
  if (isAdmin) {
    return {
      stringFields: new Set([
        "username",
        "first_name",
        "last_name",
        "phone",
        "avatar_url",
        "image",
        "additional_info",
        "category",
        "location",
        "option",
        "search_target",
        "company_name",
        "legal_form",
        "siret",
        "siren",
        "vat_number",
        "street_address",
        "postal_code",
        "city",
        "country",
        "website",
        "linkedin",
        "instagram",
        "facebook",
        "insurance_number",
        "insurance_company",
        "certifications",
        "service_area",
        "availability_hours",
        "iban",
        "bic",
      ]),
      numberFields: new Set([
        "avatar_scale",
        "avatar_offset_x",
        "avatar_offset_y",
        "avatar_rotation",
        "travel_fee",
        "service_radius_km",
        "hourly_rate",
        "monthly_rate",
        "years_experience",
      ]),
      booleanFields: new Set(["emergency_service", "onboarding_complete"]),
      allowRoleMutation: true,
      allowExperienceLevel: true,
      allowOwnerPreferencesObject: false,
    };
  }

  if (OWNER_ROLES.has(role ?? "")) {
    const stringFields = new Set<string>(OWNER_STRING_FIELDS);
    if (role === "owner_pro") {
      OWNER_PRO_EXTRA_STRING_FIELDS.forEach((field) => stringFields.add(field));
    }
    return {
      stringFields,
      numberFields: new Set(COMMON_NUMBER_FIELDS),
      booleanFields: new Set(COMMON_BOOLEAN_FIELDS),
      allowRoleMutation: false,
      allowExperienceLevel: false,
      allowOwnerPreferencesObject: true,
    };
  }

  if (CONCIERGE_ROLES.has(role ?? "")) {
    return {
      stringFields: new Set(CONCIERGE_STRING_FIELDS),
      numberFields: new Set(CONCIERGE_NUMBER_FIELDS),
      booleanFields: new Set(CONCIERGE_BOOLEAN_FIELDS),
      allowRoleMutation: false,
      allowExperienceLevel: true,
      allowOwnerPreferencesObject: false,
    };
  }

  if (PROVIDER_ROLES.has(role ?? "")) {
    return {
      stringFields: new Set(PROVIDER_STRING_FIELDS),
      numberFields: new Set(PROVIDER_NUMBER_FIELDS),
      booleanFields: new Set([...COMMON_BOOLEAN_FIELDS, "emergency_service"]),
      allowRoleMutation: false,
      allowExperienceLevel: true,
      allowOwnerPreferencesObject: false,
    };
  }

  return {
    stringFields: new Set(COMMON_STRING_FIELDS),
    numberFields: new Set(COMMON_NUMBER_FIELDS),
    booleanFields: new Set(COMMON_BOOLEAN_FIELDS),
    allowRoleMutation: false,
    allowExperienceLevel: false,
    allowOwnerPreferencesObject: false,
  };
}

export function isProfilePatchNumberValueAllowed(
  key: string,
  value: number | null,
): boolean {
  if (value === null) return true;
  if (!Number.isFinite(value)) return false;

  switch (key) {
    case "service_radius_km":
    case "hourly_rate":
    case "monthly_rate":
    case "travel_fee":
    case "years_experience":
      return value >= 0;
    default:
      return true;
  }
}

export function sanitizeProfilePatchBody(
  body: ProfilePatchRecord,
  policy: ProfilePatchPolicy,
): SanitizedProfilePatch {
  const updateData: Partial<Record<string, ProfilePatchPrimitive>> = {};
  const ignoredFields: string[] = [];
  const invalidNumberFields: string[] = [];
  const allowedFields = new Set<string>([
    ...policy.stringFields,
    ...policy.numberFields,
    ...policy.booleanFields,
    ...(policy.allowRoleMutation ? ["role"] : []),
    ...(policy.allowExperienceLevel ? ["experience_level"] : []),
    ...(policy.allowOwnerPreferencesObject ? ["owner_preferences"] : []),
  ]);

  for (const [key, value] of Object.entries(body)) {
    if (!allowedFields.has(key)) {
      ignoredFields.push(key);
      continue;
    }

    if (policy.stringFields.has(key)) {
      if (typeof value === "string" || value === null) {
        updateData[key] = value;
      }
      continue;
    }

    if (policy.numberFields.has(key)) {
      if ((typeof value === "number" && Number.isFinite(value)) || value === null) {
        if (isProfilePatchNumberValueAllowed(key, value)) {
          updateData[key] = value;
        } else {
          invalidNumberFields.push(key);
        }
      }
      continue;
    }

    if (policy.booleanFields.has(key)) {
      if (typeof value === "boolean" || value === null) {
        updateData[key] = value;
      }
      continue;
    }

    if (key === "role" && policy.allowRoleMutation && typeof value === "string") {
      updateData[key] = value;
      continue;
    }

    if (key === "experience_level" && policy.allowExperienceLevel) {
      if (typeof value === "string" || value === null) {
        updateData[key] = value;
      }
      continue;
    }
  }

  const onboardingCompleteInput =
    typeof body.onboarding_complete === "boolean" ? body.onboarding_complete : null;
  const ownerPreferencesInput =
    policy.allowOwnerPreferencesObject && isRecord(body.owner_preferences)
      ? body.owner_preferences
      : null;

  return {
    ignoredFields: ignoredFields.sort(),
    invalidNumberFields: invalidNumberFields.sort(),
    onboardingCompleteInput,
    ownerPreferencesInput,
    updateData,
  };
}

export function isProfileRoleAllowedForPatch(role: string | null | undefined): boolean {
  return (
    OWNER_ROLES.has(role ?? "") ||
    CONCIERGE_ROLES.has(role ?? "") ||
    PROVIDER_ROLES.has(role ?? "") ||
    role === "admin" ||
    role === "super_admin"
  );
}
