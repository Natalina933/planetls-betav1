import test from "node:test";
import assert from "node:assert/strict";

import {
  buildParticipantNameMap,
  canSendConversationMessage,
  resolveActiveConversationId,
} from "../app/dashboard/concierge/messages/messagesState.ts";
import type {
  ConversationDetailResponse,
  ConversationItem,
} from "../app/dashboard/concierge/messages/messagesClient.ts";

const conversations: ConversationItem[] = [
  {
    id: "conv-1",
    subject: "Premier sujet",
    source: "search",
    status: "open",
    last_message_preview: "Bonjour",
    last_message_at: "2026-02-28T12:00:00.000Z",
    counterpart_profile_id: "owner-1",
    counterpart_name: "Alice Martin",
  },
  {
    id: "conv-2",
    subject: "Deuxieme sujet",
    source: "search",
    status: "open",
    last_message_preview: "Merci",
    last_message_at: "2026-02-28T13:00:00.000Z",
    counterpart_profile_id: "owner-2",
    counterpart_name: "Bob Durand",
  },
];

const detail: ConversationDetailResponse = {
  conversation: {
    id: "conv-1",
    subject: "Premier sujet",
    source: "search",
    status: "open",
    concierge_profile_id: "concierge-1",
    owner_profile_id: "owner-1",
  },
  messages: [],
  participants: [
    {
      id: "concierge-1",
      first_name: "Nathalie",
      last_name: "Charbonnel",
      username: "ncharbonnel",
      company_name: null,
    },
    {
      id: "owner-1",
      first_name: null,
      last_name: null,
      username: null,
      company_name: "SCI Centre Ville",
    },
  ],
  current_user_id: "concierge-1",
};

test("resolveActiveConversationId prioritizes query id when valid", () => {
  assert.equal(resolveActiveConversationId(conversations, "conv-2", ""), "conv-2");
});

test("resolveActiveConversationId falls back to current or first conversation", () => {
  assert.equal(resolveActiveConversationId(conversations, "", "conv-1"), "conv-1");
  assert.equal(resolveActiveConversationId(conversations, "", "unknown"), "conv-1");
  assert.equal(resolveActiveConversationId([], "", ""), "");
});

test("buildParticipantNameMap prefers full name then company name", () => {
  const participantMap = buildParticipantNameMap(detail);

  assert.equal(participantMap.get("concierge-1"), "Nathalie Charbonnel");
  assert.equal(participantMap.get("owner-1"), "SCI Centre Ville");
});

test("canSendConversationMessage requires conversation id and non-empty draft", () => {
  assert.equal(canSendConversationMessage("conv-1", "Bonjour"), true);
  assert.equal(canSendConversationMessage("", "Bonjour"), false);
  assert.equal(canSendConversationMessage("conv-1", "   "), false);
});
