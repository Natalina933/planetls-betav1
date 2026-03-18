import { NextResponse } from "next/server";

const QUERY_MIN_LENGTH = 2;
const QUERY_MAX_LENGTH = 200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const CACHE_TTL_MS = 10 * 60_000;

const requestLog = new Map<string, number[]>();
const geocodeCache = new Map<
  string,
  { expiresAt: number; value: { latitude: number; longitude: number } }
>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = requestLog.get(ip) ?? [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recentAttempts[0])) / 1000),
    );
    requestLog.set(ip, recentAttempts);
    return { allowed: false, retryAfter };
  }

  recentAttempts.push(now);
  requestLog.set(ip, recentAttempts);
  return { allowed: true };
}

function readCachedGeocode(query: string): { latitude: number; longitude: number } | null {
  const cached = geocodeCache.get(query);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    geocodeCache.delete(query);
    return null;
  }

  return cached.value;
}

function writeCachedGeocode(query: string, value: { latitude: number; longitude: number }) {
  geocodeCache.set(query, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("q")?.trim() ?? "";

  if (!location) {
    return NextResponse.json({ error: "Parametre 'q' manquant" }, { status: 400 });
  }

  if (location.length < QUERY_MIN_LENGTH || location.length > QUERY_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Le parametre 'q' doit contenir entre ${QUERY_MIN_LENGTH} et ${QUERY_MAX_LENGTH} caracteres.`,
      },
      { status: 400 },
    );
  }

  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de requetes de geocodage. Reessayez plus tard." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter ?? 60),
        },
      },
    );
  }

  const cacheKey = location.toLowerCase();
  const cached = readCachedGeocode(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
      },
    });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "planetls-beta/1.0 (server geocode endpoint)",
        },
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (!res.ok) {
      console.error("Erreur API /geocode : upstream status", res.status);
      return NextResponse.json({ error: "Service de geocodage indisponible" }, { status: 502 });
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Localisation introuvable" }, { status: 404 });
    }

    const { lat, lon } = data[0];
    const latitude = Number.parseFloat(lat);
    const longitude = Number.parseFloat(lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: "Coordonnees invalides" }, { status: 502 });
    }

    const payload = { latitude, longitude };
    writeCachedGeocode(cacheKey, payload);

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Erreur API /geocode :", error.message);
      return NextResponse.json({ error: "Erreur serveur de geocodage" }, { status: 500 });
    }

    console.error("Erreur inconnue dans /geocode :", error);
    return NextResponse.json({ error: "Erreur serveur de geocodage" }, { status: 500 });
  }
}
