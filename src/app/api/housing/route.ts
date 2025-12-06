// src/app/api/housing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";


// GET  /api/housing       -> list des logements (filtrage possible via query)
// POST /api/housing       -> créer un logement (auth requis)
//

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // filtres optionnels (ex: ?proprietaireId=P001 ou ?ville=Bordeaux)
    const proprietaireId = searchParams.get("proprietaireId");
    const ville = searchParams.get("ville");
    const platform = searchParams.get("plateforme");

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

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/housing] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth: token obligatoire
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();

    // Ici tu peux effectuer des validations basiques
    if (!body.infos?.nomLogement || !body.proprietaire) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Insère. Utilise returning/select pour renvoyer l'enregistrement inséré
    const { data, error } = await db
      .from("housing")
      .insert({
        external_id: body.external_id ?? null,
        nom_logement: body.infos?.nomLogement ?? null,
        ville: body.infos?.adresse?.split(",").pop()?.trim() ?? body.location?.city ?? null,
        adresse: body.infos?.adresse ?? null,
        plateforme: body.location?.plateformePrincipale ?? null,
        statut: body.statut ?? "draft",
        photo_principale: (body.infos?.photos && body.infos.photos[0]) ?? body.photo_principale ?? null,
        infos: body.infos ?? null,
        proprietaire: body.proprietaire ?? null,
        location: body.location ?? null,
        menage: body.menage ?? null,
        planning: body.planning ?? null,
        documents: body.documents ?? null,
        notes: body.notes ?? null,
        // created_at/updated_at sont gérés par la DB
      })
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
