import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

const getUserId = async (req: NextRequest): Promise<string | null> => {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  return typeof token?.sub === "string" ? token.sub : null;
};

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
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

    if (!existing || existing.profile_id !== userId) {
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
