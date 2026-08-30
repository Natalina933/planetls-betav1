import { NextRequest, NextResponse } from "next/server";
import {
  getMissionIdFromIntervention,
  isProviderInterventionReportSchemaMissing,
  readProviderInterventionReportInput,
  upsertProviderInterventionReport,
} from "@/app/api/_shared/providerInterventionReports";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import {
  isProviderSchemaMissing,
  providerDb,
  providerSchemaMissingResponse,
  requireProviderAuth,
} from "../../shared";
import type { ProviderRow, ProviderUpdate } from "@/types/supabase-provider";
import type { Json } from "@/types/supabase";

type ProviderInterventionRow = ProviderRow<"provider_interventions">;
const providerDbAny = asLooseSupabaseClient(providerDb);

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
  const body = (await req.json()) as Record<string, unknown>;
  const completionReportInput = readProviderInterventionReportInput(body);

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
        ? (body.metadata as Json)
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

  let completionReport = null;
  if (completionReportInput) {
    const reportResult = await upsertProviderInterventionReport({
      db: providerDbAny,
      intervention: data,
      report: completionReportInput,
      submittedBy: providerProfileId,
    });

    if (reportResult.error) {
      if (isProviderInterventionReportSchemaMissing(reportResult.error)) {
        return NextResponse.json(
          { error: "Migration provider_intervention_reports requise pour sauvegarder le compte-rendu." },
          { status: 500 },
        );
      }
      console.error("[PATCH /api/provider/interventions/:id] report error:", reportResult.error);
      return NextResponse.json({ error: "Erreur sauvegarde compte-rendu intervention" }, { status: 500 });
    }

    completionReport = reportResult.data ?? null;
    const missionId = getMissionIdFromIntervention(data);
    if (missionId) {
      await providerDbAny.from("mission_events").insert({
        mission_id: missionId,
        actor_profile_id: providerProfileId,
        event_type: "updated",
        payload: {
          action: "provider_intervention_report_submitted",
          provider_intervention_id: data.id,
          provider_intervention_report_id: completionReport?.id ?? null,
        },
      });
    }
  }

  return NextResponse.json({ ...(data as ProviderInterventionRow), completion_report: completionReport });
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
