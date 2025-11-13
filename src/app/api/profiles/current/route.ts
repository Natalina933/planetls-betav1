// src/app/api/profiles/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";
// import type { ProfileUpdate } from "@/app/lib/types";

// const ALLOWED_KEYS: (keyof ProfileUpdate)[] = [
//   "username",
//   "first_name",
//   "last_name",
//   "email",
//   "phone",
//   "avatar_url",
//   "additional_info",
//   "category",
//   "role",
//   "location",
//   "option",
//   "search_target",
// ];

// ================================
// GET /api/profiles/current
// ================================
export async function GET(req: NextRequest) {
  try {
    // Récupération du token JWT
    const token = await getToken({ req });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: profile, error } = await db
      .from("profiles")
      .select(
        "id, username, first_name, last_name, email, phone, avatar_url, additional_info, category, role, created_at, location, option, search_target"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /profiles/current] Supabase error:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération du profil" }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err: unknown) {
    console.error("[GET /profiles/current] Exception:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ================================
// PATCH /api/profiles/current
// ================================
// export async function PATCH(req: NextRequest) {
//   try {
//     const body: Record<string, never> = await req.json();
//     console.log("[PATCH /profiles/current] Payload reçu :", body);

//     // Récupération du token JWT
//     const token = await getToken({ req });
//     const userId = typeof token?.sub === "string" ? token.sub : undefined;

//     if (!userId) {
//       return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
//     }

//     // Filtrage des champs autorisés
//     const updates: Partial<ProfileUpdate> = {};
//     ALLOWED_KEYS.forEach((key) => {
//       if (body[key] !== undefined) {
//         updates[key] = body[key];
//       }
//     });

//     console.log("[PATCH /profiles/current] Champs à mettre à jour :", updates);

//     const { error } = await db
//       .from("profiles")
//       .update(updates)
//       .eq("id", userId);

//     if (error) {
//       console.error("[PATCH /profiles/current] Supabase error:", error);
//       return NextResponse.json({ error: error.message }, { status: 502 });
//     }

//     return NextResponse.json({ message: "✅ Profil mis à jour avec succès !", updates });
//   } catch (err: unknown) {
//     console.error("[PATCH /profiles/current] Exception:", err);
//     return NextResponse.json(
//       { error: err instanceof Error ? err.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }
