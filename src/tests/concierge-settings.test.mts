import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRecentBillingEvents,
  buildSettingsChecklist,
} from "../app/dashboard/concierge/settings/settingsHelpers.ts";

test("buildSettingsChecklist derives concierge configuration cards", () => {
  const cards = buildSettingsChecklist(
    {
      city: "Paris",
      service_area: "Île-de-France",
      hourly_rate: 45,
      email: "concierge@example.com",
    },
    {
      isPro: true,
      updatedAt: "2026-02-20T10:00:00.000Z",
    },
  );

  assert.equal(cards.length, 4);
  assert.equal(cards[0]?.meta, "Île-de-France");
  assert.equal(cards[1]?.meta, "PRO actif");
  assert.equal(cards[3]?.tone, "success");
});

test("buildRecentBillingEvents formats recent Stripe history", () => {
  const cards = buildRecentBillingEvents([
    {
      id: "evt_1",
      stripe_event_type: "invoice.paid",
      source: "webhook",
      created_at: "2026-02-21T09:00:00.000Z",
    },
  ]);

  assert.equal(cards.length, 1);
  assert.equal(cards[0]?.title, "invoice.paid");
  assert.match(cards[0]?.description || "", /webhook/);
});
