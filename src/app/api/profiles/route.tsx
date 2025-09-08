import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer"; // ton client serveur
import type { Database } from "@/app/lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = db
      .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
      .select("id, name, type, photo, latitude, longitude, available");

    if (category && category !== "all") {
      query = query.eq("type", category);
    }

    const { data: profiles, error } = await query.order("name");
    if (error) throw error;

    return NextResponse.json(profiles);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Erreur API /profiles:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error("Erreur API /profiles inconnue:", error);
      return NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      );
    }
  }
}
