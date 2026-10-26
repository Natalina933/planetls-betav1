import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { LooseSupabaseQuery } from "@/app/api/_shared/untypedSupabase";
import { geocodeLocation, isGeocodingServiceError } from "@/server/location/geocodeLocation";

type InterventionZoneRow = {
  service_area: string | null;
  service_radius_km: number | null;
  city: string | null;
  postal_code: string | null;
  intervention_zone_locked: boolean | null;
  availability_hours: string | null;
};

const profilesDb = db as unknown as {
  // The migration adds intervention_zone_locked; generated Supabase types can be refreshed later.
  from(table: "profiles"): LooseSupabaseQuery<InterventionZoneRow>;
};

const zonePatchSchema = z.object({
  serviceArea: z.string().trim().max(160).nullable().optional(),
  serviceRadiusKm: z.number().int().min(1).max(250).nullable().optional(),
  locked: z.boolean(),
});

function isConciergeRole(role: string) {
  return role === "concierge" || role === "concierge_pro" || role === "admin" || role === "super_admin";
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isConciergeRole(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data, error } = await profilesDb
      .from("profiles")
      .select("service_area, service_radius_km, city, postal_code, intervention_zone_locked")
      .eq("id", auth.userId)
      .single();

    if (error) {
      console.error("[GET /api/concierge/intervention-zone] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      serviceArea: data.service_area,
      serviceRadiusKm: data.service_radius_km,
      city: data.city,
      postalCode: data.postal_code,
      locked: data.intervention_zone_locked,
    });
  } catch (error) {
    console.error("[GET /api/concierge/intervention-zone] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!isConciergeRole(auth.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const parsed = zonePatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const { serviceArea, serviceRadiusKm, locked } = parsed.data;
    const { data: previous, error: readError } = await profilesDb.from("profiles")
      .select("service_area, availability_hours").eq("id", auth.userId).single();
    if (readError || !previous) return NextResponse.json({ error: "Impossible de lire la zone actuelle." }, { status: 500 });
    let availability: Record<string, unknown>;
    try {
      const raw: unknown = JSON.parse(previous.availability_hours || "{}");
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid payload");
      availability = raw as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Les préférences existantes ne peuvent pas être conservées." }, { status: 409 });
    }
    if (serviceArea !== undefined) {
      const point = serviceArea ? await geocodeLocation(serviceArea) : null;
      if (serviceArea && !point) return NextResponse.json({ error: "Zone d’intervention introuvable." }, { status: 422 });
      availability.zones = point ? [{ label: serviceArea, lat: point.latitude, lng: point.longitude,
        placeId: `nominatim:resolved:${point.latitude}:${point.longitude}` }] : [];
      availability.zoneDeclaration = "root_explicit";
    }
    if (serviceRadiusKm !== undefined) availability.radiusDeclaration = serviceRadiusKm === null ? null : "explicit";
    const updatePayload = {
      intervention_zone_locked: locked,
      ...(serviceArea !== undefined ? { service_area: serviceArea } : {}),
      ...(serviceRadiusKm !== undefined ? { service_radius_km: serviceRadiusKm } : {}),
      availability_hours: JSON.stringify(availability),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await profilesDb
      .from("profiles")
      .update(updatePayload)
      .eq("id", auth.userId)
      .select("service_area, service_radius_km, city, postal_code, intervention_zone_locked")
      .single();

    if (error) {
      console.error("[PATCH /api/concierge/intervention-zone] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      serviceArea: data.service_area,
      serviceRadiusKm: data.service_radius_km,
      city: data.city,
      postalCode: data.postal_code,
      locked: data.intervention_zone_locked,
    });
  } catch (error) {
    console.error("[PATCH /api/concierge/intervention-zone] ERROR:", error);
    if (isGeocodingServiceError(error)) return NextResponse.json({ error: "Localisation temporairement indisponible." }, { status: 503 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
