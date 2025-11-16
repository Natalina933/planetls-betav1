/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/profiles/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";




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
