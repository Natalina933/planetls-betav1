import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/server/auth/roleGuards";
import {
  estimateMissionSchedule,
  type OptimizableMission,
  type RoutePoint,
} from "@/app/dashboard/concierge/planning/routeOptimization";
import { calculateRouteDistanceMatrix } from "@/app/dashboard/concierge/planning/routeProvider";

type OptimizeRouteBody = {
  startPoint?: RoutePoint;
  endPoint?: RoutePoint;
  missions?: OptimizableMission[];
};

const CONCIERGE_MISSION_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function sanitizePoint(point: RoutePoint | undefined, fallbackAddress: string): RoutePoint {
  return {
    address: String(point?.address || fallbackAddress),
    latitude: Number.isFinite(Number(point?.latitude)) ? Number(point?.latitude) : null,
    longitude: Number.isFinite(Number(point?.longitude)) ? Number(point?.longitude) : null,
  };
}

function isValidMission(value: unknown): value is OptimizableMission {
  if (!value || typeof value !== "object") return false;
  const mission = value as Partial<OptimizableMission>;
  return Boolean(mission.id && mission.title && Number.isFinite(Number(mission.estimatedDuration)));
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, CONCIERGE_MISSION_ROLES);
    if (!guard.ok) return guard.response;

    const auth = guard.auth;
    if (!auth.userId || !isUuidLike(auth.userId)) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body: OptimizeRouteBody = await req.json();
    const missions = Array.isArray(body.missions) ? body.missions.filter(isValidMission) : [];

    if (missions.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins une mission à optimiser." }, { status: 400 });
    }

    const startPoint = sanitizePoint(body.startPoint, "Point de départ concierge");
    const endPoint = body.endPoint ? sanitizePoint(body.endPoint, "Point de retour concierge") : undefined;
    const providerResult = await calculateRouteDistanceMatrix([startPoint, ...missions]);
    const result = estimateMissionSchedule(
      missions,
      startPoint,
      endPoint,
      providerResult.matrix,
      providerResult.provider,
      providerResult.mode,
    );

    return NextResponse.json({
      ...result,
      warnings: [...providerResult.warnings, ...result.warnings],
    });
  } catch (err) {
    console.error("[POST /api/concierge/optimized-routes/optimize] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
