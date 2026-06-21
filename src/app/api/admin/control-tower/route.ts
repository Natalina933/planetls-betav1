import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiRole } from "@/server/auth/roleGuards";
import { resolveUserRole } from "@/app/utils/roles";

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
      return { data: fallback, count: 0, error: null };
    }

    throw new Error(result.error.message);
  }

  return result;
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
            "id,title,status,priority,owner_profile_id,concierge_profile_id,property_id,scheduled_start,completed_at,created_at,updated_at",
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
            completed_at: string | null;
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
          .select("id, mission_id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(120) as unknown as PromiseLike<
          QueryResult<{ id: string; mission_id: string | null; status: string; created_at: string }>
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
    ]);

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
          { id: "account", label: "Compte cree", ok: Boolean(createdAt) },
          { id: "email", label: "Email confirme", ok: Boolean(authUser?.email_confirmed_at) },
          { id: "signin", label: "Premiere connexion", ok: Boolean(authUser?.last_sign_in_at) },
          { id: "events", label: "Evenements d'inscription", ok: (onboardingEventCountByProfile.get(profile.id) ?? 0) > 0 },
          { id: "complete", label: "Inscription terminee", ok: profile.onboarding_complete === true },
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
    const invoices = (invoicesRes.data ?? []) as Array<{ id: string; mission_id: string | null; status: string; created_at: string }>;

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

    const missionItems = ((missionsRes.data ?? []) as Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      owner_profile_id: string | null;
      concierge_profile_id: string | null;
      property_id: string | null;
      scheduled_start: string | null;
      completed_at: string | null;
      created_at: string;
      updated_at: string;
    }>)
      .map((mission) => {
        const relatedQuotes = quotesByMissionId.get(mission.id) ?? [];
        const relatedInvoices = invoicesByMissionId.get(mission.id) ?? [];
        const steps = [
          { id: "request", label: "Demande liee", ok: requestByMissionId.has(mission.id) },
          { id: "quote", label: "Devis lie", ok: relatedQuotes.length > 0 },
          { id: "planning", label: "Planning fixe", ok: Boolean(mission.scheduled_start) },
          { id: "execution", label: "Realisation", ok: Boolean(mission.completed_at) },
          { id: "invoice", label: "Facture liee", ok: relatedInvoices.length > 0 },
        ];
        const issueCount = buildIssueCount(steps);
        const tone: ControlTone =
          (Boolean(mission.completed_at) && relatedInvoices.length === 0) || issueCount >= 3
            ? "danger"
            : issueCount > 0
              ? "warning"
              : "positive";

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
          completedAt: mission.completed_at,
          quoteCount: relatedQuotes.length,
          invoiceCount: relatedInvoices.length,
          steps,
          issueCount,
          tone,
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

    return NextResponse.json(
      {
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
        onboarding: onboardingItems.slice(0, 24),
        missions: missionItems.slice(0, 24),
        messages: conversationItems.slice(0, 24),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/control-tower] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}
