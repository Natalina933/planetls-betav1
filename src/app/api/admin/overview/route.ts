import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiRole } from "@/server/auth/roleGuards";
import { resolveUserRole } from "@/app/utils/roles";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

type RawProfile = {
  id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  category: string | null;
  company_name: string | null;
  city: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  onboarding_complete: boolean | null;
  onboarding_completed_at: string | null;
  status?: string | null;
};

type AuthUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
};

type AdminRoleBucket = "admin" | "owner" | "concierge" | "provider";

type AdminUserSummary = {
  id: string;
  email: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: string;
  roleBucket: AdminRoleBucket;
  companyName: string | null;
  city: string | null;
  phone: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  onboardingComplete: boolean;
  onboardingCompletedAt: string | null;
  authCreatedAt: string | null;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  isActive24h: boolean;
  isActive7d: boolean;
  propertyCount: number;
  requestCount: number;
  recipientCount: number;
  ownerMissionCount: number;
  conciergeMissionCount: number;
  clientCount: number;
  pricingCount: number;
  healthFlags: string[];
};

type QueryResult<T> = {
  data: T[] | null;
  error: {
    code?: string;
    message: string;
  } | null;
  count?: number | null;
};

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

function toRoleBucket(role: string): AdminRoleBucket {
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "concierge" || role === "concierge_pro") return "concierge";
  if (role === "provider" || role === "provider_pro" || role === "artisan" || role === "artisan_pro") {
    return "provider";
  }
  return "owner";
}

function formatDisplayName(profile: RawProfile) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.company_name || profile.username || profile.email || "Profil sans nom";
}

function isRecent(value: string | null | undefined, maxAgeHours: number) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= maxAgeHours * 60 * 60 * 1000;
}

function incrementCount(map: Map<string, number>, key: string | null | undefined) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + 1);
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

function isMissingSchemaError(error: { code?: string; message: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("column") && message.includes("does not exist")
  );
}

async function safeQuery<T>(promise: PromiseLike<QueryResult<T>>, fallback: T[] = []) {
  const result = await promise;
  if (result.error) {
    if (isMissingSchemaError(result.error)) {
      console.warn("[admin/overview] optional query skipped:", result.error.message);
      return { data: fallback, count: 0, error: null };
    }

    throw new Error(result.error.message);
  }

  return result;
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
      propertiesRes,
      missionsRes,
      servicesPricingRes,
      serviceRequestsRes,
      recipientsRes,
      providerClientsRes,
      totalRequestsRes,
      totalInvoicesRes,
      totalPlanningRes,
      totalWorkflowEventsRes,
      totalOnboardingEventsRes,
    ] = await Promise.all([
      safeQuery(
        adminClient
          .from("profiles")
          .select(
            "id,email,username,first_name,last_name,role,category,company_name,city,phone,created_at,updated_at,onboarding_complete,onboarding_completed_at,status",
          )
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<RawProfile>>,
      ),
      listAllAuthUsers(adminClient),
      safeQuery(
        adminClient.from("properties").select("id, owner_id") as unknown as PromiseLike<
          QueryResult<{ owner_id: string | null }>
        >,
      ),
      safeQuery(
        adminClient.from("missions").select("id, owner_profile_id, concierge_profile_id") as unknown as PromiseLike<
          QueryResult<{ owner_profile_id: string | null; concierge_profile_id: string | null }>
        >,
      ),
      safeQuery(
        adminClient.from("services_pricing").select("id, profile_id") as unknown as PromiseLike<
          QueryResult<{ profile_id: string | null }>
        >,
      ),
      safeQuery(
        adminClient.from("service_requests").select("id, owner_profile_id") as unknown as PromiseLike<
          QueryResult<{ id: string; owner_profile_id: string | null }>
        >,
      ),
      safeQuery(
        adminClient
          .from("service_request_recipients")
          .select("id, concierge_profile_id") as unknown as PromiseLike<
          QueryResult<{ id: string; concierge_profile_id: string | null }>
        >,
      ),
      safeQuery(
        adminClient.from("provider_clients").select("id, provider_profile_id") as unknown as PromiseLike<
          QueryResult<{ id: string; provider_profile_id: string | null }>
        >,
      ),
      safeQuery(
        adminClient.from("service_requests").select("id", { count: "exact", head: true }) as unknown as PromiseLike<
          QueryResult<{ id: string }>
        >,
      ),
      safeQuery(
        adminClient.from("invoices").select("id", { count: "exact", head: true }) as unknown as PromiseLike<
          QueryResult<{ id: string }>
        >,
      ),
      safeQuery(
        adminClient.from("planning_entries").select("id", { count: "exact", head: true }) as unknown as PromiseLike<
          QueryResult<{ id: string }>
        >,
      ),
      safeQuery(
        adminClient.from("workflow_events").select("id", { count: "exact", head: true }) as unknown as PromiseLike<
          QueryResult<{ id: string }>
        >,
      ),
      safeQuery(
        adminClient.from("onboarding_events").select("id", { count: "exact", head: true }) as unknown as PromiseLike<
          QueryResult<{ id: string }>
        >,
      ),
    ]);

    const profiles = (profilesRes.data ?? []) as RawProfile[];
    const authById = new Map<string, AuthUser>();
    authUsers.forEach((user) => {
      authById.set(user.id, user);
    });

    const propertyCounts = new Map<string, number>();
    ((propertiesRes.data ?? []) as Array<{ owner_id: string | null }>).forEach((row) => {
      incrementCount(propertyCounts, row.owner_id);
    });

    const ownerMissionCounts = new Map<string, number>();
    const conciergeMissionCounts = new Map<string, number>();
    (
      (missionsRes.data ?? []) as Array<{
        owner_profile_id: string | null;
        concierge_profile_id: string | null;
      }>
    ).forEach((row) => {
      incrementCount(ownerMissionCounts, row.owner_profile_id);
      incrementCount(conciergeMissionCounts, row.concierge_profile_id);
    });

    const pricingCounts = new Map<string, number>();
    ((servicesPricingRes.data ?? []) as Array<{ profile_id: string | null }>).forEach((row) => {
      incrementCount(pricingCounts, row.profile_id);
    });

    const requestCounts = new Map<string, number>();
    ((serviceRequestsRes.data ?? []) as Array<{ owner_profile_id: string | null }>).forEach((row) => {
      incrementCount(requestCounts, row.owner_profile_id);
    });

    const recipientCounts = new Map<string, number>();
    ((recipientsRes.data ?? []) as Array<{ concierge_profile_id: string | null }>).forEach((row) => {
      incrementCount(recipientCounts, row.concierge_profile_id);
    });

    const clientCounts = new Map<string, number>();
    ((providerClientsRes.data ?? []) as Array<{ provider_profile_id: string | null }>).forEach((row) => {
      incrementCount(clientCounts, row.provider_profile_id);
    });

    const users: AdminUserSummary[] = profiles.map((profile) => {
      const resolvedRole = resolveUserRole(profile.role, profile.category) ?? "owner";
      const roleBucket = toRoleBucket(resolvedRole);
      const authUser = authById.get(profile.id);
      const propertyCount = propertyCounts.get(profile.id) ?? 0;
      const requestCount = requestCounts.get(profile.id) ?? 0;
      const recipientCount = recipientCounts.get(profile.id) ?? 0;
      const ownerMissionCount = ownerMissionCounts.get(profile.id) ?? 0;
      const conciergeMissionCount = conciergeMissionCounts.get(profile.id) ?? 0;
      const clientCount = clientCounts.get(profile.id) ?? 0;
      const pricingCount = pricingCounts.get(profile.id) ?? 0;
      const onboardingComplete = profile.onboarding_complete === true;
      const isActive24h = isRecent(authUser?.last_sign_in_at ?? null, 24);
      const isActive7d = isRecent(authUser?.last_sign_in_at ?? null, 24 * 7);
      const healthFlags: string[] = [];

      if (!onboardingComplete) healthFlags.push("Onboarding incomplet");
      if (!authUser?.email_confirmed_at) healthFlags.push("Email non confirmé");
      if (!authUser?.last_sign_in_at) healthFlags.push("Jamais connecté");
      if (!profile.company_name && roleBucket !== "owner") healthFlags.push("Société non renseignée");
      if (!profile.phone) healthFlags.push("Téléphone manquant");

      return {
        id: profile.id,
        email: profile.email,
        displayName: formatDisplayName(profile),
        firstName: profile.first_name,
        lastName: profile.last_name,
        username: profile.username,
        role: resolvedRole,
        roleBucket,
        companyName: profile.company_name,
        city: profile.city,
        phone: profile.phone,
        status: profile.status ?? null,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        onboardingComplete,
        onboardingCompletedAt: profile.onboarding_completed_at,
        authCreatedAt: authUser?.created_at ?? null,
        emailConfirmedAt: authUser?.email_confirmed_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        isActive24h,
        isActive7d,
        propertyCount,
        requestCount,
        recipientCount,
        ownerMissionCount,
        conciergeMissionCount,
        clientCount,
        pricingCount,
        healthFlags,
      };
    });

    const summary = {
      totalUsers: users.length,
      active24h: users.filter((user) => user.isActive24h).length,
      active7d: users.filter((user) => user.isActive7d).length,
      onboardingComplete: users.filter((user) => user.onboardingComplete).length,
      emailConfirmed: users.filter((user) => Boolean(user.emailConfirmedAt)).length,
      neverSignedIn: users.filter((user) => !user.lastSignInAt).length,
      owners: users.filter((user) => user.roleBucket === "owner").length,
      concierges: users.filter((user) => user.roleBucket === "concierge").length,
      providers: users.filter((user) => user.roleBucket === "provider").length,
      admins: users.filter((user) => user.roleBucket === "admin").length,
      properties: (propertiesRes.data ?? []).length,
      missions: (missionsRes.data ?? []).length,
      serviceRequests: totalRequestsRes.count ?? 0,
      invoices: totalInvoicesRes.count ?? 0,
      planningEntries: totalPlanningRes.count ?? 0,
      workflowEvents: totalWorkflowEventsRes.count ?? 0,
      onboardingEvents: totalOnboardingEventsRes.count ?? 0,
    };

    const spotlights = {
      recentlySignedIn: [...users]
        .filter((user) => Boolean(user.lastSignInAt))
        .sort((left, right) => {
          const leftTime = left.lastSignInAt ? new Date(left.lastSignInAt).getTime() : 0;
          const rightTime = right.lastSignInAt ? new Date(right.lastSignInAt).getTime() : 0;
          return rightTime - leftTime;
        })
        .slice(0, 8),
      onboardingAlerts: users
        .filter((user) => !user.onboardingComplete || !user.emailConfirmedAt || !user.lastSignInAt)
        .slice(0, 8),
    };

    return NextResponse.json(
      {
        summary,
        spotlights,
        users,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/overview] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}
