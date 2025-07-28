import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = `
      SELECT p.id, p.name, p.type, p.photo, p.latitude, p.longitude, p.available,
            GROUP_CONCAT(ps.service) AS services
      FROM profiles p
      LEFT JOIN profile_services ps ON p.id = ps.profile_id
    `;

    const params = [];

    if (category && category !== "all") {
      query += " WHERE p.type = ?";
      params.push(category);
    }

    query += " GROUP BY p.id ORDER BY p.name";

    const [rows] = await db.execute(query, params);

    const profiles = rows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      photo: p.photo,
      latitude: p.latitude,
      longitude: p.longitude,
      available: Boolean(p.available),
      services: p.services ? p.services.split(",") : [],
    }));

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("⛔ Erreur API /api/profiles :", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
