import test from "node:test";
import assert from "node:assert/strict";

import { deriveRequestWorkflowStatus } from "../app/lib/requestStatus.ts";

test("deriveRequestWorkflowStatus maps service request states to the shared workflow", () => {
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "sent" }), "SENT");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "received" }), "SENT");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "in_review" }), "IN_DISCUSSION");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "information_requested" }), "IN_DISCUSSION");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "quoted" }), "QUOTE_SENT");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "quote_accepted" }), "ACCEPTED");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "quote_refused" }), "DECLINED");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "expired" }), "EXPIRED");
  assert.equal(deriveRequestWorkflowStatus({ serviceRequestStatus: "accepted" }), "ACCEPTED");
});

test("deriveRequestWorkflowStatus keeps request status separate from mission execution", () => {
  assert.equal(
    deriveRequestWorkflowStatus({
      serviceRequestStatus: "accepted",
      hasMission: true,
    }),
    "ARCHIVED",
  );

  assert.equal(
    deriveRequestWorkflowStatus({
      missionStatus: "in_progress",
    }),
    "NEW",
  );

  assert.equal(
    deriveRequestWorkflowStatus({
      missionStatus: "completed",
    }),
    "NEW",
  );
});
