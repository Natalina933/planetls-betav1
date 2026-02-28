import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";

const ALLOWED_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);

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
    const sessionId =
      typeof body?.session_id === "string" ? body.session_id.trim() : "";

    if (!sessionId) {
      return NextResponse.json({ error: "session_id requis." }, { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante." },
        { status: 503 },
      );
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    );

    const stripePayload = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return NextResponse.json(
        {
          error:
            stripePayload?.error?.message ||
            "Impossible de verifier la session Stripe.",
        },
        { status: 502 },
      );
    }

    const metadataUserId =
      typeof stripePayload?.metadata?.user_id === "string"
        ? stripePayload.metadata.user_id
        : null;
    const plan =
      typeof stripePayload?.metadata?.plan === "string"
        ? stripePayload.metadata.plan
        : null;

    if (metadataUserId !== auth.userId) {
      return NextResponse.json({ error: "Session Stripe non autorisee." }, { status: 403 });
    }

    if (
      stripePayload?.mode !== "subscription" ||
      stripePayload?.payment_status !== "paid" ||
      plan !== "concierge_pro_monthly"
    ) {
      return NextResponse.json(
        { error: "La session Stripe n'est pas finalisee." },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, role")
      .eq("id", auth.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    const nextRole =
      profile.role === "concierge" || profile.role === "concierge_pro"
        ? "concierge_pro"
        : profile.role;

    const { error: updateError } = await db
      .from("profiles")
      .update({
        role: nextRole,
        additional_info: `stripe_subscription:return:${sessionId}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Impossible de synchroniser le statut PRO." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      role: nextRole,
      session_id: sessionId,
    });
  } catch (err) {
    console.error("[POST /api/billing/sync] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
