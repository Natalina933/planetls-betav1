import { NextResponse, NextRequest } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  try {
    const token = await getToken({ req });
    if (!token || !token.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = token.id as string;

    // Correction : selectionner les champs réels de 'profiles'
    let query = db.from("profiles").select(
      "id, username, firstname, lastname, email, phone, avatarurl, additionalinfo, category, createdat, location, option, searchtarget"
    );

    // Optionnel : filtrer par catégorie
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    query = query.eq("id", userId);

    const { data: profile, error } = await query.single();

    if (error) {
      console.error("[PROFILES API] Erreur Supabase:", error);
      // Erreur 404 si pas de profil
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Aucun profil trouvé" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Erreur lors de la récupération du profil" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);

  } catch (err) {
    console.error("[PROFILES API] Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
