import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeDuplicateTravelerStays,
  missionLooksLikeTravelerStay,
  missionToTravelerStay,
  workflowToTravelerStay,
  workflowsAndMissionsToTravelerStays,
} from "../app/lib/travelerStaySupabase.ts";

test("maps reservation workflow metadata to traveler stay input", () => {
  const stay = workflowToTravelerStay({
    id: "reservation-1",
    reservation: {
      property_label: "Appartement Plage",
      guest_name: "Nora V.",
      check_in: "2026-07-12T15:00:00.000Z",
      check_out: "2026-07-15T10:00:00.000Z",
    },
    missions: [
      {
        id: "mission-cleaning",
        title: "Ménage avant arrivée",
        status: "completed",
        scheduled_start: "2026-07-12T10:00:00.000Z",
        metadata: {
          reservation_step: "cleaning",
          guest_count: 3,
          booking_source: "Direct",
          linen_ready: true,
          consumables_ready: true,
        },
      },
    ],
  });

  assert.equal(stay.id, "reservation-1");
  assert.equal(stay.propertyLabel, "Appartement Plage");
  assert.equal(stay.primaryTraveler?.displayName, "Nora V.");
  assert.equal(stay.guestCount, 3);
  assert.equal(stay.cleaningDone, true);
  assert.equal(stay.channel, "Direct");
});

test("detects standalone traveler missions and keeps operational fields", () => {
  const mission = {
    id: "mission-stay",
    title: "Accueil voyageur",
    status: "scheduled",
    scheduled_start: "2026-07-12T15:00:00.000Z",
    scheduled_end: "2026-07-12T16:00:00.000Z",
    metadata: {
      mission_kind: "traveler_stay",
      traveler_name: "Sam K.",
      guest_phone: "+33600000000",
      check_in: "2026-07-12T15:00:00.000Z",
      check_out: "2026-07-18T10:00:00.000Z",
    },
  };

  assert.equal(missionLooksLikeTravelerStay(mission), true);
  const stay = missionToTravelerStay(mission);
  assert.equal(stay.primaryTraveler?.displayName, "Sam K.");
  assert.equal(stay.primaryTraveler?.phone, "+33600000000");
  assert.equal(stay.missions?.length, 1);
});

test("prefers canonical reservation_id over legacy workflow metadata when grouping stays", () => {
  const stays = workflowsAndMissionsToTravelerStays({
    workflows: [
      {
        id: "legacy-workflow-7",
        reservation: { id: "reservation-7", guest_name: "Lina", property_label: "Maison Océan" },
        missions: [
          {
            id: "m1",
            reservation_id: "reservation-7",
            title: "Check-in",
            metadata: { reservation_workflow_id: "legacy-workflow-7" },
          },
        ],
      },
    ],
    missions: [
      {
        id: "m2",
        reservation_id: "reservation-7",
        title: "Contrôle qualité",
        metadata: { reservation_workflow_id: "legacy-workflow-7", guest_name: "Lina" },
      },
    ],
  });

  assert.equal(stays.length, 1);
  assert.equal(stays[0]?.id, "reservation-7");
  assert.equal(stays[0]?.reservationId, "reservation-7");
});

test("deduplicates workflow and standalone mission stays", () => {
  const stays = workflowsAndMissionsToTravelerStays({
    workflows: [
      {
        id: "reservation-2",
        reservation: { guest_name: "Ines", property_label: "Loft Centre" },
        missions: [{ id: "m1", title: "Check-in", metadata: { reservation_workflow_id: "reservation-2" } }],
      },
    ],
    missions: [
      {
        id: "m2",
        title: "Contrôle qualité",
        metadata: { reservation_workflow_id: "reservation-2", guest_name: "Ines" },
      },
    ],
  });

  assert.equal(stays.length, 1);
  assert.equal(stays[0]?.missions?.length, 2);
});

test("merge keeps known traveler identity when duplicates are combined", () => {
  const merged = mergeDuplicateTravelerStays([
    { id: "stay", primaryTraveler: { displayName: "Voyageur à renseigner" }, missions: [] },
    { id: "stay", primaryTraveler: { displayName: "Claire" }, missions: [{ id: "m", title: "Check-in" }] },
  ]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.primaryTraveler?.displayName, "Claire");
  assert.equal(merged[0]?.missions?.length, 1);
});


