type NominatimItem = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
};

export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  displayName: string;
};

export class GeocodingServiceError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super("La localisation est temporairement indisponible. Patientez avant de relancer la recherche.");
    this.name = "GeocodingServiceError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isGeocodingServiceError(error: unknown): error is GeocodingServiceError {
  return error instanceof Error && error.name === "GeocodingServiceError";
}

type GeocodeState = {
  cache: Map<string, { expires: number; value: GeocodedLocation | null }>;
  pending: Map<string, Promise<GeocodedLocation | null>>;
  queue: Promise<unknown>;
  nextRequestAt: number;
  blockedUntil: number;
};
const newState = (): GeocodeState => ({ cache: new Map(), pending: new Map(), queue: Promise.resolve(), nextRequestAt: 0, blockedUntil: 0 });
const runtime = globalThis as typeof globalThis & { planetlsGeocodeState?: GeocodeState };
const sharedState = runtime.planetlsGeocodeState ??= newState();

export function createGeocoder(options: {
  fetch?: typeof fetch;
  now?: () => number;
  wait?: (milliseconds: number) => Promise<void>;
} = {}, state = newState()) {
  const request = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const wait = options.wait ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  return function geocode(location: string): Promise<GeocodedLocation | null> {
    const query = location.trim().replace(/\s+/g, " ");
    if (!query) return Promise.resolve(null);
    const key = query.toLocaleLowerCase("fr-FR");
    const cached = state.cache.get(key);
    if (cached && cached.expires > now()) return Promise.resolve(cached.value);
    const pending = state.pending.get(key);
    if (pending) return pending;
    const result = state.queue.then(async () => {
      if (state.blockedUntil > now()) throw new GeocodingServiceError(Math.ceil((state.blockedUntil - now()) / 1000));
      const delay = state.nextRequestAt - now();
      if (delay > 0) await wait(delay);
      state.nextRequestAt = now() + 1100;
      const value = await requestLocation(query, request, (retryAfter) => {
        state.blockedUntil = now() + retryAfter * 1000;
      }, now);
      if (state.cache.size >= 500) state.cache.delete(state.cache.keys().next().value!);
      state.cache.set(key, { value, expires: now() + (value ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000) });
      return value;
    });
    state.queue = result.catch(() => undefined);
    state.pending.set(key, result);
    void result.finally(() => state.pending.delete(key)).catch(() => undefined);
    return result;
  };
}

export const geocodeLocation = createGeocoder({}, sharedState);

async function requestLocation(
  location: string,
  request: typeof fetch,
  block: (seconds: number) => void,
  now: () => number,
): Promise<GeocodedLocation | null> {
  const query = location.trim();

  if (!query) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await request(url.toString(), {
    headers: {
      "Accept-Language": "fr",
      "User-Agent": "planetls-geocode",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const header = response.headers.get("Retry-After");
      const parsed = header ? Number(header) : NaN;
      const date = header ? Date.parse(header) : NaN;
      const seconds = Number.isFinite(parsed) ? parsed : Number.isFinite(date) ? Math.ceil((date - now()) / 1000) : 60;
      const retryAfter = Math.max(1, seconds);
      block(retryAfter);
      throw new GeocodingServiceError(retryAfter);
    }
    throw new Error(
      `Geocoding request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as NominatimItem[];

  const first = data[0];

  if (!first) {
    return null;
  }

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const address = first.address ?? {};

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    first.name ??
    query;

  return {
    latitude,
    longitude,
    city,
    displayName: first.display_name ?? city,
  };
}
