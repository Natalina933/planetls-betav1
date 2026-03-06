import { NextRequest, NextResponse } from "next/server";
import {
  isProviderSchemaMissing,
  providerDb,
  providerSchemaMissingResponse,
  requireProviderAuth,
} from "../../shared";
import type { ProviderRow, ProviderUpdate } from "@/types/supabase-provider";

type ProviderInterventionRow = ProviderRow<"provider_interventions">;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await req.json();

  const updatePayload: ProviderUpdate<"provider_interventions"> = {
    title: typeof body?.title === "string" ? body.title : undefined,
    description: typeof body?.description === "string" ? body.description : undefined,
    service_label: typeof body?.service_label === "string" ? body.service_label : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    priority: typeof body?.priority === "string" ? body.priority : undefined,
    scheduled_start: typeof body?.scheduled_start === "string" ? body.scheduled_start : undefined,
    scheduled_end: typeof body?.scheduled_end === "string" ? body.scheduled_end : undefined,
    budget_amount: typeof body?.budget_amount === "number" ? body.budget_amount : undefined,
    currency: typeof body?.currency === "string" ? body.currency : undefined,
    location_label: typeof body?.location_label === "string" ? body.location_label : undefined,
    client_id: typeof body?.client_id === "string" ? body.client_id : undefined,
    metadata:
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : undefined,
  };

  const { data, error } = await providerDb
    .from("provider_interventions")
    .update(updatePayload)
    .eq("id", id)
    .eq("provider_profile_id", providerProfileId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return providerSchemaMissingResponse("provider_interventions");
    }
    return NextResponse.json({ error: "Erreur mise a jour intervention" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  }

  return NextResponse.json(data as ProviderInterventionRow);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireProviderAuth(req);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;
  const providerProfileId = auth.userId;
  if (!providerProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  const { error } = await providerDb
    .from("provider_interventions")
    .delete()
    .eq("id", id)
    .eq("provider_profile_id", providerProfileId);

  if (error) {
    if (isProviderSchemaMissing(error)) {
      return providerSchemaMissingResponse("provider_interventions");
    }
    return NextResponse.json({ error: "Erreur suppression intervention" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
