import type { ConciergeProfile } from "../types";

type UnknownRecord = Record<string, unknown>;

/**
 * Corrige les anciennes URL d'avatar qui contiennent
 * le dossier "avatars" deux fois.
 */
function normalizeAvatarUrl(avatarUrl: string | null) {
  if (!avatarUrl) {
    return avatarUrl;
  }

  if (!avatarUrl.includes("/avatars/avatars/")) {
    return avatarUrl;
  }

  return avatarUrl.replace("/avatars/avatars/", "/avatars/");
}

/**
 * Charge le profil de l'utilisateur connecté.
 */
export async function fetchCurrentConciergeProfile(): Promise<ConciergeProfile> {
const endpoint = "/api/profiles/current";
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  // 1. Vérifie que l'API retourne bien du JSON
  if (!contentType.includes("application/json")) {
    const preview = responseText
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    console.error("[fetchCurrentConciergeProfile] Réponse non JSON", {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      contentType: contentType || "non renseigné",
      preview: preview || "(réponse totalement vide)",
    });

    throw new Error(
      `Impossible de charger le profil concierge : ` +
        `${endpoint} a retourné une réponse non JSON ` +
        `(HTTP ${response.status}, ${
          contentType || "Content-Type inconnu"
        }).`,
    );
  }

  // 2. Vérifie que la réponse n'est pas vide
  if (response.status === 204 || !responseText.trim()) {
    console.error("[fetchCurrentConciergeProfile] Réponse vide reçue", {
      endpoint,
      status: response.status,
    });

    throw new Error(
      `Impossible de charger le profil concierge : ` +
        `l'API a renvoyé une réponse vide (HTTP ${response.status}).`,
    );
  }

  // 3. Parse le JSON
  let data: UnknownRecord;

  try {
    data = JSON.parse(responseText) as UnknownRecord;
  } catch (error) {
    console.error(
      "[fetchCurrentConciergeProfile] JSON invalide retourné par l'API",
      {
        endpoint,
        status: response.status,
        error,
      },
    );

    throw new Error(
      `Impossible de lire la réponse de ${endpoint} ` +
        `(HTTP ${response.status}).`,
    );
  }

  // 4. Recherche une éventuelle erreur API
  const apiError =
    typeof data.error === "string"
      ? data.error
      : null;

  if (!response.ok) {
    throw new Error(
      apiError ||
        `Impossible de charger le profil concierge (HTTP ${response.status}).`,
    );
  }

  if (apiError) {
    throw new Error(apiError);
  }

  // 5. Normalise le profil
  const profile = data as unknown as ConciergeProfile;

  return {
    ...profile,

    avatar_url: normalizeAvatarUrl(profile.avatar_url ?? null),

    location:
      profile.location ??
      profile.service_area ??
      null,

    service_area:
      profile.service_area ??
      profile.location ??
      null,

    service_radius_km:
      profile.service_radius_km ?? null,
  };
}