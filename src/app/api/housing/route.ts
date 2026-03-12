// src/app/api/housing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { z } from "zod";
import type { Database, Json } from "@/types/supabase";

type HousingOwner = {
  id?: string;
  userId?: string;
  profile_id?: string;
  owner_id?: string;
  proprietaire_id?: string;
} | null;

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

// GET  /api/housing       -> list des logements (filtrage possible via query)
// POST /api/housing       -> créer un logement (auth requis)
//

export async function GET(req: NextRequest) {
  try {
    const { userId, isAdmin } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // filtres optionnels (ex: ?proprietaireId=P001 ou ?ville=Bordeaux)
    const proprietaireIdRaw = searchParams.get("proprietaireId");
    const proprietaireId = proprietaireIdRaw ? proprietaireIdRaw.trim() : "";
    const ville = (searchParams.get("ville") ?? "").trim();
    const platform = (searchParams.get("plateforme") ?? "").trim();

    if (proprietaireId && !isUuidLike(proprietaireId)) {
      return NextResponse.json({ error: "proprietaireId invalide" }, { status: 400 });
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
    const DEFAULT_LOGEMENT_PHOTO = "/images/default-logement.png";

    const rows = data ?? [];
    const visibleRows = isAdmin
      ? rows
      : rows.filter((item) => extractOwnerId(item.proprietaire) === userId);

    // Ajout automatique de l'image par défaut
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
    const { userId } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rawBody = await req.json();
    const parsedBody = createHousingSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }
    const body = parsedBody.data;
    const proprietaireId =
      typeof body?.proprietaire?.id === "string"
        ? body.proprietaire.id
        : typeof body?.proprietaire?.userId === "string"
        ? body.proprietaire.userId
        : typeof body?.proprietaire?.profile_id === "string"
        ? body.proprietaire.profile_id
        : null;
    const normalizedOwner = normalizeOwnerPayload(body?.proprietaire, userId);

    if (!body.infos?.nomLogement) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    if (proprietaireId && proprietaireId !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Insère. Utilise returning/select pour renvoyer l'enregistrement inséré
    const insertPayload: Database["public"]["Tables"]["housing"]["Insert"] = {
      external_id: body.external_id ?? null,
      nom_logement: body.infos?.nomLogement ?? null,
      ville:
        body.infos?.adresse?.split(",").pop()?.trim() ??
        body.location?.city ??
        null,
      adresse: body.infos?.adresse ?? null,
      plateforme: body.location?.plateformePrincipale ?? null,
      statut: body.statut ?? "draft",
      photo_principale:
        (body.infos?.photos && body.infos.photos[0]) ??
        body.photo_principale ??
        null,
      infos: (body.infos ?? null) as Json | null,
      proprietaire: (normalizedOwner ?? null) as Json | null,
      location: (body.location ?? null) as Json | null,
      menage: (body.menage ?? null) as Json | null,
      planning: (body.planning ?? null) as Json | null,
      documents: (body.documents ?? null) as Json | null,
      notes: (body.notes ?? null) as Json | null,
      // created_at/updated_at are managed by the DB.
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



