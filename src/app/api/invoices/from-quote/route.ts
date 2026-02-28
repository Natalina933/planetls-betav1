import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

interface CreateInvoiceFromQuoteBody {
  quote_id?: string;
  issue_date?: string;
  due_date?: string | null;
  status?: "draft" | "issued";
}

interface DbErrorLike {
  code?: string;
  message?: string;
}

const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);

const round2 = (value: number): number => Math.round(value * 100) / 100;

const ALLOWED_BILLING_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

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

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body: CreateInvoiceFromQuoteBody = await req.json();
    const quoteId = body.quote_id?.trim();
    if (!quoteId) {
      return NextResponse.json({ error: "quote_id requis" }, { status: 400 });
    }

    const targetStatus = body.status === "draft" ? "draft" : "issued";

    const { data: quote, error: quoteError } = await db
      .from("quotes")
      .select(
        "id, quote_number, concierge_profile_id, owner_profile_id, mission_id, currency, discount_amount, tax_rate, notes, metadata, status",
      )
      .eq("id", quoteId)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (quoteError) {
      console.error("[POST /api/invoices/from-quote] quote error:", quoteError);
      if (MISSING_TABLE_CODES.has(quoteError.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(quoteError, "Erreur lecture devis") },
        { status: 500 },
      );
    }
    if (!quote) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const { data: quoteItems, error: quoteItemsError } = await db
      .from("quote_items")
      .select(
        "id, service_id, pricing_id, label, description, quantity, unit_price, line_total, sort_order, metadata",
      )
      .eq("quote_id", quoteId)
      .order("sort_order", { ascending: true });

    if (quoteItemsError) {
      console.error("[POST /api/invoices/from-quote] quote_items error:", quoteItemsError);
      if (MISSING_TABLE_CODES.has(quoteItemsError.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(quoteItemsError, "Erreur lecture lignes devis") },
        { status: 500 },
      );
    }

    const sourceItems = quoteItems ?? [];
    if (sourceItems.length === 0) {
      return NextResponse.json(
        { error: "Le devis ne contient aucune ligne facturable." },
        { status: 400 },
      );
    }

    const quoteMetadata =
      quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
        ? (quote.metadata as Record<string, unknown>)
        : {};

    const { data: conciergeBranding } = await db
      .from("profiles")
      .select(
        "company_name, legal_form, first_name, last_name, email, phone, street_address, postal_code, city, country, siret, vat_number",
      )
      .eq("id", userId)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const { data: createdInvoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        quote_id: quote.id,
        concierge_profile_id: userId,
        owner_profile_id: quote.owner_profile_id ?? null,
        mission_id: quote.mission_id ?? null,
        status: targetStatus,
        issue_date: body.issue_date ?? new Date().toISOString().slice(0, 10),
        due_date: body.due_date ?? null,
        currency: (quote.currency ?? "EUR").toUpperCase(),
        discount_amount: round2(Number(quote.discount_amount ?? 0)),
        tax_rate: round2(Number(quote.tax_rate ?? 0)),
        notes: quote.notes ?? `Facture generee depuis devis ${quote.quote_number}`,
        metadata: {
          ...quoteMetadata,
          source: "quote",
          quote_id: quote.id,
          quote_number: quote.quote_number,
          branding_snapshot: conciergeBranding ?? null,
        },
        issued_at: targetStatus === "issued" ? nowIso : null,
      })
      .select("id, invoice_number")
      .single();

    if (invoiceError || !createdInvoice) {
      console.error("[POST /api/invoices/from-quote] create invoice error:", invoiceError);
      if (MISSING_TABLE_CODES.has(invoiceError?.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(invoiceError, "Erreur creation facture") },
        { status: 500 },
      );
    }

    const itemsToInsert = sourceItems.map((item) => ({
      invoice_id: createdInvoice.id,
      service_id: item.service_id,
      pricing_id: item.pricing_id,
      label: item.label,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      sort_order: item.sort_order,
      metadata: item.metadata ?? {},
    }));

    const { error: invoiceItemsError } = await db.from("invoice_items").insert(itemsToInsert);
    if (invoiceItemsError) {
      console.error("[POST /api/invoices/from-quote] invoice_items error:", invoiceItemsError);
      await db.from("invoices").delete().eq("id", createdInvoice.id);
      if (MISSING_TABLE_CODES.has(invoiceItemsError.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(invoiceItemsError, "Erreur creation lignes facture") },
        { status: 500 },
      );
    }

    const { error: eventError } = await db.from("invoice_events").insert({
      invoice_id: createdInvoice.id,
      actor_profile_id: userId,
      event_type: targetStatus === "issued" ? "issued" : "created",
      payload: {
        source: "quote",
        quote_id: quote.id,
        quote_number: quote.quote_number,
      },
    });
    if (eventError) {
      console.error("[POST /api/invoices/from-quote] event error:", eventError);
    }

    const { data: hydrated, error: hydratedError } = await db
      .from("invoices")
      .select(invoiceSelect)
      .eq("id", createdInvoice.id)
      .single();

    if (hydratedError || !hydrated) {
      console.error("[POST /api/invoices/from-quote] hydrate error:", hydratedError);
      return NextResponse.json(createdInvoice, { status: 201 });
    }

    return NextResponse.json(hydrated, { status: 201 });
  } catch (err) {
    console.error("[POST /api/invoices/from-quote] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
