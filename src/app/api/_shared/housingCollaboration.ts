import type { LooseSupabaseClient } from "./untypedSupabase";

type CollaborationRequest = {
  id?: string | null;
  desired_date?: string | null;
  metadata?: Record<string, unknown> | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

const asOption = (value: unknown, allowed: string[], fallback: string | null = null) =>
  typeof value === "string" && allowed.includes(value) ? value : fallback;

export async function upsertAcceptedHousingCollaboration(input: {
  db: LooseSupabaseClient;
  housingId: number;
  ownerProfileId: string | null | undefined;
  conciergeProfileId: string | null | undefined;
  quoteId: string;
  missionId?: string | null;
  request?: CollaborationRequest | null;
}) {
  if (!input.ownerProfileId || !input.conciergeProfileId) return null;

  const metadata = asRecord(input.request?.metadata);
  const collaborationType = asOption(
    metadata.collaboration_type,
    ["one_off", "regular", "full_management", "partial_management", "temporary_replacement", "trial", "onboarding"],
    "one_off",
  );
  const frequency = asOption(metadata.collaboration_frequency, ["once", "weekly", "monthly", "seasonal", "year_round", "unknown"]);
  const responsibilityLevel = asOption(metadata.responsibility_level, ["low", "shared", "full", "unknown"]);

  const { data, error } = await input.db
    .from("housing_collaborations")
    .upsert(
      {
        housing_id: input.housingId,
        owner_profile_id: input.ownerProfileId,
        concierge_profile_id: input.conciergeProfileId,
        service_request_id: input.request?.id ?? null,
        quote_id: input.quoteId,
        mission_id: input.missionId ?? null,
        status: "pending_handover",
        collaboration_type: collaborationType,
        frequency,
        responsibility_level: responsibilityLevel,
        starts_on: input.request?.desired_date ? input.request.desired_date.slice(0, 10) : null,
        handover_status: "pending",
        scope: {
          estimated_duration: typeof metadata.estimated_duration === "string" ? metadata.estimated_duration : null,
          property_constraints: typeof metadata.property_constraints === "string" ? metadata.property_constraints : null,
          requested_services: Array.isArray(metadata.requested_services) ? metadata.requested_services : [],
        },
      },
      { onConflict: "quote_id" },
    )
    .select("id, status, handover_status")
    .single();

  if (error) throw error;
  return data;
}
