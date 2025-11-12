// src/app/api/profile_services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { ProfileServiceInsert, ProfileServiceRow } from "@/app/lib/types";

// =========================================
// 🔹 GET - Récupérer les services liés à un profil
// =========================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profile_id");

    if (!profileId) {
      return NextResponse.json({ error: "Paramètre profile_id manquant" }, { status: 400 });
    }

    const { data, error } = await db
      .from("profile_services")
      .select("service_id, selected")
      .eq("profile_id", profileId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json<ProfileServiceRow[]>(data ?? []);
  } catch {
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

// =========================================
// 🔹 PATCH - Mettre à jour les services d’un profil
// =========================================
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      profile_id: string;
      services: number[];
    };

    if (!body.profile_id) {
      return NextResponse.json({ error: "Profil manquant" }, { status: 400 });
    }

    // Supprimer les anciens liens
    const { error: delError } = await db
      .from("profile_services")
      .delete()
      .eq("profile_id", body.profile_id);

    if (delError) throw delError;

    // Construire payload
    const payload: ProfileServiceInsert[] = body.services.map((service_id) => ({
      profile_id: body.profile_id,
      service_id,
      selected: true,
    }));

    if (payload.length === 0) {
      return NextResponse.json({ message: "⚠️ Aucun service sélectionné." });
    }

    const { error: insertError } = await db
      .from("profile_services")
      .insert(payload);

    if (insertError) throw insertError;

    return NextResponse.json({ message: "✅ Services mis à jour !" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
