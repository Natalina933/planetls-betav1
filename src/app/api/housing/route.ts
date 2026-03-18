import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireActor } from "@/app/lib/apiSecurity";
import { z } from "zod";
import type { Database, Json } from "@/types/supabase";

type HousingOwner = {
  id?: string;
  userId?: string;
  profile_id?: string;
  owner_id?: string;
  proprietaire_id?: string;
} | null;

const HOUSING_OWNER_ROLES = new Set(["owner", "owner_pro"]);

const createHousingSchema = z
  .object({
    external_id: z
      .preprocess((value) => {
        if (value === null || value === undefined || value === "") return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      }, z.number().int().nonnegative().nullable())
      .optional(),
    statut: z.string().trim().max(40).optional().nullable(),
    photo_principale: z.string().trim().max(2048).optional().nullable(),
    proprietaire: z
      .object({
        id: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        profile_id: z.string().uuid().optional(),
        owner_id: z.string().uuid().optional(),
        proprietaire_id: z.string().uuid().optional(),
      })
      .passthrough()
      .optional()
      .nullable(),
    infos: z
      .object({
        nomLogement: z.string().trim().min(1).max(120),
        adresse: z.string().trim().max(255).optional().nullable(),
        photos: z.array(z.string().trim().max(2048)).max(20).optional(),
      })
      .passthrough()
      .optional(),
    location: z
      .object({
        city: z.string().trim().max(120).optional().nullable(),
        plateformePrincipale: z.string().trim().max(80).optional().nullable(),
      })
      .passthrough()
      .optional()
      .nullable(),
    menage: z.unknown().optional().nullable(),
    planning: z.unknown().optional().nullable(),
    documents: z.unknown().optional().nullable(),
    notes: z.unknown().optional().nullable(),
  })
  .passthrough();

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function extractOwnerId(proprietaire: unknown): string | null {
  if (!proprietaire || typeof proprietaire !== "object") return null;

  const owner = proprietaire as HousingOwner;
  const ownerId =
    owner?.id ||
    owner?.userId ||
    owner?.profile_id ||
    owner?.owner_id ||
    owner?.proprietaire_id ||
    null;

  return ownerId && isUuidLike(ownerId) ? ownerId : null;
}

function normalizeOwnerPayload(proprietaire: unknown, userId: string) {
  const owner =
    proprietaire && typeof proprietaire === "object"
      ? { ...(proprietaire as Record<string, unknown>) }
      : {};

  const normalizedOwnerId = extractOwnerId(owner);

  return {
    ...owner,
    id: normalizedOwnerId ?? userId,
  };
}

async function requireHousingCollectionAccess(req: NextRequest): Promise<
  | {
      ok: true;
      context: {
        userId: string;
        role: string;
        isAdmin: boolean;
      };
    }
  | { ok: false; response: NextResponse }
> {
  const actorResult = await requireActor(req, {
    logLabel: "housing collection auth",
    allowedRoles: HOUSING_OWNER_ROLES,
    actionLabel: "gérer des logements",
  });
  if (!actorResult.ok) {
    return actorResult;
  }

  return {
    ok: true,
    context: {
      userId: actorResult.actor.userId,
      role: actorResult.actor.role,
      isAdmin: actorResult.actor.isAdmin,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const access = await requireHousingCollectionAccess(req);
    if (!access.ok) {
      return access.response;
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const proprietaireIdRaw = searchParams.get("proprietaireId");
    const proprietaireId = proprietaireIdRaw ? proprietaireIdRaw.trim() : "";
    const ville = (searchParams.get("ville") ?? "").trim();
    const platform = (searchParams.get("plateforme") ?? "").trim();

    if (proprietaireId && !isUuidLike(proprietaireId)) {
      return NextResponse.json({ error: "proprietaireId invalide" }, { status: 400 });
    }

    if (!access.context.isAdmin && proprietaireId && proprietaireId !== access.context.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez consulter que vos propres logements." },
        { status: 403 },
      );
    }

    let query = db.from("housing").select("*");

    if (proprietaireId) {
      query = query.eq("proprietaire->>id", proprietaireId);
    }
    if (ville) {
      query = query.ilike("ville", `%${ville}%`);
    }
    if (platform) {
      query = query.eq("plateforme", platform);
    }

    const { data, error } = await query.order("id", { ascending: true });

    if (error) {
      console.error("[GET /api/housing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    const rows = data ?? [];
    const visibleRows = access.context.isAdmin
      ? rows
      : rows.filter((item) => extractOwnerId(item.proprietaire) === access.context.userId);

    const DEFAULT_LOGEMENT_PHOTO = "/images/default-logement.png";
    const safeData = visibleRows.map((item) => ({
      ...item,
      photo_principale:
        item.photo_principale && item.photo_principale.trim() !== ""
          ? item.photo_principale
          : DEFAULT_LOGEMENT_PHOTO,
    }));

    return NextResponse.json(safeData);
  } catch (err) {
    console.error("[GET /api/housing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await requireHousingCollectionAccess(req);
    if (!access.ok) {
      return access.response;
    }

    const rawBody = await req.json();
    const parsedBody = createHousingSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsedBody.data;
    if (!body.infos?.nomLogement) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const requestedOwnerId = extractOwnerId(body.proprietaire ?? null);
    const effectiveOwnerId = requestedOwnerId ?? access.context.userId;

    if (!access.context.isAdmin && effectiveOwnerId !== access.context.userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez créer un logement que pour votre propre profil." },
        { status: 403 },
      );
    }

    if (!isUuidLike(effectiveOwnerId)) {
      return NextResponse.json({ error: "Propriétaire invalide." }, { status: 400 });
    }

    const { data: ownerProfile, error: ownerError } = await db
      .from("profiles")
      .select("id, role, status")
      .eq("id", effectiveOwnerId)
      .maybeSingle();

    if (ownerError) {
      console.error("[POST /api/housing] owner lookup error:", ownerError);
      return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
    }

    if (!ownerProfile) {
      return NextResponse.json({ error: "Profil propriétaire introuvable." }, { status: 404 });
    }

    if (ownerProfile.status === "suspended" || ownerProfile.status === "deleted") {
      return NextResponse.json(
        { error: "Le profil propriétaire ciblé ne peut pas recevoir de logement." },
        { status: 403 },
      );
    }

    if (
      ownerProfile.role !== "owner" &&
      ownerProfile.role !== "owner_pro" &&
      ownerProfile.role !== "admin" &&
      ownerProfile.role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Le profil ciblé n'est pas autorisé à posséder un logement." },
        { status: 403 },
      );
    }

    const normalizedOwner = normalizeOwnerPayload(body.proprietaire, effectiveOwnerId);

    const insertPayload: Database["public"]["Tables"]["housing"]["Insert"] = {
      external_id: body.external_id ?? null,
      nom_logement: body.infos?.nomLogement ?? null,
      ville: body.infos?.adresse?.split(",").pop()?.trim() ?? body.location?.city ?? null,
      adresse: body.infos?.adresse ?? null,
      plateforme: body.location?.plateformePrincipale ?? null,
      statut: body.statut ?? "draft",
      photo_principale:
        (body.infos?.photos && body.infos.photos[0]) ?? body.photo_principale ?? null,
      infos: (body.infos ?? null) as Json | null,
      proprietaire: (normalizedOwner ?? null) as Json | null,
      location: (body.location ?? null) as Json | null,
      menage: (body.menage ?? null) as Json | null,
      planning: (body.planning ?? null) as Json | null,
      documents: (body.documents ?? null) as Json | null,
      notes: (body.notes ?? null) as Json | null,
    };

    const { data, error } = await db
      .from("housing")
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[POST /api/housing] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/housing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
