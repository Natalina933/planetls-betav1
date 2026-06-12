export type ConciergeInspirationVideo = {
  id: string;
  sourceUrl: string;
  embedUrl: string;
  watchUrl: string;
  kind: "short" | "video";
};

export type ConciergeInspirationLibrary = {
  videos: ConciergeInspirationVideo[];
  searches: string[];
};

function parseAvailabilityPayloadJson(availabilityHours?: string | null) {
  if (!availabilityHours) return {} as Record<string, unknown>;

  try {
    const parsed = JSON.parse(availabilityHours) as Record<string, unknown>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeYoutubeUrl(value: string) {
  return value.trim();
}

export function extractYoutubeVideoId(value: string): string | null {
  const raw = normalizeYoutubeUrl(value);
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
    }

    if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") {
      return null;
    }

    const watchId = url.searchParams.get("v");
    if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
      return watchId;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts[0];
    const candidate = parts[1] ?? "";

    if (
      (marker === "shorts" || marker === "embed" || marker === "live") &&
      /^[a-zA-Z0-9_-]{11}$/.test(candidate)
    ) {
      return candidate;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseConciergeInspirationLibrary(
  availabilityHours?: string | null,
): ConciergeInspirationLibrary {
  const payload = parseAvailabilityPayloadJson(availabilityHours);
  const rawVideos = Array.isArray(payload.inspirationVideos) ? payload.inspirationVideos : [];
  const rawSearches = Array.isArray(payload.inspirationSearches) ? payload.inspirationSearches : [];
  const seen = new Set<string>();

  const videos = rawVideos
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => {
      const trimmed = item.trim();
      const id = extractYoutubeVideoId(trimmed);
      if (!id || seen.has(id)) return null;
      seen.add(id);

      return {
        id,
        sourceUrl: trimmed,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        kind: trimmed.includes("/shorts/") ? "short" : "video",
      } satisfies ConciergeInspirationVideo;
    })
    .filter((item): item is ConciergeInspirationVideo => item !== null);

  const searches = Array.from(
    new Set(
      rawSearches
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  return { videos, searches };
}

export function buildAvailabilityHoursWithInspirationLibrary(
  availabilityHours: string | null | undefined,
  payload: { videos: string[]; searches: string[] },
) {
  return JSON.stringify({
    ...parseAvailabilityPayloadJson(availabilityHours),
    inspirationVideos: payload.videos,
    inspirationSearches: payload.searches,
  });
}

export function buildYoutubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
