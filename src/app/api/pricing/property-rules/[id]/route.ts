import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getAuthContext, toOptionalNumber } from "@/app/api/pricing/_shared";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await context.params;
    const { data: existing, error: fetchError } = await db
      .from("pricing_property_rules")
      .select("id, concierge_profile_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Regle introuvable" }, { status: 404 });
    }
    if (!auth.isAdmin && existing.concierge_profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = await req.json();
    const updateObj: Record<string, unknown> = {};
    if (body?.service_id !== undefined) {
      updateObj.service_id = toOptionalNumber(body.service_id);
    }
    if (body?.property_type !== undefined) {
      updateObj.property_type =
        typeof body.property_type === "string" && body.property_type.trim()
          ? body.property_type.trim()
          : null;
    }
    if (body?.min_surface_m2 !== undefined) {
      updateObj.min_surface_m2 = toOptionalNumber(body.min_surface_m2);
    }
    if (body?.max_surface_m2 !== undefined) {
      updateObj.max_surface_m2 = toOptionalNumber(body.max_surface_m2);
    }
    if (body?.delta_pct !== undefined) {
      updateObj.delta_pct = toOptionalNumber(body.delta_pct) ?? 0;
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour" }, { status: 400 });
    }

    const { data, error } = await db
      .from("pricing_property_rules")
      .update(updateObj)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[PATCH /api/pricing/property-rules/:id] ERROR:", error);
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

    const { id } = await context.params;
    const { data: existing, error: fetchError } = await db
      .from("pricing_property_rules")
      .select("id, concierge_profile_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Regle introuvable" }, { status: 404 });
    }
    if (!auth.isAdmin && existing.concierge_profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await db.from("pricing_property_rules").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/pricing/property-rules/:id] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
