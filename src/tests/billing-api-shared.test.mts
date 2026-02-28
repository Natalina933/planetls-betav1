import test from "node:test";
import assert from "node:assert/strict";

import {
  extractCheckoutSessionSyncData,
  extractSubscriptionLifecycleData,
} from "../app/api/billing/shared.ts";

test("extractCheckoutSessionSyncData reads subscription checkout metadata", () => {
  const result = extractCheckoutSessionSyncData({
    id: "cs_test_123",
    mode: "subscription",
    payment_status: "paid",
    metadata: {
      user_id: "user-1",
      plan: "concierge_pro_monthly",
    },
  });

  assert.deepEqual(result, {
    sessionId: "cs_test_123",
    mode: "subscription",
    paymentStatus: "paid",
    userId: "user-1",
    plan: "concierge_pro_monthly",
    invoiceId: null,
  });
});

test("extractSubscriptionLifecycleData reads subscription lifecycle payload", () => {
  const result = extractSubscriptionLifecycleData({
    id: "sub_123",
    status: "active",
    metadata: {
      user_id: "user-1",
      plan: "concierge_pro_monthly",
    },
  });

  assert.deepEqual(result, {
    subscriptionId: "sub_123",
    status: "active",
    userId: "user-1",
    plan: "concierge_pro_monthly",
  });
});
