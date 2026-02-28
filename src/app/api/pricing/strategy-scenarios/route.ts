import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { ALLOWED_PRICING_ROLES, getAuthContext } from "@/app/api/pricing/_shared";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { data, error } = await db
      .from("pricing_strategy_scenarios")
      .select("*")
      .eq("concierge_profile_id", auth.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("[GET /api/pricing/strategy-scenarios] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const simulation = isRecord(body?.simulation) ? body.simulation : null;

    if (!name) {
      return NextResponse.json({ error: "name requis" }, { status: 400 });
    }
    if (!simulation) {
      return NextResponse.json({ error: "simulation requise" }, { status: 400 });
    }

    const { data, error } = await db
      .from("pricing_strategy_scenarios")
      .insert({
        concierge_profile_id: auth.userId,
        name,
        simulation,
        is_default: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pricing/strategy-scenarios] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
