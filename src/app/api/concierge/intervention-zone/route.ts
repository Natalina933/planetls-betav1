import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const profilesDb = db as unknown as {
  // The migration adds intervention_zone_locked; generated Supabase types can be refreshed later.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: "profiles"): any;
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
    const updatePayload = {
      intervention_zone_locked: locked,
      ...(serviceArea !== undefined ? { service_area: serviceArea } : {}),
      ...(serviceRadiusKm !== undefined ? { service_radius_km: serviceRadiusKm } : {}),
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

    return NextResponse.json({
      serviceArea: data.service_area,
      serviceRadiusKm: data.service_radius_km,
      city: data.city,
      postalCode: data.postal_code,
      locked: data.intervention_zone_locked,
    });
  } catch (error) {
    console.error("[PATCH /api/concierge/intervention-zone] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
