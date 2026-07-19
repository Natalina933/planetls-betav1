import assert from "node:assert/strict";
import test from "node:test";
import { computeActivationByZone, computeActivationCohort, computeWeeklyActivationSeries } from "../app/lib/activationKpis.ts";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-07-19T12:00:00Z");
const windowStart = new Date(now.getTime() - 30 * day);

function activity(profileId: string, marker: string, occurredAt: string) {
  return new Map([[profileId, new Map([[marker, new Date(occurredAt)]])]]);
}

test("activation J7 excludes profiles that have not completed seven days", () => {
  const result = computeActivationCohort({
    role: "owner",
    profiles: [{ id: "recent", role: "owner", createdAt: new Date(now.getTime() - 2 * day) }],
    roleAliases: ["owner", "owner_pro"],
    activityByProfile: activity("recent", "request", "2026-07-18T12:00:00Z"),
    windowStart,
    now,
  });
  assert.equal(result.activation_j7, null);
  assert.equal(result.activation_j7_eligible, 0);
});

test("activation J7 counts only the role event occurring before the deadline", () => {
  const createdAt = new Date("2026-07-01T12:00:00Z");
  const activities = new Map([
    ["on-time", new Map([["request", new Date("2026-07-05T12:00:00Z")]])],
    ["late", new Map([["request", new Date("2026-07-10T12:00:00Z")]])],
    ["wrong-event", new Map([["quote", new Date("2026-07-03T12:00:00Z")]])],
  ]);
  const result = computeActivationCohort({
    role: "owner",
    profiles: ["on-time", "late", "wrong-event"].map((id) => ({ id, role: "owner", createdAt })),
    roleAliases: ["owner", "owner_pro"],
    activityByProfile: activities,
    windowStart,
    now,
  });
  assert.equal(result.activation_j7_eligible, 3);
  assert.equal(result.activation_j7_activated, 1);
  assert.equal(result.activation_j7, 33.33);
  assert.equal(result.activation_definition, "request");
});
test("weekly activation series keeps mature signup cohorts separate", () => {
  const profiles = [
    { id: "week-one", role: "owner", createdAt: new Date("2026-06-22T12:00:00Z") },
    { id: "week-two", role: "owner", createdAt: new Date("2026-07-02T12:00:00Z") },
  ];
  const activities = new Map([
    ["week-one", new Map([["request", new Date("2026-06-25T12:00:00Z")]])],
    ["week-two", new Map([["request", new Date("2026-07-11T12:00:00Z")]])],
  ]);
  const series = computeWeeklyActivationSeries({
    role: "owner",
    profiles,
    roleAliases: ["owner"],
    activityByProfile: activities,
    windowStart,
    now,
  });
  assert.equal(series.reduce((sum, point) => sum + point.eligible, 0), 2);
  assert.equal(series.reduce((sum, point) => sum + point.activated, 0), 1);
  assert.ok(series.every((point) => point.period_start < point.period_end));
});
test("activation by zone exposes denominators and excludes immature cohorts", () => {
  const profiles = [
    { id: "lyon-active", role: "concierge", zone: "Lyon", createdAt: new Date("2026-07-01T12:00:00Z") },
    { id: "lyon-inactive", role: "concierge", zone: "Lyon", createdAt: new Date("2026-07-01T12:00:00Z") },
    { id: "paris-recent", role: "concierge", zone: "Paris", createdAt: new Date("2026-07-18T12:00:00Z") },
  ];
  const zones = computeActivationByZone({
    role: "concierge",
    profiles,
    roleAliases: ["concierge"],
    activityByProfile: new Map([["lyon-active", new Map([["quote", new Date("2026-07-04T12:00:00Z")]])]]),
    windowStart,
    now,
  });
  assert.deepEqual(zones, [{ zone: "Lyon", eligible: 2, activated: 1, rate: 50 }]);
});