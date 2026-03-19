import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

const CONCIERGE_MISSION_ROLES = new Set([
  "admin",
  "super_admin",
  "concierge",
  "concierge_pro",
]);
const OWNER_MISSION_ROLES = new Set(["owner", "owner_pro"]);

const patchMissionSchema = z.object({
  scheduled_start: z.string().datetime().nullable().optional(),
  scheduled_end: z.string().datetime().nullable().optional(),
  request_reschedule: z.boolean().optional(),
  accept_reschedule: z.boolean().optional(),
  reject_reschedule: z.boolean().optional(),
});

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "missions patch auth",
      allowedRoles: new Set([...CONCIERGE_MISSION_ROLES, ...OWNER_MISSION_ROLES]),
      actionLabel: "modifier une mission",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const { id } = await params;
    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Identifiant mission invalide" }, { status: 400 });
    }

    const parsedBody = patchMissionSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const { scheduled_start, scheduled_end, request_reschedule, accept_reschedule, reject_reschedule } =
      parsedBody.data;
    if (scheduled_start && scheduled_end && new Date(scheduled_end) <= new Date(scheduled_start)) {
      return NextResponse.json(
        { error: "La fin doit etre posterieure au debut." },
        { status: 400 },
      );
    }

    const { data: existing, error: lookupError } = await db
      .from("missions")
      .select("id, concierge_profile_id, owner_profile_id, metadata")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("[PATCH /api/missions/:id] lookup error:", lookupError);
      return NextResponse.json({ error: "Impossible de charger la mission." }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }
    const actorId = actorResult.actor.userId;
    const actorRole = actorResult.actor.role;
    const isConciergeActor =
      actorResult.actor.isAdmin ||
      (CONCIERGE_MISSION_ROLES.has(actorRole) && existing.concierge_profile_id === actorId);
    const isOwnerActor =
      OWNER_MISSION_ROLES.has(actorRole) &&
      "owner_profile_id" in existing &&
      (existing as { owner_profile_id?: string | null }).owner_profile_id === actorId;

    if (!isConciergeActor && !isOwnerActor) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (accept_reschedule || reject_reschedule) {
      if (!isConciergeActor && !actorResult.actor.isAdmin) {
        return NextResponse.json(
          { error: "Seul le concierge peut traiter cette demande de reprogrammation." },
          { status: 403 },
        );
      }

      const currentMetadata = ((existing.metadata as Record<string, unknown> | null) ?? {});
      const requestedStart =
        typeof currentMetadata.owner_requested_schedule_start === "string"
          ? currentMetadata.owner_requested_schedule_start
          : null;
      const requestedEnd =
        typeof currentMetadata.owner_requested_schedule_end === "string"
          ? currentMetadata.owner_requested_schedule_end
          : null;

      if (!requestedStart) {
        return NextResponse.json(
          { error: "Aucune demande de reprogrammation en attente pour cette mission." },
          { status: 409 },
        );
      }

      const nextMetadata: Record<string, unknown> = {
        ...currentMetadata,
        owner_requested_schedule_reviewed_at: new Date().toISOString(),
        owner_requested_schedule_reviewed_by: actorId,
      };

      let notificationType = "mission_reschedule_rejected";
      let notificationTitle = "Demande de reprogrammation refusee";
      let notificationBody = "Le concierge a refuse le creneau propose pour cette mission.";
      let eventType = "reschedule_rejected";
      let updatePayload: Record<string, unknown> = {
        metadata: {
          ...nextMetadata,
          owner_requested_schedule_status: "rejected",
        },
        updated_at: new Date().toISOString(),
      };

      if (accept_reschedule) {
        notificationType = "mission_reschedule_accepted";
        notificationTitle = "Nouveau creneau confirme";
        notificationBody = "Le concierge a accepte le nouveau creneau propose pour cette mission.";
        eventType = "reschedule_accepted";
        updatePayload = {
          scheduled_start: requestedStart,
          scheduled_end: requestedEnd,
          metadata: {
            ...nextMetadata,
            owner_requested_schedule_status: "accepted",
            planning_updated_at: new Date().toISOString(),
            planning_updated_by: actorId,
          },
          updated_at: new Date().toISOString(),
        };
      }

      const { data: updated, error: updateError } = await db
        .from("missions")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError || !updated) {
        console.error("[PATCH /api/missions/:id] reschedule review update error:", updateError);
        return NextResponse.json(
          { error: "Impossible de traiter la demande de reprogrammation." },
          { status: 500 },
        );
      }

      if ((existing as { owner_profile_id?: string | null }).owner_profile_id) {
        await dbAny.from("workflow_notifications").insert({
          recipient_profile_id: (existing as { owner_profile_id?: string | null }).owner_profile_id,
          actor_profile_id: actorId,
          notification_type: notificationType,
          title: notificationTitle,
          body: notificationBody,
          entity_type: "mission",
          entity_id: id,
          action_url: "/dashboard/owner/planning",
          metadata: {
            mission_id: id,
            requested_start: requestedStart,
            requested_end: requestedEnd,
          },
        });
      }

      const { error: eventError } = await db.from("mission_events").insert({
        mission_id: id,
        actor_profile_id: actorId,
        event_type: eventType,
        payload: {
          requested_start: requestedStart,
          requested_end: requestedEnd,
          source: "concierge_planning",
        },
      });

      if (eventError) {
        console.error("[PATCH /api/missions/:id] reschedule review event error:", eventError);
      }

      return NextResponse.json(updated);
    }

    if (request_reschedule) {
      if (!isOwnerActor && !actorResult.actor.isAdmin) {
        return NextResponse.json(
          { error: "Seul le proprietaire peut proposer un nouveau creneau depuis cette vue." },
          { status: 403 },
        );
      }
      if (!scheduled_start) {
        return NextResponse.json(
          { error: "Une date de debut est requise pour proposer un nouveau creneau." },
          { status: 400 },
        );
      }

      const metadata = {
        ...((existing.metadata as Record<string, unknown> | null) ?? {}),
        owner_requested_schedule_start: scheduled_start,
        owner_requested_schedule_end: scheduled_end ?? null,
        owner_requested_schedule_at: new Date().toISOString(),
        owner_requested_schedule_by: actorId,
      };

      const { data: updated, error: updateError } = await db
        .from("missions")
        .update({
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateError || !updated) {
        console.error("[PATCH /api/missions/:id] owner request update error:", updateError);
        return NextResponse.json(
          { error: "Impossible d'enregistrer votre demande de reprogrammation." },
          { status: 500 },
        );
      }

      if ((existing as { concierge_profile_id?: string | null }).concierge_profile_id) {
        await dbAny.from("workflow_notifications").insert({
          recipient_profile_id: (existing as { concierge_profile_id?: string | null }).concierge_profile_id,
          actor_profile_id: actorId,
          notification_type: "mission_reschedule_requested",
          title: "Demande de reprogrammation",
          body: "Le proprietaire a propose un nouveau creneau pour une mission.",
          entity_type: "mission",
          entity_id: id,
          action_url: "/dashboard/concierge/planning",
          metadata: {
            mission_id: id,
            requested_start: scheduled_start,
            requested_end: scheduled_end ?? null,
          },
        });
      }

      const { error: eventError } = await db.from("mission_events").insert({
        mission_id: id,
        actor_profile_id: actorId,
        event_type: "reschedule_requested",
        payload: {
          scheduled_start,
          scheduled_end: scheduled_end ?? null,
          source: "owner_planning",
        },
      });

      if (eventError) {
        console.error("[PATCH /api/missions/:id] reschedule request event error:", eventError);
      }

      return NextResponse.json(updated);
    }

    const metadata = {
      ...((existing.metadata as Record<string, unknown> | null) ?? {}),
      planning_updated_at: new Date().toISOString(),
      planning_updated_by: actorId,
    };

    const { data: updated, error: updateError } = await db
      .from("missions")
      .update({
        scheduled_start: scheduled_start ?? null,
        scheduled_end: scheduled_end ?? null,
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("[PATCH /api/missions/:id] update error:", updateError);
      return NextResponse.json({ error: "Impossible de reprogrammer la mission." }, { status: 500 });
    }

    const { error: eventError } = await db.from("mission_events").insert({
      mission_id: id,
      actor_profile_id: actorId,
      event_type: "scheduled",
      payload: {
        scheduled_start: scheduled_start ?? null,
        scheduled_end: scheduled_end ?? null,
        source: "concierge_planning",
      },
    });

    if (eventError) {
      console.error("[PATCH /api/missions/:id] mission_events error:", eventError);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/missions/:id] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
