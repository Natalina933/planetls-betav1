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

export async function PATCH(req: NextRequest) {
  try {
    const body: Partial<ProfileUpdate> = await req.json();

    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const updates: Partial<ProfileUpdate> = {};

    ALLOWED_KEYS.forEach((key) => {
      const value = body[key];
      if (value !== undefined) {
        // Remplace null par undefined pour éviter l'erreur TypeScript
        updates[key] = value === null ? undefined : value;
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ modifiable envoyé" },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("profiles")
      .update(updates)
      .eq("id", userId);

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
