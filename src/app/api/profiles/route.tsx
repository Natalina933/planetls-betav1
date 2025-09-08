import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer"; // utiliser le client serveur typé
// import type { ProfileRow } from "@/app/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = db
      .from("profiles") // ✅ Type reconnu via <Database>
      .select("id, name, type, photo, latitude, longitude, available");

    // Filtrer sur category uniquement si ce n’est pas "all"
    if (category && category !== "all") {
      query = query.eq("type", category); // ✅ TypeScript sait que type est correct
    }

    const { data: profiles, error } = await query.order("name");

    if (error) throw error;

    return NextResponse.json(profiles);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
