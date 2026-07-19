import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ACTIVATION_ALERT_POLICY, buildActivationAlerts, isKpiOverviewPayload } from "../app/api/kpis/overview/shared.ts";

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
    },
    activation_alert_policy: ACTIVATION_ALERT_POLICY,
    activation_alerts: [],
    shared: {
      mission_to_paid_invoice_rate: 80,
      median_first_message_response_minutes: 35,
    },
  };

  assert.equal(isKpiOverviewPayload(payload), true);
});

test("activation alerts separate low samples, critical rates and declining cohorts", () => {
  const metrics = {
    owner: { activation_j7: 10, activation_j7_eligible: 10, activation_j7_activated: 1, activation_definition: "request" },
    concierge: { activation_j7: 40, activation_j7_eligible: 4, activation_j7_activated: 2, activation_definition: "quote" },
    provider: { activation_j7: 40, activation_j7_eligible: 10, activation_j7_activated: 4, activation_definition: "mission" },
  };
  const series = {
    owner: [], concierge: [],
    provider: [
      { period_start: "2026-07-01", period_end: "2026-07-08", eligible: 10, activated: 5, rate: 50 },
      { period_start: "2026-07-08", period_end: "2026-07-15", eligible: 10, activated: 3, rate: 30 },
    ],
  };
  const alerts = buildActivationAlerts(metrics, series);
  assert.equal(alerts.find((alert) => alert.id === "owner-target")?.severity, "danger");
  assert.equal(alerts.find((alert) => alert.id === "concierge-sample")?.kind, "insufficient_data");
  assert.equal(alerts.find((alert) => alert.id === "provider-decline")?.kind, "declining");
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

test("KPI overview payload contract rejects malformed activation alerts", () => {
  const malformed = {
    window_days: 30, generated_at: "2026-05-18T12:00:00Z",
    owner: { activation_j7: 10, activation_j7_eligible: 10, activation_j7_activated: 1, activation_definition: "request" },
    concierge: { activation_j7: 20, activation_j7_eligible: 10, activation_j7_activated: 2, activation_definition: "quote" },
    provider: { activation_j7: 30, activation_j7_eligible: 10, activation_j7_activated: 3, activation_definition: "mission" },
    activation_series: { owner: [], concierge: [], provider: [] },
    activation_by_zone: { owner: [], concierge: [], provider: [] },
    activation_alert_policy: ACTIVATION_ALERT_POLICY,
    activation_alerts: [{ id: "bad", severity: "unknown" }],
    shared: { mission_to_paid_invoice_rate: null, median_first_message_response_minutes: null },
  };
  assert.equal(isKpiOverviewPayload(malformed), false);
});

test("admin cockpit renders activation rates, cohorts and zones without blocking operations", () => {
  assert.match(adminPage, /\/api\/kpis\/overview\?window_days=30/);
  assert.match(adminPage, /Promise\.allSettled/);
  assert.match(adminPage, /Activation J\+7/);
  assert.match(adminPage, /activation_series/);
  assert.match(adminPage, /activation_by_zone/);
  assert.match(adminPage, /activation_alerts/);
  assert.match(adminPage, /Indicateurs d activation indisponibles/);
});
