import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getAuthContext, PricingType, toOptionalNumber } from "@/app/api/pricing/_shared";

interface PricingUpdateBody {
  id: string;
  service_id?: number | null;
  label?: string;
  type?: PricingType;
  amount?: number;
  unit?: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rawBody = await req.json();
    const body: PricingUpdateBody = {
      id: rawBody?.id,
      service_id: toOptionalNumber(rawBody?.service_id),
      label: rawBody?.label,
      type: rawBody?.type,
      amount:
        rawBody?.amount === undefined ? undefined : Number(rawBody?.amount),
      unit: rawBody?.unit,
    };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await db
      .from("services_pricing")
      .select("id, profile_id")
      .eq("id", body.id)
      .maybeSingle();
    if (fetchError || !existing) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    if (!auth.isAdmin && existing.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const updateObj: Record<string, unknown> = {};
    if (body.service_id !== undefined) updateObj.service_id = body.service_id;
    if (body.label !== undefined) updateObj.label = body.label;
    if (body.type !== undefined) updateObj.type = body.type;
    if (body.amount !== undefined) {
      if (!Number.isFinite(body.amount) || body.amount <= 0) {
        return NextResponse.json({ error: "amount doit etre > 0" }, { status: 400 });
      }
      updateObj.amount = body.amount;
    }
    if (body.unit !== undefined) updateObj.unit = body.unit;

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour" }, { status: 400 });
    }

    const { data, error } = await db
      .from("services_pricing")
      .update(updateObj)
      .eq("id", body.id)
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[PATCH /api/pricing/update] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

