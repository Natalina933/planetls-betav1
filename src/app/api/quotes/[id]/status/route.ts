import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
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
      .select(
        "id, status, sent_at, accepted_at, rejected_at, canceled_at, owner_profile_id, concierge_profile_id, mission_id, total_amount, currency, notes, metadata",
      )
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

    let linkedMissionId =
      typeof existing.mission_id === "string" && existing.mission_id.trim() ? existing.mission_id : null;

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

      if (!linkedMissionId) {
        let safePropertyId: string | null = null;

        if (typeof serviceRequest?.property_id === "string" && serviceRequest.property_id.trim()) {
          const { data: propertyRow, error: propertyError } = await db
            .from("properties")
            .select("id")
            .eq("id", serviceRequest.property_id)
            .eq("owner_id", serviceRequest.owner_profile_id ?? existing.owner_profile_id ?? "")
            .maybeSingle();

          if (propertyError) {
            console.error("[PATCH /api/quotes/:id/status] property lookup error:", propertyError);
          } else if (propertyRow?.id) {
            safePropertyId = propertyRow.id;
          }
        }

        const { data: missionRow, error: missionError } = await db
          .from("missions")
          .insert({
            concierge_profile_id: existing.concierge_profile_id,
            owner_profile_id: serviceRequest?.owner_profile_id ?? existing.owner_profile_id ?? null,
            property_id: safePropertyId,
            service_id: null,
            title: serviceRequest?.title ?? "Mission issue d'un devis accepte",
            description: serviceRequest?.description ?? existing.notes ?? null,
            status: "accepted",
            priority: serviceRequest?.urgency ? "urgent" : "normal",
            amount:
              typeof existing.total_amount === "number"
                ? existing.total_amount
                : serviceRequest?.budget_max ?? null,
            currency: existing.currency ?? serviceRequest?.currency ?? "EUR",
            scheduled_start: serviceRequest?.desired_date ?? null,
            scheduled_end: null,
            metadata: {
              source: "quote_acceptance",
              quote_id: existing.id,
              service_request_id: serviceRequestId,
              service_request_recipient_id: serviceRequestRecipientId,
            },
          })
          .select("id")
          .single();

        if (missionError || !missionRow) {
          console.error("[PATCH /api/quotes/:id/status] mission create error:", missionError);
          return NextResponse.json({ error: "Impossible de creer la mission liee." }, { status: 500 });
        }

        linkedMissionId = missionRow.id;

        const { error: missionEventError } = await db.from("mission_events").insert({
          mission_id: missionRow.id,
          actor_profile_id: userId,
          event_type: "created",
          payload: {
            source: "quote_acceptance",
            quote_id: existing.id,
            service_request_id: serviceRequestId,
          },
        });

        if (missionEventError) {
          console.error("[PATCH /api/quotes/:id/status] mission event error:", missionEventError);
        }
      }

      updatePayload.mission_id = linkedMissionId;

      if (serviceRequestId) {
        const requestMetadata =
          serviceRequest?.metadata && typeof serviceRequest.metadata === "object" && !Array.isArray(serviceRequest.metadata)
            ? { ...serviceRequest.metadata }
            : {};

        const { error: requestUpdateError } = await untypedDb
          .from("service_requests")
          .update({
            selected_concierge_profile_id: existing.concierge_profile_id,
            status: "accepted",
            mission_id: linkedMissionId,
            metadata: {
              ...requestMetadata,
              selected_at: new Date().toISOString(),
              selected_mission_id: linkedMissionId,
              selected_quote_id: existing.id,
            },
          })
          .eq("id", serviceRequestId);

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
