import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  ALLOWED_PRICING_ROLES,
  getAuthContext,
  PricingType,
} from "@/app/api/pricing/_shared";

interface PricingUpdateBody {
  service_id?: number | null;
  label?: string;
  type?: PricingType;
  amount?: number;
  unit?: string;
  property_type?: string | null;
  surface_min?: number | null;
  surface_max?: number | null;
  estimated_duration?: number | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const { data, error } = await db
      .from("services_pricing")
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[GET /api/pricing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    if (!auth.isAdmin && data.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/pricing/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { data: existing } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || (!auth.isAdmin && existing.profile_id !== auth.userId)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const rawBody = await req.json();
    const body: PricingUpdateBody = {
      service_id:
        rawBody.service_id !== undefined &&
        rawBody.service_id !== null &&
        rawBody.service_id !== ""
          ? Number(rawBody.service_id)
          : rawBody.service_id === null
            ? null
            : undefined,
      label: rawBody.label,
      type: rawBody.type,
      amount: rawBody.amount,
      unit: rawBody.unit,
      property_type:
        rawBody.property_type !== undefined
          ? typeof rawBody.property_type === "string" && rawBody.property_type.trim()
            ? rawBody.property_type.trim()
            : null
          : undefined,
      surface_min:
        rawBody.surface_min !== undefined
          ? rawBody.surface_min === null || rawBody.surface_min === ""
            ? null
            : Number(rawBody.surface_min)
          : undefined,
      surface_max:
        rawBody.surface_max !== undefined
          ? rawBody.surface_max === null || rawBody.surface_max === ""
            ? null
            : Number(rawBody.surface_max)
          : undefined,
      estimated_duration:
        rawBody.estimated_duration !== undefined
          ? rawBody.estimated_duration === null || rawBody.estimated_duration === ""
            ? null
            : Number(rawBody.estimated_duration)
          : undefined,
    };

    const updateObj: Partial<PricingUpdateBody> = {};
    if (body.service_id !== undefined) updateObj.service_id = body.service_id;
    if (body.label !== undefined) updateObj.label = body.label;
    if (body.type !== undefined) updateObj.type = body.type;
    if (body.amount !== undefined) updateObj.amount = body.amount;
    if (body.unit !== undefined) updateObj.unit = body.unit;
    if (body.property_type !== undefined) updateObj.property_type = body.property_type;
    if (body.surface_min !== undefined) updateObj.surface_min = body.surface_min;
    if (body.surface_max !== undefined) updateObj.surface_max = body.surface_max;
    if (body.estimated_duration !== undefined) {
      updateObj.estimated_duration = body.estimated_duration;
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnee a mettre a jour" },
        { status: 400 },
      );
    }

    const { data, error } = await db
      .from("services_pricing")
      .update(updateObj as never)
      .eq("id", id)
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .single();

    if (error) {
      console.error(`[PATCH /api/pricing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/pricing/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { data: existing } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || (!auth.isAdmin && existing.profile_id !== auth.userId)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await db.from("services_pricing").delete().eq("id", id);
    if (error) {
      console.error(`[DELETE /api/pricing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tarif supprime" });
  } catch (err) {
    console.error("[DELETE /api/pricing/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
