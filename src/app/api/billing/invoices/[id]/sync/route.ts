import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";
import { recordStripeEvent } from "@/app/lib/stripeHistory";

const ALLOWED_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
const dbAny = asLooseSupabaseClient(db);

async function loadMissionReservationId(missionId: string | null | undefined) {
  if (!missionId) return null;
  const { data } = await dbAny.from("missions").select("reservation_id, metadata").eq("id", missionId).maybeSingle();
  const row = data as { reservation_id?: string | null; metadata?: Record<string, unknown> | null } | null;
  return row?.reservation_id ?? (typeof row?.metadata?.reservation_id === "string" ? row.metadata.reservation_id : null);
}

async function closeMissionAfterFinalPayment(input: {
  missionId: string;
  actorProfileId: string;
}) {
  const { data: mission } = await db
    .from("missions")
    .select("id, status, owner_profile_id, concierge_profile_id, metadata")
    .eq("id", input.missionId)
    .maybeSingle();

  if (!mission || !["validated", "completed", "awaiting_owner_validation"].includes(String(mission.status ?? ""))) {
    return null;
  }

  const { data: openInvoices } = await db
    .from("invoices")
    .select("id, status, balance_amount")
    .eq("mission_id", input.missionId)
    .not("status", "in", "(paid,canceled)");

  const stillOpen = (openInvoices ?? []).some((invoice) => Number(invoice.balance_amount ?? 0) > 0);
  if (stillOpen) return null;

  const nowIso = new Date().toISOString();
  const { data: closedMission, error: closeError } = await db
    .from("missions")
    .update({
      status: "closed",
      metadata: {
        ...(mission.metadata && typeof mission.metadata === "object" && !Array.isArray(mission.metadata)
          ? (mission.metadata as Record<string, unknown>)
          : {}),
        closed_after_final_payment_at: nowIso,
      },
    })
    .eq("id", input.missionId)
    .select("id, status, owner_profile_id, concierge_profile_id")
    .maybeSingle();

  if (closeError || !closedMission) {
    console.error("[POST /api/billing/invoices/:id/sync] mission close error:", closeError);
    return null;
  }

  await db.from("mission_events").insert({
    mission_id: input.missionId,
    actor_profile_id: input.actorProfileId,
    event_type: "closed_after_final_payment",
    payload: {
      source: "stripe_invoice_paid",
    },
  });

  await recordWorkflowEvent(db, {
    actorProfileId: input.actorProfileId,
    ownerProfileId: closedMission.owner_profile_id,
    conciergeProfileId: closedMission.concierge_profile_id,
    reservationId: await loadMissionReservationId(input.missionId),
    missionId: input.missionId,
    eventType: "mission_closed",
    title: "Mission cloturee",
    body: "La mission est cloturee apres paiement final.",
    actionHref: `/dashboard/missions/${input.missionId}`,
    missionStatus: "closed",
    hasMission: true,
    metadata: {
      source: "stripe_invoice_paid",
    },
  });

  return closedMission;
}

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
      .select("id, invoice_number, owner_profile_id, concierge_profile_id, quote_id, mission_id, total_amount, currency, status")
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

    await recordWorkflowEvent(db, {
      actorProfileId: auth.userId,
      ownerProfileId: invoice.owner_profile_id,
      conciergeProfileId: invoice.concierge_profile_id,
      reservationId: await loadMissionReservationId(invoice.mission_id),
      quoteId: invoice.quote_id,
      missionId: invoice.mission_id,
      eventType: "invoice_paid",
      title: "Paiement recu",
      body: `La facture ${invoice.invoice_number || invoice.id} est reglee par carte.`,
      actionHref: `/dashboard/owner/factures?invoice=${invoice.id}`,
      hasMission: Boolean(invoice.mission_id),
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        source: "stripe",
        session_id: sessionId,
      },
    });

    const closedMission = invoice.mission_id
      ? await closeMissionAfterFinalPayment({
          missionId: invoice.mission_id,
          actorProfileId: auth.userId,
        })
      : null;

    await recordStripeEvent({
      profileId: auth.userId,
      stripeObjectId: sessionId,
      stripeEventType: "checkout.session.completed",
      source: "return",
      payload: stripePayload,
    });

    return NextResponse.json({ success: true, invoice: updated, closed_mission: closedMission });
  } catch (err) {
    console.error("[POST /api/billing/invoices/:id/sync] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
