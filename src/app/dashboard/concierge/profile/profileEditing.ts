import type { PricingFallbackInput } from "@/app/components/tariffs/pricingEngine";
import type { PricingV2Config, SeasonalPricingConfig } from "@/app/components/tariffs/types";

export type SectionEditSnapshots = Record<string, string>;
export type OpenSectionsState = Record<string, boolean>;

interface ProfileIdentityLike {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  id?: string;
  onboarding_complete?: boolean;
  availability_hours?: string | null;
  hourly_rate?: number | null;
  travel_fee?: number | null;
}

export function createSectionSnapshot<T>(value: T | null): string | null {
  return value ? JSON.stringify(value) : null;
}

export function removeSectionSnapshot(
  snapshots: SectionEditSnapshots,
  sectionId: string | null,
): SectionEditSnapshots {
  if (!sectionId || !(sectionId in snapshots)) {
    return snapshots;
  }

  const next = { ...snapshots };
  delete next[sectionId];
  return next;
}

export function upsertSectionSnapshot<T>(
  snapshots: SectionEditSnapshots,
  sectionId: string,
  value: T | null,
): SectionEditSnapshots {
  const snapshot = createSectionSnapshot(value);
  if (snapshot == null) {
    return snapshots;
  }

  return {
    ...snapshots,
    [sectionId]: snapshot,
  };
}

export function hasSectionUnsavedChanges<T>(
  snapshots: SectionEditSnapshots,
  sectionId: string | null,
  currentValue: T | null,
): boolean {
  if (!sectionId || currentValue == null) {
    return false;
  }

  const snapshot = snapshots[sectionId];
  if (typeof snapshot !== "string") {
    return false;
  }

  return snapshot !== JSON.stringify(currentValue);
}

export function hasValidationErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some((error) => error !== "");
}

export function shouldCompleteMissionOnboarding(
  activeTab: string,
  progressSteps: Array<{ done: boolean }>,
  profile: ProfileIdentityLike | null,
): boolean {
  const onboardingReady =
    progressSteps.length > 0 && progressSteps.every((step) => step.done);

  return (
    activeTab === "missions" &&
    onboardingReady &&
    profile?.onboarding_complete !== true
  );
}

export function buildProfileSavePayload<T extends ProfileIdentityLike>(
  profile: T,
  avatarUrl: string | null,
  markOnboardingComplete: boolean,
): T & { avatar_url: string | null; onboarding_complete?: boolean } {
  return {
    ...profile,
    avatar_url: avatarUrl,
    ...(markOnboardingComplete ? { onboarding_complete: true } : {}),
  };
}

export function toggleOpenSection(
  openSections: OpenSectionsState,
  sectionId: string,
): OpenSectionsState {
  return {
    ...openSections,
    [sectionId]: !openSections[sectionId],
  };
}

export function ensureOpenSection(
  openSections: OpenSectionsState,
  sectionId: string,
): OpenSectionsState {
  return {
    ...openSections,
    [sectionId]: true,
  };
}

export function updateSocialFieldValue<
  T extends { website?: unknown; linkedin?: unknown; instagram?: unknown; facebook?: unknown },
>(
  profile: T | null,
  field: "website" | "linkedin" | "instagram" | "facebook",
  value: string,
): T | null {
  if (!profile) {
    return profile;
  }

  return {
    ...profile,
    [field]: value,
  };
}

export function updateProfileFieldValue<
  T extends ProfileIdentityLike,
>(
  profile: T | null,
  name: string,
  value: string,
  options: {
    parseSeasonalPricing: (value?: string | null) => SeasonalPricingConfig;
    parsePricingV2FromAvailabilityHours: (
      value: string | null | undefined,
      context: PricingFallbackInput,
    ) => PricingV2Config;
    syncSeasonalPricingFromPricingV2: (
      seasonal: SeasonalPricingConfig,
      pricingV2: PricingV2Config,
    ) => SeasonalPricingConfig;
    parseAvailabilityPayloadRaw: (value?: string | null) => Record<string, unknown>;
  },
): T | null {
  if (!profile) {
    return profile;
  }

  const isBaseTariffField = name === "hourly_rate" || name === "travel_fee";
  if (!isBaseTariffField) {
    return {
      ...profile,
      [name]: value,
    } as T;
  }

  const parsedValue =
    value.trim() === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
  const fallbackSeasonal = options.parseSeasonalPricing(profile.availability_hours);
  const pricingV2Next = options.parsePricingV2FromAvailabilityHours(
    profile.availability_hours,
    {
      hourlyRate: profile.hourly_rate ?? 0,
      travelFee: profile.travel_fee ?? 0,
      seasonalPricing: fallbackSeasonal,
    },
  );

  if (name === "hourly_rate") {
    pricingV2Next.base.hourlyRate = Math.max(0, parsedValue ?? 0);
  } else {
    pricingV2Next.base.travelFee = Math.max(0, parsedValue ?? 0);
  }

  const syncedLegacy = options.syncSeasonalPricingFromPricingV2(
    fallbackSeasonal,
    pricingV2Next,
  );

  return {
    ...profile,
    [name]: parsedValue,
    availability_hours: JSON.stringify({
      ...options.parseAvailabilityPayloadRaw(profile.availability_hours),
      pricing: syncedLegacy,
      pricing_v2: pricingV2Next,
    }),
  } as T;
}

export function validateProfileField(name: string, value: string): string {
  if (!value) {
    return "";
  }

  if (name === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "" : "Email invalide";
  }

  if (name === "phone") {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(value) ? "" : "Telephone invalide";
  }

  if (name === "siret") {
    const siretRegex = /^[0-9]{14}$/;
    return siretRegex.test(value.replace(/\s/g, ""))
      ? ""
      : "SIRET invalide (14 chiffres)";
  }

  if (name === "siren") {
    const sirenRegex = /^[0-9]{9}$/;
    return sirenRegex.test(value.replace(/\s/g, ""))
      ? ""
      : "SIREN invalide (9 chiffres)";
  }

  if (name === "postal_code") {
    const postalRegex = /^[0-9]{5}$/;
    return postalRegex.test(value) ? "" : "Code postal invalide (5 chiffres)";
  }

  if (name === "website") {
    const urlRegex =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return urlRegex.test(value) ? "" : "URL invalide";
  }

  if (name === "iban") {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    return ibanRegex.test(value.replace(/\s/g, ""))
      ? ""
      : "IBAN invalide";
  }

  return "";
}

export function buildProfileSuccessMessage(sectionTitle: string): string {
  return `✅ ${sectionTitle} mis à jour avec succès`;
}

export function buildSessionUserPayload(
  profile: Pick<ProfileIdentityLike, "first_name" | "last_name">,
  avatarUrl: string | null,
) {
  return {
    image: avatarUrl,
    avatar_url: avatarUrl,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}

export function resolveSavedSectionId(
  editingSection: string | null,
  sectionTitle: string,
  normalizeSectionId: (title: string) => string,
): string {
  return editingSection ?? normalizeSectionId(sectionTitle);
}

export async function patchProfileRequest<T extends ProfileIdentityLike>(
  profile: T,
  avatarUrl: string | null,
  markOnboardingComplete: boolean,
): Promise<T> {
  const response = await fetch("/api/profiles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildProfileSavePayload(profile, avatarUrl, markOnboardingComplete),
    ),
  });

  const result = await response.json();
  if (!response.ok || result?.error) {
    throw new Error(result?.error || "Erreur lors de la sauvegarde");
  }

  return result as T;
}

export async function createQuoteFromMissionRequest(missionId: string): Promise<string> {
  const response = await fetch("/api/quotes/from-mission", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mission_id: missionId }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result?.error === "string"
        ? result.error
        : "Erreur creation devis depuis mission",
    );
  }

  return typeof result?.quote_number === "string" ? result.quote_number : "devis cree";
}

export async function uploadProfileAvatar(
  file: File,
  userId: string,
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);

  const response = await fetch("/api/profiles/avatar", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result.url as string;
}

export function updateProfileFieldErrorsSafe(
  errors: Record<string, string>,
  name: string,
  value: string,
): Record<string, string> {
  return {
    ...errors,
    [name]: validateProfileField(name, value),
  };
}

export function buildProfileValidationAlertMessageSafe(): string {
  return "Veuillez corriger les erreurs avant de sauvegarder.";
}

export function buildProfileSuccessMessageSafe(sectionTitle: string): string {
  return `${sectionTitle} mis à jour avec succès`;
}
