import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { Database, Json } from "@/types/supabase";
import { getApiAuthContext } from "@/app/lib/apiAuth";

type MatchRow = Database["public"]["Tables"]["concierge_owner_matches"]["Row"];
type MatchInsert = Database["public"]["Tables"]["concierge_owner_matches"]["Insert"];
type MatchStatus = "new" | "contacted" | "archived";
type ListingSource = "property" | "housing";

interface SearchListing {
  id: string;
  source: ListingSource;
  title: string;
  city: string;
  postal_code: string | null;
  property_type: string | null;
  surface_m2: number | null;
  owner_profile_id: string | null;
  owner_name: string;
  status: string | null;
  services_wanted: string[];
  services_wanted_ids: number[];
  matched_services: string[];
  compatibility_ratio: string;
  compatibility_score: number;
  distance_km: number | null;
  budget_note: string | null;
}

interface SearchResponse {
  listings?: SearchListing[];
}

const MATCH_SELECT = `
  id,
  concierge_profile_id,
  listing_id,
  listing_source,
  owner_profile_id,
  title,
  city,
  postal_code,
  property_type,
  surface_m2,
  services_wanted,
  matched_services,
  compatibility_ratio,
  compatibility_score,
  distance_km,
  budget_note,
  match_status,
  metadata,
  created_at,
  updated_at
`;

const ALLOWED_MATCH_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

const getErrorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const payload = (await res.json()) as { error?: string };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const clampLimit = (raw: string | null, fallback: number): number => {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), 1), 60);
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
};

const parseJsonStringArray = (value: Json): string[] => normalizeStringArray(value);

const serializeMetadata = (listing: SearchListing): Json => {
  const safeIds = Array.isArray(listing.services_wanted_ids)
    ? listing.services_wanted_ids.filter((entry) => Number.isFinite(entry))
    : [];

  return {
    owner_name: listing.owner_name,
    owner_status: listing.status,
    services_wanted_ids: safeIds,
    source: "concierge_match_v1",
  };
};

const loadStoredMatches = async (conciergeId: string, limit: number): Promise<MatchRow[]> => {
  const { data, error } = await db
    .from("concierge_owner_matches")
    .select(MATCH_SELECT)
    .eq("concierge_profile_id", conciergeId)
    .order("compatibility_score", { ascending: false })
    .order("distance_km", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[match-owner-requests] load matches error:", error);
    throw new Error("Erreur de lecture des matchs concierge");
  }

  return (data ?? []) as MatchRow[];
};

const refreshMatches = async (
  req: NextRequest,
  conciergeId: string,
  limit: number,
): Promise<MatchRow[]> => {
  const searchLimit = Math.max(limit * 4, 40);
  const searchUrl = new URL("/api/search/owner-listings", req.nextUrl.origin);
  searchUrl.searchParams.set("limit", String(searchLimit));

  const searchResponse = await fetch(searchUrl.toString(), {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!searchResponse.ok) {
    throw new Error(await getErrorMessage(searchResponse, "Impossible de lancer la recherche"));
  }

  const searchPayload = (await searchResponse.json()) as SearchResponse;
  const listings = Array.isArray(searchPayload.listings) ? searchPayload.listings : [];

  const { data: existingRows, error: existingError } = await db
    .from("concierge_owner_matches")
    .select("listing_id, match_status")
    .eq("concierge_profile_id", conciergeId);

  if (existingError) {
    console.error("[match-owner-requests] existing rows error:", existingError);
    throw new Error("Erreur de lecture des matchs existants");
  }

  const existingStatusByListingId = new Map<string, MatchStatus>();
  (existingRows ?? []).forEach((row) => {
    const status = row.match_status as MatchStatus;
    if (status === "new" || status === "contacted" || status === "archived") {
      existingStatusByListingId.set(row.listing_id, status);
    }
  });

  const inserts: MatchInsert[] = listings.map((listing) => {
    const source: ListingSource = listing.source === "property" ? "property" : "housing";
    const preservedStatus = existingStatusByListingId.get(listing.id) ?? "new";
    const servicesWanted = normalizeStringArray(listing.services_wanted);
    const matchedServices = normalizeStringArray(listing.matched_services);
    const score = Number.isFinite(listing.compatibility_score)
      ? Math.max(0, Math.min(100, Math.round(listing.compatibility_score)))
      : 0;

    return {
      concierge_profile_id: conciergeId,
      listing_id: listing.id,
      listing_source: source,
      owner_profile_id: listing.owner_profile_id,
      title: listing.title,
      city: listing.city,
      postal_code: listing.postal_code,
      property_type: listing.property_type,
      surface_m2: listing.surface_m2,
      services_wanted: servicesWanted,
      matched_services: matchedServices,
      compatibility_ratio: listing.compatibility_ratio,
      compatibility_score: score,
      distance_km: listing.distance_km,
      budget_note: listing.budget_note,
      match_status: preservedStatus,
      metadata: serializeMetadata(listing),
    };
  });

  if (inserts.length > 0) {
    const { error: upsertError } = await db.from("concierge_owner_matches").upsert(inserts, {
      onConflict: "concierge_profile_id,listing_id",
    });
    if (upsertError) {
      console.error("[match-owner-requests] upsert error:", upsertError);
      throw new Error("Erreur de sauvegarde des matchs");
    }
  }

  const newListingIds = new Set(inserts.map((row) => row.listing_id));
  const staleListingIds = (existingRows ?? [])
    .map((row) => row.listing_id)
    .filter((listingId) => !newListingIds.has(listingId));

  if (staleListingIds.length > 0) {
    const { error: staleDeleteError } = await db
      .from("concierge_owner_matches")
      .delete()
      .eq("concierge_profile_id", conciergeId)
      .in("listing_id", staleListingIds);

    if (staleDeleteError) {
      console.error("[match-owner-requests] stale delete error:", staleDeleteError);
      throw new Error("Erreur de nettoyage des anciens matchs");
    }
  }

  return loadStoredMatches(conciergeId, limit);
};

const formatMatchRows = (rows: MatchRow[]) =>
  rows.map((row) => ({
    id: row.id,
    listing_id: row.listing_id,
    listing_source: row.listing_source,
    owner_profile_id: row.owner_profile_id,
    title: row.title,
    city: row.city,
    postal_code: row.postal_code,
    property_type: row.property_type,
    surface_m2: row.surface_m2,
    services_wanted: parseJsonStringArray(row.services_wanted),
    matched_services: parseJsonStringArray(row.matched_services),
    compatibility_ratio: row.compatibility_ratio,
    compatibility_score: row.compatibility_score,
    distance_km: row.distance_km,
    budget_note: row.budget_note,
    match_status: row.match_status,
    metadata: row.metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_MATCH_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = clampLimit(url.searchParams.get("limit"), 8);
    const forceRefresh = url.searchParams.get("refresh") === "1";

    let matches = await loadStoredMatches(userId, limit);
    let refreshed = false;
    let refreshError: string | null = null;

    if (forceRefresh || matches.length === 0) {
      try {
        matches = await refreshMatches(req, userId, limit);
        refreshed = true;
      } catch (err) {
        refreshError = err instanceof Error ? err.message : "Erreur de rafraichissement";
        if (matches.length === 0) {
          return NextResponse.json({ error: refreshError }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      matches: formatMatchRows(matches),
      meta: {
        total: matches.length,
        refreshed,
        refresh_error: refreshError,
      },
    });
  } catch (err) {
    console.error("[GET /api/concierge/match-owner-requests] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_MATCH_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const limit = clampLimit(url.searchParams.get("limit"), 8);
    const matches = await refreshMatches(req, userId, limit);

    return NextResponse.json({
      matches: formatMatchRows(matches),
      meta: {
        total: matches.length,
        refreshed: true,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de mise a jour des matchs";
    console.error("[POST /api/concierge/match-owner-requests] ERROR:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

