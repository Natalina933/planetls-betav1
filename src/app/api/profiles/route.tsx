// src/app/api/profiles/route.ts
import { NextResponse, NextRequest } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import { ProfileUpdate } from "@/app/lib/types";

// ================================
// 🔹 GET - Récupération des profils
// ================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = db
      .from("profiles")
      .select(
        "id, username, first_name, last_name, email, phone, avatar_url, additional_info, category, created_at, location, option, search_target, role"
      );

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: profiles, error } = await query.order("username");

    if (error) {
      console.error("[API /api/profiles][GET] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profiles ?? []);
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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Le corps de la requête doit être au format JSON valide" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Le corps de la requête est vide" },
        { status: 400 }
      );
    }

    // 🧩 Construction des données à mettre à jour
    const {
      username,
      first_name,
      last_name,
      email,
      phone,
      avatar_url,
      additional_info,
      category,
      location,
      option,
      search_target,
      role,
      password, // ⚠️ doit être hashé côté serveur avant update
    } = body as Record<string, unknown>;

    const updateData: ProfileUpdate = {
      username: username as string,
      first_name: first_name as string | null,
      last_name: last_name as string | null,
      email: email as string | null,
      phone: phone as string | null,
      avatar_url: avatar_url as string | null,
      additional_info: additional_info as string | null,
      category: category as string | null,
      location: location as string | null,
      option: option as string | null,
      search_target: search_target as string | null,
      role: role as string | null,
      password: password ? (password as string) : undefined,
    };

    // 🧱 Mise à jour Supabase
    const { error } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("[API /api/profiles][PATCH] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /api/profiles][PATCH] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
