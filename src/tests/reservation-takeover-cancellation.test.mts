import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("stay takeover creates or reuses missions inside the reservation patch route", () => {
  const route = read("../app/api/reservations/[id]/route.ts");
  const page = read("../app/dashboard/concierge/sejours/page.tsx");

  assert.match(route, /action === "take_over"/);
  assert.match(route, /createOrReuseStayMissions\(\{ db: dbAny, reservation, body \}\)/);
  assert.match(route, /take_over_status: "missions_failed"/);
  assert.match(route, /updatePayload\.status = "acknowledged"/);
  assert.match(route, /take_over_mission_count/);
  assert.doesNotMatch(page, /\/api\/owner\/reservations\/\$\{encodeURIComponent\(selectedStay\.id\)\}\/missions/);
});

test("takeover status is surfaced by the concierge UI", () => {
  const page = read("../app/dashboard/concierge/sejours/page.tsx");

  assert.match(page, /type TakeOverStatus = "missions_failed" \| "reservation_update_failed_after_missions"/);
  assert.match(page, /takeoverErrorMessage/);
  assert.match(page, /data\.take_over_status === "missions_failed"/);
  assert.match(page, /data\.take_over_status === "reservation_update_failed_after_missions"/);
  assert.match(page, /Vous pouvez réessayer/);
});

test("retrying takeover on an acknowledged stay preserves acknowledgement state and avoids duplicate takeover events", () => {
  const route = read("../app/api/reservations/[id]/route.ts");

  assert.match(route, /alreadyAcknowledged = action === "take_over" && cleanString\(reservation\.status\) === "acknowledged"/);
  assert.match(route, /if \(!alreadyAcknowledged\) \{[\s\S]*updatePayload\.status = "acknowledged";[\s\S]*updatePayload\.acknowledged_at = new Date\(\)\.toISOString\(\);/);
  assert.match(route, /if \(changedFields\.length > 0 \|\| action === "acknowledge" \|\| action === "cancel"\)/);
  assert.doesNotMatch(route, /action === "take_over"\s*\|\| action === "acknowledge"/);
});

test("reservation patch route keeps participant and concierge role checks before takeover mutation", () => {
  const route = read("../app/api/reservations/[id]/route.ts");

  assert.match(route, /requireApiRole\(req, RESERVATION_PARTICIPANT_ROLES\)/);
  assert.match(route, /reservation\.owner_profile_id !== userId/);
  assert.match(route, /reservation\.concierge_profile_id !== userId/);
  assert.match(route, /if \(!canManageAsConcierge\(role\)\)/);
});

test("stay mission helper validates collaboration and keeps mission creation idempotent", () => {
  const helper = read("../app/api/_shared/stayMissionAssignments.ts");
  const route = read("../app/api/owner/reservations/[id]/missions/route.ts");

  assert.match(route, /createOrReuseStayMissions/);
  assert.match(helper, /collaboration\.status !== "active"/);
  assert.match(helper, /collaboration\.owner_profile_id !== input\.reservation\.owner_profile_id/);
  assert.match(helper, /collaboration\.concierge_profile_id !== input\.reservation\.concierge_profile_id/);
  assert.match(helper, /String\(collaboration\.housing_id\) !== housingId/);
  assert.match(helper, /stay_assignment_key/);
  assert.match(helper, /\.contains\("metadata", \{ stay_assignment_key: idempotencyKey \}\)/);
  assert.match(helper, /if \(existing\)/);
});

test("foreign users cannot trigger mission creation for another reservation", () => {
  const route = read("../app/api/owner/reservations/[id]/missions/route.ts");

  assert.match(route, /reservation\.owner_profile_id !== userId/);
  assert.match(route, /reservation\.concierge_profile_id !== userId/);
  assert.match(route, /return NextResponse\.json\(\{ error: "Accès refusé\." \}, \{ status: 403 \}\)/);
});

test("reservation cancellation propagates only to cancelable linked missions", () => {
  const route = read("../app/api/reservations/[id]/route.ts");

  assert.match(route, /CANCELABLE_MISSION_STATUSES/);
  assert.match(route, /"scheduled"/);
  assert.match(route, /"accepted"/);
  assert.match(route, /"in_progress"/);
  assert.match(route, /cancelLinkedReservationMissions/);
  assert.match(route, /status: "canceled"/);
  assert.match(route, /canceled_from_reservation: true/);
  assert.match(route, /preserved_missions/);
});

test("reservation cancellation treats mission event failure as partial and retries missing events idempotently", () => {
  const route = read("../app/api/reservations/[id]/route.ts");

  assert.match(route, /existingEventMissionIds/);
  assert.match(route, /\.contains\("payload", \{ reservation_id: input\.reservationId, source: "reservation_cancel" \}\)/);
  assert.match(route, /ensureCancellationEvent/);
  assert.match(route, /missionWasCanceledFromReservation/);
  assert.match(route, /return \{ ok: false as const, error \}/);
  assert.match(route, /status: "partial"/);
  assert.match(route, /reconciled_event_mission_ids/);
});

test("reservation cancellation preserves terminal mission history", () => {
  const route = read("../app/api/reservations/[id]/route.ts");
  const cancelableStatuses = route.slice(
    route.indexOf("const CANCELABLE_MISSION_STATUSES"),
    route.indexOf("function missionCanBeCanceled"),
  );

  assert.doesNotMatch(cancelableStatuses, /"completed"/);
  assert.doesNotMatch(cancelableStatuses, /"closed"/);
  assert.doesNotMatch(cancelableStatuses, /"canceled"/);
  assert.match(route, /preserved\.map/);
});

test("stay need normalization accepts known requested services", () => {
  const helper = read("../app/api/_shared/stayMissionAssignments.ts");

  assert.match(helper, /normalized === "checkin" \|\| normalized === "arrival"/);
  assert.match(helper, /normalized === "checkout" \|\| normalized === "departure"/);
  assert.match(helper, /normalized === "cleaning" \|\| normalized === "menage" \|\| normalized === "ménage"/);
  assert.match(helper, /normalized === "linen" \|\| normalized === "linge"/);
  assert.match(helper, /return null/);
});
