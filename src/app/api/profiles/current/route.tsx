import { NextResponse, NextRequest } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  try {
    // Récupère le token JWT
    const token = await getToken({ req });
    // La clé unique du user Supabase est généralement 'sub'
    const userId = typeof token?.sub === "string" ? token.sub : (token?.id as string | undefined);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Sélectionne les champs en base (adapté à la casse réelle)
    let query = db.from("profiles").select(
      "id, username, first_name, last_name, email, phone, avatar_url, additional_info, category, created_at, location, option, search_target"
    );

    // Filtrer par catégorie si précisé
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    query = query.eq("id", userId);

    const { data: profile, error } = await query.single();

    if (error) {
      console.error("[PROFILES API] Erreur Supabase:", error);
      // Erreur 404 si profil absent
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

  } catch (err: unknown) {
    console.error("[PROFILES API] Erreur serveur:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
