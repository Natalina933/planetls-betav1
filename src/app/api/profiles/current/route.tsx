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

    // 💡 LOG CRITIQUE 1: Les valeurs utilisées pour la requête
    console.log(`[PROFILES API] Tentative de récupération pour UserID: ${userId}, Catégorie filtre: ${category}`);

    let query = db.from("profiles").select("id, username, category");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Applique le filtre sur l'ID de l'utilisateur (le UUID)
    query = query.eq("id", userId);

    const { data: profile, error } = await query.single();

    // 💡 LOG CRITIQUE 2: Le résultat de Supabase
    if (error) {
      console.error("[PROFILES API] Erreur Supabase:", error);
    }
    if (!profile) {
      console.log("[PROFILES API] AUCUN PROFIL trouvé pour cette combinaison ID/CATÉGORIE.");
    }


    if (error || !profile) {
      // ⚠️ Ce 404 est retourné à la console.
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}