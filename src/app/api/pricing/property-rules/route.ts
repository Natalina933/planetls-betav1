import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  ALLOWED_PRICING_ROLES,
  getAuthContext,
  toOptionalNumber,
} from "@/app/api/pricing/_shared";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { data, error } = await db
      .from("pricing_property_rules")
      .select("*")
      .eq("concierge_profile_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("[GET /api/pricing/property-rules] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json();
    const deltaPct = toOptionalNumber(body?.delta_pct);

    const { data, error } = await db
      .from("pricing_property_rules")
      .insert({
        concierge_profile_id: auth.userId,
        service_id: toOptionalNumber(body?.service_id),
        property_type:
          typeof body?.property_type === "string" && body.property_type.trim()
            ? body.property_type.trim()
            : null,
        min_surface_m2: toOptionalNumber(body?.min_surface_m2),
        max_surface_m2: toOptionalNumber(body?.max_surface_m2),
        delta_pct: deltaPct ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pricing/property-rules] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
