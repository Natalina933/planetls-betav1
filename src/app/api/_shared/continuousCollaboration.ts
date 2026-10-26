import { getGuestCheckinCheckoutModeFromMetadata, getGuestCheckinCheckoutOperationalSlugs } from "../../lib/guestCheckinCheckout.ts";

export type CollaborationBrief = {
  requested_services?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

/** Explicit opt-in: historical durable requests keep their signed-contract flow. */
export function isContinuousCollaboration(request: CollaborationBrief | null | undefined) {
  return request?.metadata?.continuous_collaboration === true;
}

export function agreedServiceSlugs(request: CollaborationBrief): string[] {
  const source = request.requested_services ?? request.metadata?.requested_services;
  const mode = getGuestCheckinCheckoutModeFromMetadata(request.metadata);
  return [...new Set((Array.isArray(source) ? source : []).filter((s): s is string => typeof s === "string")
    .flatMap(slug => slug === "guest_checkin_checkout"
      ? getGuestCheckinCheckoutOperationalSlugs(mode ?? "arrival_departure") : [slug]))];
}

export function canRequestCollaborationEnd(collaboration: {
  owner_profile_id: string; concierge_profile_id: string;
}, actorId: string) {
  return actorId === collaboration.owner_profile_id || actorId === collaboration.concierge_profile_id;
}
