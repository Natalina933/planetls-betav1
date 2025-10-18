import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  try {
    const userId = "ID_UTILISATEUR_CONNECTE"; // à adapter

    let query = db.from("profiles").select("id, username, category");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    query = query.eq("id", userId);

    const { data: profile, error } = await query.single();

    if (error || !profile) {
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
