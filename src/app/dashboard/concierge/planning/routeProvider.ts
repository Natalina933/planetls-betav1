import {
  calculateDistanceMatrix,
  hasUsableCoordinates,
  type DistanceMatrixCell,
  type RoutePoint,
} from "./routeOptimization";

export type RouteProviderName = "fallback" | "osrm" | "openrouteservice" | "mapbox";

export type RouteProviderResult = {
  provider: RouteProviderName;
  mode: "api" | "fallback";
  matrix: DistanceMatrixCell[][];
  warnings: string[];
};

type MatrixApiResponse = {
  distances?: number[][];
  durations?: number[][];
};

const FALLBACK_WARNING =
  "Aucun fournisseur cartographique actif ou trajet API indisponible: estimation locale utilisée.";

function hasCompleteCoordinates(points: RoutePoint[]) {
  return points.every(hasUsableCoordinates);
}

function coordinatesPath(points: RoutePoint[]) {
  return points.map((point) => `${point.longitude},${point.latitude}`).join(";");
}

function matrixFromMetersAndSeconds(
  distances: number[][] | undefined,
  durations: number[][] | undefined,
  fallback: DistanceMatrixCell[][],
) {
  return fallback.map((row, rowIndex) =>
    row.map((cell, cellIndex) => {
      const distanceMeters = distances?.[rowIndex]?.[cellIndex];
      const durationSeconds = durations?.[rowIndex]?.[cellIndex];

      if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
        return {
          ...cell,
          warningMessage: cell.warningMessage ?? "Trajet indisponible chez le fournisseur cartographique.",
        };
      }

      return {
        distanceKm: Number(distanceMeters) / 1000,
        travelTimeMinutes: Math.max(1, Math.ceil(Number(durationSeconds) / 60)),
      };
    }),
  );
}

async function fetchOsrmMatrix(points: RoutePoint[], fallback: DistanceMatrixCell[][]) {
  const baseUrl = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
  const url = `${baseUrl.replace(/\/$/, "")}/table/v1/driving/${coordinatesPath(points)}?annotations=distance,duration`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("OSRM n'a pas pu calculer la matrice.");
  const payload = (await response.json()) as MatrixApiResponse;
  return matrixFromMetersAndSeconds(payload.distances, payload.durations, fallback);
}

async function fetchOpenRouteServiceMatrix(points: RoutePoint[], fallback: DistanceMatrixCell[][]) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) throw new Error("Clé OpenRouteService absente.");

  const response = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locations: points.map((point) => [point.longitude, point.latitude]),
      metrics: ["distance", "duration"],
      units: "m",
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("OpenRouteService n'a pas pu calculer la matrice.");
  const payload = (await response.json()) as MatrixApiResponse;
  return matrixFromMetersAndSeconds(payload.distances, payload.durations, fallback);
}

async function fetchMapboxMatrix(points: RoutePoint[], fallback: DistanceMatrixCell[][]) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("Token Mapbox absent.");

  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinatesPath(
    points,
  )}?annotations=distance,duration&access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Mapbox n'a pas pu calculer la matrice.");
  const payload = (await response.json()) as MatrixApiResponse;
  return matrixFromMetersAndSeconds(payload.distances, payload.durations, fallback);
}

export async function calculateRouteDistanceMatrix(points: RoutePoint[]): Promise<RouteProviderResult> {
  const fallback = calculateDistanceMatrix(points);
  const configuredProvider = (process.env.ROUTE_PROVIDER || "fallback").toLowerCase() as RouteProviderName;

  if (!hasCompleteCoordinates(points)) {
    return {
      provider: "fallback",
      mode: "fallback",
      matrix: fallback,
      warnings: ["Coordonnées GPS incomplètes: estimation locale utilisée."],
    };
  }

  try {
    if (configuredProvider === "osrm") {
      return { provider: "osrm", mode: "api", matrix: await fetchOsrmMatrix(points, fallback), warnings: [] };
    }

    if (configuredProvider === "openrouteservice") {
      return {
        provider: "openrouteservice",
        mode: "api",
        matrix: await fetchOpenRouteServiceMatrix(points, fallback),
        warnings: [],
      };
    }

    if (configuredProvider === "mapbox") {
      return { provider: "mapbox", mode: "api", matrix: await fetchMapboxMatrix(points, fallback), warnings: [] };
    }
  } catch (error) {
    return {
      provider: configuredProvider,
      mode: "fallback",
      matrix: fallback,
      warnings: [error instanceof Error ? error.message : FALLBACK_WARNING, FALLBACK_WARNING],
    };
  }

  return {
    provider: "fallback",
    mode: "fallback",
    matrix: fallback,
    warnings: [FALLBACK_WARNING],
  };
}
