import assert from "node:assert/strict";
import test from "node:test";
import { getUpcomingInterventions } from "../app/dashboard/provider/planning/upcoming.ts";

test("le planning écarte les départs passés, absents ou invalides et inclut la borne", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const items = [
    { id: "later", scheduled_start: "2026-11-20T14:00:00+01:00" },
    { id: "past", scheduled_start: "2026-11-20T11:59:59Z" },
    { id: "missing", scheduled_start: null },
    { id: "invalid", scheduled_start: "invalid" },
    { id: "now", scheduled_start: "2026-11-20T13:00:00+01:00" },
  ];

  assert.deepEqual(getUpcomingInterventions(items, now).map(({ id }) => id), ["now", "later"]);
  assert.deepEqual(getUpcomingInterventions(items, new Date("2026-11-21T00:00:00Z")), []);
});

test("le planning limite la liste aux dix échéances les plus proches sans modifier la source", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const items = Array.from({ length: 12 }, (_, index) => ({
    scheduled_start: new Date(now.getTime() + (12 - index) * 60_000).toISOString(),
  }));
  const original = items.slice();

  assert.deepEqual(getUpcomingInterventions(items, now), original.slice(2).reverse());
  assert.deepEqual(items, original);
});
