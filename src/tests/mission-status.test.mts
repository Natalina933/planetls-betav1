import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionMissionStatus,
  getMissionActionTarget,
  getMissionStatusLabel,
  normalizeMissionStatus,
} from "../app/lib/missionStatus.ts";

test("normalizeMissionStatus maps legacy UI statuses to canonical mission statuses", () => {
  assert.equal(normalizeMissionStatus("pending"), "draft");
  assert.equal(normalizeMissionStatus("planned"), "assigned");
  assert.equal(normalizeMissionStatus("validated"), "completed");
  assert.equal(normalizeMissionStatus("provider_intervention"), "in_progress");
  assert.equal(normalizeMissionStatus("accepted"), "accepted");
});

test("getMissionStatusLabel returns readable French labels", () => {
  assert.equal(getMissionStatusLabel("assigned"), "Assignée");
  assert.equal(getMissionStatusLabel("completed"), "Terminée");
  assert.equal(getMissionStatusLabel("canceled"), "Annulée");
});

test("canTransitionMissionStatus blocks terminal states and allows operational steps", () => {
  assert.equal(canTransitionMissionStatus("assigned", "accepted"), true);
  assert.equal(canTransitionMissionStatus("accepted", "in_progress"), true);
  assert.equal(canTransitionMissionStatus("in_progress", "completed"), true);
  assert.equal(canTransitionMissionStatus("completed", "in_progress"), false);
  assert.equal(canTransitionMissionStatus("canceled", "accepted"), false);
});

test("getMissionActionTarget maps detail-page actions", () => {
  assert.equal(getMissionActionTarget("accept"), "accepted");
  assert.equal(getMissionActionTarget("start"), "in_progress");
  assert.equal(getMissionActionTarget("complete"), "completed");
  assert.equal(getMissionActionTarget("cancel"), "canceled");
  assert.equal(getMissionActionTarget("unknown"), null);
});

