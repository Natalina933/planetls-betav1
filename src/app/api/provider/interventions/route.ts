import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireProviderAuth } from "../shared";
import type { ProviderInsert, ProviderRow } from "@/types/supabase-provider";

type ProviderInterventionRow = ProviderRow<"provider_interventions">;

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
    .from("provider_interventions")
    .select("*")
    .eq("provider_profile_id", providerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({
        items: [],
        summary: { total: 0, in_progress: 0, pending: 0, completed: 0 },
        note:
          "La table provider_interventions n'est pas encore appliquee en base. Lancez les migrations provider.",
      });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows = (data ?? []) as ProviderInterventionRow[];
  return NextResponse.json({
    items: rows,
    summary: {
      total: rows.length,
      in_progress: rows.filter((item) => item.status === "in_progress").length,
      pending: rows.filter((item) => item.status === "pending").length,
      completed: rows.filter((item) => item.status === "completed").length,
    },
    note: rows.length === 0 ? "Aucune intervention artisan pour le moment." : null,
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

  const insertPayload: ProviderInsert<"provider_interventions"> = {
    provider_profile_id: providerProfileId,
    client_id: typeof body?.client_id === "string" ? body.client_id : null,
    owner_profile_id: typeof body?.owner_profile_id === "string" ? body.owner_profile_id : null,
    title,
    description: typeof body?.description === "string" ? body.description : null,
    service_label: typeof body?.service_label === "string" ? body.service_label : null,
    status: typeof body?.status === "string" ? body.status : "pending",
    priority: typeof body?.priority === "string" ? body.priority : "normal",
    scheduled_start: typeof body?.scheduled_start === "string" ? body.scheduled_start : null,
    scheduled_end: typeof body?.scheduled_end === "string" ? body.scheduled_end : null,
    budget_amount: typeof body?.budget_amount === "number" ? body.budget_amount : null,
    currency: typeof body?.currency === "string" ? body.currency : "EUR",
    location_label: typeof body?.location_label === "string" ? body.location_label : null,
    metadata:
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {},
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any)
    .from("provider_interventions")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Table provider_interventions introuvable. Appliquez la migration provider." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Erreur creation intervention" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
