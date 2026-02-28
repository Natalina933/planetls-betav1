export interface ConversationItem {
  id: string;
  subject: string | null;
  source: string;
  status: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  counterpart_profile_id: string | null;
  counterpart_name: string;
}

export interface ConversationMessage {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
  message_type: string;
}

export interface ConversationDetailResponse {
  conversation: {
    id: string;
    subject: string | null;
    source: string;
    status: string;
    concierge_profile_id: string;
    owner_profile_id: string;
  };
  messages: ConversationMessage[];
  participants: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    company_name: string | null;
  }>;
  current_user_id: string;
}

export const getResponseError = async (
  res: Response,
  fallback: string,
): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body?.error === "string" && body.error.trim()) return body.error;
    return fallback;
  } catch {
    return fallback;
  }
};

export async function fetchConversations() {
  const res = await fetch("/api/messages/conversations?role=concierge&limit=80", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await getResponseError(res, "Erreur chargement conversations"));
  }

  const rows = (await res.json()) as ConversationItem[];
  return Array.isArray(rows) ? rows : [];
}

export async function fetchConversationDetail(conversationId: string) {
  const res = await fetch(`/api/messages/conversations/${conversationId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await getResponseError(res, "Erreur chargement conversation"));
  }

  return (await res.json()) as ConversationDetailResponse;
}

export async function sendConversationMessage(
  conversationId: string,
  body: string,
) {
  const res = await fetch(`/api/messages/conversations/${conversationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    throw new Error(await getResponseError(res, "Erreur envoi message"));
  }
}
