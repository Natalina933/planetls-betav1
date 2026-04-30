import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/dbServer";
import { getApiAuthContext } from "@/server/auth/apiAuth";
import { prepareQuoteDraftFromRequest } from "@/features/concierge-commercial/server/quoteDraftFromRequest";
import {
  deriveServiceRequestStatus,
  type ServiceRequestRecipientStatus,
} from "@/server/service-requests/workflow";

type QuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  owner_profile_id: string | null;
  concierge_profile_id: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

const CONCIERGE_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type PrepareQuoteBody = {
  force?: boolean;
};

type UntypedDb = {
  from: (table: string) => ReturnType<typeof db.from>;
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body: PrepareQuoteBody = await req.json().catch(() => ({}));
    const forceRefresh = body?.force === true;

    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!CONCIERGE_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Recipient introuvable." }, { status: 400 });
    }

    const dbAny = db as unknown as UntypedDb;

    const { data: recipient, error: recipientError } = await dbAny
      .from("service_request_recipients")
      .select("id, service_request_id, concierge_profile_id, status")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (recipientError) {
      console.error("[prepare-quote] recipient error:", recipientError);
      return NextResponse.json({ error: "Impossible de charger ce destinataire." }, { status: 500 });
    }
    if (!recipient) {
      return NextResponse.json({ error: "Destinataire introuvable." }, { status: 404 });
    }
    if (recipient.status === "declined" || recipient.status === "not_selected") {
      return NextResponse.json(
        { error: "Cette demande n'est plus eligible a la preparation d'un devis." },
        { status: 400 },
      );
    }

    const { data: serviceRequest, error: serviceRequestError } = await dbAny
      .from("service_requests")
      .select("id, owner_profile_id, title, description, budget_max, currency, desired_date, requested_services")
      .eq("id", recipient.service_request_id)
      .maybeSingle();

    if (serviceRequestError) {
      console.error("[prepare-quote] service request error:", serviceRequestError);
      return NextResponse.json({ error: "Impossible de charger la demande." }, { status: 500 });
    }
    if (!serviceRequest) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }
    if (!serviceRequest.owner_profile_id) {
      return NextResponse.json({ error: "Proprietaire introuvable pour cette demande." }, { status: 400 });
    }

    const { data: existingQuotes, error: existingQuotesError } = await dbAny
      .from("quotes")
      .select("id, quote_number, status, owner_profile_id, concierge_profile_id, created_at, metadata")
      .eq("concierge_profile_id", userId)
      .eq("owner_profile_id", serviceRequest.owner_profile_id);

    if (existingQuotesError) {
      console.error("[prepare-quote] existing quotes error:", existingQuotesError);
      if (MISSING_TABLE_CODES.has(existingQuotesError.code ?? "")) {
        return NextResponse.json(
          {
            error:
              "Module devis non active: executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.",
            feature_disabled: true,
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Impossible de verifier les devis existants." }, { status: 500 });
    }

    const matchedQuote = ((existingQuotes ?? []) as QuoteRow[])
      .filter((quote) => {
        const metadata = isRecord(quote.metadata) ? quote.metadata : null;
        return (
          metadata?.service_request_id === serviceRequest.id &&
          metadata?.service_request_recipient_id === recipient.id
        );
      })
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })[0];

    const preparedDraft = await prepareQuoteDraftFromRequest(userId, serviceRequest);

    if (matchedQuote && !forceRefresh) {
      return NextResponse.json(
        {
          quote: matchedQuote,
          reused: true,
        },
        { status: 200 },
      );
    }

    const { data: conciergeBranding } = await db
      .from("profiles")
      .select(
        "company_name, legal_form, first_name, last_name, email, phone, street_address, postal_code, city, country, siret, vat_number",
      )
      .eq("id", userId)
      .maybeSingle();

    if (matchedQuote && forceRefresh && matchedQuote.status === "draft") {
      const { error: refreshQuoteError } = await db
        .from("quotes")
        .update({
          package_id: preparedDraft.packageId,
          currency: preparedDraft.currency,
          valid_until: preparedDraft.validUntil,
          notes: preparedDraft.notes,
          metadata: {
            source: "service_request",
            service_request_id: serviceRequest.id,
            service_request_recipient_id: recipient.id,
            requested_services: preparedDraft.requestedServices,
            auto_match_summary: preparedDraft.summary,
            branding_snapshot: conciergeBranding ?? null,
          },
        })
        .eq("id", matchedQuote.id)
        .eq("concierge_profile_id", userId);

      if (refreshQuoteError) {
        console.error("[prepare-quote] refresh quote error:", refreshQuoteError);
        return NextResponse.json({ error: "Impossible de relancer ce devis." }, { status: 500 });
      }

      const { error: deleteItemsError } = await db.from("quote_items").delete().eq("quote_id", matchedQuote.id);
      if (deleteItemsError) {
        console.error("[prepare-quote] delete refreshed items error:", deleteItemsError);
        return NextResponse.json({ error: "Impossible de reinitialiser les lignes du devis." }, { status: 500 });
      }

      const { error: refreshedItemsError } = await db.from("quote_items").insert(
        preparedDraft.items.map((item) => ({
          quote_id: matchedQuote.id,
          service_id: item.service_id,
          pricing_id: item.pricing_id,
          label: item.label,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          sort_order: item.sort_order,
          metadata: {
            ...item.metadata,
            service_request_recipient_id: recipient.id,
          },
        })),
      );

      if (refreshedItemsError) {
        console.error("[prepare-quote] refreshed items error:", refreshedItemsError);
        return NextResponse.json({ error: "Impossible de reconstruire les lignes du devis." }, { status: 500 });
      }

      await db.from("quote_events").insert({
        quote_id: matchedQuote.id,
        actor_profile_id: userId,
        event_type: "edited",
        payload: {
          source: "service_request",
          action: "refresh_from_request",
          service_request_id: serviceRequest.id,
          service_request_recipient_id: recipient.id,
        },
      });

      const { data: refreshedQuote } = await db
        .from("quotes")
        .select("id, quote_number, status, created_at")
        .eq("id", matchedQuote.id)
        .single();

      return NextResponse.json(
        {
          quote: refreshedQuote ?? matchedQuote,
          reused: false,
          refreshed: true,
          summary: preparedDraft.summary,
        },
        { status: 200 },
      );
    }

    const { data: createdQuote, error: quoteError } = await db
      .from("quotes")
      .insert({
        concierge_profile_id: userId,
        owner_profile_id: serviceRequest.owner_profile_id,
        mission_id: null,
        package_id: preparedDraft.packageId,
        status: "draft",
        currency: preparedDraft.currency,
        discount_amount: 0,
        tax_rate: 0,
        valid_until: preparedDraft.validUntil,
        notes: preparedDraft.notes,
        metadata: {
          source: "service_request",
          service_request_id: serviceRequest.id,
          service_request_recipient_id: recipient.id,
          requested_services: preparedDraft.requestedServices,
          auto_match_summary: preparedDraft.summary,
          branding_snapshot: conciergeBranding ?? null,
        },
      })
      .select("id, quote_number, status, created_at")
      .single();

    if (quoteError || !createdQuote) {
      console.error("[prepare-quote] create quote error:", quoteError);
      if (MISSING_TABLE_CODES.has(quoteError?.code ?? "")) {
        return NextResponse.json(
          {
            error:
              "Module devis non active: executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.",
            feature_disabled: true,
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Impossible de creer le devis." }, { status: 500 });
    }

    const { error: itemError } = await db.from("quote_items").insert(
      preparedDraft.items.map((item) => ({
        quote_id: createdQuote.id,
        service_id: item.service_id,
        pricing_id: item.pricing_id,
        label: item.label,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        sort_order: item.sort_order,
        metadata: {
          ...item.metadata,
          service_request_recipient_id: recipient.id,
        },
      })),
    );

    if (itemError) {
      console.error("[prepare-quote] create quote item error:", itemError);
      await db.from("quotes").delete().eq("id", createdQuote.id);
      return NextResponse.json({ error: "Impossible de creer la ligne de devis." }, { status: 500 });
    }

    const { error: eventError } = await db.from("quote_events").insert({
      quote_id: createdQuote.id,
      actor_profile_id: userId,
      event_type: "created",
      payload: {
        source: "service_request",
        service_request_id: serviceRequest.id,
        service_request_recipient_id: recipient.id,
      },
    });

    if (eventError) {
      console.error("[prepare-quote] quote event error:", eventError);
    }

    await dbAny
      .from("service_request_recipients")
      .update({
        status: "quoted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", recipient.id);

    const { data: relatedRecipients } = await dbAny
      .from("service_request_recipients")
      .select("status")
      .eq("service_request_id", serviceRequest.id);

    const nextRequestStatus = deriveServiceRequestStatus(
      Array.isArray(relatedRecipients)
        ? relatedRecipients
            .map((row: { status?: string | null }) => row.status)
            .filter((status): status is ServiceRequestRecipientStatus => typeof status === "string")
        : [],
      null,
    );

    await dbAny.from("service_requests").update({ status: nextRequestStatus }).eq("id", serviceRequest.id);

    return NextResponse.json(
      {
        quote: createdQuote,
        reused: false,
        summary: preparedDraft.summary,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[prepare-quote] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
