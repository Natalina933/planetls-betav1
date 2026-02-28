import type { ConversationDetailResponse, ConversationItem } from "./messagesClient";

export function resolveActiveConversationId(
  conversations: ConversationItem[],
  queryConversationId: string,
  currentActiveConversationId: string,
) {
  if (conversations.length === 0) {
    return "";
  }

  if (queryConversationId) {
    const exists = conversations.some((conversation) => conversation.id === queryConversationId);
    if (exists) {
      return queryConversationId;
    }
  }

  if (currentActiveConversationId) {
    const exists = conversations.some(
      (conversation) => conversation.id === currentActiveConversationId,
    );
    if (exists) {
      return currentActiveConversationId;
    }
  }

  return conversations[0].id;
}

export function buildParticipantNameMap(
  activeConversation: ConversationDetailResponse | null,
) {
  const map = new Map<string, string>();

  (activeConversation?.participants ?? []).forEach((participant) => {
    const fullName = `${participant.first_name ?? ""} ${participant.last_name ?? ""}`.trim();
    map.set(
      participant.id,
      fullName || participant.company_name || participant.username || "Contact",
    );
  });

  return map;
}

export function canSendConversationMessage(
  activeConversationId: string,
  draftMessage: string,
) {
  return Boolean(activeConversationId && draftMessage.trim());
}
