import test from "node:test";
import assert from "node:assert/strict";

import { finalizeAcceptedQuoteWorkflow } from "../app/api/_shared/acceptedQuoteWorkflow.ts";
import { recordWorkflowEvent } from "../app/api/_shared/workflowEvents.ts";

type DbResult<T = unknown> = { data: T; error: null };

class MockQuery {
  private operation: "select" | "insert" | "update" | "delete" | null = null;
  private payload: unknown = null;
  private filters: Record<string, unknown> = {};
  private readonly table: string;
  private readonly db: MockSupabase;

  constructor(table: string, db: MockSupabase) {
    this.table = table;
    this.db = db;
  }

  select(_columns?: string) {
    this.operation = this.operation ?? "select";
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    this.db.inserts.push({ table: this.table, payload });
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.operation = "update";
    this.payload = payload;
    this.db.updates.push({ table: this.table, payload });
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters[column] = value;
    return this;
  }

  limit(_count: number) {
    return this;
  }

  order(_column: string, _options?: Record<string, unknown>) {
    return this;
  }

  async maybeSingle(): Promise<DbResult<unknown | null>> {
    return { data: this.resolveSingle(), error: null };
  }

  async single(): Promise<DbResult<unknown>> {
    if (this.operation === "insert" && this.table === "missions") {
      return { data: this.db.mission, error: null };
    }
    if (this.operation === "insert" && this.table === "invoices") {
      return { data: this.db.invoice, error: null };
    }
    return { data: this.resolveSingle(), error: null };
  }

  then<TResult1 = DbResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.resolve().then(onfulfilled, onrejected);
  }

  private async resolve(): Promise<DbResult<unknown>> {
    if (this.operation === "insert" || this.operation === "update" || this.operation === "delete") {
      return { data: null, error: null };
    }
    if (this.table === "invoices") return { data: [], error: null };
    if (this.table === "quote_items") return { data: this.db.quoteItems, error: null };
    return { data: [], error: null };
  }

  private resolveSingle() {
    if (this.table === "quotes") return this.db.quote;
    if (this.table === "service_requests") return this.db.serviceRequest;
    if (this.table === "missions") return null;
    return null;
  }
}

class MockSupabase {
  readonly quote = {
    id: "quote-1",
    quote_number: "DV-2026-000001",
    concierge_profile_id: "concierge-1",
    owner_profile_id: "owner-1",
    mission_id: null,
    service_request_id: "request-1",
    service_request_recipient_id: "recipient-1",
    currency: "EUR",
    total_amount: 420,
    discount_amount: 0,
    tax_rate: 20,
    notes: "Prestations initiales",
    metadata: {},
  };

  readonly serviceRequest = {
    id: "request-1",
    title: "Gestion logement Paris",
    description: "Check-in et ménage",
    property_id: "property-1",
    desired_date: null,
    budget_max: 500,
    currency: "EUR",
    urgency: false,
    owner_profile_id: "owner-1",
    metadata: {},
  };

  readonly mission = {
    id: "mission-1",
    title: "Gestion logement Paris",
    status: "to_schedule",
    scheduled_start: null,
  };

  readonly invoice = { id: "invoice-1" };
  readonly quoteItems = [
    {
      service_id: 10,
      pricing_id: "pricing-1",
      label: "Accueil voyageur",
      description: "Arrivée autonome",
      quantity: 1,
      unit_price: 120,
      line_total: 120,
      sort_order: 0,
      metadata: {},
    },
  ];

  readonly inserts: Array<{ table: string; payload: unknown }> = [];
  readonly updates: Array<{ table: string; payload: Record<string, unknown> }> = [];

  from(table: string) {
    return new MockQuery(table, this);
  }
}

test("quote workflow covers draft, sent, accepted mission, draft invoice and typed events", async () => {
  const db = new MockSupabase();

  const draftEvent = await recordWorkflowEvent(db as any, {
    actorProfileId: "concierge-1",
    ownerProfileId: "owner-1",
    conciergeProfileId: "concierge-1",
    serviceRequestId: "request-1",
    serviceRequestRecipientId: "recipient-1",
    quoteId: "quote-1",
    eventType: "quote_draft_prepared",
    title: "Brouillon de devis préparé",
    serviceRequestStatus: "in_review",
    recipientStatus: "interested",
    quoteStatus: "draft",
  });

  const sentEvent = await recordWorkflowEvent(db as any, {
    actorProfileId: "concierge-1",
    ownerProfileId: "owner-1",
    conciergeProfileId: "concierge-1",
    serviceRequestId: "request-1",
    serviceRequestRecipientId: "recipient-1",
    quoteId: "quote-1",
    eventType: "quote_sent",
    title: "Devis envoyé",
    serviceRequestStatus: "quoted",
    recipientStatus: "quoted",
    quoteStatus: "sent",
  });

  assert.equal(draftEvent.workflow.quote_workflow_status, "QUOTE_DRAFT");
  assert.equal(sentEvent.workflow.quote_workflow_status, "QUOTE_SENT");

  const result = await finalizeAcceptedQuoteWorkflow({
    db: db as any,
    quoteId: "quote-1",
    actorProfileId: "owner-1",
  });

  assert.equal(result.mission?.id, "mission-1");
  assert.equal(result.invoice?.id, "invoice-1");

  const missionInsert = db.inserts.find((entry) => entry.table === "missions");
  assert.equal((missionInsert?.payload as Record<string, unknown>)?.status, "to_schedule");
  const missionMetadata = (missionInsert?.payload as { metadata?: Record<string, unknown> } | undefined)?.metadata ?? {};
  assert.equal(missionMetadata.service_request_id, "request-1");

  const invoiceInsert = db.inserts.find((entry) => entry.table === "invoices");
  assert.equal((invoiceInsert?.payload as Record<string, unknown>)?.status, "draft");
  assert.equal((invoiceInsert?.payload as Record<string, unknown>)?.mission_id, "mission-1");

  assert.ok(db.inserts.some((entry) => entry.table === "invoice_items"));
  assert.ok(db.inserts.some((entry) => entry.table === "mission_events"));
  assert.ok(
    db.updates.some(
      (entry) => entry.table === "service_requests" && entry.payload.mission_id === "mission-1",
    ),
  );

  const event = await recordWorkflowEvent(db as any, {
    actorProfileId: "owner-1",
    ownerProfileId: "owner-1",
    conciergeProfileId: "concierge-1",
    serviceRequestId: "request-1",
    serviceRequestRecipientId: "recipient-1",
    quoteId: "quote-1",
    missionId: "mission-1",
    eventType: "quote_accepted",
    title: "Devis accepté",
    serviceRequestStatus: "quote_accepted",
    quoteStatus: "accepted",
    missionStatus: "to_schedule",
    hasMission: true,
  });

  assert.equal(event.workflow.request_workflow_status, "ARCHIVED");
  assert.equal(event.workflow.quote_workflow_status, "QUOTE_ACCEPTED");
  assert.equal(event.workflow.mission_workflow_status, "TO_SCHEDULE");
  assert.ok(db.inserts.some((entry) => entry.table === "workflow_events"));
});
