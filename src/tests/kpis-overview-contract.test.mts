import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { isKpiOverviewPayload } from "../app/api/kpis/overview/shared.ts";

const adminPage = readFileSync(new URL("../app/dashboard/admin/page.tsx", import.meta.url), "utf8");

test("KPI overview payload contract accepts expected shape", () => {
  const payload = {
    window_days: 30,
    generated_at: "2026-05-18T12:00:00Z",
    owner: {
      activation_j7: 10,
      activation_j7_eligible: 10,
      activation_j7_activated: 1,
      activation_definition: "request",
      median_signup_to_first_request_minutes: 120,
      request_to_quote_rate: 50,
    },
    concierge: {
      activation_j7: 20,
      activation_j7_eligible: 10,
      activation_j7_activated: 2,
      activation_definition: "quote",
      median_signup_to_first_response_minutes: 60,
      quote_to_mission_rate: 40,
    },
    provider: {
      activation_j7: 30,
      activation_j7_eligible: 10,
      activation_j7_activated: 3,
      activation_definition: "mission",
      median_signup_to_first_response_minutes: 45,
      missions_completed_rate: 70,
    },
    activation_series: {
      owner: [{ period_start: "2026-05-01T00:00:00Z", period_end: "2026-05-08T00:00:00Z", eligible: 10, activated: 1, rate: 10 }],
      concierge: [],
      provider: [],
    },
    activation_by_zone: {
      owner: [{ zone: "Lyon", eligible: 10, activated: 4, rate: 40 }],
      concierge: [],
      provider: [],
    },    shared: {
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

test("admin cockpit renders activation rates, cohorts and zones without blocking operations", () => {
  assert.match(adminPage, /\/api\/kpis\/overview\?window_days=30/);
  assert.match(adminPage, /Promise\.allSettled/);
  assert.match(adminPage, /Activation J\+7/);
  assert.match(adminPage, /activation_series/);
  assert.match(adminPage, /activation_by_zone/);
  assert.match(adminPage, /Indicateurs d activation indisponibles/);
});