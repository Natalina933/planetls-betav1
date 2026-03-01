import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCompletedMissionHighlights,
  buildObjectiveChecklist,
  computeAverageRevenue,
  computeCompletionRate,
  countActiveHousing,
  sumTrackedRevenue,
} from "../app/dashboard/concierge/objectifs/objectifsHelpers.ts";
import {
  buildBillingCards,
  formatBillingDate,
  getBillingSourceLabel,
} from "../app/dashboard/concierge/billing/billingHelpers.ts";

test("objectifs helpers compute metrics and checklist coherently", () => {
  assert.equal(countActiveHousing([{ id: 1, statut: "active" }, { id: 2, statut: "draft" }]), 1);
  assert.equal(sumTrackedRevenue([{ id: "m1", status: "completed", amount: 120 }]), 120);
  assert.equal(computeAverageRevenue(240, 2), 120);
  assert.equal(computeCompletionRate(5, 3), 60);

  const checklist = buildObjectiveChecklist({
    activeHousing: 2,
    activeMissionCount: 0,
    averageRevenue: 150,
    completionRate: 40,
  });

  assert.equal(checklist.length, 4);
  assert.equal(checklist[0]?.tone, "warning");
  assert.equal(checklist[1]?.tone, "warning");

  const highlights = buildCompletedMissionHighlights([
    { id: "abcd1234", status: "completed", amount: 190, title: "Check-out" },
  ]);

  assert.equal(highlights[0]?.title, "Check-out");
  assert.equal(highlights[0]?.tone, "success");
});

test("billing helpers expose readable labels and fallback cards", () => {
  assert.equal(getBillingSourceLabel("webhook"), "Webhook Stripe");
  assert.equal(formatBillingDate(null), "Non renseignée");

  const emptyCards = buildBillingCards(null, false, null);
  assert.equal(emptyCards[0]?.title, "Aucun événement pour le moment");

  const cards = buildBillingCards(
    {
      subscription: null,
      events: [
        {
          id: "evt_1",
          profile_id: null,
          stripe_object_id: "cs_test",
          stripe_event_type: "checkout.session.completed",
          source: "return",
          payload: null,
          created_at: "2026-02-20T09:00:00.000Z",
        },
      ],
    },
    false,
    null,
  );

  assert.equal(cards[0]?.title, "checkout.session.completed");
  assert.match(cards[0]?.text || "", /Retour navigateur/);
});
