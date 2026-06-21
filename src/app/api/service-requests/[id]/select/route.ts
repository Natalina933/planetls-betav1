import { NextRequest, NextResponse } from "next/server";
import { finalizeAcceptedQuoteWorkflow } from "@/app/api/_shared/acceptedQuoteWorkflow";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { createHousingFromQuote } from "@/app/api/profiles/housing/shared";
import { upsertAcceptedHousingCollaboration } from "@/app/api/_shared/housingCollaboration";
import { db } from "@/server/db/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

interface SelectRequestBody {
  recipient_id?: string;
}

type QuoteLookupRow = {
  id: string;
  status?: string | null;
  mission_id?: string | null;
  accepted_at?: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireApiRole(req, OWNER_ROLES);
    if (!guard.ok) return guard.response;
    const { userId } = guard.auth;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 400 });
    }

    const body = (await req.json()) as SelectRequestBody;
    const recipientId = typeof body.recipient_id === "string" ? body.recipient_id.trim() : "";
    if (!recipientId) {
      return NextResponse.json({ error: "recipient_id requis." }, { status: 400 });
    }

    const dbAny = asLooseSupabaseClient(db);

    const { data: requestRow, error: requestError } = await dbAny
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .eq("owner_profile_id", userId)
      .maybeSingle();

    if (requestError) {
      console.error("[service-requests/select] request error:", requestError);
      return NextResponse.json({ error: "Impossible de charger la demande." }, { status: 500 });
    }
    if (!requestRow) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    const { data: recipients, error: recipientsError } = await dbAny
      .from("service_request_recipients")
      .select("*")
      .eq("service_request_id", id);

    if (recipientsError) {
      console.error("[service-requests/select] recipients error:", recipientsError);
      return NextResponse.json({ error: "Impossible de charger les destinataires." }, { status: 500 });
    }

    const recipientRows = Array.isArray(recipients) ? recipients : [];
    const selectedRecipient = recipientRows.find((recipient: { id?: string }) => recipient.id === recipientId);

    if (!selectedRecipient) {
      return NextResponse.json({ error: "Destinataire introuvable pour cette demande." }, { status: 404 });
    }

    if (
      typeof selectedRecipient.concierge_profile_id !== "string" ||
      !selectedRecipient.concierge_profile_id.trim()
    ) {
      return NextResponse.json(
        { error: "Impossible de sélectionner ce concierge car son profil est incomplet." },
        { status: 400 },
      );
    }

    const { data: candidateQuotes, error: candidateQuotesError } = await dbAny
      .from("quotes")
      .select("id, status, mission_id, accepted_at, service_request_id, service_request_recipient_id, metadata")
      .eq("concierge_profile_id", selectedRecipient.concierge_profile_id)
      .eq("owner_profile_id", requestRow.owner_profile_id ?? userId);

    if (candidateQuotesError) {
      console.error("[service-requests/select] quotes lookup error:", candidateQuotesError);
      return NextResponse.json({ error: "Impossible de charger le devis lié." }, { status: 500 });
    }

    const selectedQuote =
      ((candidateQuotes ?? []) as QuoteLookupRow[]).find((quote) => {
        const metadata = isRecord(quote.metadata) ? quote.metadata : null;
        const quoteRequestId =
          typeof quote.service_request_id === "string" ? quote.service_request_id : metadata?.service_request_id;
        const quoteRecipientId =
          typeof quote.service_request_recipient_id === "string"
            ? quote.service_request_recipient_id
            : metadata?.service_request_recipient_id;
        return (
          quoteRequestId === requestRow.id &&
          quoteRecipientId === selectedRecipient.id
        );
      }) ?? null;

    const recipientStatuses = new Map<string, string>();
    recipientRows.forEach((recipient: { id: string }) => {
      recipientStatuses.set(recipient.id, recipient.id === recipientId ? "selected" : "not_selected");
    });

    await Promise.all(
      recipientRows.map((recipient: { id: string }) =>
        dbAny
          .from("service_request_recipients")
          .update({
            status: recipientStatuses.get(recipient.id),
            responded_at: new Date().toISOString(),
          })
          .eq("id", recipient.id),
      ),
    );

    const nextMetadata = isRecord(requestRow.metadata) ? { ...requestRow.metadata } : {};
    delete nextMetadata.selected_mission_id;

    if (selectedQuote?.id) {
      const quoteUpdatePayload: Record<string, unknown> = {};

      if (selectedQuote.status !== "accepted") {
        quoteUpdatePayload.status = "accepted";
      }

      if (!selectedQuote.accepted_at) {
        quoteUpdatePayload.accepted_at = new Date().toISOString();
      }

      const { error: quoteUpdateError } = await db
        .from("quotes")
        .update(quoteUpdatePayload)
        .eq("id", selectedQuote.id)
        .eq("owner_profile_id", requestRow.owner_profile_id ?? userId)
        .eq("concierge_profile_id", selectedRecipient.concierge_profile_id);

      if (quoteUpdateError) {
        console.error("[service-requests/select] quote update error:", quoteUpdateError);
        return NextResponse.json({ error: "Impossible de valider le devis lié." }, { status: 500 });
      }

      const { error: quoteEventError } = await db.from("quote_events").insert({
        quote_id: selectedQuote.id,
        actor_profile_id: userId,
        event_type: "accepted",
        payload: {
          source: "service_request_selection",
          service_request_id: requestRow.id,
          service_request_recipient_id: selectedRecipient.id,
        },
      });

      if (quoteEventError) {
        console.error("[service-requests/select] quote event error:", quoteEventError);
      }
    }

    const updatedMetadata = {
      ...nextMetadata,
      selected_at: new Date().toISOString(),
      selected_recipient_id: selectedRecipient.id,
      selected_quote_id: selectedQuote?.id ?? null,
    };

    let acceptedWorkflow: Awaited<ReturnType<typeof finalizeAcceptedQuoteWorkflow>> | null = null;
    let autoHousing: { housingId: number; created: boolean; linkedExisting?: boolean } | null = null;
    if (selectedQuote?.id) {
      acceptedWorkflow = await finalizeAcceptedQuoteWorkflow({
        db: dbAny,
        quoteId: selectedQuote.id,
        actorProfileId: userId,
        serviceRequestId: requestRow.id,
        serviceRequestRecipientId: selectedRecipient.id,
      });

      const metadata = isRecord(requestRow.metadata) ? requestRow.metadata : {};
      const requestedHousingId = metadata.property_housing_id;
      const housingId =
        typeof requestedHousingId === "string" && requestedHousingId.trim()
          ? requestedHousingId.trim()
          : typeof requestedHousingId === "number" && Number.isFinite(requestedHousingId)
            ? requestedHousingId
            : null;

      try {
        autoHousing = await createHousingFromQuote(
          selectedQuote.id,
          selectedRecipient.concierge_profile_id,
          housingId,
        );
        try {
          await upsertAcceptedHousingCollaboration({
            db: dbAny,
            housingId: autoHousing.housingId,
            ownerProfileId: requestRow.owner_profile_id ?? userId,
            conciergeProfileId: selectedRecipient.concierge_profile_id,
            quoteId: selectedQuote.id,
            missionId: acceptedWorkflow?.mission?.id ?? selectedQuote.mission_id ?? null,
            request: requestRow,
          });
        } catch (collaborationError) {
          console.error("[service-requests/select] collaboration record error:", collaborationError);
        }
      } catch (housingError) {
        console.error("[service-requests/select] housing collaboration link error:", housingError);
        return NextResponse.json(
          { error: "La conciergerie est sélectionnée, mais le logement n'a pas pu être rattaché." },
          { status: 500 },
        );
      }
    }

    const { data: updatedRequest, error: updateRequestError } = await dbAny
      .from("service_requests")
      .update({
        selected_concierge_profile_id: selectedRecipient.concierge_profile_id,
        status: "quote_accepted",
        mission_id: acceptedWorkflow?.mission?.id ?? selectedQuote?.mission_id ?? null,
        metadata: {
          ...updatedMetadata,
          selected_mission_id: acceptedWorkflow?.mission?.id ?? selectedQuote?.mission_id ?? null,
          accepted_invoice_id: acceptedWorkflow?.invoice?.id ?? null,
        },
      })
      .eq("id", id)
      .eq("owner_profile_id", userId)
      .select("*")
      .single();

    if (updateRequestError || !updatedRequest) {
      console.error("[service-requests/select] request update error:", updateRequestError);
      return NextResponse.json({ error: "Impossible de finaliser la sélection." }, { status: 500 });
    }

    return NextResponse.json(
      {
        request: updatedRequest,
        selected_recipient_id: selectedRecipient.id,
        accepted_workflow: {
          mission_id: acceptedWorkflow?.mission?.id ?? selectedQuote?.mission_id ?? null,
          invoice_id: acceptedWorkflow?.invoice?.id ?? null,
        },
        auto_housing: autoHousing,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[service-requests/select] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
