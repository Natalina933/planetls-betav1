import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";

type BillingPlan = "concierge_pro_monthly";

const PLAN_PRICE_ENV: Record<BillingPlan, string> = {
  concierge_pro_monthly: "STRIPE_PRICE_CONCIERGE_PRO_MONTHLY",
};

const ALLOWED_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);

function buildStripeCheckoutBody(params: {
  priceId: string;
  origin: string;
  customerEmail?: string | null;
  userId: string;
}) {
  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("success_url", `${params.origin}/abonnement/concierge-pro?checkout=success`);
  form.set("cancel_url", `${params.origin}/abonnement/concierge-pro?checkout=cancel`);
  form.set("line_items[0][price]", params.priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[user_id]", params.userId);
  form.set("metadata[plan]", "concierge_pro_monthly");

  if (params.customerEmail) {
    form.set("customer_email", params.customerEmail);
  }

  return form;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces reserve aux concierges." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan === "concierge_pro_monthly" ? "concierge_pro_monthly" : null;
    if (!plan) {
      return NextResponse.json({ error: "Plan Stripe invalide." }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env[PLAN_PRICE_ENV[plan]];
    if (!secretKey || !priceId) {
      return NextResponse.json(
        {
          error:
            "Stripe n'est pas encore configure. Ajoutez STRIPE_SECRET_KEY et STRIPE_PRICE_CONCIERGE_PRO_MONTHLY.",
        },
        { status: 503 },
      );
    }

    const origin = req.nextUrl.origin;
    const payload = buildStripeCheckoutBody({
      priceId,
      origin,
      customerEmail: auth.email,
      userId: auth.userId,
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return NextResponse.json(
        {
          error:
            stripePayload?.error?.message ||
            "Impossible de creer la session Stripe pour l'abonnement.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      id: stripePayload.id,
      url: stripePayload.url,
    });
  } catch (err) {
    console.error("[POST /api/billing/checkout] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
