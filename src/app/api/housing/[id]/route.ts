import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { canAccessHousing } from "@/types/housing";
import { guardHousingWriteAccess } from "@/app/lib/housingWriteGuards";

const dbAny = asLooseSupabaseClient(db);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function syncHousingNameInServiceRequests(params: {
  ownerProfileId: string;
  housingId: number;
  previousName: string;
  nextName: string;
}) {
  if (!params.nextName || params.previousName === params.nextName) return;

  const { data: requests, error } = await dbAny
    .from("service_requests")
    .select("id, metadata")
    .eq("owner_profile_id", params.ownerProfileId);

  if (error) {
    console.error("[PATCH /api/housing/[id]] service requests sync lookup error:", error);
    return;
  }

  const updates = (requests ?? [])
    .filter((request: { metadata?: unknown }) => {
      const metadata = readRecord(request.metadata);
      return (
        String(metadata.property_housing_id ?? "") === String(params.housingId) ||
        (params.previousName && metadata.property_label === params.previousName)
      );
    })
    .map((request: { id: string; metadata?: unknown }) => {
      const metadata = readRecord(request.metadata);
      return dbAny
        .from("service_requests")
        .update({
          metadata: {
            ...metadata,
            property_housing_id: String(params.housingId),
            property_label: params.nextName,
            updated_from: "housing_name_sync",
          },
        })
        .eq("id", request.id)
        .eq("owner_profile_id", params.ownerProfileId);
    });

  await Promise.all(updates);
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

      const guardedOwnership = guardHousingWriteAccess({
        proprietaire: updateObj.proprietaire,
        userId,
        role,
        isAdmin,
      });
      if (!guardedOwnership.ok) {
        return NextResponse.json({ error: guardedOwnership.error }, { status: 403 });
      }
      updateObj.proprietaire = guardedOwnership.proprietaire;
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

    if ("nom_logement" in updateObj) {
      await syncHousingNameInServiceRequests({
        ownerProfileId: userId,
        housingId: id,
        previousName: cleanString(existingHousing.nom_logement),
        nextName: cleanString(data.nom_logement),
      });
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
