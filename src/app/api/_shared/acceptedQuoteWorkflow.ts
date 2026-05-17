import { insertMissionWithOptionalMetadata } from "@/app/api/_shared/missionInsert";
import type { LooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";

type DbClient = LooseSupabaseClient;

type QuoteWorkflowInput = {
  db: DbClient;
  quoteId: string;
  actorProfileId: string;
  serviceRequestId?: string | null;
  serviceRequestRecipientId?: string | null;
};

type QuoteWorkflowQuote = {
  id: string;
  quote_number?: string | null;
  concierge_profile_id?: string | null;
  owner_profile_id?: string | null;
  mission_id?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ServiceRequestWorkflowRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  property_id?: string | null;
  desired_date?: string | null;
  budget_max?: number | null;
  currency?: string | null;
  urgency?: boolean | null;
  owner_profile_id?: string | null;
  selected_concierge_profile_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

type MissionWorkflowRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  scheduled_start?: string | null;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function getMetadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildMissionTitle(request: ServiceRequestWorkflowRow | null, quote: QuoteWorkflowQuote) {
  return (
    request?.title?.trim() ||
    (quote.quote_number ? `Mission issue du devis ${quote.quote_number}` : "Mission conciergerie")
  );
}

async function findOrCreateMission(input: {
  db: DbClient;
  quote: QuoteWorkflowQuote;
  request: ServiceRequestWorkflowRow | null;
  serviceRequestId: string | null;
  serviceRequestRecipientId: string | null;
}) {
  const { db, quote, request, serviceRequestId, serviceRequestRecipientId } = input;
  const quoteMetadata = isRecord(quote.metadata) ? quote.metadata : {};
  const metadataMissionId = getMetadataString(quoteMetadata, "mission_id");
  const selectedMissionId = request?.metadata && isRecord(request.metadata)
    ? getMetadataString(request.metadata, "selected_mission_id")
    : null;
  const existingMissionId = quote.mission_id || metadataMissionId || selectedMissionId;

  if (existingMissionId) {
    const { data: existingMission } = await db
      .from("missions")
      .select("id, title, status, scheduled_start")
      .eq("id", existingMissionId)
      .maybeSingle();

    const missionRow = existingMission as MissionWorkflowRow | null;
    if (missionRow?.id) return missionRow;
  }

  if (!quote.concierge_profile_id) return null;

  const missionMetadata = {
    source: "quote_acceptance",
    quote_id: quote.id,
    quote_number: quote.quote_number ?? null,
    service_request_id: serviceRequestId,
    service_request_recipient_id: serviceRequestRecipientId,
    accepted_quote_amount: quote.total_amount ?? null,
    planning_origin: request?.desired_date ? "service_request_desired_date" : "to_schedule",
  };

  const { data, error } = await insertMissionWithOptionalMetadata<MissionWorkflowRow>(
    db as Parameters<typeof insertMissionWithOptionalMetadata<MissionWorkflowRow>>[0],
    {
      concierge_profile_id: quote.concierge_profile_id,
      owner_profile_id: quote.owner_profile_id ?? request?.owner_profile_id ?? null,
      property_id: request?.property_id ?? null,
      service_id: null,
      title: buildMissionTitle(request, quote),
      description: request?.description ?? quote.notes ?? null,
      status: "assigned",
      priority: request?.urgency ? "urgent" : "normal",
      amount: quote.total_amount ?? request?.budget_max ?? null,
      currency: quote.currency ?? request?.currency ?? "EUR",
      scheduled_start: request?.desired_date ?? null,
      scheduled_end: null,
      metadata: missionMetadata,
    },
    "id, title, status, scheduled_start",
    "id, title, status, scheduled_start",
  );

  if (error || !data) {
    console.error("[acceptedQuoteWorkflow] mission create error:", error);
    return null;
  }

  return data;
}

async function ensureDraftInvoice(input: {
  db: DbClient;
  quote: QuoteWorkflowQuote;
  missionId: string | null;
}) {
  const { db, quote, missionId } = input;
  if (!quote.concierge_profile_id) return null;

  const { data: existingInvoices, error: existingError } = await db
    .from("invoices")
    .select("id")
    .eq("quote_id", quote.id)
    .limit(1);

  if (existingError) {
    console.error("[acceptedQuoteWorkflow] invoice lookup error:", existingError);
    return null;
  }
  const invoiceRows = (existingInvoices ?? []) as Array<{ id: string }>;
  if (invoiceRows[0]?.id) return invoiceRows[0];

  const { data: quoteItems, error: quoteItemsError } = await db
    .from("quote_items")
    .select("service_id, pricing_id, label, description, quantity, unit_price, line_total, sort_order, metadata")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true });

  const sourceQuoteItems = (quoteItems ?? []) as Array<Record<string, unknown>>;
  if (quoteItemsError || sourceQuoteItems.length === 0) {
    if (quoteItemsError) console.error("[acceptedQuoteWorkflow] quote items lookup error:", quoteItemsError);
    return null;
  }

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(now.getDate() + 14);

  const { data: invoice, error: invoiceError } = await db
    .from("invoices")
    .insert({
      quote_id: quote.id,
      concierge_profile_id: quote.concierge_profile_id,
      owner_profile_id: quote.owner_profile_id ?? null,
      mission_id: missionId,
      status: "draft",
      issue_date: now.toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      currency: (quote.currency ?? "EUR").toUpperCase(),
      discount_amount: round2(Number(quote.discount_amount ?? 0)),
      tax_rate: round2(Number(quote.tax_rate ?? 0)),
      notes: quote.notes ?? `Facture brouillon générée depuis le devis ${quote.quote_number ?? quote.id}`,
      metadata: {
        source: "quote_acceptance",
        quote_id: quote.id,
        quote_number: quote.quote_number ?? null,
        mission_id: missionId,
      },
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    console.error("[acceptedQuoteWorkflow] invoice create error:", invoiceError);
    return null;
  }

  const itemsToInsert = sourceQuoteItems.map((item) => ({
    invoice_id: invoice.id,
    service_id: item.service_id ?? null,
    pricing_id: item.pricing_id ?? null,
    label: item.label,
    description: item.description ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
    sort_order: item.sort_order,
    metadata: item.metadata ?? {},
  }));

  const { error: invoiceItemsError } = await db.from("invoice_items").insert(itemsToInsert);
  if (invoiceItemsError) {
    console.error("[acceptedQuoteWorkflow] invoice items create error:", invoiceItemsError);
  }

  return invoice;
}

export async function finalizeAcceptedQuoteWorkflow(input: QuoteWorkflowInput) {
  const { db, quoteId, actorProfileId } = input;
  const { data: quote, error: quoteError } = await db
    .from("quotes")
    .select(
      "id, quote_number, concierge_profile_id, owner_profile_id, mission_id, currency, total_amount, discount_amount, tax_rate, notes, metadata",
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteError || !quote) {
    console.error("[acceptedQuoteWorkflow] quote lookup error:", quoteError);
    return { mission: null, invoice: null };
  }

  const quoteRow = quote as QuoteWorkflowQuote;
  const quoteMetadata = isRecord(quoteRow.metadata) ? quoteRow.metadata : {};
  const serviceRequestId = input.serviceRequestId ?? getMetadataString(quoteMetadata, "service_request_id");
  const serviceRequestRecipientId =
    input.serviceRequestRecipientId ?? getMetadataString(quoteMetadata, "service_request_recipient_id");

  let request: ServiceRequestWorkflowRow | null = null;
  if (serviceRequestId) {
    const { data: requestRow, error: requestError } = await db
      .from("service_requests")
      .select("*")
      .eq("id", serviceRequestId)
      .maybeSingle();

    if (requestError) {
      console.error("[acceptedQuoteWorkflow] request lookup error:", requestError);
    } else {
      request = (requestRow as ServiceRequestWorkflowRow | null) ?? null;
    }
  }

  const mission = await findOrCreateMission({
    db,
    quote: quoteRow,
    request,
    serviceRequestId,
    serviceRequestRecipientId,
  });
  const missionId = mission?.id ?? quoteRow.mission_id ?? null;
  const invoice = await ensureDraftInvoice({ db, quote: quoteRow, missionId });

  if (missionId) {
    await db.from("quotes").update({ mission_id: missionId }).eq("id", quoteId);

    if (serviceRequestId) {
      const requestMetadata = isRecord(request?.metadata) ? request?.metadata : {};
      await db
        .from("service_requests")
        .update({
          mission_id: missionId,
          selected_concierge_profile_id: quoteRow.concierge_profile_id,
          status: "accepted",
          metadata: {
            ...requestMetadata,
            selected_quote_id: quoteId,
            selected_mission_id: missionId,
            selected_at: getMetadataString(requestMetadata, "selected_at") ?? new Date().toISOString(),
          },
        })
        .eq("id", serviceRequestId);
    }

    await db.from("mission_events").insert({
      mission_id: missionId,
      actor_profile_id: actorProfileId,
      event_type: "quote_accepted",
      payload: {
        quote_id: quoteId,
        service_request_id: serviceRequestId,
        invoice_id: invoice?.id ?? null,
      },
    });
  }

  return { mission, invoice };
}
