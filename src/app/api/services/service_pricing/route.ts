import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  requireServiceAuthContext,
} from "@/app/api/services/_shared";

interface ServicePricingInsert {
  profile_id: string;
  service_id?: number | null;
  label: string;
  type?: string | null;
  amount: number;
  unit?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireServiceAuthContext(req);
    if (!authResult.ok) {
      return authResult.response;
    }
    const auth = authResult.auth;

    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profile_id");
    const serviceIdParam = searchParams.get("service_id");
    const type = searchParams.get("type");

    if (profileId && !auth.isAdmin && profileId !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    let query = db.from("services_pricing").select("*");

    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    } else if (profileId) {
      query = query.eq("profile_id", profileId);
    }

    if (serviceIdParam) {
      const serviceId = Number(serviceIdParam);
      if (Number.isNaN(serviceId)) {
        return NextResponse.json({ error: "service_id doit etre un nombre valide" }, { status: 400 });
      }
      query = query.eq("service_id", serviceId);
    }

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[GET /api/services/service_pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la recuperation des tarifications" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/services/service_pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireServiceAuthContext(req);
    if (!authResult.ok) {
      return authResult.response;
    }
    const auth = authResult.auth;

    const body = await req.json();

    if (!body.label) {
      return NextResponse.json({ error: "Le label est requis" }, { status: 400 });
    }
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json({ error: "Le montant est requis" }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Le montant doit etre un nombre positif" }, { status: 400 });
    }

    let serviceId: number | null = null;
    if (body.service_id !== undefined && body.service_id !== null) {
      serviceId = Number(body.service_id);
      if (Number.isNaN(serviceId)) {
        return NextResponse.json({ error: "service_id doit etre un nombre valide" }, { status: 400 });
      }
    }

    const insertData: ServicePricingInsert = {
      profile_id: auth.userId,
      service_id: serviceId,
      label: body.label,
      type: body.type ?? null,
      amount,
      unit: body.unit ?? null,
    };

    const { data, error } = await db.from("services_pricing").insert(insertData).select().single();

    if (error) {
      console.error("[POST /api/services/service_pricing] DB error:", error);
      if (error.code === "23503") {
        return NextResponse.json({ error: "Le service_id specifie n'existe pas" }, { status: 400 });
      }
      return NextResponse.json({ error: "Erreur lors de la creation de la tarification" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/services/service_pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireServiceAuthContext(req);
    if (!authResult.ok) {
      return authResult.response;
    }
    const auth = authResult.auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "L'ID est requis" }, { status: 400 });
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
      console.error("[DELETE /api/services/service_pricing] DB error:", fetchError);
      return NextResponse.json({ error: "Erreur lors de la verification" }, { status: 500 });
    }

    if (!auth.isAdmin && existing.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise a supprimer cette tarification" }, { status: 403 });
    }

    const { error } = await db.from("services_pricing").delete().eq("id", id);
    if (error) {
      console.error("[DELETE /api/services/service_pricing] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tarification supprimee" });
  } catch (err) {
    console.error("[DELETE /api/services/service_pricing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
