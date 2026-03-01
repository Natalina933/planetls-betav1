import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlanningStatusBreakdown,
  isPlanningDone,
  normalizePlanningStatus,
  toPlanningItem,
} from "../app/dashboard/concierge/planning/planningHelpers.ts";
import {
  formatContactDate,
  normalizeContactStatus,
  toConversationItem,
} from "../app/dashboard/concierge/contacts/contactsHelpers.ts";

test("planning helpers normalize status and build planning cards", () => {
  assert.equal(isPlanningDone("completed"), true);
  assert.equal(normalizePlanningStatus("in_progress"), "in progress");

  const item = toPlanningItem(
    {
      id: "m1",
      title: "Check-in",
      status: "pending",
      priority: "urgent",
      scheduled_start: null,
    },
    "Ouvrir",
  );

  assert.equal(item.title, "Check-in");
  assert.equal(item.meta, "À planifier");
  assert.equal(item.tone, "warning");

  const breakdown = buildPlanningStatusBreakdown([
    { id: "1", title: "A", status: "completed", priority: null, scheduled_start: null },
    { id: "2", title: "B", status: "completed", priority: null, scheduled_start: null },
    { id: "3", title: "C", status: "pending", priority: null, scheduled_start: null },
  ]);

  assert.equal(breakdown[0]?.title, "completed");
  assert.equal(breakdown[0]?.tone, "success");
});

test("contacts helpers format conversation cards", () => {
  const item = toConversationItem(
    {
      id: "c1",
      counterpart_name: "Owner Test",
      last_message_preview: "Bonjour",
      last_message_at: null,
      subject: "Mission",
      status: "in_progress",
    },
    normalizeContactStatus("in_progress"),
    "Répondre",
  );

  assert.equal(item.title, "Owner Test");
  assert.match(item.description, /Bonjour/);
  assert.equal(formatContactDate(null), "Aucun message récent");
});
