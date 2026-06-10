import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { Json } from "@/types/supabase";

type UntypedSupabaseTable = {
  insert: (payload: unknown) => {
    select: (columns: string) => {
      single: () => Promise<{
        data: { id: string } | null;
        error: { code?: string; message?: string } | null;
      }>;
    };
  } & PromiseLike<{
    error: { code?: string; message?: string } | null;
  }>;
};

type UntypedSupabaseClient = {
  from: (table: string) => UntypedSupabaseTable;
};

type SaveOptimizedRouteBody = {
  startPoint?: {
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  result?: {
    totalDistance?: number;
    totalTravelTime?: number;
    totalMissionTime?: number;
    estimatedStartTime?: string;
    estimatedEndTime?: string;
    routeProvider?: string;
    routeProviderMode?: string;
    warnings?: string[];
    stops?: Array<{
      order?: number;
      estimatedArrivalTime?: string;
      estimatedDepartureTime?: string;
      travelTimeFromPrevious?: number;
      distanceFromPrevious?: number;
      warningMessage?: string | null;
      mission?: {
        id?: string;
        title?: string;
        serviceType?: string;
        address?: string;
        latitude?: number | null;
        longitude?: number | null;
        estimatedDuration?: number;
        preferredStartTime?: string | null;
        preferredEndTime?: string | null;
        priority?: string;
        status?: string | null;
        constraints?: string[];
      };
    }>;
  };
};

const CONCIERGE_MISSION_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function validDateOrNull(value: string | undefined | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function routeDate(value: string | undefined) {
  const date = validDateOrNull(value);
  return date ? date.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function mapRouteSaveError(error: { code?: string; message?: string } | null) {
  if (error?.code === "42P01") {
    return {
      status: 500,
      error: "Tables optimized_routes introuvables. Lancez les migrations avant la sauvegarde.",
    };
  }

  return {
    status: 500,
    error:
      error?.message && process.env.NODE_ENV !== "production"
        ? `Erreur sauvegarde tournée: ${error.message}`
        : "Erreur sauvegarde tournée",
  };
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, CONCIERGE_MISSION_ROLES);
    if (!guard.ok) return guard.response;

    const auth = guard.auth;
    if (!auth.userId || !isUuidLike(auth.userId)) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body: SaveOptimizedRouteBody = await req.json();
    const result = body.result;
    const stops = Array.isArray(result?.stops) ? result.stops : [];

    if (!result || stops.length === 0) {
      return NextResponse.json({ error: "Aucune tournée à sauvegarder." }, { status: 400 });
    }

    const routePayload = {
      concierge_profile_id: auth.userId,
      route_date: routeDate(result.estimatedStartTime),
      start_address: body.startPoint?.address ?? null,
      start_latitude: body.startPoint?.latitude ?? null,
      start_longitude: body.startPoint?.longitude ?? null,
      end_address: null,
      end_latitude: null,
      end_longitude: null,
      total_distance: Number(result.totalDistance ?? 0).toFixed(2),
      total_travel_time: Math.round(Number(result.totalTravelTime ?? 0)),
      total_mission_time: Math.round(Number(result.totalMissionTime ?? 0)),
      status: "saved",
      snapshot: {
        estimatedStartTime: result.estimatedStartTime ?? null,
        estimatedEndTime: result.estimatedEndTime ?? null,
        routeProvider: result.routeProvider ?? null,
        routeProviderMode: result.routeProviderMode ?? null,
        warnings: result.warnings ?? [],
      } satisfies Json,
    };

    const routeDb = db as unknown as UntypedSupabaseClient;
    const routeInsert = await routeDb
      .from("optimized_routes")
      .insert(routePayload)
      .select("id")
      .single();

    if (routeInsert.error || !routeInsert.data) {
      console.error("[POST /api/concierge/optimized-routes] route error:", routeInsert.error);
      const mapped = mapRouteSaveError(routeInsert.error);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    const routeId = routeInsert.data.id;
    const stopPayload = stops.map((stop, index) => ({
      route_id: routeId,
      mission_id: stop.mission?.id && isUuidLike(stop.mission.id) ? stop.mission.id : null,
      stop_order: Number(stop.order ?? index + 1),
      estimated_arrival_time: validDateOrNull(stop.estimatedArrivalTime),
      estimated_departure_time: validDateOrNull(stop.estimatedDepartureTime),
      travel_time_from_previous: Math.round(Number(stop.travelTimeFromPrevious ?? 0)),
      distance_from_previous: Number(stop.distanceFromPrevious ?? 0).toFixed(2),
      warning_message: stop.warningMessage ?? null,
      mission_snapshot: (stop.mission ?? {}) as Json,
    }));

    const stopsInsert = await routeDb.from("optimized_route_stops").insert(stopPayload);
    if (stopsInsert.error) {
      console.error("[POST /api/concierge/optimized-routes] stops error:", stopsInsert.error);
      const mapped = mapRouteSaveError(stopsInsert.error);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    return NextResponse.json({ id: routeId, status: "saved" }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/concierge/optimized-routes] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
