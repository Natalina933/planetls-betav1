import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
import { TablesUpdate } from "@/types/supabase";

// Type qui correspond aux colonnes modifiables de profiles
type ProfilesUpdate = TablesUpdate<"profiles">;

export async function PATCH(req: NextRequest) {
  try {
    const updates: Partial<ProfilesUpdate> = await req.json();

    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ envoyé pour mise à jour" },
        { status: 400 }
      );
    }

    const { error } = await db.from("profiles").update(updates).eq("id", userId);

    if (error) {
      console.error("[PATCH /profiles/current] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({
      message: "✅ Profil mis à jour avec succès !",
      updates,
    });
  } catch (err: unknown) {
    console.error(
      "[PATCH /profiles/current] Exception:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
