import { NextRequest, NextResponse } from "next/server";
import { providerDb, requireProviderAuth } from "../shared";
import type { ProviderInsert, ProviderRow } from "@/types/supabase-provider";

type ProviderClientRow = ProviderRow<"provider_clients">;

export async function GET(req: NextRequest) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await providerDb
    .from("provider_clients")
    .select("*")
    .eq("provider_profile_id", providerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({
        items: [],
        summary: { total: 0, active: 0 },
        note:
          "La table provider_clients n'est pas encore appliquee en base. Lancez les migrations provider.",
      });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (data ?? []) as ProviderClientRow[];
  return NextResponse.json({
    items: rows,
    summary: {
      total: rows.length,
      active: rows.filter((item) => item.status === "active").length,
    },
    note: rows.length === 0 ? "Aucun client artisan pour le moment." : null,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const clientName = String(body?.client_name ?? "").trim();

  if (!clientName) {
    return NextResponse.json({ error: "client_name requis" }, { status: 400 });
  }

  const insertPayload: ProviderInsert<"provider_clients"> = {
    provider_profile_id: providerProfileId,
    owner_profile_id: typeof body?.owner_profile_id === "string" ? body.owner_profile_id : null,
    client_name: clientName,
    company_name: typeof body?.company_name === "string" ? body.company_name : null,
    email: typeof body?.email === "string" ? body.email : null,
    phone: typeof body?.phone === "string" ? body.phone : null,
    city: typeof body?.city === "string" ? body.city : null,
    client_type: typeof body?.client_type === "string" ? body.client_type : "manual",
    status: typeof body?.status === "string" ? body.status : "active",
    notes: typeof body?.notes === "string" ? body.notes : null,
    metadata:
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {},
  };

  const { data, error } = await providerDb
    .from("provider_clients")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Table provider_clients introuvable. Appliquez la migration provider." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erreur creation client" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
