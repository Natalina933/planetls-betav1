import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { canAccessHousing } from "@/types/housing";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role, isAdmin } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const { data, error } = await db.from("housing").select("*").eq("id", id).maybeSingle();
    if (error) {
      return NextResponse.json({ error: "Erreur lors de la recuperation du logement" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }
    if (!canAccessHousing(data.proprietaire, userId, role, isAdmin)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/housing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role, isAdmin } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const { data: existingHousing, error: existingError } = await db
      .from("housing")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
    if (!existingHousing) {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }
    if (!canAccessHousing(existingHousing.proprietaire, userId, role, isAdmin)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const updateObj: Record<string, unknown> = {};

    const allowedKeys = [
      "external_id",
      "nom_logement",
      "ville",
      "adresse",
      "plateforme",
      "statut",
      "photo_principale",
      "infos",
      "proprietaire",
      "location",
      "menage",
      "planning",
      "documents",
      "tarifs",
      "contrat",
      "notes",
    ] as const;

    for (const key of allowedKeys) {
      if (key in body) {
        updateObj[key] = body[key];
      }
    }

    if ("proprietaire" in updateObj && updateObj.proprietaire && typeof updateObj.proprietaire === "object") {
      const previousOwner =
        existingHousing.proprietaire && typeof existingHousing.proprietaire === "object"
          ? (existingHousing.proprietaire as Record<string, unknown>)
          : {};
      updateObj.proprietaire = {
        ...previousOwner,
        ...(updateObj.proprietaire as Record<string, unknown>),
      };
    }

    if ("nom_logement" in updateObj) updateObj.nom_logement = cleanString(updateObj.nom_logement);
    if ("ville" in updateObj) updateObj.ville = cleanString(updateObj.ville);
    if ("adresse" in updateObj) updateObj.adresse = cleanString(updateObj.adresse);
    if ("plateforme" in updateObj) updateObj.plateforme = cleanString(updateObj.plateforme);
    if ("photo_principale" in updateObj) updateObj.photo_principale = cleanString(updateObj.photo_principale);

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour" }, { status: 400 });
    }

    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("housing")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur lors de la mise a jour du logement" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/housing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role, isAdmin } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const { data: existingHousing, error: existingError } = await db
      .from("housing")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }
    if (!existingHousing) {
      return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
    }
    if (!canAccessHousing(existingHousing.proprietaire, userId, role, isAdmin)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await db.from("housing").update({ statut: "deleted" }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Erreur lors de la suppression du logement" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Logement supprime" });
  } catch (err) {
    console.error("[DELETE /api/housing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
