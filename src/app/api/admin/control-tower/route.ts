import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiRole } from "@/server/auth/roleGuards";
import { resolveUserRole } from "@/app/utils/roles";
import { buildControlTowerHealth, type ControlSourceHealth } from "./health";
import { evaluateMissionHealth } from "./missionHealth";
import { controlActionKey, parseAdminControlAction, type AdminControlTarget } from "./actions";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

type QueryResult<T> = {
  data: T[] | null;
  error: {
    code?: string;
    message: string;
  } | null;
  count?: number | null;
};

type RawProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  company_name: string | null;
  role: string | null;
  category: string | null;
  onboarding_complete: boolean | null;
  onboarding_completed_at: string | null;
  created_at: string | null;
};

type AuthUser = {
  id: string;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
};

type ControlTone = "positive" | "warning" | "danger";

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isMissingSchemaError(error: { code?: string; message: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

async function safeQuery<T>(promise: PromiseLike<QueryResult<T>>, fallback: T[] = []) {
  const result = await promise;
  if (result.error) {
    if (isMissingSchemaError(result.error)) {
      console.warn("[admin/control-tower] optional query skipped:", result.error.message);
      return {
        data: fallback,
        count: 0,
        error: null,
        available: false,
        reason: "Table ou colonne absente du schéma Supabase appliqué.",
      };
    }

    throw new Error(result.error.message);
  }

  return { ...result, available: true, reason: null };
}

async function listAllAuthUsers(adminClient: ReturnType<typeof createAdminClient>) {
  const users: AuthUser[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    users.push(...(data.users as AuthUser[]));

    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

function normalizeRoleBucket(role: string) {
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "concierge" || role === "concierge_pro") return "concierge";
  if (role === "provider" || role === "provider_pro" || role === "artisan" || role === "artisan_pro") {
    return "provider";
  }
  return "owner";
}

function formatDisplayName(profile: RawProfile | null | undefined) {
  if (!profile) return "Profil sans nom";
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.company_name || profile.username || profile.email || "Profil sans nom";
}

function getAgeHours(value: string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.round((Date.now() - time) / 36e5));
}

function buildIssueCount(steps: Array<{ ok: boolean }>) {
  return steps.filter((step) => !step.ok).length;
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) {
      return guard.response;
    }

    const adminClient = createAdminClient();

    const [
      profilesRes,
      authUsers,
      onboardingEventsRes,
      missionsRes,
      serviceRequestsRes,
      quotesRes,
      invoicesRes,
      conversationsRes,
      messagesRes,
      interventionsRes,
      maintenanceRes,
      controlActionsRes,
    ] = await Promise.all([
      safeQuery(
        adminClient
          .from("profiles")
          .select(
            "id,email,first_name,last_name,username,company_name,role,category,onboarding_complete,onboarding_completed_at,created_at",
          )
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<RawProfile>>,
      ),
      listAllAuthUsers(adminClient),
      safeQuery(
        adminClient
          .from("onboarding_events")
          .select("id, profile_id, created_at") as unknown as PromiseLike<
          QueryResult<{ id: string; profile_id: string | null; created_at: string | null }>
        >,
      ),
      safeQuery(
        adminClient
          .from("missions")
          .select(
            "id,title,status,priority,owner_profile_id,concierge_profile_id,property_id,scheduled_start,scheduled_end,completed_at,metadata,created_at,updated_at",
          )
          .order("created_at", { ascending: false })
          .limit(60) as unknown as PromiseLike<
          QueryResult<{
            id: string;
            title: string;
            status: string;
            priority: string;
            owner_profile_id: string | null;
            concierge_profile_id: string | null;
            property_id: string | null;
            scheduled_start: string | null;
            scheduled_end: string | null;
            completed_at: string | null;
            metadata: Record<string, unknown> | null;
            created_at: string;
            updated_at: string;
          }>
        >,
      ),
      safeQuery(
        adminClient
          .from("service_requests")
          .select("id, mission_id, title, status, workflow_status, created_at")
          .order("created_at", { ascending: false })
          .limit(120) as unknown as PromiseLike<
          QueryResult<{
            id: string;
            mission_id: string | null;
            title: string | null;
            status: string | null;
            workflow_status: string | null;
            created_at: string | null;
          }>
        >,
      ),
      safeQuery(
        adminClient
          .from("quotes")
          .select("id, mission_id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(120) as unknown as PromiseLike<
          QueryResult<{ id: string; mission_id: string | null; status: string; created_at: string }>
        >,
      ),
      safeQuery(
        adminClient
          .from("invoices")
          .select("id,mission_id,status,total_amount,paid_amount,balance_amount,due_date,paid_at,created_at")
          .order("created_at", { ascending: false })
          .limit(120) as unknown as PromiseLike<
          QueryResult<{
            id: string;
            mission_id: string | null;
            status: string;
            total_amount: number | null;
            paid_amount: number | null;
            balance_amount: number | null;
            due_date: string | null;
            paid_at: string | null;
            created_at: string;
          }>
        >,
      ),
      safeQuery(
        adminClient
          .from("contact_conversations")
          .select(
            "id,owner_profile_id,concierge_profile_id,source,source_reference,subject,status,last_message_preview,last_message_at,created_at,updated_at",
          )
          .order("updated_at", { ascending: false })
          .limit(80) as unknown as PromiseLike<
          QueryResult<{
            id: string;
            owner_profile_id: string;
            concierge_profile_id: string;
            source: string;
            source_reference: string | null;
            subject: string | null;
            status: string;
            last_message_preview: string | null;
            last_message_at: string | null;
            created_at: string;
            updated_at: string;
          }>
        >,
      ),
      safeQuery(
        adminClient
          .from("contact_messages")
          .select("id,conversation_id,sender_profile_id,created_at")
          .order("created_at", { ascending: false })
          .limit(400) as unknown as PromiseLike<
          QueryResult<{
            id: string;
            conversation_id: string;
            sender_profile_id: string;
            created_at: string;
          }>
        >,
      ),
      safeQuery(
        adminClient.from("provider_interventions").select("id,provider_profile_id,status,metadata").limit(200) as unknown as PromiseLike<
          QueryResult<{ id: string; provider_profile_id: string; status: string; metadata: Record<string, unknown> | null }>
        >,
      ),
      safeQuery(
        adminClient.from("maintenance_incidents").select("id,mission_id,status").limit(200) as unknown as PromiseLike<
          QueryResult<{ id: string; mission_id: string | null; status: string }>
        >,
      ),
      safeQuery(
        adminClient
          .from("workflow_events")
          .select("id,actor_profile_id,event_type,body,metadata,created_at")
          .in("event_type", ["admin_control_acknowledged", "admin_control_escalated", "admin_control_closed"])
          .order("created_at", { ascending: false })
          .limit(300) as unknown as PromiseLike<QueryResult<{
            id: string;
            actor_profile_id: string | null;
            event_type: string;
            body: string | null;
            metadata: Record<string, unknown> | null;
            created_at: string;
          }>>,
      ),
    ]);

    const latestControlAction = new Map<string, {
      status: "acknowledged" | "escalated" | "closed";
      note: string | null;
      actorProfileId: string | null;
      createdAt: string;
    }>();
    ((controlActionsRes.data ?? []) as Array<{
      actor_profile_id: string | null;
      event_type: string;
      body: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>).forEach((event) => {
      const targetType = event.metadata?.target_type;
      const targetId = event.metadata?.target_id;
      if ((targetType !== "onboarding" && targetType !== "mission" && targetType !== "message") || typeof targetId !== "string") return;
      const key = controlActionKey(targetType, targetId);
      if (latestControlAction.has(key)) return;
      latestControlAction.set(key, {
        status: event.event_type === "admin_control_closed"
          ? "closed"
          : event.event_type === "admin_control_escalated"
            ? "escalated"
            : "acknowledged",
        note: event.body,
        actorProfileId: event.actor_profile_id,
        createdAt: event.created_at,
      });
    });
    const withControlAction = <T extends { id: string }>(targetType: AdminControlTarget, item: T) => ({
      ...item,
      controlAction: latestControlAction.get(controlActionKey(targetType, item.id)) ?? null,
    });

    const profiles = (profilesRes.data ?? []) as RawProfile[];
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const authById = new Map(authUsers.map((user) => [user.id, user]));
    const onboardingEventCountByProfile = new Map<string, number>();
    ((onboardingEventsRes.data ?? []) as Array<{ profile_id: string | null }>).forEach((event) => {
      if (!event.profile_id) return;
      onboardingEventCountByProfile.set(
        event.profile_id,
        (onboardingEventCountByProfile.get(event.profile_id) ?? 0) + 1,
      );
    });

    const onboardingItems = profiles
      .map((profile) => {
        const authUser = authById.get(profile.id);
        const resolvedRole = resolveUserRole(profile.role, profile.category) ?? "owner";
        const createdAt = authUser?.created_at ?? profile.created_at;
        const steps = [
          { id: "account", label: "Compte créé", ok: Boolean(createdAt) },
          { id: "email", label: "E-mail confirmé", ok: Boolean(authUser?.email_confirmed_at) },
          { id: "signin", label: "Première connexion", ok: Boolean(authUser?.last_sign_in_at) },
          { id: "events", label: "Événements d'inscription", ok: (onboardingEventCountByProfile.get(profile.id) ?? 0) > 0 },
          { id: "complete", label: "Inscription terminée", ok: profile.onboarding_complete === true },
        ];
        const issueCount = buildIssueCount(steps);
        const ageHours = getAgeHours(createdAt);
        const tone: ControlTone =
          issueCount >= 3 || ((!authUser?.email_confirmed_at || !authUser?.last_sign_in_at) && ageHours >= 72)
            ? "danger"
            : issueCount > 0
              ? "warning"
              : "positive";

        return {
          id: profile.id,
          displayName: formatDisplayName(profile),
          email: profile.email,
          role: resolvedRole,
          roleBucket: normalizeRoleBucket(resolvedRole),
          createdAt,
          lastSignInAt: authUser?.last_sign_in_at ?? null,
          onboardingCompletedAt: profile.onboarding_completed_at,
          steps,
          issueCount,
          tone,
        };
      })
      .sort((left, right) => right.issueCount - left.issueCount || getAgeHours(right.createdAt) - getAgeHours(left.createdAt));

    const requests = (serviceRequestsRes.data ?? []) as Array<{ id: string; mission_id: string | null }>;
    const quotes = (quotesRes.data ?? []) as Array<{ id: string; mission_id: string | null; status: string; created_at: string }>;
    const invoices = (invoicesRes.data ?? []) as Array<{
      id: string;
      mission_id: string | null;
      status: string;
      total_amount: number | null;
      paid_amount: number | null;
      balance_amount: number | null;
      due_date: string | null;
      paid_at: string | null;
      created_at: string;
    }>;

    const requestByMissionId = new Map<string, { id: string; mission_id: string | null }>();
    requests.forEach((request) => {
      if (request.mission_id) requestByMissionId.set(request.mission_id, request);
    });
    const quotesByMissionId = new Map<string, Array<{ id: string; status: string }>>();
    quotes.forEach((quote) => {
      if (!quote.mission_id) return;
      quotesByMissionId.set(quote.mission_id, [...(quotesByMissionId.get(quote.mission_id) ?? []), quote]);
    });
    const invoicesByMissionId = new Map<string, Array<{ id: string; status: string }>>();
    invoices.forEach((invoice) => {
      if (!invoice.mission_id) return;
      invoicesByMissionId.set(invoice.mission_id, [...(invoicesByMissionId.get(invoice.mission_id) ?? []), invoice]);
    });
    const assignmentCountByMissionId = new Map<string, number>();
    ((interventionsRes.data ?? []) as Array<{ metadata: Record<string, unknown> | null }>).forEach((intervention) => {
      const missionId = typeof intervention.metadata?.mission_id === "string" ? intervention.metadata.mission_id : null;
      if (missionId) assignmentCountByMissionId.set(missionId, (assignmentCountByMissionId.get(missionId) ?? 0) + 1);
    });
    const openMaintenanceCountByMissionId = new Map<string, number>();
    const closedMaintenanceStatuses = new Set(["resolved", "closed", "cancelled"]);
    ((maintenanceRes.data ?? []) as Array<{ mission_id: string | null; status: string }>).forEach((incident) => {
      if (!incident.mission_id || closedMaintenanceStatuses.has(incident.status)) return;
      openMaintenanceCountByMissionId.set(incident.mission_id, (openMaintenanceCountByMissionId.get(incident.mission_id) ?? 0) + 1);
    });

    const missionItems = ((missionsRes.data ?? []) as Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      owner_profile_id: string | null;
      concierge_profile_id: string | null;
      property_id: string | null;
      scheduled_start: string | null;
      scheduled_end: string | null;
      completed_at: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
      updated_at: string;
    }>)
      .map((mission) => {
        const relatedQuotes = quotesByMissionId.get(mission.id) ?? [];
        const relatedInvoices = invoicesByMissionId.get(mission.id) ?? [];
        const evaluation = evaluateMissionHealth({
          status: mission.status,
          scheduled_start: mission.scheduled_start,
          scheduled_end: mission.scheduled_end,
          completed_at: mission.completed_at,
          hasRequest: requestByMissionId.has(mission.id),
          quoteCount: relatedQuotes.length,
          invoices: relatedInvoices,
          assignmentCount:
            (assignmentCountByMissionId.get(mission.id) ?? 0) +
            (typeof mission.metadata?.assigned_team_member_id === "string" ? 1 : 0),
          openMaintenanceCount: openMaintenanceCountByMissionId.get(mission.id) ?? 0,
        });

        return {
          id: mission.id,
          title: mission.title,
          status: mission.status,
          priority: mission.priority,
          ownerName: mission.owner_profile_id ? formatDisplayName(profileById.get(mission.owner_profile_id) as RawProfile) : "Proprietaire manquant",
          conciergeName: mission.concierge_profile_id
            ? formatDisplayName(profileById.get(mission.concierge_profile_id) as RawProfile)
            : "Conciergerie manquante",
          createdAt: mission.created_at,
          updatedAt: mission.updated_at,
          scheduledStart: mission.scheduled_start,
          scheduledEnd: mission.scheduled_end,
          completedAt: mission.completed_at,
          quoteCount: relatedQuotes.length,
          invoiceCount: relatedInvoices.length,
          assignmentCount:
            (assignmentCountByMissionId.get(mission.id) ?? 0) +
            (typeof mission.metadata?.assigned_team_member_id === "string" ? 1 : 0),
          openMaintenanceCount: openMaintenanceCountByMissionId.get(mission.id) ?? 0,
          hasOverdueInvoice: evaluation.hasOverdueInvoice,
          steps: evaluation.steps,
          issueCount: evaluation.issueCount,
          tone: evaluation.tone,
        };
      })
      .sort((left, right) => right.issueCount - left.issueCount || getAgeHours(right.updatedAt) - getAgeHours(left.updatedAt));

    const messages = (messagesRes.data ?? []) as Array<{
      id: string;
      conversation_id: string;
      sender_profile_id: string;
      created_at: string;
    }>;
    const messageGroups = new Map<string, typeof messages>();
    messages.forEach((message) => {
      messageGroups.set(message.conversation_id, [...(messageGroups.get(message.conversation_id) ?? []), message]);
    });

    const conversationItems = ((conversationsRes.data ?? []) as Array<{
      id: string;
      owner_profile_id: string;
      concierge_profile_id: string;
      source: string;
      source_reference: string | null;
      subject: string | null;
      status: string;
      last_message_preview: string | null;
      last_message_at: string | null;
      created_at: string;
      updated_at: string;
    }>)
      .map((conversation) => {
        const threadMessages = [...(messageGroups.get(conversation.id) ?? [])].sort((left, right) => {
          return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
        });
        const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
        const distinctSenders = new Set(threadMessages.map((message) => message.sender_profile_id));
        const waitingHours = getAgeHours(lastMessage?.created_at ?? conversation.last_message_at ?? conversation.created_at);
        const steps = [
          { id: "created", label: "Conversation creee", ok: Boolean(conversation.created_at) },
          { id: "first", label: "Premier message", ok: threadMessages.length > 0 },
          { id: "reply", label: "Reponse croisee", ok: distinctSenders.size > 1 },
          { id: "recent", label: "Activite recente", ok: waitingHours <= 72 },
        ];
        const issueCount = buildIssueCount(steps);
        const tone: ControlTone =
          (threadMessages.length === 0 || waitingHours > 120 || (threadMessages.length > 0 && distinctSenders.size === 1 && waitingHours > 48))
            ? "danger"
            : issueCount > 0
              ? "warning"
              : "positive";

        return {
          id: conversation.id,
          subject: conversation.subject || "Conversation",
          source: conversation.source,
          status: conversation.status,
          ownerName: formatDisplayName(profileById.get(conversation.owner_profile_id) as RawProfile),
          conciergeName: formatDisplayName(profileById.get(conversation.concierge_profile_id) as RawProfile),
          createdAt: conversation.created_at,
          lastMessageAt: conversation.last_message_at,
          messageCount: threadMessages.length,
          waitingHours,
          steps,
          issueCount,
          tone,
        };
      })
      .sort((left, right) => right.issueCount - left.issueCount || right.waitingHours - left.waitingHours);

    const onboardingProblemCount = onboardingItems.filter((item) => item.tone !== "positive").length;
    const missionProblemCount = missionItems.filter((item) => item.tone !== "positive").length;
    const conversationProblemCount = conversationItems.filter((item) => item.tone !== "positive").length;
    const dangerCount =
      onboardingItems.filter((item) => item.tone === "danger").length +
      missionItems.filter((item) => item.tone === "danger").length +
      conversationItems.filter((item) => item.tone === "danger").length;
    const warningCount =
      onboardingItems.filter((item) => item.tone === "warning").length +
      missionItems.filter((item) => item.tone === "warning").length +
      conversationItems.filter((item) => item.tone === "warning").length;
    const sourceHealth: ControlSourceHealth[] = [
      { key: "profiles", label: "Profils", available: profilesRes.available, reason: profilesRes.reason },
      { key: "auth-users", label: "Comptes Supabase Auth", available: true, reason: null },
      { key: "onboarding-events", label: "Événements d'inscription", available: onboardingEventsRes.available, reason: onboardingEventsRes.reason },
      { key: "missions", label: "Missions", available: missionsRes.available, reason: missionsRes.reason },
      { key: "service-requests", label: "Demandes", available: serviceRequestsRes.available, reason: serviceRequestsRes.reason },
      { key: "quotes", label: "Devis", available: quotesRes.available, reason: quotesRes.reason },
      { key: "invoices", label: "Factures", available: invoicesRes.available, reason: invoicesRes.reason },
      { key: "conversations", label: "Conversations", available: conversationsRes.available, reason: conversationsRes.reason },
      { key: "messages", label: "Messages", available: messagesRes.available, reason: messagesRes.reason },
      { key: "provider-interventions", label: "Affectations prestataires", available: interventionsRes.available, reason: interventionsRes.reason },
      { key: "maintenance-incidents", label: "Incidents de maintenance", available: maintenanceRes.available, reason: maintenanceRes.reason },
      { key: "control-actions", label: "Actions administratives", available: controlActionsRes.available, reason: controlActionsRes.reason },
    ];
    const health = buildControlTowerHealth({ sources: sourceHealth, dangerCount, warningCount });

    return NextResponse.json(
      {
        health,
        summary: {
          onboarding: {
            total: onboardingItems.length,
            healthy: onboardingItems.filter((item) => item.tone === "positive").length,
            warning: onboardingItems.filter((item) => item.tone === "warning").length,
            danger: onboardingItems.filter((item) => item.tone === "danger").length,
          },
          missions: {
            total: missionItems.length,
            healthy: missionItems.filter((item) => item.tone === "positive").length,
            warning: missionItems.filter((item) => item.tone === "warning").length,
            danger: missionItems.filter((item) => item.tone === "danger").length,
          },
          messages: {
            total: conversationItems.length,
            healthy: conversationItems.filter((item) => item.tone === "positive").length,
            warning: conversationItems.filter((item) => item.tone === "warning").length,
            danger: conversationItems.filter((item) => item.tone === "danger").length,
          },
          totalProblems: onboardingProblemCount + missionProblemCount + conversationProblemCount,
        },
        onboarding: onboardingItems.slice(0, 24).map((item) => withControlAction("onboarding", item)),
        missions: missionItems.slice(0, 24).map((item) => withControlAction("mission", item)),
        messages: conversationItems.slice(0, 24).map((item) => withControlAction("message", item)),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/control-tower] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) return guard.response;
    const parsed = parseAdminControlAction(await req.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const adminClient = createAdminClient();
    const action = parsed.data;
    const eventType = "admin_control_" + action.status;
    const { data, error } = await adminClient.from("workflow_events").insert({
      actor_profile_id: guard.auth.userId,
      mission_id: action.targetType === "mission" ? action.targetId : null,
      event_type: eventType,
      title: action.status === "closed"
        ? "Suivi administrateur clôturé"
        : action.status === "escalated"
          ? "Contrôle transmis au responsable"
          : "Contrôle administrateur pris en charge",
      body: action.note,
      action_href: "/dashboard/admin/controle",
      metadata: {
        target_type: action.targetType,
        target_id: action.targetId,
        control_status: action.status,
      },
    }).select("id,actor_profile_id,event_type,body,metadata,created_at").single();

    if (error) {
      console.error("[POST /api/admin/control-tower] insert error", error);
      return NextResponse.json({ error: "Impossible d'enregistrer l'action administrateur." }, { status: 500 });
    }
    return NextResponse.json({ action: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/control-tower] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}
