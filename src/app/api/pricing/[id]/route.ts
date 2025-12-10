// src/app/api/pricing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

type PricingType = "hourly" | "fixed" | "monthly" | "custom";

interface PricingUpdateBody {
  service_id?: number | null; // number comme dans Supabase
  label?: string;
  type?: PricingType;
  amount?: number;
  unit?: string;
  is_default?: boolean;
}

// GET /api/pricing/[id] -> Récupérer un tarif spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await db
      .from("services_pricing")
      .select(
        `
        *,
        service:services_catalog(id, category, service, description)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[GET /api/pricing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`[GET /api/pricing/:id] ERROR:`, err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/pricing/[id] -> Modifier un tarif
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérification auth
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le tarif appartient bien à l'utilisateur
    const { data: existing } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || existing.profile_id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Parser le body avec conversion service_id en number
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
      is_default: rawBody.is_default,
    };

    // Construire l'objet de mise à jour (seulement les champs fournis)
    const updateObj: Partial<PricingUpdateBody> = {};

    if (body.service_id !== undefined) updateObj.service_id = body.service_id;
    if (body.label !== undefined) updateObj.label = body.label;
    if (body.type !== undefined) updateObj.type = body.type;
    if (body.amount !== undefined) updateObj.amount = body.amount;
    if (body.unit !== undefined) updateObj.unit = body.unit;
    if (body.is_default !== undefined) updateObj.is_default = body.is_default;

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("services_pricing")
      .update(updateObj)
      .eq("id", id)
      .select(
        `
        *,
        service:services_catalog(id, category, service, description)
      `
      )
      .single();

    if (error) {
      console.error(`[PATCH /api/pricing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`[PATCH /api/pricing/:id] ERROR:`, err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pricing/[id] -> Supprimer un tarif
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérification auth
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le tarif appartient bien à l'utilisateur
    const { data: existing } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (!existing || existing.profile_id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await db.from("services_pricing").delete().eq("id", id);

    if (error) {
      console.error(`[DELETE /api/pricing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tarif supprimé" });
  } catch (err) {
    console.error(`[DELETE /api/pricing/:id] ERROR:`, err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
