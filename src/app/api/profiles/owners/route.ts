import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

const ALLOWED_OWNER_DIRECTORY_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_OWNER_DIRECTORY_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const limitParam = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    let query = db
      .from("profiles")
      .select("id, first_name, last_name, username, city, role, category")
      .or("role.eq.owner,role.eq.owner_pro,category.eq.proprietaire")
      .not("status", "in", "(suspended,deleted)")
      .limit(limit);

    if (q.length > 0) {
      query = query.or(
        [
          `first_name.ilike.%${q}%`,
          `last_name.ilike.%${q}%`,
          `username.ilike.%${q}%`,
          `city.ilike.%${q}%`,
        ].join(","),
      );
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[GET /api/profiles/owners] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/profiles/owners] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
