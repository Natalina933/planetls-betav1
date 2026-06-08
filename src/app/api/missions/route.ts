import { NextRequest, NextResponse } from "next/server";
import { insertMissionWithOptionalMetadata } from "@/app/api/_shared/missionInsert";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { deriveMissionWorkflowStatus } from "@/app/lib/commercialWorkflow";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { Json } from "@/types/supabase";

type MissionStatus =
  | "draft"
  | "assigned"
  | "to_schedule"
  | "date_requested"
  | "date_proposed"
  | "date_confirmed"
  | "scheduled"
  | "accepted"
  | "in_progress"
  | "completed"
  | "canceled";

type MissionPriority = "low" | "normal" | "high" | "urgent";

interface CreateMissionBody {
  concierge_profile_id?: string | null;
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

type CreatedMissionRow = {
  id: string;
  concierge_profile_id: string | null;
  owner_profile_id: string | null;
  property_id: string | null;
  service_id: number | null;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: string | null;
  amount: number | null;
  currency: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  response_time_minutes?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  metadata?: Json | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileNameRow = {
  id: string;
  company_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  image?: string | null;
};

const VALID_STATUS: MissionStatus[] = [
  "draft",
  "assigned",
  "to_schedule",
  "date_requested",
  "date_proposed",
  "date_confirmed",
  "scheduled",
  "accepted",
  "in_progress",
  "completed",
  "canceled",
];

const VALID_PRIORITY: MissionPriority[] = ["low", "normal", "high", "urgent"];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function getMetadataString(metadata: Json | null | undefined, key: string) {
  if (!isRecord(metadata)) return "";
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function attachMissionWorkflow<T extends {
  status?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
}>(mission: T) {
  const workflowStatus = deriveMissionWorkflowStatus({
    status: mission.status,
    scheduledStart: mission.scheduled_start,
    scheduledEnd: mission.scheduled_end,
  });

  return {
    ...mission,
    workflow_status: workflowStatus,
    mission_workflow_status: workflowStatus,
  };
}

function formatProfileName(profile: ProfileNameRow | null | undefined, fallback: string) {
  if (!profile) return fallback;
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return profile.company_name || fullName || profile.username || fallback;
}

const CONCIERGE_MISSION_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);
const OWNER_MISSION_ROLES = new Set(["owner", "owner_pro"]);
const MISSION_READER_ROLES = new Set([
  ...CONCIERGE_MISSION_ROLES,
  "owner",
  "owner_pro",
]);
const MISSION_CREATOR_ROLES = new Set([
  ...CONCIERGE_MISSION_ROLES,
  ...OWNER_MISSION_ROLES,
]);

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function createMissionConversationNotification(input: {
  missionId: string;
  ownerProfileId: string | null;
  conciergeProfileId: string | null;
  actorProfileId: string;
  title: string | null;
  body: string;
}) {
  if (!input.ownerProfileId || !input.conciergeProfileId) return;

  const { data: existing } = await db
    .from("contact_conversations")
    .select("id")
    .eq("owner_profile_id", input.ownerProfileId)
    .eq("concierge_profile_id", input.conciergeProfileId)
    .eq("source", "mission")
    .eq("source_reference", input.missionId)
    .limit(1);

  let conversationId = existing?.[0]?.id ?? null;
  if (!conversationId) {
    const { data: conversation, error } = await db
      .from("contact_conversations")
      .insert({
        owner_profile_id: input.ownerProfileId,
        concierge_profile_id: input.conciergeProfileId,
        source: "mission",
        source_reference: input.missionId,
        subject: input.title || "Mission",
        metadata: {
          mission_id: input.missionId,
          notification_reason: "mission_created",
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[POST /api/missions] conversation notification error:", error);
      return;
    }
    conversationId = conversation?.id ?? null;
  }

  if (conversationId) {
    await db.from("contact_messages").insert({
      conversation_id: conversationId,
      sender_profile_id: input.actorProfileId,
      message_type: "text",
      body: input.body,
      metadata: {
        mission_id: input.missionId,
        notification_reason: "mission_created",
      },
    });
  }
}

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
    const guard = await requireApiRole(req, MISSION_READER_ROLES);
    if (!guard.ok) return guard.response;
    const auth = guard.auth;
    if (!isUuidLike(auth.userId)) {
      return NextResponse.json({ error: "Utilisateur invalide" }, { status: 401 });
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

    const missions = data ?? [];
    const conciergeIds = Array.from(
      new Set(
        missions
          .map((mission) => mission.concierge_profile_id)
          .filter((id): id is string => typeof id === "string" && isUuidLike(id)),
      ),
    );
    const profileById = new Map<string, ProfileNameRow>();

    if (conciergeIds.length > 0) {
      const dbAny = asLooseSupabaseClient(db);
      const { data: profiles, error: profilesError } = await dbAny
        .from("profiles")
        .select("id, company_name, first_name, last_name, username, avatar_url, image")
        .in("id", conciergeIds);

      if (profilesError) {
        console.error("[GET /api/missions] profiles error:", profilesError);
      } else {
        for (const profile of (profiles ?? []) as ProfileNameRow[]) {
          profileById.set(profile.id, profile);
        }
      }
    }

    return NextResponse.json(
      missions.map((mission) =>
        attachMissionWorkflow({
          ...mission,
          concierge_name: mission.concierge_profile_id
            ? formatProfileName(profileById.get(mission.concierge_profile_id), "Partenaire")
            : null,
          concierge_avatar_url: mission.concierge_profile_id
            ? profileById.get(mission.concierge_profile_id)?.avatar_url ??
              profileById.get(mission.concierge_profile_id)?.image ??
              null
            : null,
        }),
      ),
    );
  } catch (err) {
    console.error("[GET /api/missions] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, MISSION_CREATOR_ROLES);
    if (!guard.ok) return guard.response;
    const auth = guard.auth;
    if (!isUuidLike(auth.userId)) {
      return NextResponse.json({ error: "Utilisateur invalide" }, { status: 401 });
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
    const isOwnerCreator = OWNER_MISSION_ROLES.has(auth.role);
    const conciergeProfileId = isOwnerCreator ? body.concierge_profile_id : auth.userId;
    const ownerProfileId = isOwnerCreator ? auth.userId : body.owner_profile_id ?? null;

    if (!conciergeProfileId || !isUuidLike(conciergeProfileId)) {
      return NextResponse.json(
        { error: "Selectionnez une conciergerie partenaire pour cette mission." },
        { status: 400 },
      );
    }

    const { data, error } = await insertMissionWithOptionalMetadata<CreatedMissionRow>(
      db,
      {
        concierge_profile_id: conciergeProfileId,
        owner_profile_id: ownerProfileId,
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
      },
      "id, concierge_profile_id, owner_profile_id, property_id, service_id, title, status, priority, amount, currency, scheduled_start, scheduled_end, created_at, updated_at",
      "id, concierge_profile_id, owner_profile_id, property_id, service_id, title, status, priority, amount, currency, scheduled_start, scheduled_end, created_at, updated_at",
    );

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

    const serviceRequestId = getMetadataString(body.metadata, "service_request_id");
    if (serviceRequestId && ownerProfileId) {
      const dbAny = asLooseSupabaseClient(db);
      const { data: serviceRequest } = await dbAny
        .from("service_requests")
        .select("metadata")
        .eq("id", serviceRequestId)
        .eq("owner_profile_id", ownerProfileId)
        .maybeSingle();
      const requestMetadata = isRecord(serviceRequest?.metadata) ? serviceRequest.metadata : {};
      const { error: requestUpdateError } = await dbAny
        .from("service_requests")
        .update({
          mission_id: data.id,
          metadata: {
            ...requestMetadata,
            selected_mission_id: data.id,
            next_mission_title: data.title,
            next_mission_start: data.scheduled_start,
          },
        })
        .eq("id", serviceRequestId)
        .eq("owner_profile_id", ownerProfileId);

      if (requestUpdateError) {
        console.error("[POST /api/missions] service request link error:", requestUpdateError);
      }
    }

    await createMissionConversationNotification({
      missionId: data.id,
      ownerProfileId: data.owner_profile_id,
      conciergeProfileId: data.concierge_profile_id,
      actorProfileId: auth.userId,
      title: data.title,
      body: `Nouvelle mission creee: ${data.title || "Mission"}.`,
    });

    await recordWorkflowEvent(asLooseSupabaseClient(db), {
      actorProfileId: auth.userId,
      ownerProfileId: data.owner_profile_id,
      conciergeProfileId: data.concierge_profile_id,
      serviceRequestId: serviceRequestId || null,
      missionId: data.id,
      eventType: "mission_created",
      title: "Mission créée",
      body: data.title ? `Mission créée: ${data.title}.` : "Une mission a été créée.",
      actionHref: `/dashboard/missions/${data.id}`,
      serviceRequestStatus: serviceRequestId ? "accepted" : null,
      missionStatus: data.status,
      hasMission: true,
      scheduledStart: data.scheduled_start,
      scheduledEnd: data.scheduled_end,
      metadata: { source: serviceRequestId ? "service_request" : "manual" },
    });

    return NextResponse.json(attachMissionWorkflow(data), { status: 201 });
  } catch (err) {
    console.error("[POST /api/missions] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
