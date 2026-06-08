import { normalizeMissionStatus } from "./missionStatus.ts";
import { deriveRequestWorkflowStatus, type RequestWorkflowStatus } from "./requestStatus.ts";

export type QuoteWorkflowStatus =
  | "QUOTE_DRAFT"
  | "QUOTE_SENT"
  | "QUOTE_ACCEPTED"
  | "QUOTE_REJECTED"
  | "QUOTE_EXPIRED"
  | "QUOTE_CANCELED";

export type MissionWorkflowStatus =
  | "TO_SCHEDULE"
  | "DATE_CONFIRMED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export type CommercialWorkflowStatus = {
  request_workflow_status: RequestWorkflowStatus;
  quote_workflow_status: QuoteWorkflowStatus | null;
  mission_workflow_status: MissionWorkflowStatus | null;
};

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function deriveQuoteWorkflowStatus(status: unknown): QuoteWorkflowStatus | null {
  switch (normalize(status)) {
    case "draft":
      return "QUOTE_DRAFT";
    case "sent":
      return "QUOTE_SENT";
    case "accepted":
      return "QUOTE_ACCEPTED";
    case "rejected":
      return "QUOTE_REJECTED";
    case "expired":
      return "QUOTE_EXPIRED";
    case "canceled":
    case "cancelled":
      return "QUOTE_CANCELED";
    default:
      return null;
  }
}

export function deriveMissionWorkflowStatus(input: {
  status?: unknown;
  scheduledStart?: unknown;
  scheduledEnd?: unknown;
}): MissionWorkflowStatus | null {
  const status = normalizeMissionStatus(input.status);
  const hasSchedule = Boolean(
    typeof input.scheduledStart === "string" && input.scheduledStart.trim()
      ? input.scheduledStart
      : typeof input.scheduledEnd === "string" && input.scheduledEnd.trim()
        ? input.scheduledEnd
        : null,
  );

  if (status === "completed") return "COMPLETED";
  if (status === "canceled") return "CANCELED";
  if (status === "in_progress") return "IN_PROGRESS";
  if (hasSchedule) return "SCHEDULED";
  if (status === "scheduled") return "SCHEDULED";
  if (status === "date_confirmed") return "DATE_CONFIRMED";
  if (status === "date_requested" || status === "date_proposed") return "TO_SCHEDULE";
  if (status === "accepted") return "DATE_CONFIRMED";
  if (status === "assigned" || status === "to_schedule" || status === "draft") return "TO_SCHEDULE";

  return null;
}

export function deriveCommercialWorkflowStatus(input: {
  workflowStatus?: string | null;
  serviceRequestStatus?: string | null;
  recipientStatus?: string | null;
  quoteStatus?: string | null;
  missionStatus?: string | null;
  hasMission?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}): CommercialWorkflowStatus {
  const quote_workflow_status = deriveQuoteWorkflowStatus(input.quoteStatus);
  const mission_workflow_status =
    input.hasMission || input.missionStatus || input.scheduledStart || input.scheduledEnd
      ? deriveMissionWorkflowStatus({
          status: input.missionStatus,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
        })
      : null;

  return {
    request_workflow_status: deriveRequestWorkflowStatus({
      workflowStatus: input.workflowStatus,
      serviceRequestStatus: input.serviceRequestStatus,
      recipientStatus: input.recipientStatus,
      quoteStatus: input.quoteStatus,
      missionStatus: input.missionStatus,
      hasMission: input.hasMission,
    }),
    quote_workflow_status,
    mission_workflow_status,
  };
}
