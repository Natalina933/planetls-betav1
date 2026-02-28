import type { ActiveService, OwnerListing } from "./searchPageSections";

export interface SearchResponse {
  profile: {
    location?: string | null;
    city: string | null;
    postal_code: string | null;
    country?: string | null;
    service_area: string | null;
    service_radius_km: number | null;
  };
  active_services: ActiveService[];
  applied_filters: {
    city: string | null;
    postal_code: string | null;
    radius_km: number | null;
    services: string[];
    country_wide?: boolean;
  };
  meta: {
    total_found: number;
    distance_mode: string;
    note: string;
  };
  listings: OwnerListing[];
}

export interface SearchFetchOptions {
  city?: string;
  postalCode?: string;
  radiusKm?: number;
  services?: string[];
  countryWide?: boolean;
}

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function buildSearchParams(options?: SearchFetchOptions) {
  const params = new URLSearchParams();

  if (options?.city) params.set("city", options.city);
  if (options?.postalCode) params.set("postalCode", options.postalCode);
  if (options?.countryWide) params.set("countryWide", "1");
  if (typeof options?.radiusKm === "number" && options.radiusKm > 0) {
    params.set("radiusKm", String(options.radiusKm));
  }
  if (options?.services && options.services.length > 0) {
    params.set("services", options.services.join(","));
  }
  params.set("limit", options?.countryWide ? "200" : "80");

  return params;
}

export const getResponseError = async (
  res: Response,
  fallback: string,
): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

export async function fetchOwnerListings(options?: SearchFetchOptions) {
  const params = buildSearchParams(options);
  const res = await fetch(`/api/search/owner-listings?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await getResponseError(res, "Impossible de charger les annonces proprietaires"));
  }

  return (await res.json()) as SearchResponse;
}

export async function createSearchConversation(listing: OwnerListing) {
  const prefillMessage = `Bonjour ${listing.owner_name}, je vous contacte suite a votre annonce "${listing.title}" (${listing.city}). Je peux vous proposer une gestion adaptee a vos besoins.`;

  const res = await fetch("/api/messages/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      owner_profile_id: listing.owner_profile_id,
      source: "search",
      source_reference: listing.id,
      subject: `Prospection concierge - ${listing.title}`,
      prefill_message: prefillMessage,
      metadata: {
        listing_id: listing.id,
        listing_city: listing.city,
        compatibility_score: listing.compatibility_score,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await getResponseError(res, "Impossible de creer la conversation"));
  }

  return (await res.json()) as { id: string };
}

export function buildAvailableServiceOptions(
  activeServices: ActiveService[],
  listings: OwnerListing[],
) {
  const byLabel = new Map<string, string>();

  activeServices.forEach((service) => {
    byLabel.set(normalize(service.label), service.label);
  });

  listings.forEach((listing) => {
    listing.services_wanted.forEach((service) => {
      const key = normalize(service);
      if (!byLabel.has(key)) byLabel.set(key, service);
    });
  });

  return Array.from(byLabel.values()).sort((a, b) => a.localeCompare(b));
}
