import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { requireActor } from "@/app/lib/apiSecurity";
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

type OwnerProfileRow = {
  id: string;
  role: string | null;
  status: string | null;
};

type PropertyRow = {
  id: string;
  owner_id: string | null;
  status: string | null;
};

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
const OWNER_MISSION_ROLES = new Set(["owner", "owner_pro"]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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

async function loadOwnerProfile(ownerProfileId: string): Promise<OwnerProfileRow | null> {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", ownerProfileId)
    .maybeSingle();

  if (error) {
    console.error("[missions owner lookup] DB error:", error);
    throw new Error("OWNER_LOOKUP_FAILED");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    role: data.role,
    status: (data as { status?: string | null }).status ?? null,
  };
}

async function loadProperty(propertyId: string): Promise<PropertyRow | null> {
  const { data, error } = await db
    .from("properties")
    .select("id, owner_id, status")
    .eq("id", propertyId)
    .maybeSingle();

  if (error) {
    console.error("[missions property lookup] DB error:", error);
    throw new Error("PROPERTY_LOOKUP_FAILED");
  }

  return data;
}

export async function GET(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "missions collection auth",
      actionLabel: "consulter les missions",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { actor } = actorResult;
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const ownerProfileId = url.searchParams.get("ownerProfileId");
    const limitParam = Number(url.searchParams.get("limit") ?? "50");
    const requestedScope = url.searchParams.get("scope") ?? "concierge";
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    const actorIsConcierge = CONCIERGE_MISSION_ROLES.has(actor.role);
    const actorIsOwner = OWNER_MISSION_ROLES.has(actor.role);
    const scope =
      requestedScope === "all" || requestedScope === "owner" || requestedScope === "concierge"
        ? requestedScope
        : "concierge";

    if (ownerProfileId && !isUuidLike(ownerProfileId)) {
      return NextResponse.json({ error: "ownerProfileId invalide" }, { status: 400 });
    }

    if (!actor.isAdmin) {
      if (scope === "owner" && !actorIsOwner) {
        return NextResponse.json(
          { error: "Seuls les proprietaires peuvent consulter cette vue." },
          { status: 403 },
        );
      }

      if ((scope === "concierge" || scope === "all") && !actorIsConcierge) {
        return NextResponse.json(
          { error: "Seuls les concierges peuvent consulter cette vue." },
          { status: 403 },
        );
      }

      if (scope === "owner" && ownerProfileId && ownerProfileId !== actor.userId) {
        return NextResponse.json(
          { error: "Vous ne pouvez consulter que vos propres missions." },
          { status: 403 },
        );
      }
    }

    let query = db
      .from("missions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (scope === "owner") {
      query = query.eq("owner_profile_id", actor.userId);
    } else if (scope === "all") {
      if (!actor.isAdmin && !actorIsConcierge) {
        return NextResponse.json({ error: "Non autorise" }, { status: 403 });
      }
      query = actor.isAdmin
        ? query
        : query.or(
            `concierge_profile_id.eq.${actor.userId},owner_profile_id.eq.${actor.userId}`,
          );
    } else {
      query = actor.isAdmin ? query : query.eq("concierge_profile_id", actor.userId);
    }

    if (status && VALID_STATUS.includes(status as MissionStatus)) {
      query = query.eq("status", status);
    }
    if (ownerProfileId) {
      query = query.eq("owner_profile_id", ownerProfileId);
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
    const actorResult = await requireActor(req, {
      logLabel: "missions create auth",
      allowedRoles: CONCIERGE_MISSION_ROLES,
      actionLabel: "creer une mission",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { actor } = actorResult;
    const body: CreateMissionBody = await req.json();
    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    const requestedOwnerId = typeof body.owner_profile_id === "string" ? body.owner_profile_id : null;
    const requestedPropertyId = typeof body.property_id === "string" ? body.property_id : null;

    if (requestedOwnerId && !isUuidLike(requestedOwnerId)) {
      return NextResponse.json({ error: "owner_profile_id invalide" }, { status: 400 });
    }

    if (requestedPropertyId && !isUuidLike(requestedPropertyId)) {
      return NextResponse.json({ error: "property_id invalide" }, { status: 400 });
    }

    let ownerProfile: OwnerProfileRow | null = null;
    if (requestedOwnerId) {
      ownerProfile = await loadOwnerProfile(requestedOwnerId);
      if (!ownerProfile) {
        return NextResponse.json({ error: "owner_profile_id introuvable" }, { status: 404 });
      }

      const ownerRole = typeof ownerProfile.role === "string" ? ownerProfile.role : "";
      if (!actor.isAdmin && ownerProfile.status !== "active") {
        return NextResponse.json(
          { error: "Le proprietaire cible ne peut pas recevoir de mission." },
          { status: 403 },
        );
      }

      if (!OWNER_MISSION_ROLES.has(ownerRole)) {
        return NextResponse.json({ error: "owner_profile_id invalide" }, { status: 400 });
      }
    }

    let property: PropertyRow | null = null;
    if (requestedPropertyId) {
      property = await loadProperty(requestedPropertyId);
      if (!property) {
        return NextResponse.json({ error: "property_id introuvable" }, { status: 404 });
      }

      if (!actor.isAdmin && property.status && property.status !== "active") {
        return NextResponse.json(
          { error: "Le logement cible ne peut pas recevoir de mission." },
          { status: 403 },
        );
      }

      if (requestedOwnerId && property.owner_id && property.owner_id !== requestedOwnerId) {
        return NextResponse.json(
          { error: "Le logement cible n'appartient pas au proprietaire selectionne." },
          { status: 403 },
        );
      }
    }

    const effectiveOwnerId = requestedOwnerId ?? property?.owner_id ?? null;
    if (requestedPropertyId && !effectiveOwnerId) {
      return NextResponse.json(
        { error: "Impossible de determiner le proprietaire du logement cible." },
        { status: 400 },
      );
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
        concierge_profile_id: actor.userId,
        owner_profile_id: effectiveOwnerId,
        property_id: requestedPropertyId,
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
      actor_profile_id: actor.userId,
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
