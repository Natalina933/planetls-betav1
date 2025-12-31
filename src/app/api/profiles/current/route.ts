// src/app/api/profiles/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// GET /api/profiles/current
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.id === "string" ? token.id : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 🔹 SOLUTION SIMPLE : Utilisez "*" pour récupérer TOUS les champs
    const { data: profile, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/profiles/current] Erreur DB:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[GET /api/profiles/current] Erreur serveur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
