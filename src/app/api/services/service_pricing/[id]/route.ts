// src/app/api/services/service_pricing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/lib/dbServer";

interface ServicePricingUpdate {
  service_id?: number | null;
  label?: string;
  type?: string | null;
  amount?: number;
  unit?: string | null;
  is_default?: boolean | null;
}

async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET });
  return typeof token?.sub === "string" ? token.sub : null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { data, error } = await db
      .from("services_pricing")
      .select("*")
      .eq("id", id)
      .eq("profile_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 });
      }
      console.error("[GET /api/services/service_pricing/[id]] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/services/service_pricing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 });
      }
      console.error("[PATCH /api/services/service_pricing/[id]] DB error:", fetchError);
      return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 });
    }

    if (existing.profile_id !== userId) {
      return NextResponse.json(
        { error: "Non autorisé à modifier cette tarification" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateObj: ServicePricingUpdate = {};

    if (body.service_id !== undefined) {
      if (body.service_id === null) {
        updateObj.service_id = null;
      } else {
        const serviceId = Number(body.service_id);
        if (isNaN(serviceId)) {
          return NextResponse.json(
            { error: "service_id doit être un nombre valide" },
            { status: 400 }
          );
        }
        updateObj.service_id = serviceId;
      }
    }

    if (body.label !== undefined) updateObj.label = body.label;
    if (body.type !== undefined) updateObj.type = body.type;

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json(
          { error: "Le montant doit être un nombre positif" },
          { status: 400 }
        );
      }
      updateObj.amount = amount;
    }

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
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/services/service_pricing/[id]] DB error:", error);
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Le service_id spécifié n'existe pas" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/services/service_pricing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 });
      }
      console.error("[DELETE /api/services/service_pricing/[id]] DB error:", fetchError);
      return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 });
    }

    if (existing.profile_id !== userId) {
      return NextResponse.json(
        { error: "Non autorisé à supprimer cette tarification" },
        { status: 403 }
      );
    }

    const { error } = await db.from("services_pricing").delete().eq("id", id);
    if (error) {
      console.error("[DELETE /api/services/service_pricing/[id]] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tarification supprimée" });
  } catch (err) {
    console.error("[DELETE /api/services/service_pricing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}


