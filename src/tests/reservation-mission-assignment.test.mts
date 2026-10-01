import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(
  new URL("../app/api/owner/reservations/[id]/missions/route.ts", import.meta.url),
  "utf8",
);
const helper = readFileSync(
  new URL("../app/api/_shared/stayMissionAssignments.ts", import.meta.url),
  "utf8",
);

test("explicit stay mission assignment creates one mission per selected need on the same reservation", () => {
  assert.match(route, /export async function POST/);
  assert.match(route, /createOrReuseStayMissions/);
  assert.match(helper, /readStayMissionAssignments/);
  assert.match(helper, /reservation_id: input\.reservation\.id/);
  assert.match(helper, /reservation_step: assignment\.need/);
  assert.match(helper, /stay_need: assignment\.need/);
  assert.match(helper, /insertMissionWithOptionalMetadata/);
});

test("collaboration admissibility is scoped to the active collaboration, housing and owner", () => {
  assert.match(helper, /from\("housing_collaborations"\)/);
  assert.match(helper, /\.in\("id", uniqueCollaborationIds\)/);
  assert.match(helper, /collaboration\.status !== "active"/);
  assert.match(helper, /collaboration\.owner_profile_id !== input\.reservation\.owner_profile_id/);
  assert.match(helper, /String\(collaboration\.housing_id\) !== housingId/);
});

test("contract services control automatic, on-demand and excluded assignments", () => {
  assert.match(helper, /from\("services_contracts"\)/);
  assert.match(helper, /from\("services_contract_versions"\)/);
  assert.match(helper, /conditions\.services/);
  assert.match(helper, /SERVICE_CODES/);
  assert.match(helper, /state === "AUTOMATIQUE"/);
  assert.match(helper, /state === "SUR_DEMANDE" && explicitNeeds\.has\(need\)/);
  assert.doesNotMatch(helper, /state === "NON_INCLUSE"[^]*return true/);
});

test("concierge responsibility is derived from the validated collaboration", () => {
  assert.match(helper, /concierge_profile_id: collaboration\.concierge_profile_id/);
  assert.doesNotMatch(helper, /concierge_profile_id: .*body/);
  assert.doesNotMatch(helper, /concierge_profile_id: .*payload/);
});

test("double submission reuses the same reservation need collaboration mission", () => {
  assert.match(helper, /stay_assignment_key/);
  assert.match(helper, /`\$\{input\.reservation\.id\}:\$\{assignment\.need\}:\$\{collaboration\.id\}`/);
  assert.match(helper, /\.eq\("reservation_id", input\.reservation\.id\)/);
  assert.match(helper, /\.contains\("metadata", \{ stay_assignment_key: idempotencyKey \}\)/);
  assert.match(helper, /if \(existing\)/);
});

test("minimal needs are normalized without creating legacy workflow steps", () => {
  assert.match(helper, /checkin/);
  assert.match(helper, /checkout/);
  assert.match(helper, /cleaning/);
  assert.match(helper, /linen/);
  assert.doesNotMatch(helper, /stepId: "billing"/);
  assert.doesNotMatch(helper, /stepId: "control"/);
  assert.doesNotMatch(helper, /stepId: "welcome"/);
  assert.doesNotMatch(helper, /maintenanceRequested/);
});
