import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { db } from "@/app/lib/dbServer";

const OWNER_ROLES = new Set(["owner", "owner_pro"]);
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "provider", "provider_pro", "artisan", "artisan_pro"]);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST204", "PGRST205"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function parseLimit(value: string | null) {
  const raw = Number(value ?? "30");
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 100) : 30;
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const unreadOnly = url.searchParams.get("unread") === "1";
    const reservationId = url.searchParams.get("reservationId");
    const serviceRequestId = url.searchParams.get("serviceRequestId");
    const quoteId = url.searchParams.get("quoteId");
    const missionId = url.searchParams.get("missionId");

    const dbAny = asLooseSupabaseClient(db);
    let query = dbAny
      .from("workflow_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (OWNER_ROLES.has(role)) {
      query = query.eq("owner_profile_id", userId);
    } else if (CONCIERGE_ROLES.has(role)) {
      query = query.eq("concierge_profile_id", userId);
    } else if (!ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (unreadOnly) query = query.is("read_at", null);
    if (reservationId && isUuidLike(reservationId)) query = query.eq("reservation_id", reservationId);
    if (serviceRequestId && isUuidLike(serviceRequestId)) query = query.eq("service_request_id", serviceRequestId);
    if (quoteId && isUuidLike(quoteId)) query = query.eq("quote_id", quoteId);
    if (missionId && isUuidLike(missionId)) query = query.eq("mission_id", missionId);

    const { data, error } = await query;
    if (error) {
      if (MISSING_TABLE_CODES.has(error.code ?? "")) {
        return NextResponse.json({ items: [], feature_pending: true });
      }
      console.error("[GET /api/workflow-events] DB error:", error);
      return NextResponse.json({ error: "Erreur chargement notifications." }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (err) {
    console.error("[GET /api/workflow-events] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
