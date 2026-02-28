import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";
import { parseStripeSubscriptionSnapshot } from "@/app/lib/stripeHistory";

const ALLOWED_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Acces reserve aux concierges." }, { status: 403 });
    }

    const [{ data: profile, error: profileError }, { data: stripeEvents, error: stripeEventsError }] =
      await Promise.all([
        db
          .from("profiles")
          .select("id, role, additional_info, updated_at")
          .eq("id", auth.userId)
          .maybeSingle(),
        db
          .from("stripe_events")
          .select("id, profile_id, stripe_object_id, stripe_event_type, source, payload, created_at")
          .eq("profile_id", auth.userId)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

    if (profileError) {
      return NextResponse.json({ error: "Erreur lecture abonnement." }, { status: 500 });
    }
    if (stripeEventsError) {
      return NextResponse.json({ error: "Erreur lecture historique Stripe." }, { status: 500 });
    }

    const subscription = profile
      ? parseStripeSubscriptionSnapshot({
          role: profile.role,
          additional_info: profile.additional_info,
          updated_at: profile.updated_at,
        })
      : null;

    return NextResponse.json({
      subscription,
      events: stripeEvents ?? [],
    });
  } catch (err) {
    console.error("[GET /api/billing/history] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
