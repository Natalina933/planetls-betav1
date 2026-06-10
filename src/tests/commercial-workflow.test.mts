import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveCommercialWorkflowStatus,
  deriveMissionWorkflowStatus,
  deriveQuoteWorkflowStatus,
} from "../app/lib/commercialWorkflow.ts";

test("deriveQuoteWorkflowStatus maps quote lifecycle states", () => {
  assert.equal(deriveQuoteWorkflowStatus("draft"), "QUOTE_DRAFT");
  assert.equal(deriveQuoteWorkflowStatus("sent"), "QUOTE_SENT");
  assert.equal(deriveQuoteWorkflowStatus("accepted"), "QUOTE_ACCEPTED");
  assert.equal(deriveQuoteWorkflowStatus("rejected"), "QUOTE_REJECTED");
  assert.equal(deriveQuoteWorkflowStatus("expired"), "QUOTE_EXPIRED");
  assert.equal(deriveQuoteWorkflowStatus("canceled"), "QUOTE_CANCELED");
});

test("deriveMissionWorkflowStatus separates scheduling from execution", () => {
  assert.equal(deriveMissionWorkflowStatus({ status: "assigned" }), "TO_SCHEDULE");
  assert.equal(
    deriveMissionWorkflowStatus({ status: "assigned", scheduledStart: "2026-06-10T10:00:00.000Z" }),
    "SCHEDULED",
  );
  assert.equal(deriveMissionWorkflowStatus({ status: "accepted" }), "DATE_CONFIRMED");
  assert.equal(deriveMissionWorkflowStatus({ status: "in_progress" }), "IN_PROGRESS");
  assert.equal(deriveMissionWorkflowStatus({ status: "completed" }), "COMPLETED");
});

test("deriveCommercialWorkflowStatus returns request, quote and mission workflow fields", () => {
  assert.deepEqual(
    deriveCommercialWorkflowStatus({
      serviceRequestStatus: "in_review",
      recipientStatus: "interested",
      quoteStatus: "draft",
    }),
    {
      request_workflow_status: "IN_DISCUSSION",
      quote_workflow_status: "QUOTE_DRAFT",
      mission_workflow_status: null,
    },
  );

  assert.deepEqual(
    deriveCommercialWorkflowStatus({
      serviceRequestStatus: "quoted",
      recipientStatus: "quoted",
      quoteStatus: "sent",
    }),
    {
      request_workflow_status: "QUOTE_SENT",
      quote_workflow_status: "QUOTE_SENT",
      mission_workflow_status: null,
    },
  );

  assert.deepEqual(
    deriveCommercialWorkflowStatus({
      serviceRequestStatus: "accepted",
      quoteStatus: "accepted",
      missionStatus: "assigned",
      hasMission: true,
    }),
    {
      request_workflow_status: "ARCHIVED",
      quote_workflow_status: "QUOTE_ACCEPTED",
      mission_workflow_status: "TO_SCHEDULE",
    },
  );
});
