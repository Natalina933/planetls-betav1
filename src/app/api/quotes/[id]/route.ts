import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";

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
};

type UpdateQuoteBody = {
  package_id?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  items?: QuoteItemInput[];
};

const ALLOWED_BILLING_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro"]);

const round2 = (value: number): number => Math.round(value * 100) / 100;

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
    pricing_id
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

    const { data: existing, error: existingError } = await db
      .from("quotes")
      .select("id, status, concierge_profile_id")
      .eq("id", id)
      .eq("concierge_profile_id", userId)
      .maybeSingle();

    if (existingError) {
      console.error("[PATCH /api/quotes/:id] read error:", existingError);
      return NextResponse.json({ error: "Erreur lecture devis" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if (!["draft", "canceled"].includes(String(existing.status ?? ""))) {
      return NextResponse.json(
        { error: "Seuls les devis brouillons peuvent être modifiés." },
        { status: 400 },
      );
    }

    const sanitizedItems = Array.isArray(body.items)
      ? body.items
          .map((item, index) => ({
            id: item.id,
            label: typeof item.label === "string" ? item.label.trim() : "",
            description: typeof item.description === "string" ? item.description.trim() : null,
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
            sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index,
          }))
          .filter(
            (item) =>
              item.label.length > 0 &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0 &&
              Number.isFinite(item.unit_price) &&
              item.unit_price >= 0,
          )
      : [];

    const updatePayload = {
      package_id: typeof body.package_id === "string" && body.package_id.trim() ? body.package_id : null,
      valid_until: body.valid_until ?? null,
      notes: body.notes ?? null,
      discount_amount: round2(Number(body.discount_amount ?? 0)),
      tax_rate: round2(Number(body.tax_rate ?? 0)),
    };

    const { error: updateError } = await db
      .from("quotes")
      .update(updatePayload)
      .eq("id", id)
      .eq("concierge_profile_id", userId);

    if (updateError) {
      console.error("[PATCH /api/quotes/:id] update error:", updateError);
      return NextResponse.json({ error: "Erreur mise à jour devis" }, { status: 500 });
    }

    if (Array.isArray(body.items)) {
      const { error: deleteItemsError } = await db.from("quote_items").delete().eq("quote_id", id);
      if (deleteItemsError) {
        console.error("[PATCH /api/quotes/:id] delete items error:", deleteItemsError);
        return NextResponse.json({ error: "Erreur mise à jour lignes devis" }, { status: 500 });
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
            metadata: {},
          })),
        );

        if (insertItemsError) {
          console.error("[PATCH /api/quotes/:id] insert items error:", insertItemsError);
          return NextResponse.json({ error: "Erreur sauvegarde lignes devis" }, { status: 500 });
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
      return NextResponse.json({ error: "Erreur rechargement devis" }, { status: 500 });
    }

    return NextResponse.json(hydrated);
  } catch (err) {
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
      return NextResponse.json({ error: "Erreur lecture devis" }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }
    if ((existing.status as QuoteStatus) !== "draft") {
      return NextResponse.json(
        { error: "Seuls les devis brouillons non envoyés peuvent être supprimés." },
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
      return NextResponse.json({ error: "Erreur vérification factures liées" }, { status: 500 });
    }
    if (Array.isArray(linkedInvoices) && linkedInvoices.length > 0) {
      return NextResponse.json(
        { error: "Ce devis ne peut plus être supprimé car une facture existe déjà." },
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
      return NextResponse.json({ error: "Erreur suppression devis" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/quotes/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
