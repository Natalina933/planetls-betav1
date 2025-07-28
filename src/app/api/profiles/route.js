import { NextResponse } from "next/server";
import db from "../../lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query = `
        SELECT p.id, p.name, p.type, p.photo,
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
    services: p.services ? p.services.split(",") : [],
  }));

  return NextResponse.json(profiles);
}
