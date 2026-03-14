import { formatDateValue } from "../../utils/formatters.ts";

type ConversationSummaryInput = {
  counterpart_name?: string | null;
  subject?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  status?: string | null;
};

export function formatConversationDate(value?: string | null) {
  return formatDateValue(value, {
    emptyLabel: "Date non renseignée",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getConversationTitle(
  conversation: ConversationSummaryInput,
  fallbackTitle: string,
) {
  return conversation.counterpart_name || fallbackTitle;
}

export function getConversationSummary(
  conversation: ConversationSummaryInput,
  {
    fallbackSubject,
    fallbackPreview,
    fallbackStatus,
  }: {
    fallbackSubject: string;
    fallbackPreview: string;
    fallbackStatus?: string;
  },
) {
  return [
    conversation.subject || fallbackSubject,
    conversation.last_message_preview || fallbackPreview,
    conversation.status || fallbackStatus,
    formatConversationDate(conversation.last_message_at),
  ]
    .filter(Boolean)
    .join(" - ");
}
