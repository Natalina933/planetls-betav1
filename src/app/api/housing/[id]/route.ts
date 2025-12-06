import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { Database } from "@/types/supabase";

type HousingUpdate = Database["public"]["Tables"]["housing"]["Update"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id))
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const body = await req.json();

    // 👇 Objet typé, ZERO any
    const updateObj: HousingUpdate = {};

    if (body.nom_logement !== undefined)
      updateObj.nom_logement = body.nom_logement;

    if (body.ville !== undefined) updateObj.ville = body.ville;
    if (body.adresse !== undefined) updateObj.adresse = body.adresse;
    if (body.plateforme !== undefined) updateObj.plateforme = body.plateforme;
    if (body.statut !== undefined) updateObj.statut = body.statut;
    if (body.photo_principale !== undefined)
      updateObj.photo_principale = body.photo_principale;

    if (body.infos !== undefined) updateObj.infos = body.infos;
    if (body.proprietaire !== undefined)
      updateObj.proprietaire = body.proprietaire;
    if (body.location !== undefined) updateObj.location = body.location;
    if (body.menage !== undefined) updateObj.menage = body.menage;
    if (body.planning !== undefined) updateObj.planning = body.planning;
    if (body.documents !== undefined) updateObj.documents = body.documents;
    if (body.notes !== undefined) updateObj.notes = body.notes;

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    // 👉 Update typé + maybeSingle()
    const { data, error } = await db
      .from("housing")
      .update(updateObj)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(`[PATCH /api/housing/${id}] DB error:`, error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`[PATCH /api/housing/:id] ERROR:`, err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
