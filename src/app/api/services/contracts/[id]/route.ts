import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  requireServiceAuthContext,
} from "@/app/api/services/_shared";

interface ContractUpdateBody {
  title?: string;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireServiceAuthContext(req);
    if (!authResult.ok) {
      return authResult.response;
    }
    const auth = authResult.auth;

    const { id } = await context.params;

    let query = db.from("services_contracts").select("*").eq("id", id);
    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error("[GET /api/contracts/:id] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Contrat non trouve" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/contracts/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireServiceAuthContext(req);
    if (!authResult.ok) {
      return authResult.response;
    }
    const auth = authResult.auth;

    const { id } = await context.params;
    const rawBody: ContractUpdateBody = await req.json();

    const updatePayload: ContractUpdateBody = {};
    if (rawBody.title !== undefined) updatePayload.title = rawBody.title;
    if (rawBody.start_date !== undefined) updatePayload.start_date = rawBody.start_date;
    if (rawBody.end_date !== undefined) updatePayload.end_date = rawBody.end_date;
    if (rawBody.status !== undefined) updatePayload.status = rawBody.status;
    if (rawBody.notes !== undefined) updatePayload.notes = rawBody.notes;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour" }, { status: 400 });
    }

    let query = db.from("services_contracts").update(updatePayload).eq("id", id).select("*");
    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error("[PATCH /api/contracts/:id] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la mise a jour" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Contrat non trouve" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/contracts/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireServiceAuthContext(req);
    if (!authResult.ok) {
      return authResult.response;
    }
    const auth = authResult.auth;

    const { id } = await context.params;

    let query = db.from("services_contracts").delete({ count: "exact" }).eq("id", id);
    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }

    const { error, count } = await query;
    if (error) {
      console.error("[DELETE /api/contracts/:id] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
    }

    if (!count) {
      return NextResponse.json({ error: "Contrat non trouve" }, { status: 404 });
    }

    return NextResponse.json({ message: "Contrat supprime avec succes" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/contracts/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
