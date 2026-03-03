import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireProviderAuth } from "../shared";
import type { ProviderInsert, ProviderRow } from "@/types/supabase-provider";

type ProviderAlertRow = ProviderRow<"provider_alerts">;

export async function GET(req: NextRequest) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("provider_alerts")
    .select("*")
    .eq("provider_profile_id", providerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({
        items: [],
        summary: { total: 0, urgent: 0 },
        note:
          "La table provider_alerts n'est pas encore appliquee en base. Lancez les migrations provider.",
      });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (data ?? []) as ProviderAlertRow[];
  return NextResponse.json({
    items: rows,
    summary: {
      total: rows.length,
      urgent: rows.filter((item) => item.severity === "urgent" || item.severity === "high").length,
    },
    note: rows.length === 0 ? "Aucune alerte artisan pour le moment." : null,
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
  const title = String(body?.title ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "title requis" }, { status: 400 });
  }

  const insertPayload: ProviderInsert<"provider_alerts"> = {
    provider_profile_id: providerProfileId,
    intervention_id: typeof body?.intervention_id === "string" ? body.intervention_id : null,
    alert_type: typeof body?.alert_type === "string" ? body.alert_type : "general",
    severity: typeof body?.severity === "string" ? body.severity : "normal",
    title,
    body: typeof body?.body === "string" ? body.body : null,
    status: typeof body?.status === "string" ? body.status : "open",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("provider_alerts")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Table provider_alerts introuvable. Appliquez la migration provider." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erreur creation alerte" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
