import { insertMissionWithOptionalMetadata } from "./missionInsert.ts";
import { readStayContext } from "./stayServiceRequestContext.ts";
import type { LooseSupabaseClient } from "./untypedSupabase.ts";
import { getStayNeedForServiceSlug } from "./stayNeeds.ts";
import { agreedServiceSlugs, isContinuousCollaboration } from "./continuousCollaboration.ts";
import { commercialObjectId } from "../../../features/concierge-commercial/server/requestCommercialGuard.ts";
import { PLANETLS_SERVICE_TARGET } from "../../lib/planetlsServiceCatalogTarget.ts";
import { stayOperationTiming } from "./stayOperationTiming.ts";
import {
  getGuestCheckinCheckoutModeFromMetadata,
  getGuestCheckinCheckoutModeLabel,
  getGuestCheckinCheckoutOperationalSlugs,
  GUEST_CHECKIN_CHECKOUT_BUNDLE,
} from "../../lib/guestCheckinCheckout.ts";

type DbClient = LooseSupabaseClient;

export class QuoteAwardError extends Error {
  status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

/** Shared transactional attribution, before either route creates business objects. */
export async function awardAcceptedQuote(
  db: { rpc: (name: "award_service_request_quote", args: { p_quote_id: string; p_actor_id: string }) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }> },
  quoteId: string,
  actorId: string,
): Promise<ServiceRequestWorkflowRow | null> {
  const { data, error } = await db.rpc("award_service_request_quote", { p_quote_id: quoteId, p_actor_id: actorId });
  if (error) throw new QuoteAwardError(error.message, error.code === "42501" ? 403 : error.code === "40001" ? 409 : 500);
  return data as ServiceRequestWorkflowRow | null;
}

type QuoteWorkflowInput = {
  db: DbClient;
  quoteId: string;
  actorProfileId: string;
  serviceRequestId?: string | null;
  serviceRequestRecipientId?: string | null;
};

type QuoteWorkflowQuote = {
  id: string;
  status?: string | null;
  quote_number?: string | null;
  concierge_profile_id?: string | null;
  owner_profile_id?: string | null;
  mission_id?: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
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
  mission_id?: string | null;
  reservation_id?: string | null;
  stay_need?: string | null;
  requested_services?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

type MissionWorkflowRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  scheduled_start?: string | null;
  reservation_id?: string | null;
  metadata?: unknown;
};

type MissionSet = {
  mission: MissionWorkflowRow | null;
  missions: MissionWorkflowRow[];
};
type ReservationOperationSchedule = {
  check_in_at?: string | null;
  check_out_at?: string | null;
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
}): Promise<MissionSet | null> {
  const { db, quote, request, serviceRequestId, serviceRequestRecipientId } = input;
  const quoteMetadata = isRecord(quote.metadata) ? quote.metadata : {};
  const checkinCheckoutMode = getGuestCheckinCheckoutModeFromMetadata(
    request?.metadata,
  );
  const metadataMissionId = getMetadataString(quoteMetadata, "mission_id");
  const selectedMissionId = request?.metadata && isRecord(request.metadata)
    ? getMetadataString(request.metadata, "selected_mission_id")
    : null;
  const existingMissionId = quote.mission_id || metadataMissionId || selectedMissionId;

  const services = request ? agreedServiceSlugs(request) : [];
  if (services.length) {
    if (services.some(slug => PLANETLS_SERVICE_TARGET.find(service => service.slug === slug)?.kind !== "service")) {
      throw new QuoteAwardError("Les catégories doivent être précisées en prestations avant la création des interventions.");
    }
    if (!quote.concierge_profile_id) throw new Error("Concierge du devis absent.");
    const { data: previous, error: previousError } = await db.from("missions")
      .select("id,title,status,scheduled_start,reservation_id,metadata")
      .eq("concierge_profile_id", quote.concierge_profile_id)
      .eq("owner_profile_id", quote.owner_profile_id)
      .contains("metadata", { quote_id: quote.id });
    if (previousError) throw previousError;
    const existing = (previous ?? []) as MissionWorkflowRow[];
    if (existingMissionId && !existing.some(row => row.id === existingMissionId)) {
      const legacyResult = await db.from("missions").select("id,title,status,scheduled_start,reservation_id,metadata")
        .eq("id", existingMissionId).eq("owner_profile_id", quote.owner_profile_id)
        .eq("concierge_profile_id", quote.concierge_profile_id).maybeSingle();
      if (legacyResult.error || !legacyResult.data) throw new Error("Mission déjà liée au devis indisponible.");
      existing.push(legacyResult.data as MissionWorkflowRow);
    }
    let schedule: ReservationOperationSchedule | null = null;
    if (request?.reservation_id) {
      const result = await db.from("reservations").select("check_in_at,check_out_at")
        .eq("id", request.reservation_id).eq("owner_profile_id", request.owner_profile_id).maybeSingle();
      if (result.error || !result.data) throw new Error("Dates du séjour indisponibles.");
      schedule = result.data as ReservationOperationSchedule;
    }
    const missions: MissionWorkflowRow[] = [];
    for (const [index, slug] of services.entries()) {
      const need = getStayNeedForServiceSlug(slug);
      const operationKey = `${quote.id}:${slug}`;
      const match = existing.find(row => {
        const meta = isRecord(row.metadata) ? row.metadata : {};
        return meta.quote_operation_key === operationKey || meta.operational_service_slug === slug
          || (need && meta.stay_need === need);
      });
      // Preserve legacy primary IDs; never repurpose a grouped operation.
      const legacy = index === 0 && existingMissionId
        ? existing.find(row => row.id === existingMissionId && (!isRecord(row.metadata)
          || (!row.metadata.operational_service_slug && !row.metadata.stay_need))) : null;
      if (match || legacy) { missions.push((match ?? legacy)!); continue; }
      const id = commercialObjectId(`quote-operation:${operationKey}`);
      const label = PLANETLS_SERVICE_TARGET.find(service => service.slug === slug)?.label ?? slug;
      const timing = schedule ? stayOperationTiming(schedule, need) : null;
      const reservationStart = timing?.start;
      const start = reservationStart ?? (services.length === 1 ? request?.desired_date : null) ?? null;
      const { data, error } = await db.from("missions").insert({
        id, concierge_profile_id: quote.concierge_profile_id,
        owner_profile_id: quote.owner_profile_id, property_id: request?.property_id ?? null,
        ...(request?.reservation_id ? { reservation_id: request.reservation_id } : {}),
        title: `${buildMissionTitle(request, quote)} — ${label}`,
        description: request?.description ?? quote.notes ?? null,
        status: reservationStart ? "scheduled" : start ? "date_requested" : "to_schedule",
        priority: request?.urgency ? "urgent" : "normal", amount: null,
        currency: quote.currency ?? request?.currency ?? "EUR",
        scheduled_start: start,
        scheduled_end: timing?.end ?? null,
        metadata: { source: "quote_acceptance", quote_id: quote.id, service_request_id: serviceRequestId,
          service_request_recipient_id: serviceRequestRecipientId, quote_operation_key: operationKey,
          operational_service_slug: slug, stay_need: need, assigned_profile_id: quote.concierge_profile_id,
          ...(checkinCheckoutMode && (need === "checkin" || need === "checkout") ? {
            guest_checkin_checkout_operation_key: `${serviceRequestId ?? quote.id}:${quote.id}:guest_checkin_checkout:${need}`,
            guest_checkin_checkout_group_key: `${serviceRequestId ?? quote.id}:${quote.id}:guest_checkin_checkout`,
            commercial_service: GUEST_CHECKIN_CHECKOUT_BUNDLE,
            service_modalities: { guest_checkin_checkout: checkinCheckoutMode },
            contract_service_code: need === "checkin" ? "CHECK_IN" : "CHECK_OUT",
          } : {}),
          payment_plan: quoteMetadata.payment_plan ?? null, deposit_required: quoteMetadata.deposit_required ?? null,
          deposit_amount: quoteMetadata.deposit_amount ?? null, deposit_percent: quoteMetadata.deposit_percent ?? null,
          ...(request?.reservation_id ? { reservation_id: request.reservation_id } : {}),
        },
      }).select("id,title,status,scheduled_start,reservation_id,metadata").single();
      if (error) {
        if (error.code !== "23505") throw error;
        const retry = await db.from("missions").select("id,title,status,scheduled_start,reservation_id,metadata").eq("id", id).single();
        if (retry.error || !retry.data) throw retry.error ?? new Error("Intervention introuvable après conflit.");
        missions.push(retry.data as MissionWorkflowRow);
      } else if (data) missions.push(data as MissionWorkflowRow);
      else throw new Error("Intervention non persistée.");
    }
    return { mission: missions.find(row => row.id === existingMissionId) ?? missions[0] ?? null, missions };
  }

  if (existingMissionId && !checkinCheckoutMode) {
    const { data: existingMission } = await db
      .from("missions")
      .select("id, title, status, scheduled_start")
      .eq("id", existingMissionId)
      .maybeSingle();

    const missionRow = existingMission as MissionWorkflowRow | null;
    if (missionRow?.id) return { mission: missionRow, missions: [missionRow] };
  }

  if (checkinCheckoutMode) {
    if (!quote.concierge_profile_id) return null;
    const groupKey = `${serviceRequestId ?? quote.id}:${quote.id}:guest_checkin_checkout`;
    const reservationId = request?.reservation_id ?? null;
    let reservationSchedule: ReservationOperationSchedule | null = null;

    if (reservationId) {
      const { data, error } = await db
        .from("reservations")
        .select("check_in_at, check_out_at")
        .eq("id", reservationId)
        .maybeSingle();
      if (error) {
        console.error("[acceptedQuoteWorkflow] reservation schedule lookup error:", error);
        return null;
      }
      reservationSchedule = data as ReservationOperationSchedule | null;
    }

    const operations = getGuestCheckinCheckoutOperationalSlugs(
      checkinCheckoutMode,
    )
      .map((slug) => ({ slug, need: getStayNeedForServiceSlug(slug) }))
      .filter(
        (operation): operation is { slug: string; need: "checkin" | "checkout" } =>
          operation.need === "checkin" || operation.need === "checkout",
      );
    const missions: MissionWorkflowRow[] = [];
    for (const operation of operations) {
      const operationKey = `${groupKey}:${operation.need}`;
      const { data: existing } = await db
        .from("missions")
        .select("id, title, status, scheduled_start, reservation_id, metadata")
        .contains("metadata", {
          guest_checkin_checkout_operation_key: operationKey,
        })
        .maybeSingle();
      if (existing) {
        missions.push(existing as MissionWorkflowRow);
        continue;
      }

      const reservationStart =
        operation.need === "checkin"
          ? reservationSchedule?.check_in_at
          : reservationSchedule?.check_out_at;
      const scheduledStart = reservationStart ?? request?.desired_date ?? null;
      const scheduledEnd = reservationStart
        ? new Date(
            new Date(reservationStart).getTime() + 45 * 60 * 1000,
          ).toISOString()
        : null;
      const operationLabel =
        operation.need === "checkin" ? "Arrivée" : "Départ";
      const { data, error } =
        await insertMissionWithOptionalMetadata<MissionWorkflowRow>(
          db as Parameters<
            typeof insertMissionWithOptionalMetadata<MissionWorkflowRow>
          >[0],
          {
            id: commercialObjectId(`legacy-guest-operation:${operationKey}`),
            concierge_profile_id: quote.concierge_profile_id,
            owner_profile_id: quote.owner_profile_id ?? request?.owner_profile_id ?? null,
            property_id: request?.property_id ?? null,
            title: `${buildMissionTitle(request, quote)} — ${operation.need === "checkin" ? "Check-in" : "Check-out"}`,
            description: request?.description ?? quote.notes ?? null,
            status: reservationStart
              ? "scheduled"
              : request?.desired_date
                ? "date_requested"
                : "to_schedule",
            priority: request?.urgency ? "urgent" : "normal",
            amount: null,
            currency: quote.currency ?? request?.currency ?? "EUR",
            scheduled_start: scheduledStart,
            scheduled_end: scheduledEnd,
            metadata: {
              source: "quote_acceptance",
              quote_id: quote.id,
              quote_number: quote.quote_number ?? null,
              service_request_id: serviceRequestId,
              service_request_recipient_id: serviceRequestRecipientId,
              commercial_service: GUEST_CHECKIN_CHECKOUT_BUNDLE,
              service_modalities: {
                guest_checkin_checkout: checkinCheckoutMode,
              },
              service_modality_label:
                getGuestCheckinCheckoutModeLabel(checkinCheckoutMode),
              stay_need: operation.need,
              contract_service_code:
                operation.need === "checkin" ? "CHECK_IN" : "CHECK_OUT",
              operational_service_slug: operation.slug,
              guest_checkin_checkout_group_key: groupKey,
              guest_checkin_checkout_operation_key: operationKey,
              intervention_label: operationLabel,
              assigned_profile_id: quote.concierge_profile_id,
              planning_origin: reservationStart
                ? "reservation_operation_date"
                : request?.desired_date
                  ? "service_request_desired_date"
                  : "to_schedule",
              ...(reservationId ? { reservation_id: reservationId } : {}),
            },
            ...(reservationId ? { reservation_id: reservationId } : {}),
          },
          "id, title, status, scheduled_start, reservation_id, metadata",
          "id, title, status, scheduled_start, metadata",
          ["metadata", ...(reservationId ? ["reservation_id"] : [])],
        );
      if (error || !data) {
        console.error("[acceptedQuoteWorkflow] operation mission create error:", error);
        return null;
      }
      missions.push(data);
    }
    return { mission: missions[0] ?? null, missions };
  }

  // Explicit stay context ("demande ponctuelle de séjour"): reuse any mission
  // already created for the same stay + request + quote (crash retry guard).
  const stayContext = readStayContext(request);
  if (stayContext) {
    const { data: stayMissions } = await db
      .from("missions")
      .select("id, title, status, scheduled_start, reservation_id, metadata")
      .eq("reservation_id", stayContext.reservationId)
      .limit(50);

    const existingStayMission = (Array.isArray(stayMissions) ? stayMissions : []).find((row) => {
      const missionMetadata = isRecord((row as MissionWorkflowRow).metadata) ? ((row as MissionWorkflowRow).metadata as Record<string, unknown>) : null;
      return (
        missionMetadata &&
        getMetadataString(missionMetadata, "service_request_id") === serviceRequestId &&
        getMetadataString(missionMetadata, "quote_id") === quote.id
      );
    }) as MissionWorkflowRow | undefined;
    if (existingStayMission?.id) {
      return { mission: existingStayMission, missions: [existingStayMission] };
    }
  }

  if (!quote.concierge_profile_id) return null;
  const { data: linkedQuoteItems } = await db
    .from("quote_items")
    .select("service_id")
    .eq("quote_id", quote.id)
    .limit(1);
  const linkedServiceId = Array.isArray(linkedQuoteItems)
    ? (linkedQuoteItems[0] as { service_id?: number | null } | undefined)?.service_id ?? null
    : null;

  const legacyId = commercialObjectId(`legacy-quote-mission:${quote.id}`);
  const existingLegacy = await db.from("missions").select("id,title,status,scheduled_start")
    .eq("id", legacyId).eq("owner_profile_id", quote.owner_profile_id)
    .eq("concierge_profile_id", quote.concierge_profile_id).maybeSingle();
  if (existingLegacy.error) throw existingLegacy.error;
  if (existingLegacy.data) return { mission: existingLegacy.data as MissionWorkflowRow, missions: [existingLegacy.data as MissionWorkflowRow] };

  const missionMetadata = {
    source: "quote_acceptance",
    quote_id: quote.id,
    quote_number: quote.quote_number ?? null,
    service_request_id: serviceRequestId,
    service_request_recipient_id: serviceRequestRecipientId,
    accepted_quote_amount: quote.total_amount ?? null,
    payment_plan: quoteMetadata.payment_plan ?? null,
    deposit_amount: quoteMetadata.deposit_amount ?? null,
    deposit_percent: quoteMetadata.deposit_percent ?? null,
    deposit_required: quoteMetadata.deposit_required ?? null,
    planning_origin: request?.desired_date ? "service_request_desired_date" : "to_schedule",
    ...(stayContext
      ? {
          reservation_id: stayContext.reservationId,
          ...(stayContext.stayNeed ? { stay_need: stayContext.stayNeed } : {}),
        }
      : {}),
  };

  const { data, error } = await insertMissionWithOptionalMetadata<MissionWorkflowRow>(
    db as Parameters<typeof insertMissionWithOptionalMetadata<MissionWorkflowRow>>[0],
    {
      id: commercialObjectId(`legacy-quote-mission:${quote.id}`),
      concierge_profile_id: quote.concierge_profile_id,
      owner_profile_id: quote.owner_profile_id ?? request?.owner_profile_id ?? null,
      property_id: request?.property_id ?? null,
      service_id: linkedServiceId,
      title: buildMissionTitle(request, quote),
      description: request?.description ?? quote.notes ?? null,
      status: request?.desired_date ? "date_requested" : "to_schedule",
      priority: request?.urgency ? "urgent" : "normal",
      amount: quote.total_amount ?? null,
      currency: quote.currency ?? request?.currency ?? "EUR",
      scheduled_start: request?.desired_date ?? null,
      scheduled_end: null,
      metadata: missionMetadata,
      // One-off stay mission: linked to the stay, without touching
      // reservations.concierge_profile_id (main concierge stays responsible).
      ...(stayContext ? { reservation_id: stayContext.reservationId } : {}),
    },
    "id, title, status, scheduled_start",
    "id, title, status, scheduled_start",
    ["metadata", ...(stayContext ? ["reservation_id"] : [])],
  );

  if (error || !data) {
    console.error("[acceptedQuoteWorkflow] mission create error:", error);
    return null;
  }

  return { mission: data, missions: [data] };
}

async function ensureDraftInvoice(input: {
  db: DbClient;
  quote: QuoteWorkflowQuote;
  missionId: string | null;
}) {
  const { db, quote, missionId } = input;
  if (!quote.concierge_profile_id) return null;
  const quoteMetadata = isRecord(quote.metadata) ? quote.metadata : {};

  const { data: existingInvoices, error: existingError } = await db
    .from("invoices")
    .select("id,status")
    .eq("quote_id", quote.id)
    .limit(1);

  if (existingError) {
    console.error("[acceptedQuoteWorkflow] invoice lookup error:", existingError);
    return null;
  }
  const invoiceRows = (existingInvoices ?? []) as Array<{ id: string; status?: string }>;
  if (invoiceRows[0]?.id && invoiceRows[0].status && invoiceRows[0].status !== "draft") return invoiceRows[0];

  const { data: quoteItems, error: quoteItemsError } = await db
    .from("quote_items")
    .select("id, service_id, pricing_id, label, description, quantity, unit_price, line_total, sort_order, metadata")
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

  let invoice = invoiceRows[0] ?? null;
  if (!invoice) {
    const { data: createdInvoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        id: commercialObjectId(`accepted-quote-invoice:${quote.id}`),
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
          ...quoteMetadata,
          source: "quote_acceptance",
          quote_id: quote.id,
          quote_number: quote.quote_number ?? null,
          mission_id: missionId,
        },
      })
      .select("id")
      .single();

    if (invoiceError) {
      if (invoiceError.code !== "23505") throw invoiceError;
      const retry = await db.from("invoices").select("id,status")
        .eq("id", commercialObjectId(`accepted-quote-invoice:${quote.id}`)).single();
      if (retry.error || !retry.data) throw retry.error ?? new Error("Facture non persistée.");
      invoice = retry.data as { id: string; status?: string };
    } else invoice = createdInvoice as { id: string; status?: string };
  }
  if (!invoice?.id) throw new Error("Facture non persistée.");

  const { data: storedItems, error: itemsReadError } = await db.from("invoice_items")
    .select("id,sort_order,metadata").eq("invoice_id", invoice.id);
  if (itemsReadError) throw itemsReadError;
  const stored = (storedItems ?? []) as Array<{ id: string; sort_order?: number; metadata?: Record<string, unknown> }>;
  // Preserve legacy line IDs too. Existing immutable quote order is the fallback
  // for invoices created before source_quote_item_id was recorded.
  const itemsToInsert = sourceQuoteItems.flatMap((item, index) => {
    if (stored.some(line => line.metadata?.source_quote_item_id === item.id
      || (line.sort_order === item.sort_order && line.sort_order != null))) return [];
    return [{
    id: commercialObjectId(`accepted-quote-invoice-item:${invoice!.id}:${item.id ?? index}`),
    invoice_id: invoice!.id,
    service_id: item.service_id ?? null,
    pricing_id: item.pricing_id ?? null,
    label: item.label,
    description: item.description ?? null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
    sort_order: item.sort_order ?? index,
    metadata: { ...(isRecord(item.metadata) ? item.metadata : {}), source_quote_item_id: item.id ?? null },
  }];
  });
  if (itemsToInsert.length) {
    const { error: invoiceItemsError } = await db.from("invoice_items")
      .upsert(itemsToInsert, { onConflict: "id", ignoreDuplicates: true });
    if (invoiceItemsError) throw invoiceItemsError;
  }

  return invoice;
}

export async function finalizeAcceptedQuoteWorkflow(input: QuoteWorkflowInput) {
  const { db, quoteId, actorProfileId } = input;
  const { data: quote, error: quoteError } = await db
    .from("quotes")
    .select(
      "id, status, quote_number, concierge_profile_id, owner_profile_id, mission_id, service_request_id, service_request_recipient_id, currency, total_amount, discount_amount, tax_rate, notes, metadata",
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteError || !quote) {
    console.error("[acceptedQuoteWorkflow] quote lookup error:", quoteError);
    return { mission: null, missions: [], invoice: null };
  }

  const quoteRow = quote as QuoteWorkflowQuote;
  if (quoteRow.status !== "accepted" || quoteRow.owner_profile_id !== actorProfileId) {
    throw new QuoteAwardError("Seul le propriétaire du devis accepté peut finaliser son attribution.", 403);
  }
  const quoteMetadata = isRecord(quoteRow.metadata) ? quoteRow.metadata : {};
  const serviceRequestId = input.serviceRequestId ?? quoteRow.service_request_id ?? getMetadataString(quoteMetadata, "service_request_id");
  const serviceRequestRecipientId =
    input.serviceRequestRecipientId ?? quoteRow.service_request_recipient_id ?? getMetadataString(quoteMetadata, "service_request_recipient_id");

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

  if (serviceRequestId && (quoteRow.status !== "accepted" || request?.metadata?.selected_quote_id !== quoteId)) {
    throw new QuoteAwardError("Seul le devis retenu peut produire les effets de l’acceptation.");
  }

  if (isContinuousCollaboration(request)) {
    if (quoteRow.owner_profile_id !== actorProfileId || request?.owner_profile_id !== actorProfileId) {
      throw new QuoteAwardError("Seul le propriétaire peut activer cette collaboration.", 403);
    }
    // The routes attach the housing and upsert the agreement. Its commercial
    // terms are not an order for future, undated interventions.
    return { mission: null, missions: [], invoice: null, continuous: true, stayScoped: false };
  }

  const missionSet = await findOrCreateMission({
    db,
    quote: quoteRow,
    request,
    serviceRequestId,
    serviceRequestRecipientId,
  });
  const mission = missionSet?.mission ?? null;
  const missions = missionSet?.missions ?? (mission ? [mission] : []);
  const missionId = mission?.id ?? quoteRow.mission_id ?? null;
  if (!missionId || !missions.length) throw new Error("Création des interventions incomplète.");
  const invoice = await ensureDraftInvoice({ db, quote: quoteRow, missionId });
  if (!invoice?.id) throw new Error("Création de la facture brouillon incomplète.");

  if (missionId) {
    const linkedQuote = await db.from("quotes").update({ mission_id: missionId }).eq("id", quoteId);
    if (linkedQuote.error) throw linkedQuote.error;

    if (serviceRequestId) {
      const requestMetadata = isRecord(request?.metadata) ? request?.metadata : {};
      const linkedRequest = await db
        .from("service_requests")
        .update({
          mission_id: missionId,
          selected_concierge_profile_id: quoteRow.concierge_profile_id,
          status: "quote_accepted",
          metadata: {
            ...requestMetadata,
            selected_quote_id: quoteId,
            selected_mission_id: missionId,
            ...(missions.length > 1
              ? { selected_mission_ids: missions.map((item) => item.id) }
              : {}),
            accepted_invoice_id: invoice?.id ?? requestMetadata.accepted_invoice_id ?? null,
            selected_at: getMetadataString(requestMetadata, "selected_at") ?? new Date().toISOString(),
          },
        })
        .eq("id", serviceRequestId);
      if (linkedRequest.error) throw linkedRequest.error;
    }

    for (const operationMission of missions) {
      const event = await db.from("mission_events").upsert({
        id: commercialObjectId(`quote-accepted-event:${quoteId}:${operationMission.id}`),
        mission_id: operationMission.id,
        actor_profile_id: actorProfileId,
        event_type: "quote_accepted",
        payload: {
          quote_id: quoteId,
          service_request_id: serviceRequestId,
          invoice_id: invoice?.id ?? null,
          intervention_group_key: getMetadataString(
            isRecord(operationMission.metadata) ? operationMission.metadata : null,
            "guest_checkin_checkout_group_key",
          ),
        },
      }, { onConflict: "id", ignoreDuplicates: true });
      if (event.error) throw event.error;
    }
  }

  return {
    mission,
    missions,
    invoice,
    stayScoped: Boolean(readStayContext(request)),
  };
}
