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

type ConversationMetadata = unknown;

function readIsoDate(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toMetadataRecord(metadata: ConversationMetadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {} as Record<string, unknown>;
  }
  return metadata as Record<string, unknown>;
}

export function getConversationSeenAt(
  metadata: ConversationMetadata,
  roleHint: "owner" | "concierge",
) {
  const record = toMetadataRecord(metadata);
  return readIsoDate(
    roleHint === "owner" ? record.owner_last_seen_at : record.concierge_last_seen_at,
  );
}

export function setConversationSeenAt(
  metadata: ConversationMetadata,
  roleHint: "owner" | "concierge",
  seenAt: string,
) {
  const record = toMetadataRecord(metadata);
  return {
    ...record,
    [roleHint === "owner" ? "owner_last_seen_at" : "concierge_last_seen_at"]: seenAt,
  };
}
