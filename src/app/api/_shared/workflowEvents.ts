import { deriveCommercialWorkflowStatus } from "../../lib/commercialWorkflow.ts";
import type { Json } from "@/types/supabase";

type InsertableWorkflowEvent = {
  actorProfileId?: string | null;
  ownerProfileId?: string | null;
  conciergeProfileId?: string | null;
  serviceRequestId?: string | null;
  serviceRequestRecipientId?: string | null;
  quoteId?: string | null;
  missionId?: string | null;
  eventType: string;
  title: string;
  body?: string | null;
  actionHref?: string | null;
  workflowStatus?: string | null;
  serviceRequestStatus?: string | null;
  recipientStatus?: string | null;
  quoteStatus?: string | null;
  missionStatus?: string | null;
  hasMission?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  metadata?: Json | null;
};

type WorkflowEventDb = {
  from: (table: string) => {
    insert: (
      payload: Record<string, unknown>,
    ) => PromiseLike<{ error?: { code?: string; message?: string } | null }>;
  };
};

const MISSING_WORKFLOW_EVENTS_CODES = new Set(["42P01", "PGRST204", "PGRST205"]);

export async function recordWorkflowEvent(db: WorkflowEventDb, input: InsertableWorkflowEvent) {
  const workflow = deriveCommercialWorkflowStatus({
    workflowStatus: input.workflowStatus,
    serviceRequestStatus: input.serviceRequestStatus,
    recipientStatus: input.recipientStatus,
    quoteStatus: input.quoteStatus,
    missionStatus: input.missionStatus,
    hasMission: input.hasMission,
    scheduledStart: input.scheduledStart,
    scheduledEnd: input.scheduledEnd,
  });

  const { error } = await db.from("workflow_events").insert({
    actor_profile_id: input.actorProfileId ?? null,
    owner_profile_id: input.ownerProfileId ?? null,
    concierge_profile_id: input.conciergeProfileId ?? null,
    service_request_id: input.serviceRequestId ?? null,
    service_request_recipient_id: input.serviceRequestRecipientId ?? null,
    quote_id: input.quoteId ?? null,
    mission_id: input.missionId ?? null,
    event_type: input.eventType,
    request_workflow_status: workflow.request_workflow_status,
    quote_workflow_status: workflow.quote_workflow_status,
    mission_workflow_status: workflow.mission_workflow_status,
    title: input.title,
    body: input.body ?? null,
    action_href: input.actionHref ?? null,
    metadata: input.metadata ?? {},
  });

  if (error && !MISSING_WORKFLOW_EVENTS_CODES.has(error.code ?? "")) {
    console.error("[workflow_events] insert error:", error);
  }

  return {
    workflow,
    inserted: !error,
  };
}
