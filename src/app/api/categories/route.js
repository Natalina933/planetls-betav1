// src/app/api/categories/route.js
import { NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "";

    let query = db.from("categories").select("*");

    if (filter) {
      query = query.eq("key", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur BDD:", error);
      return NextResponse.json({ error: error.message }, { status: 502 });
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
