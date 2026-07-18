import crypto from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";

import {
  extractCheckoutSessionSyncData,
  extractSubscriptionLifecycleData,
  verifyStripeWebhookSignature,
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

test("verifyStripeWebhookSignature accepts a fresh signature and rejects replay or tampering", () => {
  const payload = JSON.stringify({ type: "checkout.session.completed" });
  const secret = "whsec_test";
  const timestamp = 1_750_000_000;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const header = `t=${timestamp},v1=${signature}`;

  assert.equal(verifyStripeWebhookSignature(payload, header, secret, timestamp + 30), true);
  assert.equal(verifyStripeWebhookSignature(`${payload} `, header, secret, timestamp + 30), false);
  assert.equal(verifyStripeWebhookSignature(payload, header, secret, timestamp + 301), false);
  assert.equal(verifyStripeWebhookSignature(payload, "t=bad,v1=bad", secret, timestamp), false);
});