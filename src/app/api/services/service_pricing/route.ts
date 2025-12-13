// src/app/api/service-pricing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// Type inline pour l'insertion
interface ServicePricingInsert {
  profile_id: string;
  service_id?: number | null;
  label: string;
  type?: string | null;
  amount: number;
  unit?: string | null;
  is_default?: boolean | null;
}

// -----------------------------------------------------
// GET /api/service-pricing
// Récupère les tarifications de services avec filtres optionnels
// -----------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profile_id");
    const serviceIdParam = searchParams.get("service_id");
    const type = searchParams.get("type");
    const isDefault = searchParams.get("is_default");

    let query = db.from("services_pricing").select("*");

    // Filtre par profile_id
    if (profileId) {
      query = query.eq("profile_id", profileId);
    }

    // Filtre par service_id
    if (serviceIdParam) {
      const serviceId = Number(serviceIdParam);
      if (isNaN(serviceId)) {
        return NextResponse.json(
          { error: "service_id doit être un nombre valide" },
          { status: 400 }
        );
      }
      query = query.eq("service_id", serviceId);
    }

    // Filtre par type
    if (type) {
      query = query.eq("type", type);
    }

    // Filtre par is_default
    if (isDefault === "true") {
      query = query.eq("is_default", true);
    } else if (isDefault === "false") {
      query = query.eq("is_default", false);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/service-pricing] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des tarifications", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/service-pricing] ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------
// POST /api/service-pricing
// Crée une nouvelle tarification de service
// -----------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validation des champs requis
    if (!body.label) {
      return NextResponse.json(
        { error: "Le label est requis" },
        { status: 400 }
      );
    }

    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json(
        { error: "Le montant (amount) est requis" },
        { status: 400 }
      );
    }

    // Validation du montant
    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre positif" },
        { status: 400 }
      );
    }

    // Validation du service_id si fourni
    let serviceId: number | null = null;
    if (body.service_id !== undefined && body.service_id !== null) {
      serviceId = Number(body.service_id);
      if (isNaN(serviceId)) {
        return NextResponse.json(
          { error: "service_id doit être un nombre valide" },
          { status: 400 }
        );
      }
    }

    // Construction de l'objet d'insertion
    const insertData: ServicePricingInsert = {
      profile_id: userId,
      service_id: serviceId,
      label: body.label,
      type: body.type ?? null,
      amount: amount,
      unit: body.unit ?? null,
      is_default: body.is_default ?? false,
    };

    const { data, error } = await db
      .from("services_pricing")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/service-pricing] DB error:", error);
      
      // Gestion des erreurs spécifiques
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Le service_id ou profile_id spécifié n'existe pas" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Erreur lors de la création de la tarification", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Aucune donnée retournée après insertion" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/service-pricing] ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------
// DELETE /api/service-pricing?id=xxx
// Supprime une tarification de service
// -----------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "L'ID est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de cette tarification
    const { data: existing, error: fetchError } = await db
      .from("services_pricing")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Tarification introuvable" },
          { status: 404 }
        );
      }
      console.error("[DELETE /api/service-pricing] DB error:", fetchError);
      return NextResponse.json(
        { error: "Erreur lors de la vérification", details: fetchError.message },
        { status: 500 }
      );
    }

    if (existing.profile_id !== userId) {
      return NextResponse.json(
        { error: "Non autorisé à supprimer cette tarification" },
        { status: 403 }
      );
    }

    const { error } = await db
      .from("services_pricing")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/service-pricing] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Tarification supprimée" });
  } catch (err) {
    console.error("[DELETE /api/service-pricing] ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}