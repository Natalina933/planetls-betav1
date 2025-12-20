// src/app/api/housing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { HousingUpdate } from "@/types/supabase";

/**
 * GET /api/housing/[id]
 * Récupère un logement spécifique
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("housing")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Logement introuvable" },
          { status: 404 }
        );
      }
      console.error("[GET /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération du logement", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/housing/[id]] ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/housing/[id]
 * Met à jour un logement existant
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Construction de l'objet de mise à jour
    const updateObj: HousingUpdate = {};

    // Mise à jour des champs scalaires
    if (body.external_id !== undefined) updateObj.external_id = body.external_id;
    if (body.nom_logement !== undefined) updateObj.nom_logement = body.nom_logement;
    if (body.ville !== undefined) updateObj.ville = body.ville;
    if (body.adresse !== undefined) updateObj.adresse = body.adresse;
    if (body.plateforme !== undefined) updateObj.plateforme = body.plateforme;
    if (body.statut !== undefined) updateObj.statut = body.statut;
    if (body.photo_principale !== undefined) updateObj.photo_principale = body.photo_principale;

    // Mise à jour des champs JSON
    if (body.infos !== undefined) updateObj.infos = body.infos;
    if (body.proprietaire !== undefined) updateObj.proprietaire = body.proprietaire;
    if (body.location !== undefined) updateObj.location = body.location;
    if (body.menage !== undefined) updateObj.menage = body.menage;
    if (body.planning !== undefined) updateObj.planning = body.planning;
    if (body.documents !== undefined) updateObj.documents = body.documents;
    if (body.notes !== undefined) updateObj.notes = body.notes;

    // Vérification qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    // Mise à jour automatique via Supabase (si configuré)
    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("housing")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Logement introuvable" },
          { status: 404 }
        );
      }
      console.error("[PATCH /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du logement", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/housing/[id]] ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/housing/[id]
 * Supprime un logement (soft delete recommandé)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      );
    }

    // Option 1: Soft delete (recommandé)
    const { error } = await db
      .from("housing")
      .update({ statut: "deleted" })
      .eq("id", id);

    // Option 2: Hard delete (décommenter si nécessaire)
    // const { error } = await db
    //   .from("housing")
    //   .delete()
    //   .eq("id", id);

    if (error) {
      console.error("[DELETE /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du logement", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Logement supprimé" });
  } catch (err) {
    console.error("[DELETE /api/housing/[id]] ERROR:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}