import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMissionHealth } from "../app/api/admin/control-tower/missionHealth.ts";

test("completed mission needs coherent operations, payment and resolved maintenance", () => {
  const result = evaluateMissionHealth({ status: "completed", scheduled_start: "2026-07-19T08:00:00Z", scheduled_end: "2026-07-19T10:00:00Z", completed_at: "2026-07-19T10:00:00Z", hasRequest: true, quoteCount: 1, assignmentCount: 1, openMaintenanceCount: 0, invoices: [{ status: "paid", total_amount: 120, paid_amount: 120, balance_amount: 0, paid_at: "2026-07-19T11:00:00Z" }] });
  assert.equal(result.tone, "positive");
  assert.equal(result.issueCount, 0);
});

test("operational contradictions are critical", () => {
  const result = evaluateMissionHealth({ status: "completed", scheduled_start: "2026-07-19T10:00:00Z", scheduled_end: "2026-07-19T09:00:00Z", completed_at: "2026-07-19T10:00:00Z", hasRequest: true, quoteCount: 1, assignmentCount: 0, openMaintenanceCount: 1, invoices: [{ status: "paid", total_amount: 120, paid_amount: 0, balance_amount: 120, paid_at: null }] });
  assert.equal(result.tone, "danger");
  assert.deepEqual(result.steps.filter((step) => !step.ok).map((step) => step.id), ["assignment", "planning", "invoice", "payment", "maintenance"]);
});

test("overdue invoice makes an active mission critical", () => {
  const result = evaluateMissionHealth({ status: "in_progress", scheduled_start: "2026-07-18T10:00:00Z", scheduled_end: "2026-07-18T11:00:00Z", hasRequest: true, quoteCount: 1, assignmentCount: 1, openMaintenanceCount: 0, now: "2026-07-19T12:00:00Z", invoices: [{ status: "issued", total_amount: 120, paid_amount: 0, balance_amount: 120, due_date: "2026-07-18" }] });
  assert.equal(result.tone, "danger");
  assert.equal(result.hasOverdueInvoice, true);
});
