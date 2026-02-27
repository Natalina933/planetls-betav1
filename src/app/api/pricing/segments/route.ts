import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getAuthContext, toOptionalNumber } from "@/app/api/pricing/_shared";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { data, error } = await db
      .from("pricing_segments")
      .select("*")
      .eq("concierge_profile_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("[GET /api/pricing/segments] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const commissionDelta = toOptionalNumber(body?.commission_delta_pct);
    const setupDelta = toOptionalNumber(body?.setup_fee_delta_pct);

    if (!name) {
      return NextResponse.json({ error: "name requis" }, { status: 400 });
    }

    const { data, error } = await db
      .from("pricing_segments")
      .insert({
        concierge_profile_id: auth.userId,
        name,
        commission_delta_pct: commissionDelta ?? 0,
        setup_fee_delta_pct: setupDelta ?? 0,
        is_default: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pricing/segments] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
