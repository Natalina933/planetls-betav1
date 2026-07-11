import test from "node:test";
import assert from "node:assert/strict";

import {
  assignReservationStep,
  buildReservationWorkflow,
  moveReservationWorkflow,
  replanReservationStep,
  updateReservationStepStatus,
} from "../app/lib/reservationPlanningEngine.ts";

const baseReservation = {
  reservationId: "airbnb-42",
  propertyId: "property-1",
  propertyLabel: "Villa des Pins",
  ownerProfileId: "owner-1",
  conciergeProfileId: "concierge-1",
  guestName: "Alice Martin",
  checkIn: "2026-08-10T16:00:00.000Z",
  checkOut: "2026-08-14T10:00:00.000Z",
  accommodationAmount: 1200,
  cleaningAmount: 95,
  currency: "EUR",
};

test("buildReservationWorkflow generates the full reservation mission chain", () => {
  const workflow = buildReservationWorkflow({ ...baseReservation, maintenanceRequested: true });

  assert.equal(workflow.id, "airbnb-42");
  assert.deepEqual(
    workflow.missionPlans.map((plan) => plan.stepId),
    ["cleaning", "control", "welcome", "checkin", "checkout", "maintenance", "billing"],
  );
  assert.equal(workflow.missionPlans[0].title, "Menage avant arrivee - Villa des Pins");
  assert.equal(workflow.missionPlans[0].scheduledStart, "2026-08-10T11:00:00.000Z");
  assert.equal(workflow.missionPlans[3].scheduledStart, baseReservation.checkIn);
  assert.equal(workflow.missionPlans[4].scheduledStart, baseReservation.checkOut);
  assert.equal(workflow.invoicePlan.totalAmount, 1295);
  assert.equal(workflow.invoicePlan.metadata.reservation_workflow_id, "airbnb-42");
});

test("buildReservationWorkflow skips optional maintenance when not requested", () => {
  const workflow = buildReservationWorkflow(baseReservation);

  assert.deepEqual(
    workflow.missionPlans.map((plan) => plan.stepId),
    ["cleaning", "control", "welcome", "checkin", "checkout", "billing"],
  );
});

test("moveReservationWorkflow shifts reservation and every planned mission", () => {
  const workflow = buildReservationWorkflow(baseReservation);
  const moved = moveReservationWorkflow(workflow, 60);

  assert.equal(moved.reservation.checkIn, "2026-08-10T17:00:00.000Z");
  assert.equal(moved.reservation.checkOut, "2026-08-14T11:00:00.000Z");
  assert.equal(moved.missionPlans[0].scheduledStart, "2026-08-10T12:00:00.000Z");
  assert.equal(moved.missionPlans[0].metadata.moved_by_minutes, 60);
});

test("replanReservationStep changes only the targeted step", () => {
  const workflow = buildReservationWorkflow(baseReservation);
  const replanned = replanReservationStep(
    workflow,
    "checkin",
    "2026-08-10T18:00:00.000Z",
    "2026-08-10T18:45:00.000Z",
  );

  const checkin = replanned.missionPlans.find((plan) => plan.stepId === "checkin");
  const checkout = replanned.missionPlans.find((plan) => plan.stepId === "checkout");
  assert.equal(checkin?.scheduledStart, "2026-08-10T18:00:00.000Z");
  assert.equal(checkin?.scheduledEnd, "2026-08-10T18:45:00.000Z");
  assert.equal(checkout?.scheduledStart, baseReservation.checkOut);
});

test("assign and follow update one operational step", () => {
  const workflow = buildReservationWorkflow(baseReservation);
  const assigned = assignReservationStep(workflow, "cleaning", "team-7");
  const followed = updateReservationStepStatus(assigned, "cleaning", "completed");
  const cleaning = followed.missionPlans.find((plan) => plan.stepId === "cleaning");
  const control = followed.missionPlans.find((plan) => plan.stepId === "control");

  assert.equal(cleaning?.assignedProfileId, "team-7");
  assert.equal(cleaning?.status, "completed");
  assert.equal(cleaning?.metadata.assigned_profile_id, "team-7");
  assert.equal(control?.status, "planned");
});

test("buildReservationWorkflow rejects impossible dates", () => {
  assert.throws(
    () =>
      buildReservationWorkflow({
        ...baseReservation,
        checkIn: "2026-08-14T10:00:00.000Z",
        checkOut: "2026-08-10T16:00:00.000Z",
      }),
    /check-out doit etre apres le check-in/,
  );
});