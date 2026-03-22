import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  fetchPricingList,
  getAuthContext,
  isAllowedPricingRole,
} from "@/app/api/pricing/_shared";

type PricingType = "hourly" | "fixed" | "monthly" | "custom";

interface PricingInsertBody {
  service_id?: number | null;
  label: string;
  type?: PricingType;
  amount: number;
  unit?: string;
  property_type?: string | null;
  surface_min?: number | null;
  surface_max?: number | null;
  estimated_duration?: number | null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!isAllowedPricingRole(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const profileId = searchParams.get("profileId");
    const serviceId = searchParams.get("serviceId");
    const type = searchParams.get("type");

    const result = await fetchPricingList({
      profileId,
      serviceId,
      type,
      isAdmin: auth.isAdmin,
      userId: auth.userId,
    });

    if (typeof result.error === "string") {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (result.error) {
      console.error("[GET /api/pricing] DB error:", result.error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("[GET /api/pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!isAllowedPricingRole(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rawBody = await req.json();

    const body: PricingInsertBody = {
      service_id:
        rawBody.service_id !== undefined &&
        rawBody.service_id !== null &&
        rawBody.service_id !== ""
          ? Number(rawBody.service_id)
          : null,
      label: rawBody.label,
      type: rawBody.type,
      amount: rawBody.amount,
      unit: rawBody.unit,
      property_type:
        typeof rawBody.property_type === "string" && rawBody.property_type.trim()
          ? rawBody.property_type.trim()
          : null,
      surface_min:
        rawBody.surface_min !== undefined && rawBody.surface_min !== null && rawBody.surface_min !== ""
          ? Number(rawBody.surface_min)
          : null,
      surface_max:
        rawBody.surface_max !== undefined && rawBody.surface_max !== null && rawBody.surface_max !== ""
          ? Number(rawBody.surface_max)
          : null,
      estimated_duration:
        rawBody.estimated_duration !== undefined &&
        rawBody.estimated_duration !== null &&
        rawBody.estimated_duration !== ""
          ? Number(rawBody.estimated_duration)
          : null,
    };

    if (!body.label || body.amount === undefined) {
      return NextResponse.json(
        { error: "Label et montant requis" },
        { status: 400 },
      );
    }

    const insertPayload = {
      profile_id: auth.userId,
      service_id: body.service_id ?? null,
      label: body.label,
      type: body.type ?? "custom",
      amount: body.amount,
      unit: body.unit ?? "EUR",
      property_type: body.property_type ?? null,
      surface_min: body.surface_min ?? null,
      surface_max: body.surface_max ?? null,
      estimated_duration: body.estimated_duration ?? null,
    } as never;

    const { data, error } = await db
      .from("services_pricing")
      .insert(insertPayload)
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .single();

    if (error) {
      console.error("[POST /api/pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
