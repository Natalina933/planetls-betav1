import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
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
  role?: string | null;
  category?: string | null;
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

const createOwnerSchema = z.object({
  first_name: z.string().trim().max(120).optional().nullable(),
  last_name: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional().nullable(),
  company_name: z.string().trim().max(160).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

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

function isOwnerLikeProfile(profile?: Pick<ProfileLookup, "role" | "category"> | null) {
  const roleValue = (profile?.role ?? "").toLowerCase();
  const categoryValue = (profile?.category ?? "").toLowerCase();

  return (
    roleValue === "owner" ||
    roleValue === "owner_pro" ||
    categoryValue.startsWith("proprietaire")
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

function slugifyUsernamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
}

async function buildUniqueUsername(baseCandidate: string) {
  const base = slugifyUsernamePart(baseCandidate) || `owner.${Date.now()}`;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}.${attempt + 1}`;
    const { data, error } = await db
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (error) {
      console.error("[POST /api/concierge/owners] username lookup error:", error);
      throw new Error("USERNAME_LOOKUP_FAILED");
    }

    if (!data) {
      return candidate;
    }
  }

  return `${base}.${Math.random().toString(36).slice(2, 8)}`;
}

async function findAuthUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      console.error("[POST /api/concierge/owners] auth list users error:", error);
      throw new Error("AUTH_LIST_USERS_FAILED");
    }

    const users = data?.users ?? [];
    const matchingUser = users.find(
      (user) => typeof user.email === "string" && user.email.toLowerCase() === email,
    );
    if (matchingUser?.id) {
      return matchingUser.id;
    }

    if (users.length < 200) {
      break;
    }
  }

  return null;
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

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const actorResult = await requireActor(req, {
      logLabel: "concierge owners create",
      allowedRoles: CONCIERGE_ROLES,
      actionLabel: "creer un proprietaire",
    });
    if (!actorResult.ok) {
      return actorResult.response;
    }

    const rawBody = await req.json();
    const parsedBody = createOwnerSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    const body = parsedBody.data;
    const email = body.email.trim().toLowerCase();
    const displayName =
      `${body.first_name ?? ""} ${body.last_name ?? ""}`.trim() ||
      body.company_name?.trim() ||
      email;

    const { data: existingProfile, error: existingProfileError } = await db
      .from("profiles")
      .select("id, first_name, last_name, username, company_name, email, phone, city, role, category")
      .eq("email", email)
      .maybeSingle();

    if (existingProfileError) {
      console.error("[POST /api/concierge/owners] existing profile error:", existingProfileError);
      return NextResponse.json({ error: "Impossible de verifier le proprietaire." }, { status: 500 });
    }

    let ownerProfileId: string;
    let ownerLabel = displayName;

    if (existingProfile) {
      if (!isOwnerLikeProfile(existingProfile as ProfileLookup)) {
        return NextResponse.json(
          { error: "Un profil existe deja avec cet email mais ce n'est pas un proprietaire." },
          { status: 409 },
        );
      }

      ownerProfileId = existingProfile.id;
      ownerLabel = getDisplayName(existingProfile as ProfileLookup, displayName);
    } else {
      const usernameBase =
        `${body.first_name ?? ""}.${body.last_name ?? ""}`.replace(/\.+/g, ".") ||
        email.split("@")[0] ||
        "owner";
      const username = await buildUniqueUsername(usernameBase);
      let profileAlreadyExistsForAuthUser = false;
      let createdAuthUserId: string | null = null;

      const temporaryPassword = `Tmp!${randomBytes(12).toString("base64url")}9a`;
      const { data: createdAuthUser, error: authCreateError } = await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: false,
        user_metadata: {
          username,
          role: "owner",
          source: "concierge_manual_owner",
        },
      });

      if (authCreateError) {
        const authErrorMessage = authCreateError.message.toLowerCase();
        if (authErrorMessage.includes("already been registered")) {
          const existingAuthUserId = await findAuthUserIdByEmail(supabase, email);
          if (!existingAuthUserId) {
            return NextResponse.json(
              {
                error:
                  "Cet email existe deja dans l'authentification Supabase, mais aucun profil proprietaire exploitable n'a ete trouve.",
              },
              { status: 409 },
            );
          }

          ownerProfileId = existingAuthUserId;

          const { data: existingProfileByAuthId, error: existingProfileByAuthIdError } = await db
            .from("profiles")
            .select("id, first_name, last_name, username, company_name, email, phone, city, role, category")
            .eq("id", existingAuthUserId)
            .maybeSingle();

          if (existingProfileByAuthIdError) {
            console.error(
              "[POST /api/concierge/owners] existing profile by auth id error:",
              existingProfileByAuthIdError,
            );
            return NextResponse.json(
              { error: "Impossible de verifier le profil rattache a cet email." },
              { status: 500 },
            );
          }

          if (existingProfileByAuthId) {
            if (!isOwnerLikeProfile(existingProfileByAuthId as ProfileLookup)) {
              return NextResponse.json(
                {
                  error:
                    "Cet email est deja utilise par un compte existant qui n'est pas un proprietaire.",
                },
                { status: 409 },
              );
            }

            ownerLabel = getDisplayName(existingProfileByAuthId as ProfileLookup, displayName);
            profileAlreadyExistsForAuthUser = true;
          }
        } else {
          console.error("[POST /api/concierge/owners] auth create user error:", authCreateError);
          return NextResponse.json(
            {
              error:
                typeof authCreateError.message === "string" && authCreateError.message.trim()
                  ? `Impossible de creer l'utilisateur proprietaire: ${authCreateError.message}`
                  : "Impossible de creer l'utilisateur proprietaire.",
            },
            { status: 500 },
          );
        }
      } else if (createdAuthUser.user?.id) {
        ownerProfileId = createdAuthUser.user.id;
        createdAuthUserId = createdAuthUser.user.id;
      } else {
        console.error("[POST /api/concierge/owners] auth create user error:", authCreateError);
        return NextResponse.json(
          {
            error:
              typeof authCreateError?.message === "string" && authCreateError.message.trim()
                ? `Impossible de creer l'utilisateur proprietaire: ${authCreateError.message}`
                : "Impossible de creer l'utilisateur proprietaire.",
          },
          { status: 500 },
        );
      }

      if (!profileAlreadyExistsForAuthUser) {
        const { error: insertProfileError } = await db.from("profiles").insert({
          id: ownerProfileId,
          email,
          username,
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
          phone: body.phone ?? null,
          company_name: body.company_name ?? null,
          city: body.city ?? null,
          country: "France",
          role: "owner",
          category: "proprietaire",
          status: "active",
          onboarding_complete: false,
        });

        if (insertProfileError) {
          console.error("[POST /api/concierge/owners] insert profile error:", insertProfileError);
          if (createdAuthUserId) {
            await supabase.auth.admin.deleteUser(createdAuthUserId);
          }
          return NextResponse.json(
            {
              error:
                typeof insertProfileError.message === "string" && insertProfileError.message.trim()
                  ? `Impossible de creer le profil proprietaire: ${insertProfileError.message}`
                  : "Impossible de creer le profil proprietaire.",
            },
            { status: 500 },
          );
        }
      }
    }

    const { data: existingClientLink, error: existingClientLinkError } = await dbAny
      .from("provider_clients")
      .select("id")
      .eq("provider_profile_id", actorResult.actor.userId)
      .eq("owner_profile_id", ownerProfileId)
      .maybeSingle();

    if (existingClientLinkError && existingClientLinkError.code !== "PGRST116") {
      console.error("[POST /api/concierge/owners] existing client link error:", existingClientLinkError);
      return NextResponse.json({ error: "Impossible de verifier le rattachement client." }, { status: 500 });
    }

    if (!existingClientLink) {
      const { error: clientInsertError } = await dbAny.from("provider_clients").insert({
        provider_profile_id: actorResult.actor.userId,
        owner_profile_id: ownerProfileId,
        client_name: displayName,
        company_name: body.company_name ?? null,
        email,
        phone: body.phone ?? null,
        city: body.city ?? null,
        client_type: "manual",
        status: "active",
        notes: body.notes ?? null,
        metadata: {
          source: "concierge_manual_owner",
          created_via: "housing_workflow",
        },
      });

      if (clientInsertError) {
        console.error("[POST /api/concierge/owners] insert client link error:", clientInsertError);
        return NextResponse.json({ error: "Impossible de rattacher ce proprietaire au concierge." }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        owner_profile_id: ownerProfileId,
        owner_label: ownerLabel,
        created: !existingProfile,
      },
      { status: existingProfile ? 200 : 201 },
    );
  } catch (err) {
    console.error("[POST /api/concierge/owners] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
