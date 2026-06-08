import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { deriveQuoteWorkflowStatus } from "@/app/lib/commercialWorkflow";
import type { Json } from "@/types/supabase";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { z } from "zod";

type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "canceled";

interface QuoteItemInput {
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

const VALID_QUOTE_STATUS: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "canceled",
];

const round2 = (value: number): number => Math.round(value * 100) / 100;

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
const dbAny = asLooseSupabaseClient(db);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const quoteItemSchema = z.object({
  label: z.string().trim().min(1).max(180),
  description: z.string().max(4000).optional().nullable(),
  quantity: z.coerce.number().positive().max(100000).optional(),
  unit_price: z.coerce.number().nonnegative().max(100000000),
  service_id: z.coerce.number().int().positive().optional().nullable(),
  pricing_id: z.string().trim().min(1).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const createQuoteBodySchema = z.object({
  owner_profile_id: z.string().uuid().optional().nullable(),
  mission_id: z.string().uuid().optional().nullable(),
  service_request_id: z.string().uuid().optional().nullable(),
  service_request_recipient_id: z.string().uuid().optional().nullable(),
  package_id: z.string().uuid().optional().nullable(),
  status: z.enum(VALID_QUOTE_STATUS).optional(),
  currency: z.string().trim().length(3).optional().nullable(),
  discount_amount: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
  tax_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  valid_until: z.string().trim().max(40).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  items: z.array(quoteItemSchema).max(200).optional(),
});

const getDbErrorMessage = (error: DbErrorLike | null, fallback: string): string => {
  const code = error?.code ?? "";

  if (code === "42P01" || code === "PGRST205" || code === "PGRST204") {
    return "Tables devis/factures introuvables. Executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.";
  }
  if (code === "23503") {
    return "Reference invalide (mission, proprietaire, pack, service ou tarif).";
  }
  if (code === "22P02") {
    return "Format de donnee invalide (UUID/date/nombre).";
  }
  if (code === "23514") {
    return "Valeur invalide pour statut, montant, quantite ou taux.";
  }

  return error?.message ?? fallback;
};

const buildFeatureDisabledResponse = (resource: "devis" | "factures") =>
  NextResponse.json(
    {
      error: `Module ${resource} non active: executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.`,
      feature_disabled: true,
    },
    { status: 503 },
  );

const sanitizeCurrency = (value?: string | null): string => {
  const upper = (value ?? "EUR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : "EUR";
};

const parseQuoteItems = (rawItems: QuoteItemInput[] | undefined): QuoteItemInput[] => {
  if (!Array.isArray(rawItems)) return [];

  const parsedItems: QuoteItemInput[] = [];
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

function attachQuoteWorkflow<T extends { status?: string | null }>(quote: T) {
  const workflowStatus = deriveQuoteWorkflowStatus(quote.status);

  return {
    ...quote,
    workflow_status: workflowStatus,
    quote_workflow_status: workflowStatus,
  };
}

const quoteSelect = `
  id,
  quote_number,
  concierge_profile_id,
  owner_profile_id,
  mission_id,
  service_request_id,
  service_request_recipient_id,
  package_id,
  status,
  currency,
  subtotal,
  discount_amount,
  tax_rate,
  tax_amount,
  total_amount,
  valid_until,
  notes,
  metadata,
  sent_at,
  accepted_at,
  rejected_at,
  canceled_at,
  created_at,
  updated_at,
  owner:profiles!quotes_owner_profile_id_fkey(
    id,
    first_name,
    last_name,
    company_name
  ),
  concierge:profiles!quotes_concierge_profile_id_fkey(
    id,
    first_name,
    last_name,
    company_name
  ),
  package:services_packages(
    id,
    name,
    description,
    category
  ),
  quote_items(
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
    const missionId = url.searchParams.get("missionId");
    const ownerProfileId = url.searchParams.get("ownerProfileId");
    const limitRaw = Number(url.searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;

    if (status && !VALID_QUOTE_STATUS.includes(status as QuoteStatus)) {
      return NextResponse.json({ error: "status invalide" }, { status: 400 });
    }
    if (missionId && !isUuidLike(missionId)) {
      return NextResponse.json({ error: "missionId invalide" }, { status: 400 });
    }
    if (ownerProfileId && !isUuidLike(ownerProfileId)) {
      return NextResponse.json({ error: "ownerProfileId invalide" }, { status: 400 });
    }

    let query = dbAny
      .from("quotes")
      .select(quoteSelect)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (OWNER_BILLING_ROLES.has(role)) {
      if (status === "draft") {
        return NextResponse.json([]);
      }
      query = query.eq("owner_profile_id", userId);
      if (!status) {
        query = query.neq("status", "draft");
      }
    } else {
      query = query.eq("concierge_profile_id", userId);
    }

    if (status && VALID_QUOTE_STATUS.includes(status as QuoteStatus)) {
      query = query.eq("status", status);
    }
    if (missionId) {
      query = query.eq("mission_id", missionId);
    }
    if (ownerProfileId && !OWNER_BILLING_ROLES.has(role)) {
      query = query.eq("owner_profile_id", ownerProfileId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === "PGRST205" || error.code === "PGRST204" || error.code === "42P01") {
        return NextResponse.json([]);
      }
      console.error("[GET /api/quotes] DB error:", error);
      return NextResponse.json(
        { error: getDbErrorMessage(error, "Erreur chargement devis") },
        { status: 500 },
      );
    }

    return NextResponse.json((data ?? []).map(attachQuoteWorkflow));
  } catch (err) {
    console.error("[GET /api/quotes] ERROR:", err);
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
    const parsedBody = createQuoteBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const body = parsedBody.data;
    const items = parseQuoteItems(body.items as QuoteItemInput[] | undefined);
    const status: QuoteStatus = VALID_QUOTE_STATUS.includes(body.status as QuoteStatus)
      ? (body.status as QuoteStatus)
      : "draft";

    const discountAmount = Number(body.discount_amount ?? 0);
    const taxRate = Number(body.tax_rate ?? 0);
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return NextResponse.json({ error: "discount_amount invalide" }, { status: 400 });
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return NextResponse.json({ error: "tax_rate invalide (0-100)" }, { status: 400 });
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
    const metadataServiceRequestId =
      typeof safeMetadata.service_request_id === "string" && isUuidLike(safeMetadata.service_request_id)
        ? safeMetadata.service_request_id
        : null;
    const metadataRecipientId =
      typeof safeMetadata.service_request_recipient_id === "string" && isUuidLike(safeMetadata.service_request_recipient_id)
        ? safeMetadata.service_request_recipient_id
        : null;

    const { data: createdQuote, error: quoteError } = await dbAny
      .from("quotes")
      .insert({
        concierge_profile_id: userId,
        owner_profile_id: body.owner_profile_id ?? null,
        mission_id: body.mission_id ?? null,
        service_request_id: body.service_request_id ?? metadataServiceRequestId,
        service_request_recipient_id: body.service_request_recipient_id ?? metadataRecipientId,
        package_id: body.package_id ?? null,
        status,
        currency: sanitizeCurrency(body.currency),
        discount_amount: round2(discountAmount),
        tax_rate: round2(taxRate),
        valid_until: body.valid_until ?? null,
        notes: body.notes ?? null,
        metadata: {
          ...safeMetadata,
          branding_snapshot: conciergeBranding ?? null,
        },
      })
      .select("id, quote_number, status, created_at")
      .single();

    if (quoteError || !createdQuote) {
      console.error("[POST /api/quotes] create quote error:", quoteError);
      if (MISSING_TABLE_CODES.has(quoteError?.code ?? "")) {
        return buildFeatureDisabledResponse("devis");
      }
      return NextResponse.json(
        { error: getDbErrorMessage(quoteError, "Erreur creation devis") },
        { status: 500 },
      );
    }

    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        quote_id: createdQuote.id,
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

      const { error: itemsError } = await db.from("quote_items").insert(itemsToInsert);
      if (itemsError) {
        console.error("[POST /api/quotes] create items error:", itemsError);
        await dbAny.from("quotes").delete().eq("id", createdQuote.id);
        if (MISSING_TABLE_CODES.has(itemsError.code ?? "")) {
          return buildFeatureDisabledResponse("devis");
        }
        return NextResponse.json(
          { error: getDbErrorMessage(itemsError, "Erreur creation lignes devis") },
          { status: 500 },
        );
      }
    }

    const { error: eventError } = await db.from("quote_events").insert({
      quote_id: createdQuote.id,
      actor_profile_id: userId,
      event_type: "created",
      payload: {
        status,
        source: "api",
        item_count: items.length,
      },
    });
    if (eventError) {
      console.error("[POST /api/quotes] event error:", eventError);
    }

    const { data: hydrated, error: hydratedError } = await dbAny
      .from("quotes")
      .select(quoteSelect)
      .eq("id", createdQuote.id)
      .single();

    if (hydratedError || !hydrated) {
      console.error("[POST /api/quotes] hydrate error:", hydratedError);
      return NextResponse.json(attachQuoteWorkflow(createdQuote), { status: 201 });
    }

    return NextResponse.json(attachQuoteWorkflow(hydrated), { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotes] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
