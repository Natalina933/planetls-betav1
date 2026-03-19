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
  concierge_profile_id?: string;
  manager_profile_id?: string;
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

const HOUSING_ACCESS_ROLES = new Set(["owner", "owner_pro", "concierge", "concierge_pro"]);
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function extractOwnerData(proprietaire: unknown): {
  ownerId: string | null;
  conciergeProfileId: string | null;
} {
  const readOwnerData = (value: unknown) => {
    if (!value || typeof value !== "object") {
      return { ownerId: null, conciergeProfileId: null };
    }

    const owner = value as HousingOwner;
    const ownerId =
      owner?.id ||
      owner?.userId ||
      owner?.profile_id ||
      owner?.owner_id ||
      owner?.proprietaire_id ||
      null;
    const conciergeProfileId =
      owner?.concierge_profile_id ||
      owner?.manager_profile_id ||
      null;

    return {
      ownerId: ownerId && isUuidLike(ownerId) ? ownerId : null,
      conciergeProfileId:
        conciergeProfileId && isUuidLike(conciergeProfileId) ? conciergeProfileId : null,
    };
  };

  if (typeof proprietaire === "string") {
    const raw = proprietaire.trim();
    if (!raw) return { ownerId: null, conciergeProfileId: null };

    try {
      const parsed: unknown = JSON.parse(raw);
      return readOwnerData(parsed);
    } catch {
      return { ownerId: null, conciergeProfileId: null };
    }
  }

  return readOwnerData(proprietaire);
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
    const ownerData = extractOwnerData(housing.proprietaire);
    const isConcierge = CONCIERGE_ROLES.has(actorResult.actor.role);
    const canAccess = isConcierge
      ? ownerData.conciergeProfileId === actorResult.actor.userId
      : ownerData.ownerId === actorResult.actor.userId;

    if (!canAccess) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Vous n'etes pas autorise a acceder a ce logement." },
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

    const permission = await requireHousingPermission(req, id, HOUSING_ACCESS_ROLES, "consulter");
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
        { error: "Erreur lors de la recuperation du logement" },
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

    const permission = await requireHousingPermission(req, id, HOUSING_ACCESS_ROLES, "modifier");
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
      const currentOwnerData = extractOwnerData(permission.context.housing.proprietaire);
      const requestedOwnerData = extractOwnerData(body.proprietaire);
      const isConcierge = CONCIERGE_ROLES.has(permission.context.role);

      if (
        !permission.context.isAdmin &&
        requestedOwnerData.ownerId &&
        requestedOwnerData.ownerId !== currentOwnerData.ownerId
      ) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas transferer ce logement a un autre proprietaire." },
          { status: 403 },
        );
      }

      if (
        isConcierge &&
        currentOwnerData.conciergeProfileId &&
        requestedOwnerData.conciergeProfileId &&
        requestedOwnerData.conciergeProfileId !== currentOwnerData.conciergeProfileId
      ) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas changer le concierge gestionnaire de ce logement." },
          { status: 403 },
        );
      }

      updateObj.proprietaire = body.proprietaire;
    }

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
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Logement introuvable" }, { status: 404 });
      }

      console.error("[PATCH /api/housing/[id]] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise a jour du logement" },
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

    const permission = await requireHousingPermission(req, id, HOUSING_ACCESS_ROLES, "supprimer");
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

    return NextResponse.json({ success: true, message: "Logement supprime" });
  } catch (err) {
    console.error("[DELETE /api/housing/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
