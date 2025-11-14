/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import type { ProfileUpdate } from "@/types/supabase";

const ALLOWED_KEYS: (keyof ProfileUpdate)[] = [
  "username",
  "first_name",
  "last_name",
  "email",
  "phone",
  "avatar_url",
  "additional_info",
  "category",
  "role",
  "location",
  "option",
  "search_target",
];

// GET /api/profiles/current
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile, error } = await db
      .from("profiles")
      .select(
        "id, username, first_name, last_name, email, phone, avatar_url, additional_info, category, role, created_at, location, option, search_target"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    if (!profile) return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });

    return NextResponse.json(profile);

  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/profiles/current
export async function PATCH(req: NextRequest) {
  try {
    const body: Partial<ProfileUpdate> = await req.json();

    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const updates: Partial<ProfileUpdate> = {};
    ALLOWED_KEYS.forEach((key) => {
      const value = body[key];
      if (value !== undefined) updates[key] = value === null ? undefined : value;
    });

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: "Aucun champ modifiable envoyé" }, { status: 400 });

    const { error } = await db.from("profiles").update(updates).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });

    return NextResponse.json({ message: "Profil mis à jour avec succès", updates });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
