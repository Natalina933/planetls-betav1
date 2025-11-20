// src/app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

// PATCH /api/profiles
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;
    if (!userId)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();

    const { error } = await db
      .from("profiles")
      .update({
        username: body.username,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        avatar_url: body.avatar_url,
        additional_info: body.additional_info,
        category: body.category,
        location: body.location,
        option: body.option,
        search_target: body.search_target,
      })
      .eq("id", userId);

    if (error)
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });

    // Retourne le profil mis à jour
    const { data: updatedProfile } = await db
      .from("profiles")
      .select(
        "id, username, first_name, last_name, email, phone, avatar_url, additional_info, category, role, created_at, location, option, search_target"
      )
      .eq("id", userId)
      .maybeSingle();

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error("[PATCH /api/profiles] ERREUR :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
