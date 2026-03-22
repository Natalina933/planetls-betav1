import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { createHousingFromQuote } from "@/app/api/profiles/housing/shared";

type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "canceled";

interface UpdateQuoteStatusBody {
  status?: QuoteStatus;
}

const VALID_QUOTE_STATUS: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "canceled",
];

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
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body: UpdateQuoteStatusBody = await req.json();
    const nextStatus = body.status;

    if (!nextStatus || !VALID_QUOTE_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: "Statut devis invalide" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await db
      .from("quotes")
      .select("id, status, sent_at, accepted_at, rejected_at, canceled_at")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (existingError) {
      console.error("[PATCH /api/quotes/:id/status] read error:", existingError);
      return NextResponse.json({ error: "Erreur lecture devis" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "sent" && !existing.sent_at) {
      updatePayload.sent_at = new Date().toISOString();
    }
    if (nextStatus === "accepted" && !existing.accepted_at) {
      updatePayload.accepted_at = new Date().toISOString();
    }
    if (nextStatus === "rejected" && !existing.rejected_at) {
      updatePayload.rejected_at = new Date().toISOString();
    }
    if (nextStatus === "canceled" && !existing.canceled_at) {
      updatePayload.canceled_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await db
      .from("quotes")
      .update(updatePayload)
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .select(
        "id, quote_number, status, owner_profile_id, mission_id, package_id, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, valid_until, sent_at, accepted_at, rejected_at, canceled_at, created_at, updated_at",
      )
      .single();

    if (updateError || !updated) {
      console.error("[PATCH /api/quotes/:id/status] update error:", updateError);
      return NextResponse.json({ error: "Erreur mise a jour statut devis" }, { status: 500 });
    }

    const eventType =
      nextStatus === "sent" ||
      nextStatus === "accepted" ||
      nextStatus === "rejected" ||
      nextStatus === "canceled"
        ? nextStatus
        : "status_changed";

    const { error: eventError } = await db.from("quote_events").insert({
      quote_id: id,
      actor_profile_id: userId,
      event_type: eventType,
      payload: {
        from: existing.status,
        to: nextStatus,
      },
    });
    if (eventError) {
      console.error("[PATCH /api/quotes/:id/status] event error:", eventError);
    }

    let autoHousingResult: { housingId: number; created: boolean } | null = null;
    if (nextStatus === "accepted") {
      try {
        autoHousingResult = await createHousingFromQuote(id, userId);
      } catch (autoHousingError) {
        console.error("[PATCH /api/quotes/:id/status] auto housing error:", autoHousingError);
      }
    }

    return NextResponse.json({
      ...updated,
      auto_housing: autoHousingResult,
    });
  } catch (err) {
    console.error("[PATCH /api/quotes/:id/status] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
