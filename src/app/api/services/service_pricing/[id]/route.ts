import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  getServiceAuthContext,
  isAllowedServiceRole,
  serviceAuthError,
} from "@/app/api/services/_shared";

interface ServicePricingUpdate {
  service_id?: number | null;
  label?: string;
  type?: string | null;
  amount?: number;
  unit?: string | null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    let query = db.from("services_pricing").select("*").eq("id", id);
    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }

    const { data, error } = await query.single();
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Tarification introuvable" }, { status: 404 });
      }
      console.error("[GET /api/services/service_pricing/[id]] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la recuperation" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/services/service_pricing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
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
      return NextResponse.json({ error: "Erreur lors de la verification" }, { status: 500 });
    }

    if (!auth.isAdmin && existing.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise a modifier cette tarification" }, { status: 403 });
    }

    const body = await req.json();
    const updateObj: ServicePricingUpdate = {};

    if (body.service_id !== undefined) {
      if (body.service_id === null) {
        updateObj.service_id = null;
      } else {
        const serviceId = Number(body.service_id);
        if (Number.isNaN(serviceId)) {
          return NextResponse.json({ error: "service_id doit etre un nombre valide" }, { status: 400 });
        }
        updateObj.service_id = serviceId;
      }
    }

    if (body.label !== undefined) updateObj.label = body.label;
    if (body.type !== undefined) updateObj.type = body.type;

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (Number.isNaN(amount) || amount < 0) {
        return NextResponse.json({ error: "Le montant doit etre un nombre positif" }, { status: 400 });
      }
      updateObj.amount = amount;
    }

    if (body.unit !== undefined) updateObj.unit = body.unit;

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour" }, { status: 400 });
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
        return NextResponse.json({ error: "Le service_id specifie n'existe pas" }, { status: 400 });
      }
      return NextResponse.json({ error: "Erreur lors de la mise a jour" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/services/service_pricing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
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
      return NextResponse.json({ error: "Erreur lors de la verification" }, { status: 500 });
    }

    if (!auth.isAdmin && existing.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise a supprimer cette tarification" }, { status: 403 });
    }

    const { error } = await db.from("services_pricing").delete().eq("id", id);
    if (error) {
      console.error("[DELETE /api/services/service_pricing/[id]] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tarification supprimee" });
  } catch (err) {
    console.error("[DELETE /api/services/service_pricing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
