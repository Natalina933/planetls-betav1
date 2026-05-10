import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessMissionForRole,
  canMutateMissionStatus,
  canUpdateMissionFields,
  getMissionPermissions,
} from "../app/lib/missionPermissions.ts";

test("canAccessMissionForRole scopes owner and concierge to their own missions", () => {
  assert.equal(
    canAccessMissionForRole({
      role: "owner",
      userId: "owner-1",
      ownerProfileId: "owner-1",
      conciergeProfileId: "concierge-1",
    }),
    true,
  );
  assert.equal(
    canAccessMissionForRole({
      role: "owner",
      userId: "owner-2",
      ownerProfileId: "owner-1",
      conciergeProfileId: "concierge-1",
    }),
    false,
  );
  assert.equal(
    canAccessMissionForRole({
      role: "concierge",
      userId: "concierge-1",
      ownerProfileId: "owner-1",
      conciergeProfileId: "concierge-1",
    }),
    true,
  );
});

test("canUpdateMissionFields separates owner and concierge responsibilities", () => {
  assert.equal(canUpdateMissionFields("owner", ["title", "description", "scheduled_start"]), true);
  assert.equal(canUpdateMissionFields("owner", ["amount"]), false);
  assert.equal(canUpdateMissionFields("concierge", ["amount", "scheduled_end"]), true);
  assert.equal(canUpdateMissionFields("concierge", ["concierge_profile_id"]), false);
});

test("canMutateMissionStatus allows concierge execution and owner cancellation", () => {
  assert.equal(canMutateMissionStatus("concierge", "assigned", "accepted"), true);
  assert.equal(canMutateMissionStatus("concierge", "accepted", "in_progress"), true);
  assert.equal(canMutateMissionStatus("owner", "accepted", "in_progress"), false);
  assert.equal(canMutateMissionStatus("owner", "accepted", "canceled"), true);
  assert.equal(canMutateMissionStatus("concierge", "completed", "canceled"), false);
});

test("getMissionPermissions exposes UI-level capabilities by role", () => {
  const ownerPermissions = getMissionPermissions("owner", "accepted");
  assert.equal(ownerPermissions.canUploadEvidence, false);
  assert.equal(ownerPermissions.canCancel, true);
  assert.equal(ownerPermissions.canStart, false);

  const conciergePermissions = getMissionPermissions("concierge", "accepted");
  assert.equal(conciergePermissions.canUploadEvidence, true);
  assert.equal(conciergePermissions.canCreateProviderIntervention, true);
  assert.equal(conciergePermissions.canStart, true);
});

