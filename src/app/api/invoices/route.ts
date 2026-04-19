import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import type { Json } from "@/types/supabase";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { z } from "zod";

type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "canceled";

interface InvoiceItemInput {
  label: string;
  description?: string | null;
  quantity?: number;
  unit_price: number;
  service_id?: number | null;
  pricing_id?: string | null;
  sort_order?: number;
  metadata?: Json | null;
}

interface DbErrorLike {
  code?: string;
  message?: string;
}

const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);

const VALID_INVOICE_STATUS: InvoiceStatus[] = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "canceled",
];

const round2 = (value: number): number => Math.round(value * 100) / 100;

const ALLOWED_BILLING_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
  "owner",
  "owner_pro",
]);

const OWNER_BILLING_ROLES = new Set(["owner", "owner_pro"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const invoiceItemSchema = z.object({
  label: z.string().trim().min(1).max(180),
  description: z.string().max(4000).optional().nullable(),
  quantity: z.coerce.number().positive().max(100000).optional(),
  unit_price: z.coerce.number().nonnegative().max(100000000),
  service_id: z.coerce.number().int().positive().optional().nullable(),
  pricing_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const createInvoiceBodySchema = z.object({
  quote_id: z.string().uuid().optional().nullable(),
  owner_profile_id: z.string().uuid().optional().nullable(),
  mission_id: z.string().uuid().optional().nullable(),
  status: z.enum(VALID_INVOICE_STATUS).optional(),
  issue_date: z.string().trim().max(40).optional().nullable(),
  due_date: z.string().trim().max(40).optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
  discount_amount: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
  tax_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  paid_amount: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  items: z.array(invoiceItemSchema).max(200).optional(),
});

const getDbErrorMessage = (error: DbErrorLike | null, fallback: string): string => {
  const code = error?.code ?? "";

  if (code === "42P01" || code === "PGRST205" || code === "PGRST204") {
    return "Tables devis/factures introuvables. Executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.";
  }
  if (code === "23503") {
    return "Reference invalide (devis, mission, proprietaire, service ou tarif).";
  }
  if (code === "22P02") {
    return "Format de donnee invalide (UUID/date/nombre).";
  }
  if (code === "23514") {
    return "Valeur invalide pour statut, montant, quantite ou taux.";
  }

  return error?.message ?? fallback;
};

const buildFeatureDisabledResponse = () =>
  NextResponse.json(
    {
      error: "Module factures non active: executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.",
      feature_disabled: true,
    },
    { status: 503 },
  );

const sanitizeCurrency = (value?: string | null): string => {
  const upper = (value ?? "EUR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : "EUR";
};

const parseInvoiceItems = (rawItems: InvoiceItemInput[] | undefined): InvoiceItemInput[] => {
  if (!Array.isArray(rawItems)) return [];

  const parsedItems: InvoiceItemInput[] = [];
  rawItems.forEach((item, index) => {
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unit_price);
    const lineIsValid =
      label.length > 0 &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(unitPrice) &&
      unitPrice >= 0;

    if (!lineIsValid) return;

    parsedItems.push({
      label,
      description: item.description ?? null,
      quantity: round2(quantity),
      unit_price: round2(unitPrice),
      service_id:
        item.service_id === null || item.service_id === undefined
          ? null
          : Number(item.service_id),
      pricing_id: item.pricing_id ?? null,
      sort_order: Number.isFinite(Number(item.sort_order))
        ? Number(item.sort_order)
        : index,
      metadata: item.metadata ?? {},
    });
  });

  return parsedItems;
};

const invoiceSelect = `
  id,
  invoice_number,
  quote_id,
  concierge_profile_id,
  owner_profile_id,
  mission_id,
  status,
  issue_date,
  due_date,
  currency,
  subtotal,
  discount_amount,
  tax_rate,
  tax_amount,
  total_amount,
  paid_amount,
  balance_amount,
  notes,
  metadata,
  issued_at,
  paid_at,
  canceled_at,
  created_at,
  updated_at,
  invoice_items(
    id,
    label,
    description,
    quantity,
    unit_price,
    line_total,
    sort_order,
    service_id,
    pricing_id
  )
`;

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const quoteId = url.searchParams.get("quoteId");
    const ownerProfileId = url.searchParams.get("ownerProfileId");
    const limitRaw = Number(url.searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;

    if (status && !VALID_INVOICE_STATUS.includes(status as InvoiceStatus)) {
      return NextResponse.json({ error: "status invalide" }, { status: 400 });
    }
    if (quoteId && !isUuidLike(quoteId)) {
      return NextResponse.json({ error: "quoteId invalide" }, { status: 400 });
    }
    if (ownerProfileId && !isUuidLike(ownerProfileId)) {
      return NextResponse.json({ error: "ownerProfileId invalide" }, { status: 400 });
    }

    let query = db
      .from("invoices")
      .select(invoiceSelect)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (OWNER_BILLING_ROLES.has(role)) {
      query = query.eq("owner_profile_id", userId);
    } else {
      query = query.eq("concierge_profile_id", userId);
    }

    if (status && VALID_INVOICE_STATUS.includes(status as InvoiceStatus)) {
      query = query.eq("status", status);
    }
    if (quoteId) {
      query = query.eq("quote_id", quoteId);
    }
    if (ownerProfileId && !OWNER_BILLING_ROLES.has(role)) {
      query = query.eq("owner_profile_id", ownerProfileId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST205" || error.code === "PGRST204" || error.code === "42P01") {
        return NextResponse.json([]);
      }
      console.error("[GET /api/invoices] DB error:", error);
      return NextResponse.json(
        { error: getDbErrorMessage(error, "Erreur chargement factures") },
        { status: 500 },
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/invoices] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = createInvoiceBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsedBody.data;
    const items = parseInvoiceItems(body.items as InvoiceItemInput[] | undefined);
    const status: InvoiceStatus = VALID_INVOICE_STATUS.includes(body.status as InvoiceStatus)
      ? (body.status as InvoiceStatus)
      : "draft";

    const discountAmount = Number(body.discount_amount ?? 0);
    const taxRate = Number(body.tax_rate ?? 0);
    const paidAmount = Number(body.paid_amount ?? 0);
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return NextResponse.json({ error: "discount_amount invalide" }, { status: 400 });
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return NextResponse.json({ error: "tax_rate invalide (0-100)" }, { status: 400 });
    }
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return NextResponse.json({ error: "paid_amount invalide" }, { status: 400 });
    }

    const { data: conciergeBranding } = await db
      .from("profiles")
      .select(
        "company_name, legal_form, first_name, last_name, email, phone, street_address, postal_code, city, country, siret, vat_number",
      )
      .eq("id", userId)
      .maybeSingle();

    const safeMetadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    const nowIso = new Date().toISOString();
    const issuedAt = status === "issued" ? nowIso : null;
    const paidAt = status === "paid" ? nowIso : null;
    const canceledAt = status === "canceled" ? nowIso : null;

    const { data: createdInvoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        quote_id: body.quote_id ?? null,
        concierge_profile_id: userId,
        owner_profile_id: body.owner_profile_id ?? null,
        mission_id: body.mission_id ?? null,
        status,
        issue_date: body.issue_date ?? new Date().toISOString().slice(0, 10),
        due_date: body.due_date ?? null,
        currency: sanitizeCurrency(body.currency),
        discount_amount: round2(discountAmount),
        tax_rate: round2(taxRate),
        paid_amount: round2(paidAmount),
        notes: body.notes ?? null,
        metadata: {
          ...safeMetadata,
          branding_snapshot: conciergeBranding ?? null,
        },
        issued_at: issuedAt,
        paid_at: paidAt,
        canceled_at: canceledAt,
      })
      .select("id, invoice_number, status, created_at")
      .single();

    if (invoiceError || !createdInvoice) {
      console.error("[POST /api/invoices] create invoice error:", invoiceError);
      if (MISSING_TABLE_CODES.has(invoiceError?.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(invoiceError, "Erreur creation facture") },
        { status: 500 },
      );
    }

    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        invoice_id: createdInvoice.id,
        service_id: item.service_id ?? null,
        pricing_id: item.pricing_id ?? null,
        label: item.label,
        description: item.description ?? null,
        quantity: item.quantity ?? 1,
        unit_price: item.unit_price,
        line_total: round2((item.quantity ?? 1) * item.unit_price),
        sort_order: item.sort_order ?? 0,
        metadata: item.metadata ?? {},
      }));

      const { error: itemsError } = await db.from("invoice_items").insert(itemsToInsert);
      if (itemsError) {
        console.error("[POST /api/invoices] create items error:", itemsError);
        await db.from("invoices").delete().eq("id", createdInvoice.id);
        if (MISSING_TABLE_CODES.has(itemsError.code ?? "")) {
          return buildFeatureDisabledResponse();
        }
        return NextResponse.json(
          { error: getDbErrorMessage(itemsError, "Erreur creation lignes facture") },
          { status: 500 },
        );
      }
    }

    const { error: eventError } = await db.from("invoice_events").insert({
      invoice_id: createdInvoice.id,
      actor_profile_id: userId,
      event_type: "created",
      payload: {
        status,
        source: "api",
        item_count: items.length,
      },
    });
    if (eventError) {
      console.error("[POST /api/invoices] event error:", eventError);
    }

    const { data: hydrated, error: hydratedError } = await db
      .from("invoices")
      .select(invoiceSelect)
      .eq("id", createdInvoice.id)
      .single();

    if (hydratedError || !hydrated) {
      console.error("[POST /api/invoices] hydrate error:", hydratedError);
      return NextResponse.json(createdInvoice, { status: 201 });
    }

    return NextResponse.json(hydrated, { status: 201 });
  } catch (err) {
    console.error("[POST /api/invoices] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
