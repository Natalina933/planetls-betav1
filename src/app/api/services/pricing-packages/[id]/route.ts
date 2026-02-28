import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  getServiceAuthContext,
  isAllowedServiceRole,
  serviceAuthError,
} from "@/app/api/services/_shared";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const { id } = await params;

    const { data: existing, error: existingError } = await db
      .from("pricing_packages")
      .select("id, profile_id")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error("[DELETE /api/services/pricing-packages/:id] DB read error:", existingError);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    if (!auth.isAdmin && existing.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await db.from("pricing_packages").delete().eq("id", id);
    if (error) {
      console.error("[DELETE /api/services/pricing-packages/:id] DB delete error:", error);
      return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/services/pricing-packages/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
