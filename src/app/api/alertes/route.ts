import { NextResponse } from "next/server";
import { db } from "../../lib/dbServer"; 

export async function POST(request: Request) {
  try {
    const { userId, message, category, location, latitude, longitude } = await request.json();

    const { data, error } = await db
      .from("alertes")
      .insert([{
        user_id: userId,
        message,
        category,
        location,
        latitude,
        longitude,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Erreur Supabase :", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Erreur API /alertes :", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Erreur serveur inconnue" }, { status: 500 });
}

}
