import crypto from "node:crypto";

type StripeObject = Record<string, unknown>;

const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
const readString = (value: unknown) => (typeof value === "string" ? value : null);

export function extractCheckoutSessionSyncData(session: StripeObject) {
  const metadata = (session.metadata ?? {}) as Record<string, unknown>;

  return {
    sessionId: readString(session.id),
    mode: readString(session.mode),
    paymentStatus: readString(session.payment_status),
    userId: readString(metadata.user_id),
    plan: readString(metadata.plan),
    invoiceId: readString(metadata.invoice_id),
  };
}

export function extractSubscriptionLifecycleData(subscription: StripeObject) {
  const metadata = (subscription.metadata ?? {}) as Record<string, unknown>;

  return {
    subscriptionId: readString(subscription.id),
    status: readString(subscription.status),
    userId: readString(metadata.user_id),
    plan: readString(metadata.plan),
  };
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestampValue = parts.find((part) => part.startsWith("t="))?.slice(2);
  const timestamp = Number(timestampValue);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!Number.isInteger(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > STRIPE_WEBHOOK_TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  });
}