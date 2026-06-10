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
  assert.equal(normalizeMissionStatus("planned"), "scheduled");
  assert.equal(normalizeMissionStatus("validated"), "validated");
  assert.equal(normalizeMissionStatus("provider_intervention"), "in_progress");
  assert.equal(normalizeMissionStatus("quote_accepted"), "to_schedule");
  assert.equal(normalizeMissionStatus("accepted"), "accepted");
});

test("getMissionStatusLabel returns readable French labels", () => {
  assert.equal(getMissionStatusLabel("assigned"), "À planifier");
  assert.equal(getMissionStatusLabel("date_requested"), "Date demandée");
  assert.equal(getMissionStatusLabel("date_confirmed"), "Date confirmée");
  assert.equal(getMissionStatusLabel("scheduled"), "Planifiée");
  assert.equal(getMissionStatusLabel("awaiting_owner_validation"), "Validation propriétaire");
  assert.equal(getMissionStatusLabel("validated"), "Validée");
  assert.equal(getMissionStatusLabel("closed"), "Clôturée");
  assert.equal(getMissionStatusLabel("completed"), "Terminée");
  assert.equal(getMissionStatusLabel("canceled"), "Annulée");
});

test("canTransitionMissionStatus blocks terminal states and allows operational steps", () => {
  assert.equal(canTransitionMissionStatus("assigned", "date_requested"), true);
  assert.equal(canTransitionMissionStatus("date_requested", "date_confirmed"), true);
  assert.equal(canTransitionMissionStatus("date_confirmed", "scheduled"), true);
  assert.equal(canTransitionMissionStatus("scheduled", "accepted"), true);
  assert.equal(canTransitionMissionStatus("accepted", "in_progress"), true);
  assert.equal(canTransitionMissionStatus("in_progress", "awaiting_owner_validation"), true);
  assert.equal(canTransitionMissionStatus("awaiting_owner_validation", "validated"), true);
  assert.equal(canTransitionMissionStatus("validated", "closed"), true);
  assert.equal(canTransitionMissionStatus("completed", "in_progress"), false);
  assert.equal(canTransitionMissionStatus("closed", "validated"), false);
  assert.equal(canTransitionMissionStatus("canceled", "accepted"), false);
});

test("getMissionActionTarget maps detail-page actions", () => {
  assert.equal(getMissionActionTarget("accept"), "accepted");
  assert.equal(getMissionActionTarget("request_date"), "date_requested");
  assert.equal(getMissionActionTarget("propose_date"), "date_proposed");
  assert.equal(getMissionActionTarget("confirm_date"), "date_confirmed");
  assert.equal(getMissionActionTarget("schedule"), "scheduled");
  assert.equal(getMissionActionTarget("start"), "in_progress");
  assert.equal(getMissionActionTarget("complete"), "awaiting_owner_validation");
  assert.equal(getMissionActionTarget("validate_completion"), "validated");
  assert.equal(getMissionActionTarget("close"), "closed");
  assert.equal(getMissionActionTarget("unknown"), null);
});
