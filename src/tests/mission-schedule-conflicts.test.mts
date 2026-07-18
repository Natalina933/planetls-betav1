import test from "node:test";
import assert from "node:assert/strict";

import {
  findMissionScheduleConflicts,
  validateMissionScheduleRange,
} from "../app/lib/missionScheduleConflicts.ts";

test("validateMissionScheduleRange rejects invalid or reversed ranges", () => {
  assert.equal(validateMissionScheduleRange("bad", "2026-07-20T10:00:00Z").valid, false);
  assert.equal(validateMissionScheduleRange("2026-07-20T11:00:00Z", "2026-07-20T10:00:00Z").valid, false);
  assert.equal(validateMissionScheduleRange("2026-07-20T09:00:00Z", "2026-07-20T10:00:00Z").valid, true);
});

test("findMissionScheduleConflicts detects same property or team member overlaps only", () => {
  const conflicts = findMissionScheduleConflicts(
    {
      id: "mission-current",
      propertyId: "housing-1",
      assignedTeamMemberId: "member-1",
      scheduledStart: "2026-07-20T09:00:00Z",
      scheduledEnd: "2026-07-20T11:00:00Z",
    },
    [
      { id: "same-property", property_id: "housing-1", scheduled_start: "2026-07-20T10:00:00Z", scheduled_end: "2026-07-20T12:00:00Z" },
      { id: "same-member", property_id: "housing-2", scheduled_start: "2026-07-20T08:30:00Z", scheduled_end: "2026-07-20T09:30:00Z", metadata: { assigned_team_member_id: "member-1" } },
      { id: "different-resource", property_id: "housing-2", scheduled_start: "2026-07-20T09:30:00Z", scheduled_end: "2026-07-20T10:30:00Z", metadata: { assigned_team_member_id: "member-2" } },
      { id: "touching-boundary", property_id: "housing-1", scheduled_start: "2026-07-20T11:00:00Z", scheduled_end: "2026-07-20T12:00:00Z" },
    ],
  );
  assert.deepEqual(conflicts.map((row) => row.id), ["same-property", "same-member"]);
});