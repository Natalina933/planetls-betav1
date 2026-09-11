import { test } from "node:test";
import assert from "node:assert/strict";
import { performancePeriod, summarizeReservations, propertyStatus } from "../app/dashboard/owner/finances/overview/performanceData.ts";

test("performance nights clip stays, exclude checkout, canceled/draft and invalid dates, and deduplicate overlap", () => {
  const common = { property_id: "1", check_in_at: "2026-09-10T16:00:00+02:00", check_out_at: "2026-09-14T10:00:00+02:00", status: "shared" };
  const rows = [
    { ...common, id: "a" }, { ...common, id: "a" },
    { ...common, id: "b", check_in_at: "2026-09-13", check_out_at: "2026-09-16" },
    { ...common, id: "c", status: "canceled" }, { ...common, id: "d", status: "draft" },
    { ...common, id: "e", check_in_at: "invalid" }, { ...common, id: "f", check_out_at: "2026-09-01" },
  ];
  const result = summarizeReservations(rows, { start: Date.UTC(2026,8,11), end: Date.UTC(2026,8,15) });
  assert.equal(result.count, 2);
  assert.equal(result.nightsByProperty.get("1")?.size, 4);
});

test("performance uses canonical housing reference, distinguishes unknown property, and counts calendar nights across DST", () => {
  const rows = [
    { id: "a", property_id: "uuid", metadata: { housing_id: 42 }, check_in_at: "2026-10-24T16:00:00+02:00", check_out_at: "2026-10-26T10:00:00+01:00", status: "scheduled" },
    { id: "b", check_in_at: "2026-10-24", check_out_at: "2026-10-26", status: "shared" },
  ];
  const result = summarizeReservations(rows, performancePeriod(new Date(2026,8,11)));
  assert.equal(result.count, 2);
  assert.equal(result.nightsByProperty.get("42")?.size, 2);
  assert.equal(result.unmatchedReservations, 1);
});

test("six month window clamps month end and yearly window includes leap day", () => {
  assert.equal(performancePeriod(new Date(2026,7,31)).end, Date.UTC(2027,1,28));
  assert.deepEqual(performancePeriod(new Date(), 2024), { start: Date.UTC(2024,0,1), end: Date.UTC(2025,0,1) });
  assert.equal(propertyStatus("maintenance"), "Maintenance");
  assert.equal(propertyStatus("unknown"), "À préciser");
});
