import test from "node:test";
import assert from "node:assert/strict";
import { controlActionKey, parseAdminControlAction } from "../app/api/admin/control-tower/actions.ts";

const targetId = "123e4567-e89b-42d3-a456-426614174000";

test("control tower accepts a traced acknowledgement", () => {
  const result = parseAdminControlAction({ targetType: "mission", targetId, status: "acknowledged", note: "Pris par Nathalie" });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.note, "Pris par Nathalie");
  assert.equal(controlActionKey("mission", targetId), "mission:" + targetId);
});

test("control tower requires a reason before transmission to a manager", () => {
  assert.deepEqual(
    parseAdminControlAction({ targetType: "message", targetId, status: "escalated", note: "" }),
    { ok: false, error: "Un motif est requis pour transmettre au responsable." },
  );
});

test("control tower requires a report to close a follow-up", () => {
  assert.deepEqual(
    parseAdminControlAction({ targetType: "mission", targetId, status: "closed", note: "" }),
    { ok: false, error: "Un compte rendu est requis pour clôturer le suivi." },
  );
  assert.equal(parseAdminControlAction({ targetType: "mission", targetId, status: "closed", note: "Contrôle effectué" }).ok, true);
});

test("control tower rejects unsupported targets and identifiers", () => {
  assert.equal(parseAdminControlAction({ targetType: "invoice", targetId, status: "acknowledged" }).ok, false);
  assert.equal(parseAdminControlAction({ targetType: "mission", targetId: "not-an-id", status: "acknowledged" }).ok, false);
});

test("control tower accepts system incidents with stable non-UUID identifiers", () => {
  const result = parseAdminControlAction({
    targetType: "system",
    targetId: "permission-dispute-export",
    status: "acknowledged",
    note: "Investigation ouverte",
  });

  assert.equal(result.ok, true);
  assert.equal(controlActionKey("system", "permission-dispute-export"), "system:permission-dispute-export");
});
