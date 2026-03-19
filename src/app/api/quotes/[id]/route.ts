import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";
import type { Json } from "@/types/supabase";

type QuoteItemInput = {
  label: string;
  description?: string | null;
  quantity?: number;
  unit_price: number;
  service_id?: number | null;
  pricing_id?: string | null;
  sort_order?: number;
  metadata?: Json | null;
};

type SanitizedQuoteItem = {
  label: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  service_id: number | null;
  pricing_id: string | null;
  sort_order: number;
  metadata: Json;
};

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);

const quoteSelect = `
  id,
  quote_number,
  concierge_profile_id,
  owner_profile_id,
  mission_id,
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

const quoteItemSchema = z.object({
  label: z.string().trim().min(1).max(180),
  description: z.string().max(4000).optional().nullable(),
  quantity: z.coerce.number().positive().max(100000).optional(),
  unit_price: z.coerce.number().nonnegative().max(100000000),
  service_id: z.coerce.number().int().positive().optional().nullable(),
  pricing_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

const patchQuoteBodySchema = z.object({
  currency: z.string().trim().length(3).optional().nullable(),
  discount_amount: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
  tax_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  valid_until: z.string().trim().max(40).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  items: z.array(quoteItemSchema).max(200).optional(),
});

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const round2 = (value: number): number => Math.round(value * 100) / 100;

const sanitizeCurrency = (value?: string | null): string => {
  const upper = (value ?? "EUR").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : "EUR";
};

function parseQuoteItems(rawItems: QuoteItemInput[] | undefined): SanitizedQuoteItem[] {
  if (!Array.isArray(rawItems)) return [];

  const parsedItems: SanitizedQuoteItem[] = [];

  rawItems.forEach((item, index) => {
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const quantity = Number(item.quantity ?? 1);
    const unitPrice = Number(item.unit_price);

    if (!label || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return;
    }

    parsedItems.push({
      label,
      description: item.description ?? null,
      quantity: round2(quantity),
      unit_price: round2(unitPrice),
      service_id:
        item.service_id === null || item.service_id === undefined ? null : Number(item.service_id),
      pricing_id: item.pricing_id ?? null,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
      metadata: (item.metadata ?? {}) as Json,
    });
  });

  return parsedItems;
}

async function loadQuote(quoteId: string) {
  const { data, error } = await db
    .from("quotes")
    .select("id, concierge_profile_id, owner_profile_id, status")
    .eq("id", quoteId)
    .maybeSingle();

  if (error) {
    console.error("[PATCH /api/quotes/:id] quote lookup error:", error);
    throw new Error("QUOTE_LOOKUP_FAILED");
  }

  return data;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "quotes patch auth",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "modifier un devis",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Identifiant devis invalide" }, { status: 400 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = patchQuoteBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const existing = await loadQuote(id);
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if (!actorResult.actor.isAdmin && existing.concierge_profile_id !== actorResult.actor.userId) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Seuls les devis en brouillon peuvent etre modifies." },
        { status: 409 },
      );
    }

    const body = parsedBody.data;
    const safeItems = parseQuoteItems(body.items as QuoteItemInput[] | undefined);

    const quotePatch: Record<string, unknown> = {
      currency: sanitizeCurrency(body.currency),
      discount_amount: round2(Number(body.discount_amount ?? 0)),
      tax_rate: round2(Number(body.tax_rate ?? 0)),
      valid_until: body.valid_until ?? null,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await db.from("quotes").update(quotePatch).eq("id", id);
    if (updateError) {
      console.error("[PATCH /api/quotes/:id] quote update error:", updateError);
      if (MISSING_TABLE_CODES.has(updateError.code ?? "")) {
        return NextResponse.json({ error: "Module devis non active." }, { status: 503 });
      }
      return NextResponse.json({ error: "Erreur mise a jour devis" }, { status: 500 });
    }

    if (body.items) {
      const { error: deleteItemsError } = await db.from("quote_items").delete().eq("quote_id", id);
      if (deleteItemsError) {
        console.error("[PATCH /api/quotes/:id] delete items error:", deleteItemsError);
        return NextResponse.json({ error: "Erreur mise a jour lignes devis" }, { status: 500 });
      }

      if (safeItems.length > 0) {
        const { error: insertItemsError } = await db.from("quote_items").insert(
          safeItems.map((item) => ({
            quote_id: id,
            service_id: item.service_id ?? null,
            pricing_id: item.pricing_id ?? null,
            label: item.label,
            description: item.description ?? null,
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price,
            line_total: round2((item.quantity ?? 1) * item.unit_price),
            sort_order: item.sort_order ?? 0,
            metadata: item.metadata ?? {},
          })),
        );

        if (insertItemsError) {
          console.error("[PATCH /api/quotes/:id] insert items error:", insertItemsError);
          return NextResponse.json({ error: "Erreur mise a jour lignes devis" }, { status: 500 });
        }
      }
    }

    const { error: eventError } = await db.from("quote_events").insert({
      quote_id: id,
      actor_profile_id: actorResult.actor.userId,
      event_type: "updated",
      payload: {
        source: "billing_desk",
        item_count: body.items ? safeItems.length : undefined,
      },
    });
    if (eventError) {
      console.error("[PATCH /api/quotes/:id] quote event error:", eventError);
    }

    const { data: hydrated, error: hydratedError } = await db
      .from("quotes")
      .select(quoteSelect)
      .eq("id", id)
      .single();

    if (hydratedError || !hydrated) {
      console.error("[PATCH /api/quotes/:id] hydrate error:", hydratedError);
      return NextResponse.json({ id, ...quotePatch }, { status: 200 });
    }

    return NextResponse.json(hydrated);
  } catch (err) {
    console.error("[PATCH /api/quotes/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
