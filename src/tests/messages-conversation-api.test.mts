import test from "node:test";
import assert from "node:assert/strict";

import { resolveConversationParticipants } from "../app/api/messages/conversations/shared.ts";

test("resolveConversationParticipants uses current owner id for owner-created threads", () => {
  const result = resolveConversationParticipants({
    role: "owner",
    userId: "owner-1",
    conciergeProfileId: "concierge-1",
  });

  assert.deepEqual(result, {
    ownerProfileId: "owner-1",
    conciergeProfileId: "concierge-1",
  });
});

test("resolveConversationParticipants keeps provided owner target for concierge-created threads", () => {
  const result = resolveConversationParticipants({
    role: "concierge",
    userId: "concierge-1",
    ownerProfileId: "owner-1",
  });

  assert.deepEqual(result, {
    ownerProfileId: "owner-1",
    conciergeProfileId: "concierge-1",
  });
});
