import { formatConversationDate } from "../../shared/conversations.ts";

type ContactConversation = {
  id: string;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  subject: string | null;
  status: string | null;
};

type WorkspaceTone = "default" | "warning" | "success";

export type ContactItem = {
  title: string;
  meta: string;
  description: string;
  href: string;
  actionLabel: string;
  tone?: WorkspaceTone;
};

export function formatContactDate(value: string | null) {
  return value ? formatConversationDate(value) : "Aucun message récent";
}

export function isOlderThanDays(value: string | null, days: number) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time > days * 24 * 60 * 60 * 1000;
}

export function normalizeContactStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "non renseigné";
}

export function toConversationItem(
  conversation: ContactConversation,
  meta: string,
  actionLabel: string,
  tone?: WorkspaceTone,
): ContactItem {
  return {
    title: conversation.counterpart_name || "Propriétaire",
    meta,
    description: `${conversation.subject || "Conversation directe"} - ${conversation.last_message_preview || "Aucun aperçu disponible."}`,
    href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
    actionLabel,
    tone,
  };
}
