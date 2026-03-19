import { NextRequest, NextResponse } from "next/server";
import { requireActor } from "@/app/lib/apiSecurity";
import { db } from "@/app/lib/dbServer";

type ClientStage = "client_active" | "client" | "prospect" | "inactive";

type ProfileLookup = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
};

type ClientItem = {
  id: string;
  owner_profile_id: string | null;
  client_name: string;
  company_name: string | null;
  city: string | null;
  status: string | null;
  stage: ClientStage;
  source: "client" | "conversation";
  missions_total: number;
  missions_active: number;
  missions_completed: number;
  latest_mission_id: string | null;
  latest_mission_title: string | null;
  latest_mission_status: string | null;
  conversation_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_conversation_count: number;
  unread_notifications: number;
  notes: string | null;
};

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbAny = db as any;

function getDisplayName(profile?: ProfileLookup | null, fallback?: string | null) {
  if (fallback && fallback.trim()) return fallback.trim();
  if (!profile) return "Proprietaire";

  return (
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    profile.company_name ||
    profile.username ||
    "Proprietaire"
  );
}

function isActiveMissionStatus(value: string | null | undefined) {
  return value === "accepted" || value === "assigned" || value === "in_progress";
}

function inferStage(params: {
  status: string | null;
  missionsActive: number;
  missionsTotal: number;
  hasConversation: boolean;
}): ClientStage {
  if (params.status === "archived" || params.status === "inactive") return "inactive";
  if (params.missionsActive > 0) return "client_active";
  if (params.missionsTotal > 0) return "client";
  if (params.hasConversation) return "prospect";
  return "client";
}

export async function GET(req: NextRequest) {
  try {
    const actorResult = await requireActor(req, {
      logLabel: "concierge owners auth",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "consulter vos proprietaires",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const conciergeProfileId = actorResult.actor.userId;

    const [clientsResult, conversationsResult, missionsResult, notificationsResult] = await Promise.all([
      dbAny
        .from("provider_clients")
        .select("*")
        .eq("provider_profile_id", conciergeProfileId)
        .order("created_at", { ascending: false }),
      db
        .from("contact_conversations")
        .select("id, owner_profile_id, subject, status, last_message_preview, last_message_at, metadata")
        .eq("concierge_profile_id", conciergeProfileId)
        .order("last_message_at", { ascending: false, nullsFirst: false }),
      db
        .from("missions")
        .select("id, owner_profile_id, title, status, created_at, updated_at")
        .eq("concierge_profile_id", conciergeProfileId)
        .order("created_at", { ascending: false }),
      dbAny
        .from("workflow_notifications")
        .select("id, notification_type, entity_id, read_at, metadata, created_at")
        .eq("recipient_profile_id", conciergeProfileId)
        .is("read_at", null)
        .order("created_at", { ascending: false }),
    ]);

    if (clientsResult.error) {
      if (clientsResult.error.code === "42P01") {
        return NextResponse.json({
          summary: {
            total_clients: 0,
            active_clients: 0,
            attached_owners: 0,
            prospects: 0,
            active_missions: 0,
            unread_notifications: 0,
          },
          items: [],
          note: "Le module clients n'est pas encore disponible en base.",
        });
      }

      console.error("[GET /api/concierge/owners] clients error:", clientsResult.error);
      return NextResponse.json({ error: "Impossible de charger les proprietaires." }, { status: 500 });
    }

    if (conversationsResult.error) {
      console.error("[GET /api/concierge/owners] conversations error:", conversationsResult.error);
      return NextResponse.json({ error: "Impossible de charger les conversations." }, { status: 500 });
    }

    if (missionsResult.error) {
      console.error("[GET /api/concierge/owners] missions error:", missionsResult.error);
      return NextResponse.json({ error: "Impossible de charger les missions." }, { status: 500 });
    }

    const clients = Array.isArray(clientsResult.data) ? clientsResult.data : [];
    const conversations = Array.isArray(conversationsResult.data) ? conversationsResult.data : [];
    const missions = Array.isArray(missionsResult.data) ? missionsResult.data : [];
    const notifications = Array.isArray(notificationsResult.data) ? notificationsResult.data : [];

    const ownerIds = Array.from(
      new Set<string>(
        clients
          .map((item: { owner_profile_id?: string | null }) => item.owner_profile_id ?? null)
          .concat(
            conversations.map(
              (item: { owner_profile_id?: string | null }) => item.owner_profile_id ?? null,
            ),
          )
          .concat(
            missions.map(
              (item: { owner_profile_id?: string | null }) => item.owner_profile_id ?? null,
            ),
          )
          .filter((value: string | null): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    const profilesById = new Map<string, ProfileLookup>();
    if (ownerIds.length > 0) {
      const { data: profiles, error: profilesError } = await db
        .from("profiles")
        .select("id, first_name, last_name, username, company_name, email, phone, city")
        .in("id", ownerIds);

      if (profilesError) {
        console.error("[GET /api/concierge/owners] profiles error:", profilesError);
        return NextResponse.json({ error: "Impossible de charger les profils proprietaires." }, { status: 500 });
      }

      (profiles ?? []).forEach((profile) => {
        profilesById.set(profile.id, profile as ProfileLookup);
      });
    }

    const conversationByOwnerId = new Map<
      string,
      {
        id: string;
        subject: string | null;
        status: string | null;
        last_message_preview: string | null;
        last_message_at: string | null;
      }
    >();

    conversations.forEach((conversation: {
      id: string;
      owner_profile_id: string | null;
      subject: string | null;
      status: string | null;
      last_message_preview: string | null;
      last_message_at: string | null;
    }) => {
      if (!conversation.owner_profile_id || conversationByOwnerId.has(conversation.owner_profile_id)) return;
      conversationByOwnerId.set(conversation.owner_profile_id, conversation);
    });

    const missionSummaryByOwnerId = new Map<
      string,
      {
        total: number;
        active: number;
        completed: number;
        latestMissionId: string | null;
        latestMissionTitle: string | null;
        latestMissionStatus: string | null;
      }
    >();

    missions.forEach((mission: {
      id: string;
      owner_profile_id: string | null;
      title: string | null;
      status: string | null;
    }) => {
      if (!mission.owner_profile_id) return;
      const current = missionSummaryByOwnerId.get(mission.owner_profile_id) ?? {
        total: 0,
        active: 0,
        completed: 0,
        latestMissionId: null,
        latestMissionTitle: null,
        latestMissionStatus: null,
      };
      current.total += 1;
      if (isActiveMissionStatus(mission.status)) current.active += 1;
      if (mission.status === "completed") current.completed += 1;
      if (!current.latestMissionId) {
        current.latestMissionId = mission.id;
        current.latestMissionTitle = mission.title ?? null;
        current.latestMissionStatus = mission.status ?? null;
      }
      missionSummaryByOwnerId.set(mission.owner_profile_id, current);
    });

    const unreadNotificationsByOwnerId = new Map<string, number>();
    notifications.forEach((notification: {
      notification_type?: string | null;
      metadata?: { owner_profile_id?: string | null; [key: string]: unknown } | null;
    }) => {
      const ownerProfileId =
        typeof notification.metadata?.owner_profile_id === "string"
          ? notification.metadata.owner_profile_id
          : null;
      if (!ownerProfileId) return;
      unreadNotificationsByOwnerId.set(
        ownerProfileId,
        (unreadNotificationsByOwnerId.get(ownerProfileId) ?? 0) + 1,
      );
    });

    const items: ClientItem[] = clients.map((client: {
      id: string;
      owner_profile_id?: string | null;
      client_name?: string | null;
      company_name?: string | null;
      city?: string | null;
      status?: string | null;
      notes?: string | null;
    }) => {
      const ownerProfileId = client.owner_profile_id ?? null;
      const ownerProfile = ownerProfileId ? profilesById.get(ownerProfileId) ?? null : null;
      const conversation = ownerProfileId ? conversationByOwnerId.get(ownerProfileId) ?? null : null;
      const missionSummary = ownerProfileId
        ? missionSummaryByOwnerId.get(ownerProfileId) ?? {
            total: 0,
            active: 0,
            completed: 0,
            latestMissionId: null,
            latestMissionTitle: null,
            latestMissionStatus: null,
          }
        : {
            total: 0,
            active: 0,
            completed: 0,
            latestMissionId: null,
            latestMissionTitle: null,
            latestMissionStatus: null,
          };

      return {
        id: client.id,
        owner_profile_id: ownerProfileId,
        client_name: getDisplayName(ownerProfile, client.client_name ?? null),
        company_name: client.company_name ?? ownerProfile?.company_name ?? null,
        city: client.city ?? ownerProfile?.city ?? null,
        status: client.status ?? null,
        stage: inferStage({
          status: client.status ?? null,
          missionsActive: missionSummary.active,
          missionsTotal: missionSummary.total,
          hasConversation: Boolean(conversation),
        }),
        source: "client",
        missions_total: missionSummary.total,
        missions_active: missionSummary.active,
        missions_completed: missionSummary.completed,
        latest_mission_id: missionSummary.latestMissionId,
        latest_mission_title: missionSummary.latestMissionTitle,
        latest_mission_status: missionSummary.latestMissionStatus,
        conversation_id: conversation?.id ?? null,
        last_message_at: conversation?.last_message_at ?? null,
        last_message_preview: conversation?.last_message_preview ?? null,
        unread_conversation_count: 0,
        unread_notifications: ownerProfileId ? unreadNotificationsByOwnerId.get(ownerProfileId) ?? 0 : 0,
        notes: client.notes ?? null,
      };
    });

    const knownOwnerIds = new Set(
      items
        .map((item) => item.owner_profile_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    );

    conversations.forEach((conversation: {
      id: string;
      owner_profile_id: string | null;
      subject: string | null;
      status: string | null;
      last_message_preview: string | null;
      last_message_at: string | null;
    }) => {
      if (!conversation.owner_profile_id || knownOwnerIds.has(conversation.owner_profile_id)) return;

      const ownerProfile = profilesById.get(conversation.owner_profile_id) ?? null;
      const missionSummary = missionSummaryByOwnerId.get(conversation.owner_profile_id) ?? {
        total: 0,
        active: 0,
        completed: 0,
        latestMissionId: null,
        latestMissionTitle: null,
        latestMissionStatus: null,
      };

      items.push({
        id: `prospect-${conversation.id}`,
        owner_profile_id: conversation.owner_profile_id,
        client_name: getDisplayName(ownerProfile, null),
        company_name: ownerProfile?.company_name ?? null,
        city: ownerProfile?.city ?? null,
        status: conversation.status ?? "open",
        stage: inferStage({
          status: conversation.status ?? "open",
          missionsActive: missionSummary.active,
          missionsTotal: missionSummary.total,
          hasConversation: true,
        }),
        source: "conversation",
        missions_total: missionSummary.total,
        missions_active: missionSummary.active,
        missions_completed: missionSummary.completed,
        latest_mission_id: missionSummary.latestMissionId,
        latest_mission_title: missionSummary.latestMissionTitle,
        latest_mission_status: missionSummary.latestMissionStatus,
        conversation_id: conversation.id,
        last_message_at: conversation.last_message_at,
        last_message_preview: conversation.last_message_preview,
        unread_conversation_count: 0,
        unread_notifications:
          unreadNotificationsByOwnerId.get(conversation.owner_profile_id) ?? 0,
        notes: conversation.subject ?? null,
      });
    });

    items.sort((left, right) => {
      if (right.missions_active !== left.missions_active) {
        return right.missions_active - left.missions_active;
      }
      if (right.unread_notifications !== left.unread_notifications) {
        return right.unread_notifications - left.unread_notifications;
      }
      const leftDate = left.last_message_at ? new Date(left.last_message_at).getTime() : 0;
      const rightDate = right.last_message_at ? new Date(right.last_message_at).getTime() : 0;
      return rightDate - leftDate;
    });

    return NextResponse.json({
      summary: {
        total_clients: items.length,
        active_clients: items.filter((item) => item.stage === "client_active").length,
        attached_owners: items.filter((item) => item.owner_profile_id).length,
        prospects: items.filter((item) => item.stage === "prospect").length,
        active_missions: items.reduce((sum, item) => sum + item.missions_active, 0),
        unread_notifications: notifications.length,
      },
      items,
      note:
        items.length === 0
          ? "Aucun proprietaire rattache pour le moment. Les devis acceptes et conversations actives apparaitront ici."
          : null,
    });
  } catch (err) {
    console.error("[GET /api/concierge/owners] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
