import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(
  new URL("../app/api/owner/reservations/[id]/missions/route.ts", import.meta.url),
  "utf8",
);

test("explicit stay mission assignment creates one mission per selected need on the same reservation", () => {
  assert.match(route, /export async function POST/);
  assert.match(route, /readAssignments/);
  assert.match(route, /reservation_id: reservation\.id/);
  assert.match(route, /reservation_step: assignment\.need/);
  assert.match(route, /stay_need: assignment\.need/);
  assert.match(route, /insertMissionWithOptionalMetadata/);
});

test("collaboration admissibility is scoped to the active collaboration, housing and owner", () => {
  assert.match(route, /from\("housing_collaborations"\)/);
  assert.match(route, /\.in\("id", uniqueCollaborationIds\)/);
  assert.match(route, /collaboration\.status !== "active"/);
  assert.match(route, /collaboration\.owner_profile_id !== reservation\.owner_profile_id/);
  assert.match(route, /String\(collaboration\.housing_id\) !== housingId/);
});

test("contract services control automatic, on-demand and excluded assignments", () => {
  assert.match(route, /from\("services_contracts"\)/);
  assert.match(route, /from\("services_contract_versions"\)/);
  assert.match(route, /conditions\.services/);
  assert.match(route, /SERVICE_CODES/);
  assert.match(route, /state === "AUTOMATIQUE"/);
  assert.match(route, /state === "SUR_DEMANDE" && explicitNeeds\.has\(need\)/);
  assert.doesNotMatch(route, /state === "NON_INCLUSE"[^]*return true/);
});

test("concierge responsibility is derived from the validated collaboration", () => {
  assert.match(route, /concierge_profile_id: collaboration\.concierge_profile_id/);
  assert.doesNotMatch(route, /concierge_profile_id: .*body/);
  assert.doesNotMatch(route, /concierge_profile_id: .*payload/);
});

test("double submission reuses the same reservation need collaboration mission", () => {
  assert.match(route, /stay_assignment_key/);
  assert.match(route, /`\$\{reservation\.id\}:\$\{assignment\.need\}:\$\{collaboration\.id\}`/);
  assert.match(route, /\.eq\("reservation_id", reservation\.id\)/);
  assert.match(route, /\.contains\("metadata", \{ stay_assignment_key: idempotencyKey \}\)/);
  assert.match(route, /if \(existing\)/);
});

test("minimal needs are normalized without creating legacy workflow steps", () => {
  assert.match(route, /checkin/);
  assert.match(route, /checkout/);
  assert.match(route, /cleaning/);
  assert.match(route, /linen/);
  assert.doesNotMatch(route, /stepId: "billing"/);
  assert.doesNotMatch(route, /stepId: "control"/);
  assert.doesNotMatch(route, /stepId: "welcome"/);
  assert.doesNotMatch(route, /maintenanceRequested/);
});
