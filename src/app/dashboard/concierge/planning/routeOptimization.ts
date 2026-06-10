export type MissionPriority = "low" | "normal" | "high" | "urgent";

export type OptimizableMission = {
  id: string;
  conciergeId: string | null;
  ownerId: string | null;
  title: string;
  serviceType: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  estimatedDuration: number;
  preferredStartTime: string | null;
  preferredEndTime: string | null;
  priority: MissionPriority;
  status: string | null;
  constraints: string[];
};

export type RoutePoint = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type DistanceMatrixCell = {
  distanceKm: number;
  travelTimeMinutes: number;
  warningMessage?: string;
};

export type OptimizedRouteStop = {
  mission: OptimizableMission;
  order: number;
  estimatedArrivalTime: string;
  estimatedDepartureTime: string;
  travelTimeFromPrevious: number;
  distanceFromPrevious: number;
  warningMessage: string | null;
};

export type OptimizedRouteResult = {
  stops: OptimizedRouteStop[];
  totalDistance: number;
  totalTravelTime: number;
  totalMissionTime: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  warnings: string[];
  routeProvider: string;
  routeProviderMode: "api" | "fallback";
};

type EstimateMissionScheduleOptions = {
  preserveMissionOrder?: boolean;
};

const PRIORITY_WEIGHT: Record<MissionPriority, number> = {
  urgent: 0,
  high: 12,
  normal: 28,
  low: 44,
};

const AVERAGE_SPEED_KMH = 34;
const ROUTE_FACTOR = 1.28;

function isFiniteCoordinate(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value !== 0;
}

export function hasUsableCoordinates(point: RoutePoint) {
  return isFiniteCoordinate(point.latitude) && isFiniteCoordinate(point.longitude);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateHaversineDistanceKm(from: RoutePoint, to: RoutePoint) {
  if (!hasUsableCoordinates(from) || !hasUsableCoordinates(to)) return null;

  const earthRadiusKm = 6371;
  const latDelta = toRadians((to.latitude as number) - (from.latitude as number));
  const lonDelta = toRadians((to.longitude as number) - (from.longitude as number));
  const lat1 = toRadians(from.latitude as number);
  const lat2 = toRadians(to.latitude as number);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function calculateDistanceMatrix(points: RoutePoint[]): DistanceMatrixCell[][] {
  return points.map((from) =>
    points.map((to) => {
      if (from === to) return { distanceKm: 0, travelTimeMinutes: 0 };

      const directDistance = calculateHaversineDistanceKm(from, to);
      if (directDistance === null) {
        return {
          distanceKm: 0,
          travelTimeMinutes: 0,
          warningMessage: "Coordonnées manquantes pour estimer ce trajet.",
        };
      }

      const distanceKm = directDistance * ROUTE_FACTOR;
      return {
        distanceKm,
        travelTimeMinutes: Math.max(4, Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60)),
      };
    }),
  );
}

function minutesFromStartOfDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function getRouteDay(missions: OptimizableMission[]) {
  const datedMission = missions.find((mission) => mission.preferredStartTime || mission.preferredEndTime);
  const date = datedMission?.preferredStartTime || datedMission?.preferredEndTime;
  const day = date ? new Date(date) : new Date();
  if (Number.isNaN(day.getTime())) return new Date();
  day.setHours(8, 30, 0, 0);
  return day;
}

function scoreCandidate(
  mission: OptimizableMission,
  travel: DistanceMatrixCell,
  currentMinute: number,
) {
  const preferredStart = minutesFromStartOfDay(mission.preferredStartTime);
  const preferredEnd = minutesFromStartOfDay(mission.preferredEndTime);
  const arrival = currentMinute + travel.travelTimeMinutes;
  const wait = preferredStart !== null && arrival < preferredStart ? preferredStart - arrival : 0;
  const lateness = preferredEnd !== null && arrival > preferredEnd ? arrival - preferredEnd : 0;

  return travel.travelTimeMinutes + wait * 0.5 + lateness * 3 + PRIORITY_WEIGHT[mission.priority];
}

export function optimizeMissionOrder(
  missions: OptimizableMission[],
  startPoint: RoutePoint,
  distanceMatrix?: DistanceMatrixCell[][],
) {
  const points = [startPoint, ...missions.map((mission) => mission)];
  const matrix = distanceMatrix ?? calculateDistanceMatrix(points);
  const remaining = missions.map((mission, index) => ({ mission, matrixIndex: index + 1 }));
  const ordered: OptimizableMission[] = [];
  let currentMatrixIndex = 0;
  let currentMinute = 8 * 60 + 30;

  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      const scoreA = scoreCandidate(a.mission, matrix[currentMatrixIndex][a.matrixIndex], currentMinute);
      const scoreB = scoreCandidate(b.mission, matrix[currentMatrixIndex][b.matrixIndex], currentMinute);
      return scoreA - scoreB;
    });

    const next = remaining.shift();
    if (!next) break;

    const travel = matrix[currentMatrixIndex][next.matrixIndex];
    const preferredStart = minutesFromStartOfDay(next.mission.preferredStartTime);
    currentMinute = Math.max(currentMinute + travel.travelTimeMinutes, preferredStart ?? 0);
    currentMinute += next.mission.estimatedDuration;
    currentMatrixIndex = next.matrixIndex;
    ordered.push(next.mission);
  }

  return ordered;
}

export function estimateMissionSchedule(
  missions: OptimizableMission[],
  startPoint: RoutePoint,
  endPoint?: RoutePoint,
  distanceMatrix?: DistanceMatrixCell[][],
  routeProvider = "fallback",
  routeProviderMode: "api" | "fallback" = "fallback",
  options: EstimateMissionScheduleOptions = {},
): OptimizedRouteResult {
  const day = getRouteDay(missions);
  const initialPoints = [startPoint, ...missions.map((mission) => mission)];
  const initialMatrix = distanceMatrix ?? calculateDistanceMatrix(initialPoints);
  const ordered = options.preserveMissionOrder ? missions : optimizeMissionOrder(missions, startPoint, initialMatrix);
  const originalMatrixIndexes = new Map(missions.map((mission, index) => [mission.id, index + 1]));
  const orderedMatrixIndexes = [0, ...ordered.map((mission) => originalMatrixIndexes.get(mission.id) ?? 0)];
  const matrix = distanceMatrix
    ? orderedMatrixIndexes.map((fromIndex) =>
        orderedMatrixIndexes.map((toIndex) => initialMatrix[fromIndex]?.[toIndex] ?? {
          distanceKm: 0,
          travelTimeMinutes: 0,
          warningMessage: "Trajet indisponible dans la matrice cartographique.",
        }),
      )
    : calculateDistanceMatrix([startPoint, ...ordered.map((mission) => mission)]);
  const warnings = new Set<string>();
  let currentDate = new Date(day);
  let totalDistance = 0;
  let totalTravelTime = 0;
  let totalMissionTime = 0;

  const stops = ordered.map((mission, index) => {
    const travel = matrix[index][index + 1];
    const preferredStart = mission.preferredStartTime ? new Date(mission.preferredStartTime) : null;
    const preferredEnd = mission.preferredEndTime ? new Date(mission.preferredEndTime) : null;
    const stopWarnings: string[] = [];

    currentDate = new Date(currentDate.getTime() + travel.travelTimeMinutes * 60 * 1000);
    if (preferredStart && currentDate < preferredStart) {
      currentDate = new Date(preferredStart);
    }

    const arrival = new Date(currentDate);
    const departure = new Date(arrival.getTime() + mission.estimatedDuration * 60 * 1000);

    if (!mission.address) stopWarnings.push("Adresse manquante.");
    if (!hasUsableCoordinates(mission)) stopWarnings.push("Coordonnées manquantes.");
    if (travel.warningMessage) stopWarnings.push(travel.warningMessage);
    if (travel.distanceKm > 35) stopWarnings.push("Mission éloignée du précédent passage.");
    if (preferredEnd && arrival > preferredEnd) stopWarnings.push("Plage horaire incompatible.");
    if (mission.constraints.length > 0) stopWarnings.push(mission.constraints.join(" "));

    totalDistance += travel.distanceKm;
    totalTravelTime += travel.travelTimeMinutes;
    totalMissionTime += mission.estimatedDuration;
    currentDate = departure;
    stopWarnings.forEach((warning) => warnings.add(`${mission.title}: ${warning}`));

    return {
      mission,
      order: index + 1,
      estimatedArrivalTime: arrival.toISOString(),
      estimatedDepartureTime: departure.toISOString(),
      travelTimeFromPrevious: travel.travelTimeMinutes,
      distanceFromPrevious: travel.distanceKm,
      warningMessage: stopWarnings.length > 0 ? stopWarnings.join(" ") : null,
    };
  });

  if (endPoint && hasUsableCoordinates(endPoint) && stops.length > 0) {
    const last = stops[stops.length - 1].mission;
    const returnDistance = calculateHaversineDistanceKm(last, endPoint);
    if (returnDistance !== null) {
      const distance = returnDistance * ROUTE_FACTOR;
      totalDistance += distance;
      totalTravelTime += Math.ceil((distance / AVERAGE_SPEED_KMH) * 60);
    }
  }

  if (totalTravelTime + totalMissionTime > 9 * 60) {
    warnings.add("La durée totale dépasse une journée terrain de 9 heures.");
  }

  return {
    stops,
    totalDistance,
    totalTravelTime,
    totalMissionTime,
    estimatedStartTime: day.toISOString(),
    estimatedEndTime: currentDate.toISOString(),
    warnings: Array.from(warnings),
    routeProvider,
    routeProviderMode,
  };
}

export function reorderOptimizedStops(
  stops: OptimizedRouteStop[],
  fromIndex: number,
  toIndex: number,
  startPoint: RoutePoint,
) {
  const next = [...stops];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return estimateMissionSchedule(stops.map((stop) => stop.mission), startPoint);
  next.splice(toIndex, 0, moved);
  return estimateMissionSchedule(next.map((stop) => stop.mission), startPoint, undefined, undefined, "manual", "fallback", {
    preserveMissionOrder: true,
  });
}
