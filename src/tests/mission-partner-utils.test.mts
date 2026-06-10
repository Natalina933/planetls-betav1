import assert from "node:assert/strict";
import test from "node:test";
import {
  isAcceptedMissionPartner,
  isUuidLike,
  normalizeMissionPartnerStatus,
} from "../app/dashboard/owner/missions/missionPartnerUtils.ts";

const conciergeId = "123e4567-e89b-42d3-a456-426614174000";

test("mission partner statuses are normalized across legacy and API values", () => {
  assert.equal(normalizeMissionPartnerStatus("ACCEPTED"), "accepted");
  assert.equal(normalizeMissionPartnerStatus(" mission_created "), "mission_created");
  assert.equal(normalizeMissionPartnerStatus(null), "");
});

test("accepted mission partners include lower-case accepted service requests", () => {
  assert.equal(
    isAcceptedMissionPartner({
      selected_concierge_profile_id: conciergeId,
      status: "accepted",
    }),
    true,
  );
});

test("accepted mission partners include existing mission links and selected recipients", () => {
  assert.equal(
    isAcceptedMissionPartner({
      selected_concierge_profile_id: conciergeId,
      status: "sent",
      mission_id: "987e6543-e21b-42d3-a456-426614174000",
    }),
    true,
  );
  assert.equal(
    isAcceptedMissionPartner({
      selected_concierge_profile_id: conciergeId,
      status: "sent",
      recipients: [{ status: "selected" }],
    }),
    true,
  );
});

test("mission partner requires a valid concierge UUID", () => {
  assert.equal(isUuidLike(conciergeId), true);
  assert.equal(
    isAcceptedMissionPartner({
      selected_concierge_profile_id: "not-a-uuid",
      status: "accepted",
    }),
    false,
  );
});
