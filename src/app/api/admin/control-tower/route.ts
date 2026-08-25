import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/app/lib/dbServer";
import { requireApiRole } from "@/server/auth/roleGuards";
import { resolveUserRole } from "@/app/utils/roles";
import { buildControlTowerHealth, type ControlSourceHealth } from "./health";
import { evaluateMissionHealth } from "./missionHealth";
import { controlActionKey, parseAdminControlAction, type AdminControlTarget } from "./actions";
import { createOrRedetectAdminProblem } from "@/server/admin/problems";
import { detectMissionProblems } from "@/server/admin/problemDetectors";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const FALLBACK_ONBOARDING_ID = "00000000-0000-4000-8000-000000000001";

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

type PersistedControlAction = {
  status: "acknowledged" | "escalated" | "closed";
  note: string | null;
  actorProfileId: string | null;
  createdAt: string;
};

type SafeResult<T> = {
  data: T[] | null;
  count?: number | null;
  error: null;
  available: boolean;
  reason: string | null;
};

const fallbackControlActions = new Map<string, PersistedControlAction>();

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
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

function isTransportError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message.toLowerCase()
        : "";

  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econn") ||
    message.includes("enotfound")
  );
}

function buildUnavailableResult<T>(fallback: T[], reason: string): SafeResult<T> {
  return {
    data: fallback,
    count: 0,
    error: null,
    available: false,
    reason,
  };
}

async function safeQuery<T>(promise: PromiseLike<QueryResult<T>>, fallback: T[] = []): Promise<SafeResult<T>> {
  let result: QueryResult<T>;
  try {
    result = await promise;
  } catch (error) {
    if (isTransportError(error)) {
      return buildUnavailableResult(fallback, "Connexion Supabase indisponible pour cette source.");
    }
    throw error;
  }

  if (result.error) {
    if (isMissingSchemaError(result.error)) {
      console.warn("[admin/control-tower] optional query skipped:", result.error.message);
      return buildUnavailableResult(fallback, "Table ou colonne absente du schema Supabase applique.");
    }

    if (isTransportError(result.error)) {
      return buildUnavailableResult(fallback, "Connexion Supabase indisponible pour cette source.");
    }

    throw new Error(result.error.message);
  }

  return { ...result, error: null, available: true, reason: null };
}

async function listAllAuthUsers(adminClient: ReturnType<typeof createAdminClient>) {
  if (!adminClient) {
    return {
      users: [] as AuthUser[],
      available: false,
      reason: "Client admin Supabase indisponible pour lister les comptes Auth.",
    };
  }

  const users: AuthUser[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    try {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) {
        if (isTransportError(error)) {
          return {
            users,
            available: false,
            reason: "Connexion Supabase indisponible pour lister les comptes Auth.",
          };
        }
        throw error;
      }

      users.push(...(data.users as AuthUser[]));
      if (data.users.length < perPage) break;
      page += 1;
    } catch (error) {
      if (isTransportError(error)) {
        return {
          users,
          available: false,
          reason: "Connexion Supabase indisponible pour lister les comptes Auth.",
        };
      }
      throw error;
    }
  }

  return { users, available: true, reason: null };
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

function buildFallbackOnboardingItem() {
  return {
    id: FALLBACK_ONBOARDING_ID,
    displayName: "Connexion Supabase à rétablir",
    email: null,
    role: "admin" as const,
    roleBucket: "admin" as const,
    createdAt: new Date().toISOString(),
    lastSignInAt: null,
    onboardingCompletedAt: null,
    steps: [
      { id: "account", label: "Source admin joignable", ok: false },
      { id: "email", label: "Authentification distante", ok: false },
      { id: "signin", label: "Lecture des comptes", ok: false },
      { id: "events", label: "Journal distant", ok: false },
      { id: "complete", label: "Contrôle complet", ok: false },
    ],
    issueCount: 5,
    tone: "danger" as const,
  };
}

type OnboardingEventRow = {
  id: string;
  profile_id: string | null;
  created_at: string | null;
};

type AdminProblemRow = {
  id: string;
  severity: "information" | "vigilance" | "prioritaire" | "critique";
  status: "new" | "acknowledged" | "in_progress" | "escalated" | "resolved" | "closed" | "reopened";
  title: string;
  summary: string;
  functional_owner: string;
  occurrence_count: number;
  last_detected_at: string;
};

type UntypedQueryBuilder = PromiseLike<unknown> & {
  select: (columns: string) => UntypedQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQueryBuilder;
  limit: (count: number) => UntypedQueryBuilder;
  in: (column: string, values: string[]) => UntypedQueryBuilder;
  insert: (payload: Record<string, unknown>) => UntypedQueryBuilder;
  single: () => PromiseLike<unknown>;
};

function queryTable(table: string) {
  const untypedDb = db as unknown as {
    from: (relation: string) => UntypedQueryBuilder;
  };

  return untypedDb.from(table);
}

function queryOnboardingEvents() {
  return queryTable("onboarding_events").select("id, profile_id, created_at") as PromiseLike<QueryResult<OnboardingEventRow>>;
}

function getRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMissionLabel(mission: { title?: string | null; metadata?: Record<string, unknown> | null }) {
  return (
    getNullableString(mission.title) ??
    getNullableString(getRecord(mission.metadata).mission_title) ??
    getNullableString(getRecord(mission.metadata).service_label) ??
    getNullableString(getRecord(mission.metadata).property_label) ??
    "Mission"
  );
}

async function queryControlTowerMissions() {
  const primary = await safeQuery(
    queryTable("missions")
      .select("id,title,status,priority,owner_profile_id,concierge_profile_id,property_id,scheduled_start,scheduled_end,completed_at,metadata,created_at,updated_at")
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
  );

  if (primary.available || primary.data !== null) {
    return primary;
  }

  return safeQuery(
    queryTable("missions")
      .select("id,status,priority,owner_profile_id,concierge_profile_id,property_id,scheduled_start,scheduled_end,completed_at,metadata,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(60) as unknown as PromiseLike<
      QueryResult<{
        id: string;
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
  );
}

export async function GET(req: NextRequest) {
  let stage = "boot";

  try {
    stage = "auth";
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) {
      return guard.response;
    }

    stage = "client";
    const adminClient = createAdminClient();

    stage = "queries";
    const [
      profilesRes,
      authUsersRes,
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
        queryTable("profiles")
          .select("id,email,first_name,last_name,username,company_name,role,category,onboarding_complete,onboarding_completed_at,created_at")
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<RawProfile>>,
      ),
      listAllAuthUsers(adminClient),
      safeQuery(
        queryOnboardingEvents(),
      ),
      queryControlTowerMissions(),
      safeQuery(
        queryTable("service_requests")
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
        queryTable("quotes")
          .select("id, mission_id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(120) as unknown as PromiseLike<
          QueryResult<{ id: string; mission_id: string | null; status: string; created_at: string }>
        >,
      ),
      safeQuery(
        queryTable("invoices")
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
        queryTable("contact_conversations")
          .select("id,owner_profile_id,concierge_profile_id,source,source_reference,subject,status,last_message_preview,last_message_at,created_at,updated_at")
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
        queryTable("contact_messages")
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
        queryTable("provider_interventions").select("id,provider_profile_id,status,metadata").limit(200) as unknown as PromiseLike<
          QueryResult<{ id: string; provider_profile_id: string; status: string; metadata: Record<string, unknown> | null }>
        >,
      ),
      safeQuery(
        queryTable("maintenance_incidents").select("id,mission_id,status").limit(200) as unknown as PromiseLike<
          QueryResult<{ id: string; mission_id: string | null; status: string }>
        >,
      ),
      safeQuery(
        queryTable("workflow_events")
          .select("id,actor_profile_id,event_type,body,metadata,created_at")
          .in("event_type", ["admin_control_acknowledged", "admin_control_escalated", "admin_control_closed"])
          .order("created_at", { ascending: false })
          .limit(300) as unknown as PromiseLike<
          QueryResult<{
            id: string;
            actor_profile_id: string | null;
            event_type: string;
            body: string | null;
            metadata: Record<string, unknown> | null;
            created_at: string;
          }>
        >,
      ),
    ]);

    stage = "control-actions";
    const latestControlAction = new Map<string, PersistedControlAction>();
    ((controlActionsRes.data ?? []) as Array<{
      actor_profile_id: string | null;
      event_type: string;
      body: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>).forEach((event) => {
      const targetType = event.metadata?.target_type;
      const targetId = event.metadata?.target_id;
      if ((targetType !== "onboarding" && targetType !== "mission" && targetType !== "message") || typeof targetId !== "string") {
        return;
      }
      const key = controlActionKey(targetType, targetId);
      if (latestControlAction.has(key)) return;
      latestControlAction.set(key, {
        status:
          event.event_type === "admin_control_closed"
            ? "closed"
            : event.event_type === "admin_control_escalated"
              ? "escalated"
              : "acknowledged",
        note: event.body,
        actorProfileId: event.actor_profile_id,
        createdAt: event.created_at,
      });
    });
    fallbackControlActions.forEach((action, key) => {
      if (!latestControlAction.has(key)) {
        latestControlAction.set(key, action);
      }
    });

    const withControlAction = <T extends { id: string }>(targetType: AdminControlTarget, item: T) => ({
      ...item,
      controlAction: latestControlAction.get(controlActionKey(targetType, item.id)) ?? null,
    });

    stage = "onboarding";
    const profiles = (profilesRes.data ?? []) as RawProfile[];
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const authById = new Map(authUsersRes.users.map((user) => [user.id, user]));
    const onboardingEventCountByProfile = new Map<string, number>();
    ((onboardingEventsRes.data ?? []) as Array<{ profile_id: string | null }>).forEach((event) => {
      if (!event.profile_id) return;
      onboardingEventCountByProfile.set(event.profile_id, (onboardingEventCountByProfile.get(event.profile_id) ?? 0) + 1);
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

    stage = "missions";
    const canDetectMissionProblems = [missionsRes, serviceRequestsRes, quotesRes, invoicesRes, interventionsRes, maintenanceRes].every(
      (source) => source.available,
    );
    const missionProblemDetections: ReturnType<typeof detectMissionProblems> = [];
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
      if (missionId) {
        assignmentCountByMissionId.set(missionId, (assignmentCountByMissionId.get(missionId) ?? 0) + 1);
      }
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
        const assignmentCount =
          (assignmentCountByMissionId.get(mission.id) ?? 0) +
          (typeof mission.metadata?.assigned_team_member_id === "string" ? 1 : 0);
        const evaluation = evaluateMissionHealth({
          status: mission.status,
          scheduled_start: mission.scheduled_start,
          scheduled_end: mission.scheduled_end,
          completed_at: mission.completed_at,
          hasRequest: requestByMissionId.has(mission.id),
          quoteCount: relatedQuotes.length,
          invoices: relatedInvoices,
          assignmentCount,
          openMaintenanceCount: openMaintenanceCountByMissionId.get(mission.id) ?? 0,
        });
        if (canDetectMissionProblems) {
          missionProblemDetections.push(
            ...detectMissionProblems({
              id: mission.id,
              status: mission.status,
              scheduledStart: mission.scheduled_start,
              scheduledEnd: mission.scheduled_end,
              completedAt: mission.completed_at,
              hasRequest: requestByMissionId.has(mission.id),
              quoteCount: relatedQuotes.length,
              invoices: relatedInvoices,
              assignmentCount,
              openMaintenanceCount: openMaintenanceCountByMissionId.get(mission.id) ?? 0,
            }),
          );
        }

        return {
          id: mission.id,
          title: getMissionLabel(mission),
          status: mission.status,
          priority: mission.priority,
          ownerName: mission.owner_profile_id ? formatDisplayName(profileById.get(mission.owner_profile_id)) : "Propriétaire manquant",
          conciergeName: mission.concierge_profile_id ? formatDisplayName(profileById.get(mission.concierge_profile_id)) : "Conciergerie manquante",
          createdAt: mission.created_at,
          updatedAt: mission.updated_at,
          scheduledStart: mission.scheduled_start,
          scheduledEnd: mission.scheduled_end,
          completedAt: mission.completed_at,
          quoteCount: relatedQuotes.length,
          invoiceCount: relatedInvoices.length,
          assignmentCount,
          openMaintenanceCount: openMaintenanceCountByMissionId.get(mission.id) ?? 0,
          hasOverdueInvoice: evaluation.hasOverdueInvoice,
          steps: evaluation.steps,
          issueCount: evaluation.issueCount,
          tone: evaluation.tone,
        };
      })
      .sort((left, right) => right.issueCount - left.issueCount || getAgeHours(right.updatedAt) - getAgeHours(left.updatedAt));

    if (missionProblemDetections.length > 0) {
      const registryClient = db as unknown as Parameters<typeof createOrRedetectAdminProblem>[0];
      await Promise.all(
        missionProblemDetections.map((detection) =>
          createOrRedetectAdminProblem(registryClient, detection).catch((error) => {
            console.error("[admin/control-tower] problem registry sync failed", error);
          }),
        ),
      );
    }

    stage = "problem-registry";
    const problemRegistryRes = await safeQuery(
      queryTable("admin_problems")
        .select("id,severity,status,title,summary,functional_owner,occurrence_count,last_detected_at")
        .order("last_detected_at", { ascending: false })
        .limit(24) as unknown as PromiseLike<QueryResult<AdminProblemRow>>,
    );

    stage = "messages";
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
        const threadMessages = [...(messageGroups.get(conversation.id) ?? [])].sort(
          (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
        );
        const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
        const distinctSenders = new Set(threadMessages.map((message) => message.sender_profile_id));
        const waitingHours = getAgeHours(lastMessage?.created_at ?? conversation.last_message_at ?? conversation.created_at);
        const steps = [
          { id: "created", label: "Conversation créée", ok: Boolean(conversation.created_at) },
          { id: "first", label: "Premier message", ok: threadMessages.length > 0 },
          { id: "reply", label: "Reponse croisee", ok: distinctSenders.size > 1 },
          { id: "recent", label: "Activite recente", ok: waitingHours <= 72 },
        ];
        const issueCount = buildIssueCount(steps);
        const tone: ControlTone =
          threadMessages.length === 0 ||
          waitingHours > 120 ||
          (threadMessages.length > 0 && distinctSenders.size === 1 && waitingHours > 48)
            ? "danger"
            : issueCount > 0
              ? "warning"
              : "positive";

        return {
          id: conversation.id,
          subject: conversation.subject || "Conversation",
          source: conversation.source,
          status: conversation.status,
          ownerName: formatDisplayName(profileById.get(conversation.owner_profile_id)),
          conciergeName: formatDisplayName(profileById.get(conversation.concierge_profile_id)),
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

    const hasUnavailableSources = [
      profilesRes,
      authUsersRes,
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
      problemRegistryRes,
    ].some((source) => !source.available);

    if (hasUnavailableSources && onboardingItems.length === 0 && missionItems.length === 0 && conversationItems.length === 0) {
      onboardingItems.push(buildFallbackOnboardingItem());
    }

    stage = "health";
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
      { key: "auth-users", label: "Comptes Supabase Auth", available: authUsersRes.available, reason: authUsersRes.reason },
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
      { key: "admin-problems", label: "Registre des problèmes", available: problemRegistryRes.available, reason: problemRegistryRes.reason },
    ];
    const health = buildControlTowerHealth({ sources: sourceHealth, dangerCount, warningCount });

    stage = "response";
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
        problemRegistry: {
          available: problemRegistryRes.available,
          reason: problemRegistryRes.reason,
          openCount: (problemRegistryRes.data ?? []).filter((item) => item.status !== "resolved" && item.status !== "closed").length,
          items: problemRegistryRes.data ?? [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/control-tower] error", { stage, error });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      process.env.NODE_ENV === "production"
        ? { error: "Erreur serveur admin" }
        : { error: "Erreur serveur admin", stage, details: message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) return guard.response;

    const parsed = parseAdminControlAction(await req.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const action = parsed.data;
    const eventType = "admin_control_" + action.status;
    const payload = {
      actor_profile_id: guard.auth.userId,
      mission_id: action.targetType === "mission" ? action.targetId : null,
      event_type: eventType,
      title:
        action.status === "closed"
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
    };

    try {
      const { data, error } = await (queryTable("workflow_events")
        .insert(payload)
        .select("id,actor_profile_id,event_type,body,metadata,created_at")
        .single() as PromiseLike<{
        data: {
          id: string;
          actor_profile_id: string | null;
          event_type: string;
          body: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        error: { code?: string; message?: string } | null;
      }>);

      if (error) {
        if (!isTransportError(error)) {
          console.error("[POST /api/admin/control-tower] insert error", error);
          return NextResponse.json({ error: "Impossible d'enregistrer l'action administrateur." }, { status: 500 });
        }
      } else {
        fallbackControlActions.set(controlActionKey(action.targetType, action.targetId), {
          status: action.status,
          note: action.note,
          actorProfileId: guard.auth.userId,
          createdAt: data.created_at,
        });
        return NextResponse.json({ action: data }, { status: 201 });
      }
    } catch (error) {
      if (!isTransportError(error)) {
        throw error;
      }
    }

    const createdAt = new Date().toISOString();
    const fallbackAction = {
      id: crypto.randomUUID(),
      actor_profile_id: guard.auth.userId,
      event_type: eventType,
      body: action.note,
      metadata: {
        target_type: action.targetType,
        target_id: action.targetId,
        control_status: action.status,
      },
      created_at: createdAt,
    };

    fallbackControlActions.set(controlActionKey(action.targetType, action.targetId), {
      status: action.status,
      note: action.note,
      actorProfileId: guard.auth.userId,
      createdAt,
    });

    return NextResponse.json({ action: fallbackAction }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/control-tower] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}
