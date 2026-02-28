import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";
import { recordStripeEvent } from "@/app/lib/stripeHistory";

const ALLOWED_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces reserve aux proprietaires." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId =
      typeof body?.session_id === "string" ? body.session_id.trim() : "";
    if (!sessionId) {
      return NextResponse.json({ error: "session_id requis." }, { status: 400 });
    }

    const { id } = await params;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY manquante." }, { status: 503 });
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return NextResponse.json(
        {
          error:
            stripePayload?.error?.message ||
            "Impossible de verifier la session Stripe.",
        },
        { status: 502 },
      );
    }

    const invoiceId =
      typeof stripePayload?.metadata?.invoice_id === "string"
        ? stripePayload.metadata.invoice_id
        : null;
    const metadataUserId =
      typeof stripePayload?.metadata?.user_id === "string"
        ? stripePayload.metadata.user_id
        : null;

    if (invoiceId !== id || metadataUserId !== auth.userId) {
      return NextResponse.json({ error: "Session Stripe non autorisee." }, { status: 403 });
    }

    if (stripePayload?.mode !== "payment" || stripePayload?.payment_status !== "paid") {
      return NextResponse.json(
        { error: "La session de paiement n'est pas finalisee." },
        { status: 400 },
      );
    }

    const { data: invoice, error: invoiceError } = await db
      .from("invoices")
      .select("id, owner_profile_id, total_amount, currency, status")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    }

    if (invoice.owner_profile_id !== auth.userId && auth.role !== "admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const totalAmount = Number(invoice.total_amount ?? 0);
    const nowIso = new Date().toISOString();

    const { data: updated, error: updateError } = await db
      .from("invoices")
      .update({
        status: "paid",
        paid_amount: totalAmount,
        balance_amount: 0,
        paid_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", id)
      .select("id, invoice_number, status, total_amount, paid_amount, balance_amount, paid_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Impossible de synchroniser la facture." }, { status: 500 });
    }

    const { error: eventError } = await db.from("invoice_events").insert({
      invoice_id: id,
      actor_profile_id: auth.userId,
      event_type: "paid",
      payload: {
        source: "stripe",
        session_id: sessionId,
      },
    });

    if (eventError) {
      console.error("[POST /api/billing/invoices/:id/sync] event error:", eventError);
    }

    await recordStripeEvent({
      profileId: auth.userId,
      stripeObjectId: sessionId,
      stripeEventType: "checkout.session.completed",
      source: "return",
      payload: stripePayload,
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err) {
    console.error("[POST /api/billing/invoices/:id/sync] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
