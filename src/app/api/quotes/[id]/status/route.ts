import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";
import { createHousingFromQuote } from "@/app/api/profiles/housing/shared";

const untypedDb = asLooseSupabaseClient(db);

type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "canceled";

interface UpdateQuoteStatusBody {
  status?: QuoteStatus;
  reason?: string;
}

type ServiceRequestRow = {
  id: string;
  owner_profile_id?: string | null;
  property_id?: string | null;
  title?: string | null;
  description?: string | null;
  desired_date?: string | null;
  budget_max?: number | null;
  currency?: string | null;
  urgency?: boolean | null;
  metadata?: Record<string, unknown> | null;
};

type QuoteNotificationContext = {
  quoteId: string;
  quoteNumber?: string | null;
  ownerProfileId?: string | null;
  conciergeProfileId?: string | null;
  actorProfileId: string;
  status: QuoteStatus;
  reason?: string | null;
};

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
  "provider",
  "provider_pro",
  "artisan",
  "artisan_pro",
  "owner",
  "owner_pro",
]);

const OWNER_BILLING_ROLES = new Set(["owner", "owner_pro"]);
const SERVICE_BILLING_ROLES = new Set(["concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro"]);
const OWNER_ALLOWED_STATUS = new Set<QuoteStatus>(["accepted", "rejected"]);

const cleanReason = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 500) : "";

async function notifyQuoteStatusChange(context: QuoteNotificationContext) {
  if (!context.ownerProfileId || !context.conciergeProfileId) return null;

  const subject = context.quoteNumber ? `Devis ${context.quoteNumber}` : "Suivi devis";
  const statusLabel = context.status === "accepted" ? "accepté" : context.status === "rejected" ? "refusé" : "mis à jour";
  const body =
    context.status === "rejected" && context.reason
      ? `Le devis ${context.quoteNumber ?? ""} a été refusé. Motif : ${context.reason}`.trim()
      : `Le devis ${context.quoteNumber ?? ""} a été ${statusLabel}.`.trim();

  const { data: existingConversation } = await untypedDb
    .from("contact_conversations")
    .select("id, metadata")
    .eq("owner_profile_id", context.ownerProfileId)
    .eq("concierge_profile_id", context.conciergeProfileId)
    .eq("source", "quote")
    .eq("source_reference", context.quoteId)
    .limit(1);

  let conversationId = existingConversation?.[0]?.id ?? null;

  if (!conversationId) {
    const { data: createdConversation, error: conversationError } = await untypedDb
      .from("contact_conversations")
      .insert({
        owner_profile_id: context.ownerProfileId,
        concierge_profile_id: context.conciergeProfileId,
        source: "quote",
        source_reference: context.quoteId,
        subject,
        metadata: {
          quote_id: context.quoteId,
          quote_status: context.status,
          notification_reason: "quote_status",
          last_quote_notification_at: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (conversationError) {
      console.error("[PATCH /api/quotes/:id/status] conversation create error:", conversationError);
      return null;
    }

    conversationId = createdConversation?.id ?? null;
  }

  if (!conversationId) return null;

  await untypedDb.from("contact_messages").insert({
    conversation_id: conversationId,
    sender_profile_id: context.actorProfileId,
    message_type: "text",
    body,
    metadata: {
      quote_id: context.quoteId,
      quote_status: context.status,
      quote_rejection_reason: context.reason ?? null,
      system_context: "quote_status",
    },
  });

  await untypedDb
    .from("contact_conversations")
    .update({
      metadata: {
        quote_id: context.quoteId,
        quote_status: context.status,
        notification_reason: "quote_status",
        last_quote_notification_at: new Date().toISOString(),
      },
    })
    .eq("id", conversationId);

  return conversationId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireApiRole(req, ALLOWED_BILLING_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;

    const { id } = await params;
    const body: UpdateQuoteStatusBody = await req.json();
    const nextStatus = body.status;
    const reason = cleanReason(body.reason);

    if (!nextStatus || !VALID_QUOTE_STATUS.includes(nextStatus)) {
      return NextResponse.json({ error: "Statut devis invalide" }, { status: 400 });
    }
    if (OWNER_BILLING_ROLES.has(role) && !OWNER_ALLOWED_STATUS.has(nextStatus)) {
      return NextResponse.json(
        { error: "Un proprietaire peut uniquement accepter ou refuser un devis." },
        { status: 403 },
      );
    }

    let existingQuery = db
      .from("quotes")
      .select(
        "id, status, sent_at, accepted_at, rejected_at, canceled_at, owner_profile_id, concierge_profile_id, mission_id, total_amount, currency, notes, metadata",
      )
      .eq("id", id);

    if (OWNER_BILLING_ROLES.has(role)) {
      existingQuery = existingQuery.eq("owner_profile_id", userId);
    } else if (SERVICE_BILLING_ROLES.has(role)) {
      existingQuery = existingQuery.eq("concierge_profile_id", userId);
    }

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();

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

    const actorIsOwner = OWNER_BILLING_ROLES.has(role);

    if (nextStatus === "accepted") {
      const metadata =
        existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
          ? existing.metadata
          : {};

      const serviceRequestId =
        typeof metadata.service_request_id === "string" ? metadata.service_request_id : null;
      const serviceRequestRecipientId =
        typeof metadata.service_request_recipient_id === "string"
          ? metadata.service_request_recipient_id
          : null;

      let serviceRequest: ServiceRequestRow | null = null;
      if (serviceRequestId) {
        const { data: requestRow, error: requestError } = await untypedDb
          .from("service_requests")
          .select("*")
          .eq("id", serviceRequestId)
          .maybeSingle();

        if (requestError) {
          console.error("[PATCH /api/quotes/:id/status] request lookup error:", requestError);
          return NextResponse.json({ error: "Impossible de charger la demande liee." }, { status: 500 });
        }

        serviceRequest = (requestRow as ServiceRequestRow | null) ?? null;
      }

      if (serviceRequestId) {
        const requestMetadata =
          serviceRequest?.metadata && typeof serviceRequest.metadata === "object" && !Array.isArray(serviceRequest.metadata)
            ? { ...serviceRequest.metadata }
            : {};
        delete requestMetadata.selected_mission_id;

        const { error: requestUpdateError } = await untypedDb
          .from("service_requests")
          .update({
            selected_concierge_profile_id: existing.concierge_profile_id,
            status: "accepted",
            mission_id: null,
            metadata: {
              ...requestMetadata,
              selected_at: new Date().toISOString(),
              selected_quote_id: existing.id,
            },
          })
          .eq("id", serviceRequestId)
          .eq("owner_profile_id", serviceRequest?.owner_profile_id ?? existing.owner_profile_id ?? "");

        if (requestUpdateError) {
          console.error("[PATCH /api/quotes/:id/status] request update error:", requestUpdateError);
          return NextResponse.json({ error: "Impossible de synchroniser la demande." }, { status: 500 });
        }

        if (serviceRequestRecipientId) {
          const { data: relatedRecipients, error: recipientsError } = await untypedDb
            .from("service_request_recipients")
            .select("id")
            .eq("service_request_id", serviceRequestId);

          if (recipientsError) {
            console.error("[PATCH /api/quotes/:id/status] recipients lookup error:", recipientsError);
            return NextResponse.json({ error: "Impossible de synchroniser les destinataires." }, { status: 500 });
          }

          await Promise.all(
            (relatedRecipients ?? []).map((recipient: { id: string }) =>
              untypedDb
                .from("service_request_recipients")
                .update({
                  status: recipient.id === serviceRequestRecipientId ? "selected" : "not_selected",
                  responded_at: new Date().toISOString(),
                })
                .eq("id", recipient.id),
            ),
          );
        }
      }
    }

    if (nextStatus === "rejected") {
      const metadata =
        existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
          ? existing.metadata
          : {};
      const serviceRequestRecipientId =
        typeof metadata.service_request_recipient_id === "string"
          ? metadata.service_request_recipient_id
          : null;

      if (actorIsOwner && serviceRequestRecipientId) {
        const { error: recipientUpdateError } = await untypedDb
          .from("service_request_recipients")
          .update({
            status: "declined",
            responded_at: new Date().toISOString(),
          })
          .eq("id", serviceRequestRecipientId);

        if (recipientUpdateError) {
          console.error("[PATCH /api/quotes/:id/status] recipient decline error:", recipientUpdateError);
        }
      }
    }

    let updateQuery = db
      .from("quotes")
      .update(updatePayload)
      .eq("id", id)
      .select(
        "id, quote_number, status, owner_profile_id, concierge_profile_id, mission_id, package_id, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, valid_until, sent_at, accepted_at, rejected_at, canceled_at, created_at, updated_at",
      );

    if (OWNER_BILLING_ROLES.has(role)) {
      updateQuery = updateQuery.eq("owner_profile_id", userId);
    } else if (SERVICE_BILLING_ROLES.has(role)) {
      updateQuery = updateQuery.eq("concierge_profile_id", userId);
    }

    const { data: updated, error: updateError } = await updateQuery.single();

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
        reason: nextStatus === "rejected" ? reason || null : null,
      },
    });
    if (eventError) {
      console.error("[PATCH /api/quotes/:id/status] event error:", eventError);
    }

    let autoHousingResult: { housingId: number; created: boolean } | null = null;
    if (nextStatus === "accepted") {
      try {
        autoHousingResult = await createHousingFromQuote(id, existing.concierge_profile_id);
      } catch (autoHousingError) {
        console.error("[PATCH /api/quotes/:id/status] auto housing error:", autoHousingError);
      }
    }

    if (nextStatus === "accepted" || nextStatus === "rejected") {
      await notifyQuoteStatusChange({
        quoteId: id,
        quoteNumber: updated.quote_number,
        ownerProfileId: existing.owner_profile_id,
        conciergeProfileId: existing.concierge_profile_id,
        actorProfileId: userId,
        status: nextStatus,
        reason: nextStatus === "rejected" ? reason || null : null,
      });
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
