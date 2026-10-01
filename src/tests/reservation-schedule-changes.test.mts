import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildReservationScheduleChangeSet,
  identifyImpactedStayMissions,
} from "../app/api/_shared/reservationScheduleChanges.ts";
import type { ReservationRow } from "../app/api/_shared/reservations.ts";

const route = readFileSync(new URL("../app/api/reservations/[id]/route.ts", import.meta.url), "utf8");
const ownerPage = readFileSync(new URL("../app/dashboard/owner/missions/voyageurs/page.tsx", import.meta.url), "utf8");

const reservation: ReservationRow = {
  id: "reservation-1",
  owner_profile_id: "owner",
  concierge_profile_id: "concierge",
  property_id: "property",
  check_in_at: "2026-10-07T15:00:00.000Z",
  check_out_at: "2026-10-10T10:00:00.000Z",
  arrival_time_window: "15:00",
  departure_time_window: "10:00",
  metadata: {},
};

const linkedMissions = [
  { id: "checkin", title: "Check-in", status: "scheduled", scheduled_start: "2026-10-07T15:00:00.000Z", scheduled_end: "2026-10-07T15:45:00.000Z", metadata: { reservation_step: "checkin" } },
  { id: "checkout", title: "Check-out", status: "accepted", scheduled_start: "2026-10-10T10:00:00.000Z", scheduled_end: "2026-10-10T10:45:00.000Z", metadata: { reservation_step: "checkout" } },
  { id: "cleaning", title: "Menage", status: "in_progress", scheduled_start: "2026-10-10T11:00:00.000Z", scheduled_end: "2026-10-10T13:00:00.000Z", metadata: { reservation_step: "cleaning" } },
  { id: "linen", title: "Linge", status: "completed", scheduled_start: "2026-10-10T11:30:00.000Z", scheduled_end: "2026-10-10T12:30:00.000Z", metadata: { reservation_step: "linen" } },
];

test("arrival time change updates reservation fields and only flags checkin without moving missions", () => {
  const result = buildReservationScheduleChangeSet(reservation, { check_in_at: "2026-10-07T19:00:00.000Z" });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.changedFields, ["check_in_at"]);
  assert.deepEqual(result.impactedSteps, ["checkin"]);
  assert.equal(result.updatePayload.check_in_at, "2026-10-07T19:00:00.000Z");

  const impacted = identifyImpactedStayMissions(linkedMissions, result.impactedSteps);
  assert.deepEqual(impacted.map((mission) => mission.id), ["checkin"]);
  assert.equal(linkedMissions[0].scheduled_start, "2026-10-07T15:00:00.000Z");
});

test("departure time change flags checkout cleaning and linen without checkin", () => {
  const result = buildReservationScheduleChangeSet(reservation, { check_out_at: "2026-10-10T12:00:00.000Z" });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.impactedSteps, ["checkout", "cleaning", "linen"]);
  const impacted = identifyImpactedStayMissions(linkedMissions, result.impactedSteps);
  assert.deepEqual(impacted.map((mission) => mission.id), ["checkout", "cleaning", "linen"]);
  assert.equal(impacted.some((mission) => mission.id === "checkin"), false);
});

test("arrival date and departure date changes use the same impact rules", () => {
  const arrival = buildReservationScheduleChangeSet(reservation, { check_in_at: "2026-10-08T15:00:00.000Z" });
  const departure = buildReservationScheduleChangeSet(reservation, { check_out_at: "2026-10-11T10:00:00.000Z" });
  assert.equal(arrival.ok, true);
  assert.equal(departure.ok, true);
  if (!arrival.ok || !departure.ok) return;

  assert.deepEqual(arrival.impactedSteps, ["checkin"]);
  assert.deepEqual(departure.impactedSteps, ["checkout", "cleaning", "linen"]);
});

test("accepted in progress and completed missions are identified but never moved automatically", () => {
  const result = buildReservationScheduleChangeSet(reservation, { departure_time_window: "12:00" });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const impacted = identifyImpactedStayMissions(linkedMissions, result.impactedSteps);
  assert.deepEqual(impacted.map((mission) => [mission.id, mission.status, mission.scheduled_start]), [
    ["checkout", "accepted", "2026-10-10T10:00:00.000Z"],
    ["cleaning", "in_progress", "2026-10-10T11:00:00.000Z"],
    ["linen", "completed", "2026-10-10T11:30:00.000Z"],
  ]);
});

test("replaying the same modification produces no business change", () => {
  const result = buildReservationScheduleChangeSet(reservation, {
    check_in_at: reservation.check_in_at,
    check_out_at: reservation.check_out_at,
    arrival_time_window: reservation.arrival_time_window,
    departure_time_window: reservation.departure_time_window,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.changedFields, []);
  assert.deepEqual(result.impactedSteps, []);
  assert.deepEqual(result.changes, []);
});

test("invalid chronology is rejected", () => {
  const result = buildReservationScheduleChangeSet(reservation, { check_in_at: "2026-10-10T10:00:00.000Z" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /postérieure/);
});

test("required canonical stay dates cannot be cleared", () => {
  const missingArrival = buildReservationScheduleChangeSet(reservation, { check_in_at: "" });
  const missingDeparture = buildReservationScheduleChangeSet(reservation, { check_out_at: null });

  assert.equal(missingArrival.ok, false);
  assert.equal(missingDeparture.ok, false);
  if (!missingArrival.ok) assert.match(missingArrival.error, /arrivée requise/);
  if (!missingDeparture.ok) assert.match(missingDeparture.error, /départ requise/);
});

test("reservation patch keeps participant guard and traces old new schedule values", () => {
  assert.match(route, /reservation\.owner_profile_id !== userId/);
  assert.match(route, /reservation\.concierge_profile_id !== userId/);
  assert.match(route, /schedule_changes: scheduleChanges/);
  assert.match(route, /impacted_missions/);
  assert.match(route, /recordWorkflowEvent/);
  assert.match(route, /changed_fields: changedFields/);
});

test("owner UI sends stay schedule fields through the existing reservation patch", () => {
  assert.match(ownerPage, /check_in_at: checkInAt/);
  assert.match(ownerPage, /check_out_at: checkOutAt/);
  assert.match(ownerPage, /arrival_time_window: focusedReservationDraft\.arrivalWindow/);
  assert.match(ownerPage, /departure_time_window: focusedReservationDraft\.departureWindow/);
  assert.match(ownerPage, /mission\(s\) peuvent necessiter une verification/);
});
