import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

interface CreateQuoteFromMissionBody {
  mission_id?: string;
  quantity?: number;
}

interface DbErrorLike {
  code?: string;
  message?: string;
}

const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);

const round2 = (value: number): number => Math.round(value * 100) / 100;

const getDbErrorMessage = (error: DbErrorLike | null, fallback: string): string => {
  const code = error?.code ?? "";

  if (code === "42P01" || code === "PGRST205" || code === "PGRST204") {
    return "Tables devis/factures introuvables. Executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.";
  }
  if (code === "23503") {
    return "Reference invalide (mission, proprietaire, service ou tarif).";
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
      error: "Module devis non active: executez la migration SQL 20260223_quotes_invoices_core.sql dans Supabase.",
      feature_disabled: true,
    },
    { status: 503 },
  );

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

export async function POST(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "POST /api/quotes/from-mission",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "créer un devis depuis une mission",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const body: CreateQuoteFromMissionBody = await req.json();
    const missionId = body.mission_id?.trim();
    if (!missionId) {
      return NextResponse.json({ error: "mission_id requis" }, { status: 400 });
    }

    const quantity = Number(body.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "quantity invalide" }, { status: 400 });
    }

    const { data: mission, error: missionError } = await db
      .from("missions")
      .select(
        "id, concierge_profile_id, owner_profile_id, service_id, title, description, amount, currency, status",
      )
      .eq("id", missionId)
      .maybeSingle();

    if (missionError) {
      console.error("[POST /api/quotes/from-mission] mission error:", missionError);
      return NextResponse.json(
        { error: getDbErrorMessage(missionError, "Erreur lecture mission") },
        { status: 500 },
      );
    }
    if (!mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }

    if (!actorResult.actor.isAdmin && mission.concierge_profile_id !== actorResult.actor.userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à créer un devis depuis cette mission." },
        { status: 403 },
      );
    }

    let unitPrice = Number(mission.amount ?? 0);
    let pricingId: string | null = null;

    const pricingProfileId = actorResult.actor.isAdmin
      ? (mission.concierge_profile_id ?? actorResult.actor.userId)
      : actorResult.actor.userId;

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      let pricingQuery = db
        .from("services_pricing")
        .select("id, amount")
        .eq("profile_id", pricingProfileId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (mission.service_id !== null) {
        pricingQuery = pricingQuery.eq("service_id", mission.service_id);
      }

      const { data: pricingRows, error: pricingError } = await pricingQuery;
      if (pricingError) {
        console.error("[POST /api/quotes/from-mission] pricing error:", pricingError);
      }

      const fallbackPricing = (pricingRows ?? [])[0];
      if (fallbackPricing) {
        unitPrice = Number(fallbackPricing.amount ?? 0);
        pricingId = fallbackPricing.id;
      }
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json(
        {
          error:
            "Aucun montant exploitable sur la mission. Definissez un montant de mission ou un tarif correspondant.",
        },
        { status: 400 },
      );
    }

    const brandingProfileId = actorResult.actor.isAdmin
      ? (mission.concierge_profile_id ?? actorResult.actor.userId)
      : actorResult.actor.userId;

    const { data: conciergeBranding } = await db
      .from("profiles")
      .select(
        "company_name, legal_form, first_name, last_name, email, phone, street_address, postal_code, city, country, siret, vat_number",
      )
      .eq("id", brandingProfileId)
      .maybeSingle();

    const { data: createdQuote, error: quoteError } = await db
      .from("quotes")
      .insert({
        concierge_profile_id: mission.concierge_profile_id ?? actorResult.actor.userId,
        owner_profile_id: mission.owner_profile_id ?? null,
        mission_id: mission.id,
        status: "draft",
        currency: (mission.currency ?? "EUR").toUpperCase(),
        notes: `Devis genere depuis mission ${mission.id}`,
        metadata: {
          source: "mission",
          mission_status: mission.status,
          branding_snapshot: conciergeBranding ?? null,
        },
      })
      .select("id, quote_number")
      .single();

    if (quoteError || !createdQuote) {
      console.error("[POST /api/quotes/from-mission] quote error:", quoteError);
      if (MISSING_TABLE_CODES.has(quoteError?.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(quoteError, "Erreur creation devis") },
        { status: 500 },
      );
    }

    const { error: itemError } = await db.from("quote_items").insert({
      quote_id: createdQuote.id,
      service_id: mission.service_id,
      pricing_id: pricingId,
      label: mission.title,
      description: mission.description ?? null,
      quantity: round2(quantity),
      unit_price: round2(unitPrice),
      line_total: round2(quantity * unitPrice),
      sort_order: 0,
      metadata: {
        source: "mission",
      },
    });

    if (itemError) {
      console.error("[POST /api/quotes/from-mission] quote_item error:", itemError);
      await db.from("quotes").delete().eq("id", createdQuote.id);
      if (MISSING_TABLE_CODES.has(itemError.code ?? "")) {
        return buildFeatureDisabledResponse();
      }
      return NextResponse.json(
        { error: getDbErrorMessage(itemError, "Erreur creation ligne devis") },
        { status: 500 },
      );
    }

    const { error: eventError } = await db.from("quote_events").insert({
      quote_id: createdQuote.id,
      actor_profile_id: actorResult.actor.userId,
      event_type: "created",
      payload: {
        source: "mission",
        mission_id: mission.id,
        actor_role: actorResult.actor.role,
      },
    });
    if (eventError) {
      console.error("[POST /api/quotes/from-mission] event error:", eventError);
    }

    const { data: hydrated, error: hydratedError } = await db
      .from("quotes")
      .select(quoteSelect)
      .eq("id", createdQuote.id)
      .single();

    if (hydratedError || !hydrated) {
      console.error("[POST /api/quotes/from-mission] hydrate error:", hydratedError);
      return NextResponse.json(createdQuote, { status: 201 });
    }

    return NextResponse.json(hydrated, { status: 201 });
  } catch (err) {
    console.error("[POST /api/quotes/from-mission] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
