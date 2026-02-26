import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getAuthContext } from "@/app/api/pricing/_shared";

const readId = async (req: NextRequest): Promise<string> => {
  const queryId = new URL(req.url).searchParams.get("id");
  if (queryId) return queryId;
  try {
    const body = await req.json();
    return typeof body?.id === "string" ? body.id : "";
  } catch {
    return "";
  }
};

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const id = await readId(req);
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await db
      .from("services_pricing")
      .select("id, profile_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });
    }

    if (!auth.isAdmin && existing.profile_id !== auth.userId) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { error } = await db.from("services_pricing").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/pricing/delete] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

