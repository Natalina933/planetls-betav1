type NullableId = string | null | undefined;

export type ServiceRequestOwnership = {
  id?: NullableId;
  owner_profile_id?: NullableId;
};

export type QuoteOwnership = {
  id?: NullableId;
  owner_profile_id?: NullableId;
  concierge_profile_id?: NullableId;
  service_request_id?: NullableId;
  service_request_recipient_id?: NullableId;
  metadata?: Record<string, unknown> | null;
};

export const quoteBelongsToServiceRequest = (
  quote: QuoteOwnership,
  serviceRequestId: string,
): boolean => quote.service_request_id === serviceRequestId || quote.metadata?.service_request_id === serviceRequestId;

export const canOwnerSelectQuote = (
  ownerProfileId: string,
  serviceRequest: ServiceRequestOwnership,
  quote: QuoteOwnership,
): boolean =>
  Boolean(
    ownerProfileId &&
      serviceRequest.id &&
      serviceRequest.owner_profile_id === ownerProfileId &&
      quote.owner_profile_id === ownerProfileId &&
      quoteBelongsToServiceRequest(quote, serviceRequest.id),
  );

export const canConciergeManageQuote = (
  conciergeProfileId: string,
  quote: QuoteOwnership,
): boolean => Boolean(conciergeProfileId && quote.concierge_profile_id === conciergeProfileId);

export const canOwnerUpdateQuoteStatus = (
  ownerProfileId: string,
  quote: QuoteOwnership,
  nextStatus: string,
): boolean =>
  Boolean(
    ownerProfileId &&
      quote.owner_profile_id === ownerProfileId &&
      (nextStatus === "accepted" || nextStatus === "rejected"),
  );

export const isCrossProfileAccessDenied = (
  profileId: string,
  resource: {
    owner_profile_id?: NullableId;
    concierge_profile_id?: NullableId;
  },
): boolean =>
  Boolean(
    profileId &&
      resource.owner_profile_id !== profileId &&
      resource.concierge_profile_id !== profileId,
  );
