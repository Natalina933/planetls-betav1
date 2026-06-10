export type ServiceRequestStatus =
  | "received"
  | "sent"
  | "viewed"
  | "in_review"
  | "information_requested"
  | "quoted"
  | "quote_accepted"
  | "quote_refused"
  | "accepted"
  | "closed"
  | "cancelled"
  | "expired";

export type ServiceRequestRecipientStatus =
  | "sent"
  | "viewed"
  | "interested"
  | "information_requested"
  | "date_proposed"
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

  if (
    recipientStatuses.some((status) =>
      status === "interested" ||
      status === "information_requested" ||
      status === "date_proposed" ||
      status === "viewed"
    )
  ) {
    return "in_review";
  }

  return "sent";
}
