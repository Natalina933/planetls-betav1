import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";

const ALLOWED_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces reserve aux proprietaires." }, { status: 403 });
    }

    const { id } = await params;

    const { data: invoice, error } = await db
      .from("invoices")
      .select(
        "id, invoice_number, owner_profile_id, status, currency, balance_amount, total_amount",
      )
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
    }

    if (invoice.owner_profile_id !== auth.userId && auth.role !== "admin" && auth.role !== "super_admin") {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const amount = Number(invoice.balance_amount ?? invoice.total_amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Cette facture ne comporte aucun solde a regler." },
        { status: 400 },
      );
    }

    if (invoice.status === "paid" || invoice.status === "canceled") {
      return NextResponse.json(
        { error: "Cette facture ne peut plus etre reglee en ligne." },
        { status: 400 },
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe n'est pas encore configure. Ajoutez STRIPE_SECRET_KEY." },
        { status: 503 },
      );
    }

    const origin = req.nextUrl.origin;
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", `${origin}/dashboard/owner/factures?payment=success&invoice=${invoice.id}`);
    form.set("cancel_url", `${origin}/dashboard/owner/factures?payment=cancel&invoice=${invoice.id}`);
    form.set("line_items[0][price_data][currency]", (invoice.currency || "EUR").toLowerCase());
    form.set("line_items[0][price_data][product_data][name]", `Facture ${invoice.invoice_number || invoice.id}`);
    form.set("line_items[0][price_data][product_data][description]", "Reglement facture PlanetLS");
    form.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)));
    form.set("line_items[0][quantity]", "1");
    form.set("metadata[user_id]", auth.userId);
    form.set("metadata[invoice_id]", invoice.id);

    if (auth.email) {
      form.set("customer_email", auth.email);
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return NextResponse.json(
        {
          error:
            stripePayload?.error?.message ||
            "Impossible de creer la session de paiement Stripe.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      id: stripePayload.id,
      url: stripePayload.url,
    });
  } catch (err) {
    console.error("[POST /api/billing/invoices/:id/checkout] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
