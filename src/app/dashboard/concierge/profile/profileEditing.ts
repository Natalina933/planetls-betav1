export type SectionEditSnapshots = Record<string, string>;
export type OpenSectionsState = Record<string, boolean>;

interface ProfileIdentityLike {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  id?: string;
  onboarding_complete?: boolean;
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

export function updateSocialFieldValue<T extends Record<string, unknown>>(
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
