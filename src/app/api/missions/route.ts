import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";

type MissionStatus =
  | "draft"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "canceled";

type MissionPriority = "low" | "normal" | "high" | "urgent";

interface CreateMissionBody {
  owner_profile_id?: string | null;
  property_id?: string | null;
  service_id?: number | null;
  title?: string;
  description?: string | null;
  status?: MissionStatus;
  priority?: MissionPriority;
  amount?: number | null;
  currency?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  metadata?: Json | null;
}

const VALID_STATUS: MissionStatus[] = [
  "draft",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "canceled",
];

const VALID_PRIORITY: MissionPriority[] = ["low", "normal", "high", "urgent"];
const CONCIERGE_MISSION_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);

const mapMissionInsertError = (error: {
  code?: string;
  message?: string;
  details?: string;
} | null) => {
  const code = error?.code ?? "";

  if (code === "42P01") {
    return {
      status: 500,
      error:
        "Table missions introuvable sur la base. Lancez les migrations Supabase (ex: supabase db push).",
    };
  }

  if (code === "23503") {
    return {
      status: 400,
      error:
        "Reference invalide (proprietaire, logement ou service). Verifiez les valeurs selectionnees.",
    };
  }

  if (code === "22P02") {
    return {
      status: 400,
      error: "Format de donnee invalide (UUID/date). Verifiez le formulaire.",
    };
  }

  if (code === "23514") {
    return {
      status: 400,
      error:
        "Valeur invalide pour le statut, la priorite ou le montant de la mission.",
    };
  }

  return {
    status: 500,
    error:
      error?.message && process.env.NODE_ENV !== "production"
        ? `Erreur creation mission: ${error.message}`
        : "Erreur creation mission",
  };
};

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limitParam = Number(url.searchParams.get("limit") ?? "50");
    const scopeParam = url.searchParams.get("scope") ?? "concierge";
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    let query = db
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (scopeParam === "owner") {
      query = query.eq("owner_profile_id", auth.userId);
    } else if (scopeParam === "all") {
      if (!CONCIERGE_MISSION_ROLES.has(auth.role)) {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 });
      }
      query = query.or(`concierge_profile_id.eq.${auth.userId},owner_profile_id.eq.${auth.userId}`);
    } else {
      if (!CONCIERGE_MISSION_ROLES.has(auth.role)) {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 });
      }
      query = query.eq("concierge_profile_id", auth.userId);
    }

    if (status && VALID_STATUS.includes(status as MissionStatus)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[GET /api/missions] DB error:", error);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/missions] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (!CONCIERGE_MISSION_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body: CreateMissionBody = await req.json();
    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    const status: MissionStatus = VALID_STATUS.includes(body.status as MissionStatus)
      ? (body.status as MissionStatus)
      : "draft";
    const priority: MissionPriority = VALID_PRIORITY.includes(body.priority as MissionPriority)
      ? (body.priority as MissionPriority)
      : "normal";

    const { data, error } = await db
      .from("missions")
      .insert({
        concierge_profile_id: auth.userId,
        owner_profile_id: body.owner_profile_id ?? null,
        property_id: body.property_id ?? null,
        service_id: body.service_id ?? null,
        title,
        description: body.description ?? null,
        status,
        priority,
        amount: body.amount ?? null,
        currency: body.currency ?? "EUR",
        scheduled_start: body.scheduled_start ?? null,
        scheduled_end: body.scheduled_end ?? null,
        metadata: body.metadata ?? {},
      })
      .select(
        "id, concierge_profile_id, owner_profile_id, property_id, service_id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, response_time_minutes, started_at, completed_at, canceled_at, cancel_reason, metadata, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      console.error("[POST /api/missions] DB error:", error);
      const mapped = mapMissionInsertError(error);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    const { error: eventError } = await db.from("mission_events").insert({
      mission_id: data.id,
      actor_profile_id: auth.userId,
      event_type: "created",
      payload: {
        status: data.status,
      },
    });

    if (eventError) {
      console.error("[POST /api/missions] mission_events error:", eventError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/missions] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
