import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "canceled";

type QuoteRecord = {
  id: string;
  status: QuoteStatus;
  concierge_profile_id: string | null;
  owner_profile_id: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  canceled_at: string | null;
};

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

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);
const OWNER_ROLES = new Set(["owner", "owner_pro"]);
const QUOTE_PARTICIPANT_ROLES = new Set(["concierge", "concierge_pro", "owner", "owner_pro"]);

const CONCIERGE_ALLOWED_TRANSITIONS = new Map<QuoteStatus, QuoteStatus[]>([
  ["draft", ["sent", "canceled"]],
  ["sent", ["canceled", "expired"]],
  ["accepted", ["canceled"]],
  ["rejected", []],
  ["expired", []],
  ["canceled", []],
]);

const OWNER_ALLOWED_TRANSITIONS = new Map<QuoteStatus, QuoteStatus[]>([
  ["draft", []],
  ["sent", ["accepted", "rejected"]],
  ["accepted", []],
  ["rejected", []],
  ["expired", []],
  ["canceled", []],
]);

async function loadQuote(quoteId: string): Promise<QuoteRecord | null> {
  const { data, error } = await db
    .from("quotes")
    .select(
      "id, status, concierge_profile_id, owner_profile_id, sent_at, accepted_at, rejected_at, canceled_at",
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (error) {
    console.error("[quotes status auth] quote lookup error:", error);
    throw new Error("QUOTE_LOOKUP_FAILED");
  }

  return data as QuoteRecord | null;
}

function canTransition(role: string, currentStatus: QuoteStatus, nextStatus: QuoteStatus): boolean {
  if (role === "admin" || role === "super_admin") {
    return currentStatus !== nextStatus;
  }

  if (CONCIERGE_ROLES.has(role)) {
    return CONCIERGE_ALLOWED_TRANSITIONS.get(currentStatus)?.includes(nextStatus) ?? false;
  }

  if (OWNER_ROLES.has(role)) {
    return OWNER_ALLOWED_TRANSITIONS.get(currentStatus)?.includes(nextStatus) ?? false;
  }

  return false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "quotes status auth",
      allowedRoles: QUOTE_PARTICIPANT_ROLES,
      actionLabel: "modifier un devis",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { id } = await params;
    const body: UpdateQuoteStatusBody = await req.json();
    const nextStatus = body.status;

    if (!nextStatus || !VALID_QUOTE_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: "Statut devis invalide" }, { status: 400 });
    }

    const existing = await loadQuote(id);
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const actorRole = actorResult.actor.role;
    const isAdmin = actorResult.actor.isAdmin;
    const isConciergeOwner =
      CONCIERGE_ROLES.has(actorRole) && existing.concierge_profile_id === actorResult.actor.userId;
    const isQuoteOwner =
      OWNER_ROLES.has(actorRole) && existing.owner_profile_id === actorResult.actor.userId;

    if (!isAdmin && !isConciergeOwner && !isQuoteOwner) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce devis." },
        { status: 403 },
      );
    }

    if (!canTransition(actorRole, existing.status, nextStatus)) {
      return NextResponse.json(
        {
          error: `La transition '${existing.status}' -> '${nextStatus}' n'est pas autorisée pour votre rôle.`,
        },
        { status: 403 },
      );
    }

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

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
      .select(
        "id, quote_number, status, owner_profile_id, concierge_profile_id, mission_id, package_id, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, valid_until, sent_at, accepted_at, rejected_at, canceled_at, created_at, updated_at",
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
      actor_profile_id: actorResult.actor.userId,
      event_type: eventType,
      payload: {
        from: existing.status,
        to: nextStatus,
        actor_role: actorRole,
      },
    });

    if (eventError) {
      console.error("[PATCH /api/quotes/:id/status] event error:", eventError);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/quotes/:id/status] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
