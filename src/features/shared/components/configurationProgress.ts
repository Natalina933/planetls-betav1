import type { CurrentUser } from "@/app/components/hooks/useCurrentUser";
import type { ConfigurationStep, ConfigurationStatus } from "./DashboardConfigurationCard";

// Owner configuration steps and progress calculation
export const OWNER_CONFIGURATION_STEPS: ConfigurationStep[] = [
  { key: "project", label: "Projet" },
  { key: "housing", label: "Logement" },
  { key: "organization", label: "Organisation" },
];

export function getOwnerConfigurationProgress(
  user: CurrentUser | null | undefined,
): ConfigurationStatus {
  // Use the existing helper from owner-preferences
  // We'll import and use it, but for now use a simplified version
  const userAny = user as unknown as Record<string, unknown>;
  const availabilityHours = userAny?.availability_hours as string | null | undefined;
  
  let onboarding: Record<string, unknown> | null = null;
  if (availabilityHours) {
    try {
      const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
      const preferences = parsed.preferences as Record<string, unknown> | null | undefined;
      const onboardingFromPrefs = preferences?.ownerOnboardingV1 as Record<string, unknown> | null | undefined;
      const onboardingFromRoot = parsed.onboarding as Record<string, unknown> | null | undefined;
      onboarding = onboardingFromPrefs || onboardingFromRoot || null;
    } catch {
      onboarding = null;
    }
  }

  const managementMode = onboarding?.managementMode as string | null | undefined;
  const situation = onboarding?.situation as string | null | undefined;
  const helpFrequency = onboarding?.helpFrequency as string | null | undefined;
  const requestOrg = onboarding?.requestOrg as string | null | undefined;
  const billingPref = onboarding?.billingPref as string | null | undefined;
  const proOrg = onboarding?.proOrg as string | null | undefined;

  const projectComplete = Boolean(managementMode && situation);
  const housingComplete = Boolean(helpFrequency);
  const organizationComplete = Boolean(requestOrg && billingPref && proOrg);
  const completed = [projectComplete, housingComplete, organizationComplete].filter(Boolean).length;
  const isComplete = user?.onboarding_complete === true || completed === 3;

  return {
    completed,
    total: 3,
    isComplete,
  };
}

// Concierge configuration steps and progress calculation
export const CONCIERGE_CONFIGURATION_STEPS: ConfigurationStep[] = [
  { key: "activity", label: "Profil / activité" },
  { key: "services", label: "Services proposés" },
  { key: "organization", label: "Zone d'intervention" },
];

export function getConciergeConfigurationProgress(
  user: CurrentUser | null | undefined,
): ConfigurationStatus {
  const userAny = user as unknown as Record<string, unknown>;
  const experienceLevel = userAny?.experience_level as string | null | undefined;
  const legalForm = userAny?.legal_form as string | null | undefined;
  const serviceMode = userAny?.service_mode as string | null | undefined;
  const location = userAny?.location as string | null | undefined;
  const serviceArea = userAny?.service_area as string | null | undefined;
  const city = userAny?.city as string | null | undefined;
  const serviceRadiusKm = userAny?.service_radius_km as number | null | undefined;
  
  const activityComplete = Boolean(experienceLevel && legalForm);
  const servicesComplete =
    serviceMode === "a_la_carte" ||
    serviceMode === "full_management" ||
    serviceMode === "both";
  const organizationComplete = Boolean(
    (location?.trim() || serviceArea?.trim() || city?.trim()) &&
      typeof serviceRadiusKm === "number" &&
      serviceRadiusKm > 0,
  );
  const completed = [activityComplete, servicesComplete, organizationComplete].filter(Boolean).length;
  const isComplete = user?.onboarding_complete === true || completed === 3;

  return {
    completed,
    total: 3,
    isComplete,
  };
}

// Provider configuration steps and progress calculation
export const PROVIDER_CONFIGURATION_STEPS: ConfigurationStep[] = [
  { key: "profile", label: "Profil professionnel" },
  { key: "trade", label: "Métier / spécialités" },
  { key: "zone", label: "Zone d'intervention" },
];

// Type for Provider profile - accepts any object with the required properties
export function getProviderConfigurationProgress(
  profile: unknown,
): ConfigurationStatus {
  const prof = profile as Record<string, unknown> | null | undefined;
  if (!prof || typeof prof !== "object") {
    return { completed: 0, total: 3, isComplete: false };
  }

  // Profile complete: company_name and (first_name or last_name)
  const companyName = prof.company_name as string | null | undefined;
  const firstName = prof.first_name as string | null | undefined;
  const lastName = prof.last_name as string | null | undefined;
  const profileComplete = Boolean(
    companyName?.trim() &&
      (firstName?.trim() || lastName?.trim()),
  );

  // Trade complete: category
  const category = prof.category as string | null | undefined;
  const tradeComplete = Boolean(category?.trim());

  // Zone complete: service_area and service_radius_km
  const serviceArea = prof.service_area as string | null | undefined;
  const serviceRadiusKm = prof.service_radius_km as number | null | undefined;
  const zoneComplete = Boolean(
    serviceArea?.trim() &&
      typeof serviceRadiusKm === "number" &&
      serviceRadiusKm > 0,
  );

  const completed = [profileComplete, tradeComplete, zoneComplete].filter(Boolean).length;
  const isComplete = completed === 3;

  return {
    completed,
    total: 3,
    isComplete,
  };
}
