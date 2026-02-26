// src/app/api/categories/route.js
import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const filter = searchParams.get("filter") || "";

    let query = db.from("categories").select("*");

    if (filter) {
      query = query.eq("key", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur BDD:", error);
      // Fallback non bloquant pour éviter de casser la page côté front.
      return NextResponse.json([]);
    }

    // console.log("Données récupérées :", data.length, "enregistrements");

    return NextResponse.json(data);
  } catch (err) {
    console.error("Erreur générale dans GET /api/categories :", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
