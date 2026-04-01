export type RequestWorkflowStatus =
  | "NEW"
  | "IN_DISCUSSION"
  | "QUOTE_SENT"
  | "ACCEPTED"
  | "MISSION_CREATED"
  | "IN_PROGRESS"
  | "COMPLETED";

type RequestWorkflowTone = "neutral" | "info" | "warning" | "success";

type RequestWorkflowMeta = {
  label: string;
  variant: RequestWorkflowTone;
};

const REQUEST_WORKFLOW_META: Record<RequestWorkflowStatus, RequestWorkflowMeta> = {
  NEW: { label: "Nouveau", variant: "neutral" },
  IN_DISCUSSION: { label: "En discussion", variant: "info" },
  QUOTE_SENT: { label: "Devis envoyé", variant: "warning" },
  ACCEPTED: { label: "Accepté", variant: "success" },
  MISSION_CREATED: { label: "Mission créée", variant: "info" },
  IN_PROGRESS: { label: "En cours", variant: "warning" },
  COMPLETED: { label: "Terminée", variant: "success" },
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

  const missionStatus = normalizeStatus(params.missionStatus);
  if (missionStatus === "COMPLETED") return "COMPLETED";
  if (missionStatus === "IN_PROGRESS") return "IN_PROGRESS";
  if (params.hasMission || ["DRAFT", "ASSIGNED", "ACCEPTED"].includes(missionStatus)) {
    return "MISSION_CREATED";
  }

  const quoteStatus = normalizeStatus(params.quoteStatus);
  if (quoteStatus === "ACCEPTED") return "ACCEPTED";
  if (quoteStatus === "SENT") return "QUOTE_SENT";
  if (quoteStatus === "DRAFT") return "IN_DISCUSSION";

  const recipientStatus = normalizeStatus(params.recipientStatus);
  if (recipientStatus === "SELECTED") return "ACCEPTED";
  if (recipientStatus === "QUOTED") return "QUOTE_SENT";
  if (recipientStatus === "INTERESTED" || recipientStatus === "VIEWED") {
    return "IN_DISCUSSION";
  }

  const serviceRequestStatus = normalizeStatus(params.serviceRequestStatus);
  if (serviceRequestStatus === "COMPLETED") return "COMPLETED";
  if (serviceRequestStatus === "IN_PROGRESS") return "IN_PROGRESS";
  if (serviceRequestStatus === "ACCEPTED") return "ACCEPTED";
  if (serviceRequestStatus === "QUOTED") return "QUOTE_SENT";
  if (serviceRequestStatus === "IN_REVIEW") return "IN_DISCUSSION";

  return "NEW";
}
