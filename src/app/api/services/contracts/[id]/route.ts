// src/app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getToken } from "next-auth/jwt";

interface ContractUpdateBody {
  title?: string;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}

// --- GET /api/contracts/[id] -> Détail d'un contrat ---
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const { data, error } = await db
      .from("services_contracts")
      .select("*")
      .eq("id", id)
      .eq("profile_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/contracts/:id] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Contrat non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/contracts/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// --- PATCH /api/contracts/[id] -> Mettre à jour un contrat ---
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    const rawBody: ContractUpdateBody = await req.json();

    const updatePayload: ContractUpdateBody = {};
    if (rawBody.title !== undefined) updatePayload.title = rawBody.title;
    if (rawBody.start_date !== undefined)
      updatePayload.start_date = rawBody.start_date;
    if (rawBody.end_date !== undefined)
      updatePayload.end_date = rawBody.end_date;
    if (rawBody.status !== undefined) updatePayload.status = rawBody.status;
    if (rawBody.notes !== undefined) updatePayload.notes = rawBody.notes;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from("services_contracts")
      .update(updatePayload)
      .eq("id", id)
      .eq("profile_id", userId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[PATCH /api/contracts/:id] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Contrat non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/contracts/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// --- DELETE /api/contracts/[id] -> Supprimer un contrat ---
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET });
    const userId = typeof token?.sub === "string" ? token.sub : undefined;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    const { error, count } = await db
      .from("services_contracts")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("profile_id", userId);

    if (error) {
      console.error("[DELETE /api/contracts/:id] DB error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    if (!count) {
      return NextResponse.json(
        { error: "Contrat non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Contrat supprimé avec succès" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[DELETE /api/contracts/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

