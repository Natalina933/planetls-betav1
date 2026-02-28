import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  ALLOWED_PRICING_ROLES,
  getAuthContext,
  toOptionalNumber,
} from "@/app/api/pricing/_shared";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await context.params;
    const { data: existing, error: fetchError } = await db
      .from("pricing_segments")
      .select("id, concierge_profile_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Segment introuvable" }, { status: 404 });
    }
    if (!auth.isAdmin && existing.concierge_profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = await req.json();
    const updateObj: Record<string, unknown> = {};
    if (typeof body?.name === "string") updateObj.name = body.name.trim();
    if (body?.commission_delta_pct !== undefined) {
      updateObj.commission_delta_pct = toOptionalNumber(body.commission_delta_pct) ?? 0;
    }
    if (body?.setup_fee_delta_pct !== undefined) {
      updateObj.setup_fee_delta_pct = toOptionalNumber(body.setup_fee_delta_pct) ?? 0;
    }
    if (typeof body?.is_default === "boolean") {
      updateObj.is_default = body.is_default;
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour" }, { status: 400 });
    }

    if (updateObj.is_default === true) {
      await db
        .from("pricing_segments")
        .update({ is_default: false })
        .eq("concierge_profile_id", existing.concierge_profile_id);
    }

    const { data, error } = await db
      .from("pricing_segments")
      .update(updateObj)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[PATCH /api/pricing/segments/:id] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_PRICING_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await context.params;
    const { data: existing, error: fetchError } = await db
      .from("pricing_segments")
      .select("id, concierge_profile_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Segment introuvable" }, { status: 404 });
    }
    if (!auth.isAdmin && existing.concierge_profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await db.from("pricing_segments").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/pricing/segments/:id] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
