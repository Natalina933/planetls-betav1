import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase.generated";
import { loadOpenRequestForQuote, RequestCommercialError } from "@/features/concierge-commercial/server/requestCommercialGuard";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { confirmQuoteItemPrice } from "@/features/concierge-commercial/server/quoteSendGuard";
type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "canceled";

type QuoteItemInput = {
  id?: string;
  label: string;
  description?: string | null;
  quantity?: number;
  unit_price: number;
  service_id?: number | null;
  pricing_id?: string | null;
  sort_order?: number;
  metadata?: Json;
};

type UpdateQuoteBody = {
  package_id?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  metadata?: Record<string, unknown> | null;
  items?: QuoteItemInput[];
};

const ALLOWED_BILLING_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

const round2 = (value: number): number => Math.round(value * 100) / 100;

// Clés de métadonnées de devis qui ne doivent JAMAIS être écrasées par un
// client : elles portent les règles de sécurité d'envoi (clarification,
// confirmation de tarif, budget indicatif). Seul le serveur les contrôle.
const PROTECTED_QUOTE_METADATA_KEYS = new Set([
  "service_request_id", "service_request_recipient_id", "requested_services", "service_modalities", "draft_preparation_pending",
  "quote_service_clarification_status",
  "quote_service_clarification_reason",
  "quote_service_clarification_status_source",
  "quote_service_price_confirmed",
  "quote_service_budget_is_indicative",
  "quote_service_budget_max",
  "quote_service_original_values",
  "quote_service_resolution_diagnostics",
]);

// Clés de métadonnées de ligne protégées (jamais écrasées côté client).
const PROTECTED_ITEM_METADATA_KEYS = new Set([
  "requested_service_slug", "service_request_id", "service_request_recipient_id", "desired_date",
  "quote_service_clarification_status",
  "quote_service_clarification_reason",
  "quote_service_price_confirmed",
  "quote_service_budget_is_indicative",
  "quote_service_budget_max",
  "quote_service_original_values",
  "quote_service_resolution_diagnostics",
]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Conserve uniquement les clés NON protégées fouries par le client, puis
// réapplique les valeurs serveur existantes (source de vérité : base).
function mergeQuoteMetadata(
  incoming: Record<string, unknown> | null | undefined,
  existing: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const safeIncoming: Record<string, unknown> = {};
  if (isPlainObject(incoming)) {
    for (const [key, value] of Object.entries(incoming)) {
      if (!PROTECTED_QUOTE_METADATA_KEYS.has(key)) safeIncoming[key] = value;
    }
  }
  const existingRecord = isPlainObject(existing) ? existing : {};
  const protectedExisting: Record<string, unknown> = {};
  for (const key of PROTECTED_QUOTE_METADATA_KEYS) {
    if (key in existingRecord) protectedExisting[key] = existingRecord[key];
  }
  return { ...existingRecord, ...safeIncoming, ...protectedExisting };
}

// Préserve les clés de sécurité de la ligne existante lors d'une édition.
function mergeItemMetadata(
  incoming: unknown,
  existing: unknown,
): Record<string, unknown> {
  const safeIncoming: Record<string, unknown> = {};
  if (isPlainObject(incoming)) {
    for (const [key, value] of Object.entries(incoming)) {
      if (!PROTECTED_ITEM_METADATA_KEYS.has(key)) safeIncoming[key] = value;
    }
  }
  const existingRecord = isPlainObject(existing) ? existing : {};
  const protectedExisting: Record<string, unknown> = {};
  for (const key of PROTECTED_ITEM_METADATA_KEYS) {
    if (key in existingRecord) protectedExisting[key] = existingRecord[key];
  }
  return { ...existingRecord, ...safeIncoming, ...protectedExisting };
}

// Recalcule total à partir des lignes : source de vérité pour l'envoi.
function computeQuoteTotalsFromItems(
  items: QuoteItemInput[],
  base: { discount?: number | null; taxRate?: number | null },
): { subtotal: number; discount: number; taxRate: number; taxAmount: number; total: number } {
  const subtotal = round2(
    items.reduce((sum, item) => {
      const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const unitPrice = Number.isFinite(Number(item.unit_price)) ? Number(item.unit_price) : 0;
      return sum + quantity * unitPrice;
    }, 0),
  );
  const discount = Math.max(0, round2(Number(base.discount ?? 0) || 0));
  const taxRate = Math.min(100, Math.max(0, round2(Number(base.taxRate ?? 0) || 0)));
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = round2(afterDiscount * (taxRate / 100));
  const total = round2(afterDiscount + taxAmount);
  return { subtotal, discount, taxRate, taxAmount, total };
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
    pricing_id,
    metadata
  )
`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const { data, error } = await db
      .from("quotes")
      .select(quoteSelect)
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/quotes/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await req.json()) as UpdateQuoteBody;

    const { data: existing, error: existingError } = await asLooseSupabaseClient(db)
      .from("quotes")
      .select("*")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (existingError) {
      console.error("[PATCH /api/quotes/:id] read error:", existingError);
      return NextResponse.json(
        { error: "Erreur lecture devis" },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    await loadOpenRequestForQuote(asLooseSupabaseClient(db), existing);
    if (!["draft", "canceled"].includes(String(existing.status ?? ""))) {
      return NextResponse.json(
        { error: "Seuls les devis brouillons peuvent être modifiés." },
        { status: 400 },
      );
    }

    const { data: existingItemRows, error: existingItemsError } = await db
      .from("quote_items")
      .select("id, label, description, quantity, unit_price, line_total, service_id, pricing_id, sort_order, metadata")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true });

    if (existingItemsError) {
      console.error("[PATCH /api/quotes/:id] existing items read error:", existingItemsError);
      return NextResponse.json({ error: "Impossible de conserver les lignes existantes." }, { status: 500 });
    }
    const existingItems = Array.isArray(existingItemRows)
      ? existingItemRows
      : [];

    const sanitizedItems = Array.isArray(body.items)
      ? body.items
          .map((item, index) => {
            const existingItem = (item.id
              ? existingItems.find((row) => row.id === item.id)
              : existingItems[index]) as { metadata?: unknown } | undefined;
            return {
              id: item.id,
              label: typeof item.label === "string" ? item.label.trim() : "",
              description:
                typeof item.description === "string"
                  ? item.description.trim()
                  : null,
              quantity: Number(item.quantity ?? 1),
              unit_price: Number(item.unit_price ?? 0),
              service_id:
                item.service_id === null || item.service_id === undefined
                  ? null
                  : Number(item.service_id),
              pricing_id:
                item.pricing_id === null || item.pricing_id === undefined
                  ? null
                  : String(item.pricing_id),
              sort_order: Number.isFinite(Number(item.sort_order))
                ? Number(item.sort_order)
                : index,
              // Faille D : préserve les clés de sécurité de la ligne existante.
              metadata: confirmQuoteItemPrice({ label: item.label, unit_price: Number(item.unit_price) }, mergeItemMetadata(item.metadata, existingItem?.metadata)) as Json,
            };
          })
          .filter(
            (item) =>
              item.label.length > 0 &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0 &&
              Number.isFinite(item.unit_price) &&
              item.unit_price >= 0,
          )
      : existingItems;

    const existingMetadata =
      existing.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};
    const nextMetadata =
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
        ? // Faille D : les clés de sécurité du devis ne peuvent pas être écrasées.
          mergeQuoteMetadata(body.metadata, existingMetadata)
        : existingMetadata;

    const updatePayload: Record<string, unknown> = {
      ...(body.package_id !== undefined ? { package_id:
        typeof body.package_id === "string" && body.package_id.trim()
          ? body.package_id
          : null } : {}),
      ...(body.valid_until !== undefined ? { valid_until: body.valid_until } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };
    if (body.metadata !== undefined) {
      updatePayload.metadata = nextMetadata;
    }

    // Faille E : recalcule systématiquement le total à partir des lignes
    // sauvegardées (source de vérité), puis applique remise/taxe.
    const effectiveDiscount = round2(Number(body.discount_amount ?? existing.discount_amount ?? 0));
    const effectiveTaxRate = round2(Number(body.tax_rate ?? existing.tax_rate ?? 0));
    const totals = computeQuoteTotalsFromItems(sanitizedItems, {
      discount: effectiveDiscount,
      taxRate: effectiveTaxRate,
    });
    updatePayload.discount_amount = totals.discount;
    updatePayload.tax_rate = totals.taxRate;
    updatePayload.subtotal = totals.subtotal;
    updatePayload.tax_amount = totals.taxAmount;
    updatePayload.total_amount = totals.total;

    const { data: savedQuote, error: updateError } = await db
      .from("quotes")
      .update(updatePayload)
      .eq("id", id)
      .eq("concierge_profile_id", userId).eq("status", existing.status).select("id").maybeSingle();
    if (!updateError && !savedQuote) return NextResponse.json({ error: "Le devis a changé pendant la modification." }, { status: 409 });

    if (updateError) {
      console.error("[PATCH /api/quotes/:id] update error:", updateError);
      return NextResponse.json(
        { error: "Erreur mise à jour devis" },
        { status: 500 },
      );
    }

    if (Array.isArray(body.items)) {
      // Best-effort compensation of the existing REST replacement, without claiming a transaction.
      const restore = async () => {
        const deleted = await db.from("quote_items").delete().eq("quote_id", id);
        if (deleted.error) return false;
        if (existingItems.length) {
          const restored = await db.from("quote_items").insert(existingItems.map(item => ({ ...item, quote_id: id })));
          if (restored.error) return false;
        }
        const restoredHeader = await asLooseSupabaseClient(db).from("quotes").update({
          package_id: existing.package_id, valid_until: existing.valid_until, notes: existing.notes, metadata: existing.metadata,
          subtotal: existing.subtotal, discount_amount: existing.discount_amount, tax_rate: existing.tax_rate,
          tax_amount: existing.tax_amount, total_amount: existing.total_amount,
        }).eq("id", id).eq("status", existing.status);
        return !restoredHeader.error;
      };
      const { error: deleteItemsError } = await db
        .from("quote_items")
        .delete()
        .eq("quote_id", id);
      if (deleteItemsError) {
        console.error(
          "[PATCH /api/quotes/:id] delete items error:",
          deleteItemsError,
        );
        const restored = await restore();
        return NextResponse.json(
          { error: "Erreur mise à jour des lignes du devis.", restored, code: restored ? "QUOTE_EDIT_RESTORED" : "QUOTE_EDIT_RESTORE_FAILED" },
          { status: 500 },
        );
      }

      if (sanitizedItems.length > 0) {
        const { error: insertItemsError } = await db.from("quote_items").insert(
          sanitizedItems.map((item) => ({
            quote_id: id,
            service_id: item.service_id,
            pricing_id: item.pricing_id,
            label: item.label,
            description: item.description,
            quantity: round2(item.quantity),
            unit_price: round2(item.unit_price),
            line_total: round2(item.quantity * item.unit_price),
            sort_order: item.sort_order,
            metadata: item.metadata,
          })),
        );

        if (insertItemsError) {
          console.error(
            "[PATCH /api/quotes/:id] insert items error:",
            insertItemsError,
          );
          const restored = await restore();
          return NextResponse.json(
            { error: "Erreur sauvegarde des lignes du devis.", restored, code: restored ? "QUOTE_EDIT_RESTORED" : "QUOTE_EDIT_RESTORE_FAILED" },
            { status: 500 },
          );
        }
      }
    }

    const { error: eventError } = await db.from("quote_events").insert({
      quote_id: id,
      actor_profile_id: userId,
      event_type: "edited",
      payload: {
        item_count: sanitizedItems.length,
      },
    });

    if (eventError) {
      console.error("[PATCH /api/quotes/:id] event error:", eventError);
    }

    const { data: hydrated, error: hydratedError } = await db
      .from("quotes")
      .select(quoteSelect)
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .single();

    if (hydratedError || !hydrated) {
      console.error("[PATCH /api/quotes/:id] hydrate error:", hydratedError);
      return NextResponse.json(
        { error: "Erreur rechargement devis" },
        { status: 500 },
      );
    }

    return NextResponse.json(hydrated);
  } catch (err) {
    if (err instanceof RequestCommercialError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[PATCH /api/quotes/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (!ALLOWED_BILLING_ROLES.has(role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const { data: existing, error: existingError } = await db
      .from("quotes")
      .select("id, status, concierge_profile_id")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (existingError) {
      console.error("[DELETE /api/quotes/:id] read error:", existingError);
      return NextResponse.json(
        { error: "Erreur lecture devis" },
        { status: 500 },
      );
    }
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if ((existing.status as QuoteStatus) !== "draft") {
      return NextResponse.json(
        {
          error:
            "Seuls les devis brouillons non envoyés peuvent être supprimés.",
        },
        { status: 400 },
      );
    }

    const { data: linkedInvoices, error: invoicesError } = await db
      .from("invoices")
      .select("id")
      .eq("quote_id", id)
      .limit(1);

    if (invoicesError) {
      console.error("[DELETE /api/quotes/:id] invoices error:", invoicesError);
      return NextResponse.json(
        { error: "Erreur vérification factures liées" },
        { status: 500 },
      );
    }
    if (Array.isArray(linkedInvoices) && linkedInvoices.length > 0) {
      return NextResponse.json(
        {
          error:
            "Ce devis ne peut plus être supprimé car une facture existe déjà.",
        },
        { status: 400 },
      );
    }

    await db.from("quote_items").delete().eq("quote_id", id);
    await db.from("quote_events").delete().eq("quote_id", id);

    const { error: deleteError } = await db
      .from("quotes")
      .delete()
      .eq("id", id)
      .eq("concierge_profile_id", userId);

    if (deleteError) {
      console.error("[DELETE /api/quotes/:id] delete error:", deleteError);
      return NextResponse.json(
        { error: "Erreur suppression devis" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/quotes/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
