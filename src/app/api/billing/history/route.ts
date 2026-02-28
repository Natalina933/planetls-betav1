import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";

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

    const [{ data: profile, error: profileError }, { data: invoices, error: invoicesError }] =
      await Promise.all([
        db
          .from("profiles")
          .select("id, role, additional_info, updated_at")
          .eq("id", auth.userId)
          .maybeSingle(),
        db
          .from("invoices")
          .select(
            "id, invoice_number, status, updated_at, invoice_events(id, event_type, payload, created_at, actor_profile_id)",
          )
          .eq("concierge_profile_id", auth.userId)
          .order("updated_at", { ascending: false })
          .limit(12),
      ]);

    if (profileError) {
      return NextResponse.json({ error: "Erreur lecture abonnement." }, { status: 500 });
    }
    if (invoicesError) {
      return NextResponse.json({ error: "Erreur lecture historique factures." }, { status: 500 });
    }

    const additionalInfo = typeof profile?.additional_info === "string" ? profile.additional_info : "";
    let subscription = null as null | {
      is_pro: boolean;
      source: string | null;
      reference: string | null;
      updated_at: string | null;
    };

    if (additionalInfo.startsWith("stripe_subscription:")) {
      const raw = additionalInfo.replace("stripe_subscription:", "").trim();
      const [source, ...rest] = raw.split(":");
      subscription = {
        is_pro: profile?.role === "concierge_pro",
        source: source || null,
        reference: rest.join(":").trim() || null,
        updated_at: profile?.updated_at ?? null,
      };
    } else {
      subscription = {
        is_pro: profile?.role === "concierge_pro",
        source: null,
        reference: null,
        updated_at: profile?.updated_at ?? null,
      };
    }

    const invoiceEvents = (invoices ?? []).flatMap((invoice) =>
      (invoice.invoice_events ?? []).map((event) => ({
        id: event.id,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_status: invoice.status,
        event_type: event.event_type,
        payload: event.payload,
        created_at: event.created_at,
      })),
    );

    return NextResponse.json({
      subscription,
      invoice_events: invoiceEvents
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 20),
    });
  } catch (err) {
    console.error("[GET /api/billing/history] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
