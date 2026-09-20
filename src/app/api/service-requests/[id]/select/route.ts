import { NextRequest, NextResponse } from "next/server";
import { awardAcceptedQuote, QuoteAwardError, finalizeAcceptedQuoteWorkflow } from "@/app/api/_shared/acceptedQuoteWorkflow";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { createHousingFromQuote, validateHousingFromQuote, QuoteHousingValidationError } from "@/app/api/profiles/housing/shared";
import { upsertAcceptedHousingCollaboration } from "@/app/api/_shared/housingCollaboration";
import { db } from "@/server/db/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";

interface SelectRequestBody {
  recipient_id?: string;
  quote_id?: string;
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
    const quoteId = typeof body.quote_id === "string" ? body.quote_id.trim() : "";
    if (!quoteId) return NextResponse.json({ error: "quote_id requis." }, { status: 400 });
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
      .eq("id", quoteId)
      .eq("concierge_profile_id", selectedRecipient.concierge_profile_id)
      .eq("owner_profile_id", requestRow.owner_profile_id ?? userId);

    if (candidateQuotesError) {
      console.error("[service-requests/select] quotes lookup error:", candidateQuotesError);
      return NextResponse.json({ error: "Impossible de charger le devis lié." }, { status: 500 });
    }

    const selectedQuote =
      ((candidateQuotes ?? []) as QuoteLookupRow[]).filter((quote) => {
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
      })[0] ?? null;

    if (!selectedQuote) {
      throw new QuoteHousingValidationError("Aucun devis correspondant à cette demande et à cette concierge ne peut être sélectionné.");
    }
    const housingValidation = await validateHousingFromQuote({
          quoteId: selectedQuote.id,
          expectedOwnerProfileId: userId,
          expectedConciergeProfileId: selectedRecipient.concierge_profile_id,
          expectedRequestId: id,
          expectedRecipientId: recipientId,
        });

    await awardAcceptedQuote(db, selectedQuote.id, userId);

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

      const housingId = housingValidation?.housingId ?? null;

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
        if (housingError instanceof QuoteHousingValidationError) throw housingError;
        console.error("[service-requests/select] housing collaboration link error:", housingError);
        return NextResponse.json(
          { error: "La conciergerie est sélectionnée, mais le logement n'a pas pu être rattaché." },
          { status: 500 },
        );
      }
    }

    const { data: updatedRequest, error: updateRequestError } = await dbAny
      .from("service_requests").select("*").eq("id", id).eq("owner_profile_id", userId).single();

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
    if (error instanceof QuoteAwardError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof QuoteHousingValidationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[service-requests/select] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
