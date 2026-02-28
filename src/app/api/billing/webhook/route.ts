import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { recordStripeEvent } from "@/app/lib/stripeHistory";
import {
  extractCheckoutSessionSyncData,
  extractSubscriptionLifecycleData,
} from "@/app/api/billing/shared";

function verifyStripeWebhookSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

async function markConciergeProFromWebhook(session: Record<string, unknown>) {
  const { userId, plan, sessionId, paymentStatus } = extractCheckoutSessionSyncData(session);

  if (!userId || !sessionId || plan !== "concierge_pro_monthly" || paymentStatus !== "paid") {
    return;
  }

  const { data: profile } = await db.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  if (!profile) return;

  const nextRole =
    profile.role === "concierge" || profile.role === "concierge_pro" ? "concierge_pro" : profile.role;

  await db
    .from("profiles")
    .update({
      role: nextRole,
      additional_info: `stripe_subscription:webhook:${sessionId}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await recordStripeEvent({
    profileId: userId,
    stripeObjectId: sessionId,
    stripeEventType: "checkout.session.completed",
    source: "webhook",
    payload: session,
  });
}

async function updateConciergeSubscriptionFromObject(
  subscription: Record<string, unknown>,
  eventType: string,
) {
  const { userId, plan, subscriptionId, status } =
    extractSubscriptionLifecycleData(subscription);

  if (!userId || !subscriptionId || plan !== "concierge_pro_monthly") {
    return;
  }

  const { data: profile } = await db.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  if (!profile) return;

  const shouldStayPro =
    status === "active" || status === "trialing" || status === "past_due";
  const nextRole =
    shouldStayPro && (profile.role === "concierge" || profile.role === "concierge_pro")
      ? "concierge_pro"
      : !shouldStayPro && profile.role === "concierge_pro"
      ? "concierge"
      : profile.role;

  await db
    .from("profiles")
    .update({
      role: nextRole,
      additional_info: `stripe_subscription:webhook:${subscriptionId}:${status ?? "unknown"}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await recordStripeEvent({
    profileId: userId,
    stripeObjectId: subscriptionId,
    stripeEventType: eventType,
    source: "webhook",
    payload: subscription,
  });
}

async function markInvoicePaidFromWebhook(session: Record<string, unknown>) {
  const { invoiceId, userId, sessionId, paymentStatus } = extractCheckoutSessionSyncData(session);

  if (!invoiceId || !userId || !sessionId || paymentStatus !== "paid") {
    return;
  }

  const { data: invoice } = await db
    .from("invoices")
    .select("id, owner_profile_id, total_amount, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice || invoice.owner_profile_id !== userId) return;
  if (invoice.status === "paid") return;

  const nowIso = new Date().toISOString();
  const totalAmount = Number(invoice.total_amount ?? 0);

  await db
    .from("invoices")
    .update({
      status: "paid",
      paid_amount: totalAmount,
      balance_amount: 0,
      paid_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", invoiceId);

  await db.from("invoice_events").insert({
    invoice_id: invoiceId,
    actor_profile_id: userId,
    event_type: "paid",
    payload: {
      source: "stripe_webhook",
      session_id: sessionId,
    },
  });

  await recordStripeEvent({
    profileId: userId,
    stripeObjectId: sessionId,
    stripeEventType: "checkout.session.completed",
    source: "webhook",
    payload: session,
  });
}

async function recordInvoiceFailureFromWebhook(invoiceObject: Record<string, unknown>) {
  const metadata = (invoiceObject.metadata ?? {}) as Record<string, unknown>;
  const userId = typeof metadata.user_id === "string" ? metadata.user_id : null;
  const invoiceId = typeof invoiceObject.id === "string" ? invoiceObject.id : null;

  if (!invoiceId) {
    return;
  }

  await recordStripeEvent({
    profileId: userId,
    stripeObjectId: invoiceId,
    stripeEventType: "invoice.payment_failed",
    source: "webhook",
    payload: invoiceObject,
  });
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET manquante." }, { status: 503 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Signature Stripe manquante." }, { status: 400 });
    }

    const payload = await req.text();
    if (!verifyStripeWebhookSignature(payload, signature, secret)) {
      return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });
    }

    const event = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
    const eventType = typeof event?.type === "string" ? event.type : "";
    const session = event?.data?.object ?? {};

    if (eventType === "checkout.session.completed") {
      const mode = typeof session.mode === "string" ? session.mode : null;
      if (mode === "subscription") {
        await markConciergeProFromWebhook(session);
      } else if (mode === "payment") {
        await markInvoicePaidFromWebhook(session);
      }
    } else if (
      eventType === "customer.subscription.updated" ||
      eventType === "customer.subscription.deleted"
    ) {
      await updateConciergeSubscriptionFromObject(session, eventType);
    } else if (eventType === "invoice.payment_failed") {
      await recordInvoiceFailureFromWebhook(session);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/billing/webhook] ERROR:", err);
    return NextResponse.json({ error: "Erreur webhook Stripe." }, { status: 500 });
  }
}
