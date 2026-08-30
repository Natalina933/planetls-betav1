import type { Json } from "@/types/supabase";
import type { LooseSupabaseClient } from "./untypedSupabase";

export type ProviderInterventionForReport = {
  id: string;
  provider_profile_id?: string | null;
  owner_profile_id?: string | null;
  reservation_id?: string | null;
  metadata?: Json | null;
};

export type ProviderInterventionReportRow = {
  id: string;
  provider_intervention_id: string;
  mission_id: string | null;
  reservation_id: string | null;
  provider_profile_id: string;
  owner_profile_id: string | null;
  summary: string;
  work_performed: string | null;
  materials_used: string | null;
  follow_up_required: boolean;
  follow_up_notes: string | null;
  submitted_by: string | null;
  submitted_at: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type ProviderInterventionReportInput = {
  summary: string;
  work_performed: string | null;
  materials_used: string | null;
  follow_up_required: boolean;
  follow_up_notes: string | null;
  metadata: Record<string, unknown>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

export function isProviderInterventionReportSchemaMissing(
  error: { code?: string; message?: string; details?: string } | null | undefined,
) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("provider_intervention_reports");
}

export function readProviderInterventionReportInput(body: Record<string, unknown>) {
  const explicitReport = isRecord(body.completion_report) ? body.completion_report : null;
  const metadata = isRecord(body.metadata) ? body.metadata : {};
  const legacyProof = isRecord(metadata.proof) ? metadata.proof : null;

  if (!explicitReport && body.status !== "completed") return null;

  const source = explicitReport ?? legacyProof;
  if (!source) return null;

  const summary =
    cleanString(source.summary, 5000) ??
    cleanString(source.note, 5000) ??
    cleanString(metadata.completion_summary, 5000);
  if (!summary || summary.length < 3) return null;

  return {
    summary,
    work_performed: cleanString(source.work_performed, 5000) ?? cleanString(source.workPerformed, 5000),
    materials_used: cleanString(source.materials_used, 3000) ?? cleanString(source.materialsUsed, 3000),
    follow_up_required: Boolean(source.follow_up_required ?? source.followUpRequired),
    follow_up_notes: cleanString(source.follow_up_notes, 3000) ?? cleanString(source.followUpNotes, 3000),
    metadata: {
      source: explicitReport ? "completion_report" : "legacy_metadata_proof",
      ...(isRecord(source.metadata) ? source.metadata : {}),
    },
  } satisfies ProviderInterventionReportInput;
}

export function getMissionIdFromIntervention(intervention: ProviderInterventionForReport) {
  const metadata = isRecord(intervention.metadata) ? intervention.metadata : {};
  const missionId = cleanString(metadata.mission_id, 80);
  return missionId && UUID_PATTERN.test(missionId) ? missionId : null;
}

export async function upsertProviderInterventionReport(input: {
  db: LooseSupabaseClient;
  intervention: ProviderInterventionForReport;
  report: ProviderInterventionReportInput;
  submittedBy: string;
}) {
  const missionId = getMissionIdFromIntervention(input.intervention);

  return input.db
    .from("provider_intervention_reports")
    .upsert(
      {
        provider_intervention_id: input.intervention.id,
        mission_id: missionId,
        reservation_id: input.intervention.reservation_id ?? null,
        provider_profile_id: input.intervention.provider_profile_id ?? input.submittedBy,
        owner_profile_id: input.intervention.owner_profile_id ?? null,
        summary: input.report.summary,
        work_performed: input.report.work_performed,
        materials_used: input.report.materials_used,
        follow_up_required: input.report.follow_up_required,
        follow_up_notes: input.report.follow_up_notes,
        submitted_by: input.submittedBy,
        submitted_at: new Date().toISOString(),
        metadata: input.report.metadata as Json,
      },
      { onConflict: "provider_intervention_id" },
    )
    .select("*")
    .single<ProviderInterventionReportRow>();
}

export async function attachProviderInterventionReports<
  T extends { id?: string | null },
>(db: LooseSupabaseClient, interventions: T[]) {
  const ids = interventions.map((item) => item.id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return { items: interventions, schemaReady: true };

  const { data, error } = await db
    .from("provider_intervention_reports")
    .select("*")
    .in("provider_intervention_id", ids);

  if (error) {
    if (isProviderInterventionReportSchemaMissing(error)) {
      return {
        items: interventions.map((item) => ({ ...item, completion_report: null })),
        schemaReady: false,
      };
    }
    console.error("[provider_intervention_reports] load error:", error);
    return {
      items: interventions.map((item) => ({ ...item, completion_report: null })),
      schemaReady: true,
    };
  }

  const reportsByIntervention = new Map(
    ((data ?? []) as ProviderInterventionReportRow[]).map((report) => [
      report.provider_intervention_id,
      report,
    ]),
  );

  return {
    items: interventions.map((item) => ({
      ...item,
      completion_report: item.id ? reportsByIntervention.get(item.id) ?? null : null,
    })),
    schemaReady: true,
  };
}
