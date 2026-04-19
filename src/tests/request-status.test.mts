import test from "node:test";
import assert from "node:assert/strict";

import { deriveRequestWorkflowStatus } from "../app/lib/requestStatus.ts";

test("deriveRequestWorkflowStatus maps service request states to the shared workflow", () => {
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "sent" }), "NEW");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "in_review" }), "IN_DISCUSSION");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "quoted" }), "QUOTE_SENT");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "accepted" }), "ACCEPTED");
});

test("deriveRequestWorkflowStatus prioritizes mission progress over earlier steps", () => {
  assert.equal(
    deriveRequestWorkflowStatus({
      serviceRequestStatus: "accepted",
      hasMission: true,
    }),
    "MISSION_CREATED",
  );

  assert.equal(
    deriveRequestWorkflowStatus({
      missionStatus: "in_progress",
    }),
    "IN_PROGRESS",
  );

  assert.equal(
    deriveRequestWorkflowStatus({
      missionStatus: "completed",
    }),
    "COMPLETED",
  );
});
