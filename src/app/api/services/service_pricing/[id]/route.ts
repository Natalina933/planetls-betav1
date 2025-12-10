// src/app/api/service-pricing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type ServicePricingUpdate = {
  service_id?: number;
  label?: string;
  type?: string;
  amount?: number;
  unit?: string;
  is_default?: boolean;
};

// -----------------------------------------------------
// GET    /api/service-pricing/[id]   -> récupérer un tarif
// PATCH  /api/service-pricing/[id]   -> MAJ (auth requise)
// DELETE /api/service-pricing/[id]   -> suppression (auth requise)
// -----------------------------------------------------

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalide : id doit être un nombre" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("service_pricing")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Tarif non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérification auth
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Validation ID
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalide : id doit être un nombre" },
        { status: 400 }
      );
    }

    // 3. Parsing et construction des données
    const body = await req.json();
    const updateData: ServicePricingUpdate = {};

    if (body.service_id !== undefined) updateData.service_id = body.service_id;
    if (body.label !== undefined) updateData.label = body.label;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    // 4. Mise à jour DB
    const { data, error } = await db
      .from("service_pricing")
      .update(updateData)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[PATCH /api/service-pricing/:id] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Tarif non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch {
    console.error("[PATCH /api/service-pricing/:id] ERROR");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérification auth
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Validation ID
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID invalide : id doit être un nombre" },
        { status: 400 }
      );
    }

    // 3. Suppression DB
    const { error } = await db
      .from("service_pricing")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/service-pricing/:id] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("[DELETE /api/service-pricing/:id] ERROR");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}