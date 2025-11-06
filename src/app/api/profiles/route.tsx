import { NextResponse, NextRequest } from "next/server";
import { db } from "@/app/lib/dbServer"; // utiliser le client serveur typé
// import type { ProfileRow } from "@/app/lib/types";
import { getToken } from "next-auth/jwt";

// --------------------------
// GET (récupération de tous les profils, avec filtre optionnel par catégorie)
// --------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    console.log("[API /api/profiles] SELECT columns:", [
      "id", "username", "first_name", "last_name", "email", "phone", "avatar_url",
      "additional_info", "category", "created_at", "location", "option", "search_target", "role"
    ]);

    let query = db
      .from("profiles")
      .select("id, username, first_name, last_name, email, phone, avatar_url, additional_info, category, created_at, location, option, search_target, role");

    if (category && category !== "all") {
      query = query.eq("category", category);
      console.log("[API /api/profiles] Filtres : category =", category);
    }

    const { data: profiles, error } = await query.order("username");

    if (error) {
      console.error("[API /api/profiles] ERROR (fetch profiles)", error);
      throw error;
    }

    console.log("[API /api/profiles] Réponse envoyée :", profiles);

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("[API /api/profiles] Catch error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

// --------------------------
// PATCH (édition profil *du user* connecté)
// --------------------------
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  const userId = typeof token?.sub === "string" ? token.sub : (token?.id as string | undefined);

  console.log("[API /api/profiles] PATCH userId :", userId);

  if (!userId) {
    console.warn("[API /api/profiles] PATCH - utilisateur non authentifié.");
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();

  console.log("[API /api/profiles] PATCH - données reçues :", body);

  const { error } = await db.from("profiles")
    .update(body)
    .eq("id", userId);

  if (error) {
    console.error("[API /api/profiles] PATCH ERROR", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[API /api/profiles] PATCH success for userId", userId);

  return NextResponse.json({ success: true });
}
