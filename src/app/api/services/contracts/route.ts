import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import {
  getServiceAuthContext,
  isAllowedServiceRole,
  serviceAuthError,
} from "@/app/api/services/_shared";

interface ContractBody {
  title: string;
  start_date: string;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = db.from("services_contracts").select("*").order("start_date", { ascending: false });

    if (!auth.isAdmin) {
      query = query.eq("profile_id", auth.userId);
    }
    if (status) query = query.eq("status", status);
    if (from) query = query.gte("start_date", from);
    if (to) query = query.lte("start_date", to);

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/contracts] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/contracts] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServiceAuthContext(req);
    if (!auth) {
      return serviceAuthError(401);
    }

    if (!isAllowedServiceRole(auth.role)) {
      return serviceAuthError(403);
    }

    const body: ContractBody = await req.json();
    if (!body.title || !body.start_date) {
      return NextResponse.json({ error: "title et start_date sont requis" }, { status: 400 });
    }

    const { data, error } = await db
      .from("services_contracts")
      .insert({
        profile_id: auth.userId,
        title: body.title,
        start_date: body.start_date,
        end_date: body.end_date ?? null,
        status: body.status ?? "actif",
        notes: body.notes ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/contracts] DB error:", error);
      return NextResponse.json({ error: "Erreur lors de la creation" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contracts] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
