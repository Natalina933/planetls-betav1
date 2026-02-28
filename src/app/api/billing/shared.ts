type StripeObject = Record<string, unknown>;

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
