import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { HousingUpdate } from "@/types/supabase";
import { requireActor } from "@/app/lib/apiSecurity";

type HousingOwner = {
  id?: string;
  userId?: string;
  profile_id?: string;
  owner_id?: string;
  proprietaire_id?: string;
} | null;

type HousingPermissionContext = {
  userId: string;
  role: string;
  isAdmin: boolean;
  housing: {
    id: number;
    proprietaire: unknown;
  };
};

const HOUSING_OWNER_ROLES = new Set(["owner", "owner_pro"]);

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function extractOwnerId(proprietaire: unknown): string | null {
  if (!proprietaire) return null;

  const readOwnerId = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const owner = value as HousingOwner;

    const ownerId =
      owner?.id ||
      owner?.userId ||
      owner?.profile_id ||
      owner?.owner_id ||
      owner?.proprietaire_id ||
      null;

    return ownerId && isUuidLike(ownerId) ? ownerId : null;
  };

  if (typeof proprietaire === "string") {
    const raw = proprietaire.trim();
    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      return readOwnerId(parsed);
    } catch {
      return null;
    }
  }

  return readOwnerId(proprietaire);
}

async function loadHousingForAuthorization(id: number) {
  const { data, error } = await db
    .from("housing")
    .select("id, proprietaire")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[housing auth] housing lookup error:", error);
    throw new Error("HOUSING_LOOKUP_FAILED");
  }

  return data;
}

async function requireHousingPermission(
  req: NextRequest,
  housingId: number,
  allowedRoles: Set<string>,
  actionLabel: string,
): Promise<
  | { ok: true; context: HousingPermissionContext }
  | { ok: false; response: NextResponse }
> {
  const actorResult = await requireActor(req, {
    logLabel: "housing auth",
    allowedRoles,
    actionLabel: `${actionLabel} ce logement`,
  });
  if (!actorResult.ok) {
    return actorResult;
  }

  const housing = await loadHousingForAuthorization(housingId);
  if (!housing) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Logement introuvable." }, { status: 404 }),
    };
  }

  if (!actorResult.actor.isAdmin) {
    const ownerId = extractOwnerId(housing.proprietaire);
    if (!ownerId || ownerId !== actorResult.actor.userId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Vous n'êtes pas propriétaire de ce logement." },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    context: {
      userId: actorResult.actor.userId,
      role: actorResult.actor.role,
      isAdmin: actorResult.actor.isAdmin,
      housing,
    },
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const permission = await requireHousingPermission(req, id, HOUSING_OWNER_ROLES, "consulter");
    if (!permission.ok) {
      return permission.response;
    }

    const { data, error } = await db.from("housing").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
      }

      console.error("[GET /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération du logement" },
        { status: 500 },
      );
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
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const permission = await requireHousingPermission(req, id, HOUSING_OWNER_ROLES, "modifier");
    if (!permission.ok) {
      return permission.response;
    }

    const body = await req.json();
    const updateObj: HousingUpdate = {};

    if (body.external_id !== undefined) updateObj.external_id = body.external_id;
    if (body.nom_logement !== undefined) updateObj.nom_logement = body.nom_logement;
    if (body.ville !== undefined) updateObj.ville = body.ville;
    if (body.adresse !== undefined) updateObj.adresse = body.adresse;
    if (body.plateforme !== undefined) updateObj.plateforme = body.plateforme;
    if (body.statut !== undefined) updateObj.statut = body.statut;
    if (body.photo_principale !== undefined) updateObj.photo_principale = body.photo_principale;
    if (body.infos !== undefined) updateObj.infos = body.infos;
    if (body.location !== undefined) updateObj.location = body.location;
    if (body.menage !== undefined) updateObj.menage = body.menage;
    if (body.planning !== undefined) updateObj.planning = body.planning;
    if (body.documents !== undefined) updateObj.documents = body.documents;
    if (body.notes !== undefined) updateObj.notes = body.notes;

    if (body.proprietaire !== undefined) {
      const currentOwnerId = extractOwnerId(permission.context.housing.proprietaire);
      const requestedOwnerId = extractOwnerId(body.proprietaire);

      if (!permission.context.isAdmin && requestedOwnerId && requestedOwnerId !== currentOwnerId) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas transférer ce logement à un autre propriétaire." },
          { status: 403 },
        );
      }

      updateObj.proprietaire = body.proprietaire;
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
    }

    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("housing")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
      }

      console.error("[PATCH /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du logement" },
        { status: 500 },
      );
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
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const permission = await requireHousingPermission(req, id, HOUSING_OWNER_ROLES, "supprimer");
    if (!permission.ok) {
      return permission.response;
    }

    const { error } = await db.from("housing").update({ statut: "deleted" }).eq("id", id);

    if (error) {
      console.error("[DELETE /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du logement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "Logement supprimé" });
  } catch (err) {
    console.error("[DELETE /api/housing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
