import test from "node:test";
import assert from "node:assert/strict";

import { isKpiOverviewPayload } from "../app/api/kpis/overview/shared.ts";

test("KPI overview payload contract accepts expected shape", () => {
  const payload = {
    window_days: 30,
    generated_at: "2026-05-18T12:00:00Z",
    owner: {
      activation_j7: 10,
      median_signup_to_first_request_minutes: 120,
      request_to_quote_rate: 50,
    },
    concierge: {
      activation_j7: 20,
      median_signup_to_first_response_minutes: 60,
      quote_to_mission_rate: 40,
    },
    provider: {
      activation_j7: 30,
      median_signup_to_first_response_minutes: 45,
      missions_completed_rate: 70,
    },
    shared: {
      mission_to_paid_invoice_rate: 80,
      median_first_message_response_minutes: 35,
    },
  };

  assert.equal(isKpiOverviewPayload(payload), true);
});

test("KPI overview payload contract rejects invalid shape", () => {
  const invalidPayload = {
    window_days: "30",
    generated_at: "2026-05-18T12:00:00Z",
    owner: { activation_j7: 10 },
    concierge: { activation_j7: 20 },
    provider: { activation_j7: 30 },
    shared: {
      mission_to_paid_invoice_rate: 80,
      median_first_message_response_minutes: 35,
    },
  };

  assert.equal(isKpiOverviewPayload(invalidPayload), false);
});
