import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getAuthContext, PricingType, toOptionalNumber } from "@/app/api/pricing/_shared";

interface PricingInsertBody {
  profile_id?: string;
  service_id?: number | null;
  label: string;
  type?: PricingType;
  amount: number;
  unit?: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rawBody = await req.json();
    const targetProfileId =
      auth.isAdmin && typeof rawBody?.profile_id === "string" && rawBody.profile_id
        ? rawBody.profile_id
        : auth.userId;

    const body: PricingInsertBody = {
      profile_id: targetProfileId,
      service_id: toOptionalNumber(rawBody?.service_id),
      label: rawBody?.label,
      type: rawBody?.type,
      amount: Number(rawBody?.amount),
      unit: rawBody?.unit,
    };

    if (!body.label || !Number.isFinite(body.amount) || body.amount <= 0) {
      return NextResponse.json(
        { error: "label et amount > 0 sont requis" },
        { status: 400 },
      );
    }

    if (body.service_id === undefined) {
      return NextResponse.json({ error: "service_id invalide" }, { status: 400 });
    }

    const { data, error } = await db
      .from("services_pricing")
      .insert({
        profile_id: targetProfileId,
        service_id: body.service_id ?? null,
        label: body.label,
        type: body.type ?? "custom",
        amount: body.amount,
        unit: body.unit ?? "par prestation",
      })
      .select(`
        *,
        service:services_catalog(id, category, service, description)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pricing/create] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

