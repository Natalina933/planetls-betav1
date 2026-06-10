export type RequestWorkflowStatus =
  | "NEW"
  | "SENT"
  | "VIEWED"
  | "IN_DISCUSSION"
  | "QUOTE_SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "ARCHIVED";

type RequestWorkflowTone = "neutral" | "info" | "warning" | "success" | "danger" | "progress";

type RequestWorkflowMeta = {
  label: string;
  variant: RequestWorkflowTone;
};

const REQUEST_WORKFLOW_META: Record<RequestWorkflowStatus, RequestWorkflowMeta> = {
  NEW: { label: "Brouillon", variant: "neutral" },
  SENT: { label: "Envoyée", variant: "info" },
  VIEWED: { label: "Consultée", variant: "info" },
  IN_DISCUSSION: { label: "En discussion", variant: "progress" },
  QUOTE_SENT: { label: "Proposition reçue", variant: "progress" },
  ACCEPTED: { label: "Acceptée", variant: "success" },
  DECLINED: { label: "Refusée", variant: "danger" },
  EXPIRED: { label: "Expirée", variant: "warning" },
  ARCHIVED: { label: "Archivée", variant: "success" },
};

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export function getRequestWorkflowMeta(status: RequestWorkflowStatus) {
  return REQUEST_WORKFLOW_META[status];
}

export function deriveRequestWorkflowStatus(params: {
  workflowStatus?: string | null;
  serviceRequestStatus?: string | null;
  recipientStatus?: string | null;
  quoteStatus?: string | null;
  missionStatus?: string | null;
  hasMission?: boolean;
}): RequestWorkflowStatus {
  const workflowStatus = normalizeStatus(params.workflowStatus);
  if (workflowStatus in REQUEST_WORKFLOW_META) {
    return workflowStatus as RequestWorkflowStatus;
  }
  if (workflowStatus === "MISSION_CREATED" || workflowStatus === "COMPLETED") return "ARCHIVED";
  if (workflowStatus === "IN_PROGRESS") return "ACCEPTED";
  if (params.hasMission) return "ARCHIVED";

  const quoteStatus = normalizeStatus(params.quoteStatus);
  if (quoteStatus === "ACCEPTED") return "ACCEPTED";
  if (quoteStatus === "SENT") return "QUOTE_SENT";
  if (quoteStatus === "DRAFT") return "IN_DISCUSSION";
  if (["REJECTED", "CANCELED", "CANCELLED"].includes(quoteStatus)) return "DECLINED";
  if (quoteStatus === "EXPIRED") return "EXPIRED";

  const recipientStatus = normalizeStatus(params.recipientStatus);
  if (recipientStatus === "SELECTED") return "ACCEPTED";
  if (recipientStatus === "QUOTED") return "QUOTE_SENT";
  if (recipientStatus === "INFORMATION_REQUESTED" || recipientStatus === "DATE_PROPOSED") return "IN_DISCUSSION";
  if (recipientStatus === "INTERESTED") return "IN_DISCUSSION";
  if (recipientStatus === "VIEWED") return "VIEWED";
  if (recipientStatus === "SENT") return "SENT";
  if (["DECLINED", "NOT_SELECTED"].includes(recipientStatus)) return "DECLINED";

  const serviceRequestStatus = normalizeStatus(params.serviceRequestStatus);
  if (["COMPLETED", "ARCHIVED"].includes(serviceRequestStatus)) return "ARCHIVED";
  if (serviceRequestStatus === "ACCEPTED" || serviceRequestStatus === "QUOTE_ACCEPTED") return "ACCEPTED";
  if (serviceRequestStatus === "INFORMATION_REQUESTED") return "IN_DISCUSSION";
  if (serviceRequestStatus === "QUOTED") return "QUOTE_SENT";
  if (serviceRequestStatus === "IN_REVIEW") return "IN_DISCUSSION";
  if (serviceRequestStatus === "SENT" || serviceRequestStatus === "RECEIVED") return "SENT";
  if (serviceRequestStatus === "VIEWED") return "VIEWED";
  if (["DECLINED", "REJECTED", "QUOTE_REFUSED", "CLOSED"].includes(serviceRequestStatus)) return "DECLINED";
  if (serviceRequestStatus === "EXPIRED") return "EXPIRED";

  return "NEW";
}
