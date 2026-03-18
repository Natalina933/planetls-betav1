import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "canceled";

type InvoiceRecord = {
  id: string;
  status: InvoiceStatus;
  total_amount: number | null;
  paid_amount: number | null;
  concierge_profile_id: string | null;
  owner_profile_id: string | null;
  issued_at: string | null;
  paid_at: string | null;
  canceled_at: string | null;
};

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
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);

const CONCIERGE_ALLOWED_TRANSITIONS = new Map<InvoiceStatus, InvoiceStatus[]>([
  ["draft", ["issued", "canceled"]],
  ["issued", ["partially_paid", "paid", "overdue", "canceled"]],
  ["partially_paid", ["paid", "overdue", "canceled"]],
  ["paid", []],
  ["overdue", ["partially_paid", "paid", "canceled"]],
  ["canceled", []],
]);

async function loadInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
  const { data, error } = await db
    .from("invoices")
    .select(
      "id, status, total_amount, paid_amount, concierge_profile_id, owner_profile_id, issued_at, paid_at, canceled_at",
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (error) {
    console.error("[invoice status auth] invoice lookup error:", error);
    throw new Error("INVOICE_LOOKUP_FAILED");
  }

  return data as InvoiceRecord | null;
}

function canTransition(currentStatus: InvoiceStatus, nextStatus: InvoiceStatus, isAdmin: boolean): boolean {
  if (isAdmin) {
    return currentStatus !== nextStatus;
  }

  return CONCIERGE_ALLOWED_TRANSITIONS.get(currentStatus)?.includes(nextStatus) ?? false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "invoice status auth",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "modifier une facture",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { id } = await params;
    const body: UpdateInvoiceStatusBody = await req.json();
    const nextStatus = body.status;

    if (!nextStatus || !VALID_INVOICE_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: "Statut facture invalide" }, { status: 400 });
    }

    const existing = await loadInvoice(id);
    if (!existing) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }

    if (!actorResult.actor.isAdmin && existing.concierge_profile_id !== actorResult.actor.userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette facture." },
        { status: 403 },
      );
    }

    if (!canTransition(existing.status, nextStatus, actorResult.actor.isAdmin)) {
      return NextResponse.json(
        {
          error: `La transition '${existing.status}' -> '${nextStatus}' n'est pas autorisée.`,
        },
        { status: 403 },
      );
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

    if (nextPaidAmount > totalAmount && !actorResult.actor.isAdmin) {
      return NextResponse.json(
        { error: "Le montant payé ne peut pas dépasser le montant total de la facture." },
        { status: 403 },
      );
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      paid_amount: round2(nextPaidAmount),
      balance_amount: round2(Math.max(totalAmount - nextPaidAmount, 0)),
      updated_at: nowIso,
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
    if (nextStatus === "paid") {
      updatePayload.balance_amount = 0;
    }

    const { data: updated, error: updateError } = await db
      .from("invoices")
      .update(updatePayload)
      .eq("id", id)
      .select(
        "id, invoice_number, status, quote_id, owner_profile_id, concierge_profile_id, mission_id, issue_date, due_date, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, paid_amount, balance_amount, issued_at, paid_at, canceled_at, created_at, updated_at",
      )
      .single();

    if (updateError || !updated) {
      console.error("[PATCH /api/invoices/:id/status] update error:", updateError);
      return NextResponse.json({ error: "Erreur mise a jour statut facture" }, { status: 500 });
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
      actor_profile_id: actorResult.actor.userId,
      event_type: eventType,
      payload: {
        from: existing.status,
        to: nextStatus,
        paid_amount: round2(nextPaidAmount),
        actor_role: actorResult.actor.role,
      },
    });

    if (eventError) {
      console.error("[PATCH /api/invoices/:id/status] event error:", eventError);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/invoices/:id/status] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
