export type ServiceRequestStatus =
  | "sent"
  | "in_review"
  | "quoted"
  | "accepted"
  | "closed"
  | "cancelled";

export type ServiceRequestRecipientStatus =
  | "sent"
  | "viewed"
  | "interested"
  | "quoted"
  | "declined"
  | "selected"
  | "not_selected";

export function deriveServiceRequestStatus(
  recipientStatuses: ServiceRequestRecipientStatus[],
  selectedConciergeProfileId?: string | null,
): ServiceRequestStatus {
  if (selectedConciergeProfileId || recipientStatuses.some((status) => status === "selected")) {
    return "accepted";
  }

  if (
    recipientStatuses.length > 0 &&
    recipientStatuses.every((status) => status === "declined" || status === "not_selected")
  ) {
    return "closed";
  }

  if (recipientStatuses.some((status) => status === "quoted")) {
    return "quoted";
  }

  if (recipientStatuses.some((status) => status === "interested" || status === "viewed")) {
    return "in_review";
  }

  return "sent";
}
