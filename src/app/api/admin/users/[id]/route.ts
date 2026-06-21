import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiRole } from "@/server/auth/roleGuards";
import { isUserRole, resolveUserRole } from "@/app/utils/roles";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const MANAGEABLE_STATUSES = new Set(["active", "suspended", "deleted"]);

type QueryResult<T> = {
  data: T[] | T | null;
  error: {
    code?: string;
    message: string;
  } | null;
  count?: number | null;
};

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
  location: string | null;
  created_at: string | null;
  updated_at: string | null;
  onboarding_complete: boolean | null;
  onboarding_completed_at: string | null;
  status?: string | null;
  legal_form?: string | null;
  website?: string | null;
  service_area?: string | null;
  service_radius_km?: number | null;
  hourly_rate?: number | null;
  monthly_rate?: number | null;
  years_experience?: number | null;
  experience_level?: string | null;
};

type AuthUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
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
      console.warn("[admin/users] optional query skipped:", result.error.message);
      return { data: fallback, count: 0, error: null };
    }

    throw new Error(result.error.message);
  }

  return result;
}

function formatDisplayName(profile: RawProfile) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return fullName || profile.company_name || profile.username || profile.email || "Profil sans nom";
}

function toRoleBucket(role: string) {
  if (role === "admin" || role === "super_admin") return "admin";
  if (role === "concierge" || role === "concierge_pro") return "concierge";
  if (role === "provider" || role === "provider_pro" || role === "artisan" || role === "artisan_pro") {
    return "provider";
  }
  return "owner";
}

function parseManagedStatus(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return MANAGEABLE_STATUSES.has(normalized) ? normalized : null;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await context.params;
    const adminClient = createAdminClient();

    const [
      profileRes,
      authRes,
      propertiesRes,
      ownerRequestsRes,
      conciergeRequestsRes,
      recipientsRes,
      ownerMissionsRes,
      conciergeMissionsRes,
      pricingRes,
      providerClientsRes,
      ownerQuotesRes,
      conciergeQuotesRes,
      ownerInvoicesRes,
      conciergeInvoicesRes,
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select(
          "id,email,username,first_name,last_name,role,category,company_name,city,phone,location,created_at,updated_at,onboarding_complete,onboarding_completed_at,status,legal_form,website,service_area,service_radius_km,hourly_rate,monthly_rate,years_experience,experience_level",
        )
        .eq("id", id)
        .single(),
      adminClient.auth.admin.getUserById(id),
      safeQuery(
        adminClient
          .from("properties")
          .select("id, name, city, status")
          .eq("owner_id", id)
          .order("name", { ascending: true }) as unknown as PromiseLike<QueryResult<{
          id: string;
          name: string | null;
          city: string | null;
          status: string | null;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("service_requests")
          .select("id, title, status, workflow_status, city, created_at")
          .eq("owner_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          title: string | null;
          status: string | null;
          workflow_status: string | null;
          city: string | null;
          created_at: string | null;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("service_requests")
          .select("id, title, status, workflow_status, city, created_at")
          .eq("selected_concierge_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          title: string | null;
          status: string | null;
          workflow_status: string | null;
          city: string | null;
          created_at: string | null;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("service_request_recipients")
          .select("id, service_request_id, status, responded_at, viewed_at, created_at")
          .eq("concierge_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          service_request_id: string;
          status: string | null;
          responded_at: string | null;
          viewed_at: string | null;
          created_at: string | null;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("missions")
          .select("id, status, priority, created_at")
          .eq("owner_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          status: string;
          priority: string;
          created_at: string;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("missions")
          .select("id, status, priority, created_at")
          .eq("concierge_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          status: string;
          priority: string;
          created_at: string;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("services_pricing")
          .select("id, label, amount, unit, created_at")
          .eq("profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          label: string;
          amount: number;
          unit: string | null;
          created_at: string | null;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("provider_clients")
          .select("id, client_name, company_name, city, client_type, status, created_at")
          .eq("provider_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          client_name: string | null;
          company_name: string | null;
          city: string | null;
          client_type: string | null;
          status: string | null;
          created_at: string | null;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("quotes")
          .select("id, status, total_amount, created_at")
          .eq("owner_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          status: string;
          total_amount: number;
          created_at: string;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("quotes")
          .select("id, status, total_amount, created_at")
          .eq("concierge_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          status: string;
          total_amount: number;
          created_at: string;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("invoices")
          .select("id, status, total_amount, created_at")
          .eq("owner_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          status: string;
          total_amount: number;
          created_at: string;
        }>>,
      ),
      safeQuery(
        adminClient
          .from("invoices")
          .select("id, status, total_amount, created_at")
          .eq("concierge_profile_id", id)
          .order("created_at", { ascending: false }) as unknown as PromiseLike<QueryResult<{
          id: string;
          status: string;
          total_amount: number;
          created_at: string;
        }>>,
      ),
    ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const profile = profileRes.data as RawProfile;
    const authUser = authRes.data.user as AuthUser | null;
    const resolvedRole = resolveUserRole(profile.role, profile.category) ?? "owner";
    const properties = (propertiesRes.data ?? []) as Array<{
      id: string;
      name: string | null;
      city: string | null;
      status: string | null;
    }>;
    const ownerRequests = (ownerRequestsRes.data ?? []) as Array<{
      id: string;
      title: string | null;
      status: string | null;
      workflow_status: string | null;
      city: string | null;
      created_at: string | null;
    }>;
    const conciergeRequests = (conciergeRequestsRes.data ?? []) as Array<{
      id: string;
      title: string | null;
      status: string | null;
      workflow_status: string | null;
      city: string | null;
      created_at: string | null;
    }>;
    const recipients = (recipientsRes.data ?? []) as Array<{
      id: string;
      service_request_id: string;
      status: string | null;
      responded_at: string | null;
      viewed_at: string | null;
      created_at: string | null;
    }>;
    const ownerMissions = (ownerMissionsRes.data ?? []) as Array<{
      id: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
    const conciergeMissions = (conciergeMissionsRes.data ?? []) as Array<{
      id: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
    const pricing = (pricingRes.data ?? []) as Array<{
      id: string;
      label: string;
      amount: number;
      unit: string | null;
      created_at: string | null;
    }>;
    const profileServices: Array<{
      id: number;
      service_id: number;
      selected: boolean | null;
      created_at: string | null;
    }> = [];
    const providerClients = (providerClientsRes.data ?? []) as Array<{
      id: string;
      client_name: string | null;
      company_name: string | null;
      city: string | null;
      client_type: string | null;
      status: string | null;
      created_at: string | null;
    }>;
    const ownerQuotes = (ownerQuotesRes.data ?? []) as Array<{
      id: string;
      status: string;
      total_amount: number;
      created_at: string;
    }>;
    const conciergeQuotes = (conciergeQuotesRes.data ?? []) as Array<{
      id: string;
      status: string;
      total_amount: number;
      created_at: string;
    }>;
    const ownerInvoices = (ownerInvoicesRes.data ?? []) as Array<{
      id: string;
      status: string;
      total_amount: number;
      created_at: string;
    }>;
    const conciergeInvoices = (conciergeInvoicesRes.data ?? []) as Array<{
      id: string;
      status: string;
      total_amount: number;
      created_at: string;
    }>;

    return NextResponse.json(
      {
        user: {
          id: profile.id,
          email: profile.email,
          displayName: formatDisplayName(profile),
          firstName: profile.first_name,
          lastName: profile.last_name,
          username: profile.username,
          role: resolvedRole,
          roleBucket: toRoleBucket(resolvedRole),
          companyName: profile.company_name,
          city: profile.city,
          phone: profile.phone,
          location: profile.location,
          status: profile.status ?? "active",
          onboardingComplete: profile.onboarding_complete === true,
          onboardingCompletedAt: profile.onboarding_completed_at,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          emailConfirmedAt: authUser?.email_confirmed_at ?? null,
          lastSignInAt: authUser?.last_sign_in_at ?? null,
          authCreatedAt: authUser?.created_at ?? null,
          legalForm: profile.legal_form ?? null,
          website: profile.website ?? null,
          serviceArea: profile.service_area ?? null,
          serviceRadiusKm: profile.service_radius_km ?? null,
          hourlyRate: profile.hourly_rate ?? null,
          monthlyRate: profile.monthly_rate ?? null,
          yearsExperience: profile.years_experience ?? null,
          experienceLevel: profile.experience_level ?? null,
        },
        metrics: {
          properties: properties.length,
          ownerRequests: ownerRequests.length,
          conciergeRequests: conciergeRequests.length,
          recipients: recipients.length,
          ownerMissions: ownerMissions.length,
          conciergeMissions: conciergeMissions.length,
          pricingItems: pricing.length,
          serviceSelections: profileServices.length,
          providerClients: providerClients.length,
          ownerQuotes: ownerQuotes.length,
          conciergeQuotes: conciergeQuotes.length,
          ownerInvoices: ownerInvoices.length,
          conciergeInvoices: conciergeInvoices.length,
        },
        collections: {
          properties,
          ownerRequests,
          conciergeRequests,
          recipients,
          ownerMissions,
          conciergeMissions,
          pricing,
          profileServices,
          providerClients,
          ownerQuotes,
          conciergeQuotes,
          ownerInvoices,
          conciergeInvoices,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/users/[id]] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await context.params;
    const adminClient = createAdminClient();
    const body = (await req.json()) as {
      status?: unknown;
      role?: unknown;
      onboardingComplete?: unknown;
    };

    const { data: currentProfile, error: currentProfileError } = await adminClient
      .from("profiles")
      .select("id, role, category")
      .eq("id", id)
      .single();

    if (currentProfileError || !currentProfile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const currentRole = resolveUserRole(currentProfile.role, currentProfile.category) ?? "owner";
    const requesterRole = guard.auth.role;

    if (currentRole === "super_admin" && requesterRole !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut modifier ce compte." }, { status: 403 });
    }

    if ((body.role || body.status) && currentRole === "admin" && requesterRole !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut modifier un administrateur." }, { status: 403 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      const status = parseManagedStatus(body.status);
      if (!status) {
        return NextResponse.json({ error: "Statut administrateur invalide." }, { status: 400 });
      }
      updates.status = status;
    }

    if (body.role !== undefined) {
      if (typeof body.role !== "string" || !isUserRole(body.role)) {
        return NextResponse.json({ error: "Rôle administrateur invalide." }, { status: 400 });
      }

      if (body.role === "super_admin" && requesterRole !== "super_admin") {
        return NextResponse.json({ error: "Seul un super admin peut attribuer ce rôle." }, { status: 403 });
      }

      updates.role = body.role;
    }

    if (body.onboardingComplete !== undefined) {
      if (typeof body.onboardingComplete !== "boolean") {
        return NextResponse.json({ error: "Valeur du parcours d'inscription invalide." }, { status: 400 });
      }

      updates.onboarding_complete = body.onboardingComplete;
      updates.onboarding_completed_at = body.onboardingComplete ? new Date().toISOString() : null;
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "Aucune modification demandée." }, { status: 400 });
    }

    const { error: updateError } = await adminClient.from("profiles").update(updates).eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}
