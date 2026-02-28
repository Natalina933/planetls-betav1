export interface ConciergeOwnerMatch {
  id: string;
  listing_id: string;
  listing_source: "property" | "housing";
  owner_profile_id: string | null;
  title: string;
  city: string | null;
  services_wanted: string[];
  matched_services: string[];
  compatibility_ratio: string | null;
  compatibility_score: number;
  distance_km: number | null;
}

interface MatchesApiResponse {
  matches?: ConciergeOwnerMatch[];
}

export function normalizeConciergeMatches(payload: MatchesApiResponse) {
  return Array.isArray(payload.matches) ? payload.matches : [];
}

export function getMatchesErrorMessage(body: { error?: string } | null) {
  if (body && typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }

  return "Impossible de charger les propriétaires compatibles";
}

export async function fetchConciergeMatches(limit = 6) {
  const res = await fetch(`/api/concierge/match-owner-requests?limit=${limit}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMessage = getMatchesErrorMessage(null);
    try {
      const body = (await res.json()) as { error?: string };
      errorMessage = getMatchesErrorMessage(body);
    } catch {
      // keep fallback message
    }
    throw new Error(errorMessage);
  }

  const payload = (await res.json()) as MatchesApiResponse;
  return normalizeConciergeMatches(payload);
}
