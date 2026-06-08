import { NextRequest, NextResponse } from "next/server";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { db } from "@/app/lib/dbServer";
import { getInvoiceWorkflowEventType } from "@/app/lib/invoiceStatus";
import { requireApiRole } from "@/server/auth/roleGuards";

type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "canceled";

interface UpdateInvoiceStatusBody {
  status?: InvoiceStatus;
  paid_amount?: number | null;
}

const VALID_INVOICE_STATUS: InvoiceStatus[] = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "canceled",
];

const round2 = (value: number): number => Math.round(value * 100) / 100;

const ALLOWED_BILLING_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

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
    console.error("[PATCH /api/invoices/:id/status] mission close error:", closeError);
    return null;
  }

  await db.from("mission_events").insert({
    mission_id: input.missionId,
    actor_profile_id: input.actorProfileId,
    event_type: "closed_after_final_payment",
    payload: {
      source: "invoice_paid",
    },
  });

  await recordWorkflowEvent(db, {
    actorProfileId: input.actorProfileId,
    ownerProfileId: closedMission.owner_profile_id,
    conciergeProfileId: closedMission.concierge_profile_id,
    missionId: input.missionId,
    eventType: "mission_closed",
    title: "Mission cloturee",
    body: "La mission est cloturee apres paiement final.",
    actionHref: `/dashboard/missions/${input.missionId}`,
    missionStatus: "closed",
    hasMission: true,
    metadata: {
      source: "invoice_paid",
    },
  });

  return closedMission;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireApiRole(req, ALLOWED_BILLING_ROLES);
    if (!guard.ok) return guard.response;

    const { userId } = guard.auth;
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateInvoiceStatusBody = await req.json();
    const nextStatus = body.status;

    if (!nextStatus || !VALID_INVOICE_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: "Statut facture invalide" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await db
      .from("invoices")
      .select("id, invoice_number, status, quote_id, owner_profile_id, concierge_profile_id, mission_id, total_amount, paid_amount, issued_at, paid_at, canceled_at")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (existingError) {
      console.error("[PATCH /api/invoices/:id/status] read error:", existingError);
      return NextResponse.json({ error: "Erreur lecture facture" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }

    const totalAmount = Number(existing.total_amount ?? 0);
    let nextPaidAmount = Number(existing.paid_amount ?? 0);
    if (body.paid_amount !== null && body.paid_amount !== undefined) {
      const candidate = Number(body.paid_amount);
      if (!Number.isFinite(candidate) || candidate < 0) {
        return NextResponse.json({ error: "paid_amount invalide" }, { status: 400 });
      }
      nextPaidAmount = candidate;
    }
    if (nextStatus === "paid" && (body.paid_amount === null || body.paid_amount === undefined)) {
      nextPaidAmount = totalAmount;
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      paid_amount: round2(nextPaidAmount),
      balance_amount: round2(Math.max(totalAmount - nextPaidAmount, 0)),
    };

    if (nextStatus === "issued" && !existing.issued_at) {
      updatePayload.issued_at = nowIso;
    }
    if ((nextStatus === "paid" || nextStatus === "partially_paid") && !existing.paid_at) {
      updatePayload.paid_at = nowIso;
    }
    if (nextStatus === "canceled" && !existing.canceled_at) {
      updatePayload.canceled_at = nowIso;
    }
    if (nextStatus !== "canceled") {
      updatePayload.canceled_at = existing.canceled_at;
    }

    if (nextStatus === "paid") {
      updatePayload.balance_amount = 0;
    }

    const { data: updated, error: updateError } = await db
      .from("invoices")
      .update(updatePayload)
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .select(
        "id, invoice_number, status, quote_id, owner_profile_id, concierge_profile_id, mission_id, issue_date, due_date, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, paid_amount, balance_amount, issued_at, paid_at, canceled_at, created_at, updated_at",
      )
      .single();

    if (updateError || !updated) {
      console.error("[PATCH /api/invoices/:id/status] update error:", updateError);
      return NextResponse.json(
        { error: "Erreur mise a jour statut facture" },
        { status: 500 },
      );
    }

    const eventType =
      nextStatus === "issued" ||
      nextStatus === "partially_paid" ||
      nextStatus === "paid" ||
      nextStatus === "overdue" ||
      nextStatus === "canceled"
        ? nextStatus
        : "status_changed";

    const { error: eventError } = await db.from("invoice_events").insert({
      invoice_id: id,
      actor_profile_id: userId,
      event_type: eventType,
      payload: {
        from: existing.status,
        to: nextStatus,
        paid_amount: round2(nextPaidAmount),
      },
    });
    if (eventError) {
      console.error("[PATCH /api/invoices/:id/status] event error:", eventError);
    }

    await recordWorkflowEvent(db, {
      actorProfileId: userId,
      ownerProfileId: updated.owner_profile_id,
      conciergeProfileId: updated.concierge_profile_id ?? userId,
      quoteId: updated.quote_id,
      missionId: updated.mission_id,
      eventType: getInvoiceWorkflowEventType(nextStatus),
      title:
        nextStatus === "paid"
          ? "Paiement recu"
          : nextStatus === "issued"
            ? "Facture disponible"
            : nextStatus === "overdue"
              ? "Paiement en retard"
              : nextStatus === "partially_paid"
                ? "Paiement partiel recu"
                : "Statut facture mis a jour",
      body:
        nextStatus === "paid"
          ? `La facture ${updated.invoice_number || updated.id} est reglee.`
          : nextStatus === "issued"
            ? `La facture ${updated.invoice_number || updated.id} est disponible pour paiement.`
            : nextStatus === "overdue"
              ? `La facture ${updated.invoice_number || updated.id} est en retard de paiement.`
              : nextStatus === "partially_paid"
                ? `Un paiement partiel a ete enregistre sur la facture ${updated.invoice_number || updated.id}.`
                : `La facture ${updated.invoice_number || updated.id} a change de statut.`,
      actionHref: `/dashboard/owner/factures?invoice=${updated.id}`,
      quoteStatus: null,
      missionStatus: null,
      hasMission: Boolean(updated.mission_id),
      metadata: {
        invoice_id: updated.id,
        invoice_number: updated.invoice_number,
        invoice_status: nextStatus,
        paid_amount: round2(nextPaidAmount),
        balance_amount: updated.balance_amount,
      },
    });

    let completedAction: Record<string, unknown> | null = null;
    if (updated.mission_id) {
      const closedMission =
        nextStatus === "paid"
          ? await closeMissionAfterFinalPayment({
              missionId: updated.mission_id,
              actorProfileId: userId,
            })
          : null;
      const missionEventType =
        nextStatus === "paid"
          ? "invoice_paid"
          : nextStatus === "issued"
            ? "invoice_issued"
            : nextStatus === "canceled"
              ? "invoice_canceled"
              : "invoice_status_changed";

      await db.from("mission_events").insert({
        mission_id: updated.mission_id,
        actor_profile_id: userId,
        event_type: missionEventType,
        payload: {
          invoice_id: updated.id,
          invoice_number: updated.invoice_number,
          invoice_status: nextStatus,
          paid_amount: round2(nextPaidAmount),
        },
      });

      completedAction = {
        visible_in:
          nextStatus === "paid"
            ? closedMission
              ? ["finances", "factures_payees", "mission_cloturee"]
              : ["finances", "factures_payees", "mission_detail"]
            : nextStatus === "issued"
              ? ["finances", "factures_a_regler", "mission_detail"]
              : ["finances", "mission_detail"],
        mission_id: updated.mission_id,
        mission_status: closedMission?.status ?? null,
      };
    }

    return NextResponse.json({
      ...updated,
      completed_action: completedAction,
    });
  } catch (err) {
    console.error("[PATCH /api/invoices/:id/status] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
