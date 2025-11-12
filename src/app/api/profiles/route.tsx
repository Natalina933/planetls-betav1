// src/app/api/profiles/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import type { ProfileRow, ProfileUpdate } from "@/app/lib/types";
// ================================
// 🔹 GET - Récupération des profils
// ================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = db
      .from("profiles")
      .select("id, username, first_name, last_name, email, phone, avatar_url, category, role, created_at");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.order("username");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json<ProfileRow[]>(data ?? []);
  } catch (err) {
    console.error("[API /api/profiles][GET] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// =========================================
// 🔹 PATCH - Mise à jour du profil connecté
// =========================================
export async function PATCH(req: NextRequest) {
  try {
    // 🔒 Authentification
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }

    // 📦 Lecture et validation du corps JSON
     const body = (await req.json()) as ProfileUpdate;

    const { data, error } = await db
      .from("profiles")
      .update(body)
      .eq("id", userId)
      .select("id, username, first_name, last_name, email, phone, avatar_url, category, role, created_at")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

    return NextResponse.json<ProfileRow>(data);
  } catch {
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
