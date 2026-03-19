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
  quote_number: string | null;
  status: QuoteStatus;
  concierge_profile_id: string | null;
  owner_profile_id: string | null;
  mission_id: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  canceled_at: string | null;
};

type MissionSchedulingRow = {
  id: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata: Record<string, unknown> | null;
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

// Legacy typing does not include the new RPC/notification table in this repo snapshot.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function buildPlanningFallbackWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 90);

  return {
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString(),
  };
}

async function ensureMissionScheduled(missionId: string | null | undefined): Promise<void> {
  if (!missionId) return;

  const { data: mission, error: missionError } = await db
    .from("missions")
    .select("id, scheduled_start, scheduled_end, metadata")
    .eq("id", missionId)
    .maybeSingle();

  if (missionError) {
    console.error("[PATCH /api/quotes/:id/status] mission lookup error:", missionError);
    return;
  }
  if (!mission) return;

  const typedMission = mission as MissionSchedulingRow;
  if (typedMission.scheduled_start) return;

  const fallbackWindow = buildPlanningFallbackWindow();
  const nextMetadata = {
    ...(typedMission.metadata ?? {}),
    planning_auto_scheduled: true,
    planning_auto_scheduled_at: new Date().toISOString(),
    planning_auto_schedule_source: "quote_acceptance_fallback",
  };

  const { error: scheduleError } = await db
    .from("missions")
    .update({
      scheduled_start: fallbackWindow.scheduled_start,
      scheduled_end: typedMission.scheduled_end ?? fallbackWindow.scheduled_end,
      metadata: nextMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", missionId);

  if (scheduleError) {
    console.error("[PATCH /api/quotes/:id/status] mission scheduling fallback error:", scheduleError);
  }
}

async function loadQuote(quoteId: string): Promise<QuoteRecord | null> {
  const { data, error } = await db
    .from("quotes")
    .select(
      "id, quote_number, status, concierge_profile_id, owner_profile_id, mission_id, sent_at, accepted_at, rejected_at, canceled_at",
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (error) {
    console.error("[quotes status auth] quote lookup error:", error);
    throw new Error("QUOTE_LOOKUP_FAILED");
  }

  return data as QuoteRecord | null;
}

async function createQuoteStatusNotifications(params: {
  quote: QuoteRecord;
  actorProfileId: string;
  actorRole: string;
  nextStatus: QuoteStatus;
  missionId?: string | null;
}) {
  try {
    const { quote, actorProfileId, actorRole, nextStatus, missionId } = params;
    const inserts: Array<Record<string, unknown>> = [];

    if (nextStatus === "sent" && quote.owner_profile_id) {
      inserts.push({
        recipient_profile_id: quote.owner_profile_id,
        actor_profile_id: actorProfileId,
        notification_type: "quote_received",
        title: `Nouveau devis ${quote.quote_number ?? ""}`.trim(),
        body: "Un concierge vous a envoye un devis a consulter.",
        entity_type: "quote",
        entity_id: quote.id,
        action_url: "/dashboard/owner/devis",
        metadata: {
          quote_id: quote.id,
          quote_number: quote.quote_number,
          status: nextStatus,
        },
      });
    }

    if (nextStatus === "rejected" && quote.concierge_profile_id) {
      inserts.push({
        recipient_profile_id: quote.concierge_profile_id,
        actor_profile_id: actorProfileId,
        notification_type: "quote_rejected",
        title: `Devis ${quote.quote_number ?? ""} refuse`.trim(),
        body: "Le proprietaire a refuse ce devis.",
        entity_type: "quote",
        entity_id: quote.id,
        action_url: "/dashboard/concierge/billing",
        metadata: {
          quote_id: quote.id,
          quote_number: quote.quote_number,
          status: nextStatus,
        },
      });
    }

    if ((nextStatus === "canceled" || nextStatus === "expired") && quote.owner_profile_id) {
      inserts.push({
        recipient_profile_id: quote.owner_profile_id,
        actor_profile_id: actorProfileId,
        notification_type: nextStatus === "canceled" ? "quote_canceled" : "quote_expired",
        title:
          nextStatus === "canceled"
            ? `Devis ${quote.quote_number ?? ""} annule`.trim()
            : `Devis ${quote.quote_number ?? ""} expire`.trim(),
        body:
          nextStatus === "canceled"
            ? "Ce devis n'est plus disponible."
            : "La periode de validite de ce devis est terminee.",
        entity_type: "quote",
        entity_id: quote.id,
        action_url: "/dashboard/owner/devis",
        metadata: {
          quote_id: quote.id,
          quote_number: quote.quote_number,
          status: nextStatus,
          mission_id: missionId ?? null,
          actor_role: actorRole,
        },
      });
    }

    if (inserts.length === 0) return;
    await dbAny.from("workflow_notifications").insert(inserts);
  } catch (notificationError) {
    console.error("[PATCH /api/quotes/:id/status] notification error:", notificationError);
  }
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

    if (nextStatus === "accepted") {
      const { data: workflowResult, error: workflowError } = await dbAny.rpc(
        "accept_quote_and_create_mission",
        {
          p_quote_id: id,
          p_actor_profile_id: actorResult.actor.userId,
        },
      );

      if (workflowError) {
        console.error("[PATCH /api/quotes/:id/status] workflow error:", workflowError);

        const message = typeof workflowError?.message === "string" ? workflowError.message : "";
        if (message.includes("QUOTE_NOT_FOUND")) {
          return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
        }
        if (message.includes("QUOTE_STATUS_INVALID")) {
          return NextResponse.json(
            { error: "Ce devis n'est plus dans un etat compatible avec une acceptation." },
            { status: 409 },
          );
        }

        return NextResponse.json(
          { error: "Impossible de finaliser l'acceptation du devis." },
          { status: 500 },
        );
      }

      const { data: updatedAfterWorkflow, error: updatedAfterWorkflowError } = await db
        .from("quotes")
        .select(
          "id, quote_number, status, owner_profile_id, concierge_profile_id, mission_id, package_id, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, valid_until, sent_at, accepted_at, rejected_at, canceled_at, created_at, updated_at",
        )
        .eq("id", id)
        .single();

      await ensureMissionScheduled(
        updatedAfterWorkflow?.mission_id ??
          (workflowResult &&
          typeof workflowResult === "object" &&
          "mission_id" in workflowResult &&
          typeof workflowResult.mission_id === "string"
            ? workflowResult.mission_id
            : null),
      );

      if (updatedAfterWorkflowError || !updatedAfterWorkflow) {
        console.error(
          "[PATCH /api/quotes/:id/status] hydrate after workflow error:",
          updatedAfterWorkflowError,
        );
        return NextResponse.json(
          {
            id,
            status: "accepted",
            workflow: workflowResult ?? null,
          },
          { status: 200 },
        );
      }

      return NextResponse.json({
        ...updatedAfterWorkflow,
        workflow: workflowResult ?? null,
      });
    }

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "sent" && !existing.sent_at) {
      updatePayload.sent_at = new Date().toISOString();
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

    await createQuoteStatusNotifications({
      quote: {
        ...existing,
        mission_id: updated.mission_id ?? existing.mission_id,
        quote_number: updated.quote_number ?? existing.quote_number,
      },
      actorProfileId: actorResult.actor.userId,
      actorRole,
      nextStatus,
      missionId: updated.mission_id ?? existing.mission_id,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/quotes/:id/status] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
