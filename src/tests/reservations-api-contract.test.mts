import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("owner reservations API exposes list and create on the canonical table", () => {
  const route = read("../app/api/owner/reservations/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function POST/);
  assert.match(route, /from\("reservations"\)/);
  assert.match(route, /concierge_owner_matches/);
  assert.match(route, /manual_owner/);
});

test("reservation detail API exposes participant read and update", () => {
  const route = read("../app/api/reservations/[id]/route.ts");
  assert.match(route, /export async function GET/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /from\("reservations"\)/);
  assert.match(route, /reservation_id\.eq\.\$\{id\}/);
  assert.match(route, /from\("workflow_events"\)/);
  assert.match(route, /timeline:/);
  assert.match(route, /acknowledge/);
  assert.match(route, /cancel/);
});

test("concierge stays now reads canonical reservations before legacy missions", () => {
  const route = read("../app/api/concierge/stays/route.ts");
  const page = read("../app/dashboard/concierge/sejours/page.tsx");
  assert.match(route, /from\("reservations"\)/);
  assert.match(route, /reservation_id\.eq\.\$\{stayId\}/);
  assert.match(route, /reservationToTravelerStay/);
  assert.match(route, /mergeDuplicateTravelerStays/);
  assert.match(route, /workflowsAndMissionsToTravelerStays/);
  assert.match(page, /\/api\/reservations\/\$\{encodeURIComponent\(selectedStay\.id\)\}/);
  assert.match(page, /method: "PATCH"/);
  assert.match(page, /handleSaveCollaborativeBrief/);
  assert.match(page, /handleConciergeAction/);
});

test("concierge reservations list now uses canonical reservations as root object", () => {
  const route = read("../app/api/concierge/reservations/route.ts");
  assert.match(route, /from\("reservations"\)/);
  assert.match(route, /reservation_id: workflow\.reservation\.id/);
  assert.match(route, /ensureCanonicalReservation/);
  assert.match(route, /reservation_created/);
  assert.match(route, /reservationToTravelerStay/);
  assert.match(route, /getReservationMissionKey/);
});

test("provider interventions now carry an explicit reservation link when available", () => {
  const missionProviderRoute = read("../app/api/missions/[id]/provider-interventions/route.ts");
  const missionDetailRoute = read("../app/api/missions/[id]/route.ts");
  assert.match(missionProviderRoute, /reservation_id:/);
  assert.match(missionDetailRoute, /reservation_id\.eq\.\$\{reservationId\}/);
});

test("workflow events API and writers support reservation_id", () => {
  const workflowRoute = read("../app/api/workflow-events/route.ts");
  const workflowHelper = read("../app/api/_shared/workflowEvents.ts");
  const invoiceRoute = read("../app/api/invoices/[id]/status/route.ts");
  const billingSyncRoute = read("../app/api/billing/invoices/[id]/sync/route.ts");
  const quoteStatusRoute = read("../app/api/quotes/[id]/status/route.ts");
  const ownerReservationsRoute = read("../app/api/owner/reservations/route.ts");
  const reservationDetailRoute = read("../app/api/reservations/[id]/route.ts");

  assert.match(workflowRoute, /reservationId/);
  assert.match(workflowRoute, /reservation_id/);
  assert.match(workflowHelper, /reservationId\?: string \| null/);
  assert.match(workflowHelper, /reservation_id: input\.reservationId \?\? null/);
  assert.match(ownerReservationsRoute, /reservation_created/);
  assert.match(reservationDetailRoute, /recordWorkflowEvent/);
  assert.match(invoiceRoute, /reservationId: await loadMissionReservationId/);
  assert.match(billingSyncRoute, /reservationId: await loadMissionReservationId/);
  assert.match(quoteStatusRoute, /reservationId: await loadMissionReservationId/);
});

test("owner traveler missions page now reads and creates canonical reservations", () => {
  const page = read("../app/dashboard/owner/missions/voyageurs/page.tsx");
  assert.match(page, /fetch\("\/api\/owner\/reservations"/);
  assert.match(page, /\/api\/reservations\/\$\{encodeURIComponent\(focusedMission\.id\)\}/);
  assert.match(page, /buildReservationPayload/);
  assert.match(page, /reservationToMissionRow/);
  assert.match(page, /patchFocusedReservation/);
  assert.match(page, /cancelFocusedReservation/);
});

test("owner planning page now reads canonical reservations", () => {
  const page = read("../app/dashboard/owner/planning/page.tsx");
  const list = read("../app/dashboard/owner/planning/OwnerPlanningList.tsx");
  assert.match(page, /fetch\("\/api\/owner\/reservations"/);
  assert.match(page, /mapReservationToPlanningItem/);
  assert.match(page, /concierge_notes/);
  assert.match(list, /item\.travelerName \|\| item\.propertyName/);
  assert.match(list, /item\.narrative/);
  assert.doesNotMatch(page, /\/api\/missions\?scope=owner/);
});
