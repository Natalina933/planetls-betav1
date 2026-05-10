import test from "node:test";
import assert from "node:assert/strict";

import {
  canConciergeManageQuote,
  canOwnerUpdateQuoteStatus,
  canOwnerSelectQuote,
  isCrossProfileAccessDenied,
  quoteBelongsToServiceRequest,
} from "../server/auth/businessAuthorization.ts";

test("owner can select only a quote linked to their own request", () => {
  const request = { id: "request-1", owner_profile_id: "owner-1" };
  const quote = {
    id: "quote-1",
    owner_profile_id: "owner-1",
    concierge_profile_id: "concierge-1",
    metadata: { service_request_id: "request-1" },
  };

  assert.equal(canOwnerSelectQuote("owner-1", request, quote), true);
  assert.equal(quoteBelongsToServiceRequest(quote, "request-1"), true);
});

test("owner cannot select another owner's quote or request", () => {
  const request = { id: "request-2", owner_profile_id: "owner-2" };
  const quote = {
    id: "quote-2",
    owner_profile_id: "owner-2",
    concierge_profile_id: "concierge-1",
    metadata: { service_request_id: "request-2" },
  };

  assert.equal(canOwnerSelectQuote("owner-1", request, quote), false);
});

test("concierge can send or accept only their own quote", () => {
  const quote = {
    id: "quote-3",
    owner_profile_id: "owner-1",
    concierge_profile_id: "concierge-1",
    metadata: { service_request_id: "request-1" },
  };

  assert.equal(canConciergeManageQuote("concierge-1", quote), true);
  assert.equal(canConciergeManageQuote("concierge-2", quote), false);
});

test("unrelated profile is denied cross-access to owner/concierge resource", () => {
  const resource = {
    owner_profile_id: "owner-1",
    concierge_profile_id: "concierge-1",
  };

  assert.equal(isCrossProfileAccessDenied("owner-1", resource), false);
  assert.equal(isCrossProfileAccessDenied("concierge-1", resource), false);
  assert.equal(isCrossProfileAccessDenied("owner-2", resource), true);
});

test("owner can accept or reject only their own quote", () => {
  const quote = {
    id: "quote-4",
    owner_profile_id: "owner-1",
    concierge_profile_id: "concierge-1",
    metadata: {},
  };

  assert.equal(canOwnerUpdateQuoteStatus("owner-1", quote, "accepted"), true);
  assert.equal(canOwnerUpdateQuoteStatus("owner-1", quote, "rejected"), true);
  assert.equal(canOwnerUpdateQuoteStatus("owner-2", quote, "accepted"), false);
});

test("owner cannot move quote back to service-side statuses", () => {
  const quote = {
    id: "quote-5",
    owner_profile_id: "owner-1",
    concierge_profile_id: "concierge-1",
    metadata: {},
  };

  assert.equal(canOwnerUpdateQuoteStatus("owner-1", quote, "sent"), false);
  assert.equal(canOwnerUpdateQuoteStatus("owner-1", quote, "draft"), false);
  assert.equal(canOwnerUpdateQuoteStatus("owner-1", quote, "canceled"), false);
});
