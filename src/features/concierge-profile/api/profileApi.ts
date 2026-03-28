import type { ConciergeProfile } from "../types";

function normalizeAvatarUrl(avatarUrl: string | null) {
  if (!avatarUrl || !avatarUrl.includes("/avatars//")) {
    return avatarUrl;
  }

  return avatarUrl.replace("/avatars/avatars/", "/avatars/");
}

export async function fetchCurrentConciergeProfile(): Promise<ConciergeProfile> {
  const response = await fetch("/api/profiles/current", { cache: "no-store" });
  const data = (await response.json()) as ConciergeProfile | { error?: string };

  if (!response.ok || ("error" in data && typeof data.error === "string")) {
    throw new Error(("error" in data && data.error) || "Impossible de charger le profil concierge.");
  }

  const profile = data as ConciergeProfile;

  return {
    ...profile,
    avatar_url: normalizeAvatarUrl(profile.avatar_url ?? null),
    location: profile.location ?? profile.service_area ?? null,
    service_area: profile.service_area ?? profile.location ?? null,
    service_radius_km: profile.service_radius_km ?? null,
  };
}
