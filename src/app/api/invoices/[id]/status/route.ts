import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
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
      .select("id, status, total_amount, paid_amount, issued_at, paid_at, canceled_at")
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
        "id, invoice_number, status, quote_id, owner_profile_id, mission_id, issue_date, due_date, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, paid_amount, balance_amount, issued_at, paid_at, canceled_at, created_at, updated_at",
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

    let completedAction: Record<string, unknown> | null = null;
    if (updated.mission_id) {
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
            ? ["finances", "factures_payees", "mission_detail"]
            : nextStatus === "issued"
              ? ["finances", "factures_a_regler", "mission_detail"]
              : ["finances", "mission_detail"],
        mission_id: updated.mission_id,
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
