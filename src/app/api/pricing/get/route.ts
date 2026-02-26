import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getAuthContext } from "@/app/api/pricing/_shared";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const profileId = searchParams.get("profileId");
    const serviceId = searchParams.get("serviceId");
    const type = searchParams.get("type");

    let query = db.from("services_pricing").select(`
      *,
      service:services_catalog(id, category, service, description)
    `);

    if (auth.isAdmin && profileId) {
      query = query.eq("profile_id", profileId);
    } else {
      query = query.eq("profile_id", auth.userId);
    }

    if (serviceId) {
      const parsedServiceId = Number(serviceId);
      if (!Number.isFinite(parsedServiceId)) {
        return NextResponse.json({ error: "serviceId invalide" }, { status: 400 });
      }
      query = query.eq("service_id", parsedServiceId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("[GET /api/pricing/get] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

