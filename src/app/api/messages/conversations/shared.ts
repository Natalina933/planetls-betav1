export function resolveConversationParticipants(input: {
  role: string;
  userId: string;
  ownerProfileId?: string | null;
  conciergeProfileId?: string | null;
}) {
  const isOwnerCreator = input.role === "owner" || input.role === "owner_pro";

  return {
    ownerProfileId: isOwnerCreator ? input.userId : (input.ownerProfileId ?? "").trim(),
    conciergeProfileId: isOwnerCreator
      ? (input.conciergeProfileId ?? "").trim()
      : input.userId,
  };
}
