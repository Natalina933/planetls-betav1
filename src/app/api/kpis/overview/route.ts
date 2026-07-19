import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { ACTIVATION_ALERT_POLICY, buildActivationAlerts, type KpiOverviewPayload } from "./shared";
import { computeActivationByZone, computeActivationCohort, computeWeeklyActivationSeries } from "@/app/lib/activationKpis";

type RoleKey = "owner" | "concierge" | "provider";

type SchemaDriftError = { code?: string } | null | undefined;

type KpiQueryResult = {
  data: unknown[] | null;
  error: SchemaDriftError;
};

type KpiQuery = {
  select: (columns: string) => KpiQuery;
  gte: (column: string, value: string) => Promise<KpiQueryResult>;
  not: (column: string, operator: string, value: unknown) => Promise<KpiQueryResult>;
};

type KpiDb = {
  from: (relation: string) => KpiQuery;
};

const ROLE_GROUPS: Record<RoleKey, string[]> = {
  owner: ["owner", "owner_pro", "proprietaire"],
  concierge: ["concierge", "concierge_pro"],
  provider: ["provider", "provider_pro", "artisan", "artisan_pro"],
};

const SCHEMA_DRIFT_CODES = new Set(["42P01", "42703", "PGRST205"]);

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toMinutes(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return round2((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return round2(sorted[mid]);
}

const kpiDb = db as unknown as KpiDb;

function isSchemaDriftError(error: SchemaDriftError): boolean {
  return Boolean(error?.code && SCHEMA_DRIFT_CODES.has(error.code));
}

function profileMatchesRole(profileRole: string | null, role: RoleKey): boolean {
  if (!profileRole) return false;
  return ROLE_GROUPS[role].includes(profileRole);
}

async function fetchProfiles() {
  const { data, error } = await kpiDb
    .from("profiles")
    .select("id, role, city, created_at")
    .not("created_at", "is", null);

  if (error) {
    if (isSchemaDriftError(error)) return [];
    throw error;
  }

  return (data ?? []) as Array<{ id: string; role: string | null; city: string | null; created_at: string | null }>;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    if (!auth.isAdmin) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

    const windowDaysRaw = Number(req.nextUrl.searchParams.get("window_days") ?? 30);
    const windowDays = Number.isFinite(windowDaysRaw)
      ? Math.min(120, Math.max(7, Math.trunc(windowDaysRaw)))
      : 30;

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const windowIso = windowStart.toISOString();

    const profiles = await fetchProfiles();
    const profileMap = new Map(
      profiles.map((profile) => [profile.id, { role: profile.role ?? "", createdAt: asDate(profile.created_at) }]),
    );

    const activityByProfile = new Map<string, Map<string, Date>>();
    const markActivity = (profileId: string, marker: string, occurredAt: unknown) => {
      const date = asDate(occurredAt);
      if (!date) return;
      const existing = activityByProfile.get(profileId) ?? new Map<string, Date>();
      const previous = existing.get(marker);
      if (!previous || date < previous) existing.set(marker, date);
      activityByProfile.set(profileId, existing);
    };

    const { data: requestsData, error: requestsError } = await kpiDb
      .from("service_requests")
      .select("id, owner_profile_id, created_at")
      .gte("created_at", windowIso);
    if (requestsError && !isSchemaDriftError(requestsError)) throw requestsError;
    const requests = (requestsError ? [] : requestsData ?? []) as Array<{
      id: string;
      owner_profile_id: string | null;
      created_at: string | null;
    }>;

    const ownerSignupToFirstRequest: number[] = [];
    const firstRequestByOwner = new Map<string, Date>();
    for (const requestRow of requests) {
      if (requestRow.owner_profile_id) markActivity(requestRow.owner_profile_id, "request", requestRow.created_at);
      if (!requestRow.owner_profile_id) continue;
      const createdAt = asDate(requestRow.created_at);
      if (!createdAt) continue;
      const previous = firstRequestByOwner.get(requestRow.owner_profile_id);
      if (!previous || createdAt < previous) firstRequestByOwner.set(requestRow.owner_profile_id, createdAt);
    }
    for (const [ownerId, firstRequestAt] of firstRequestByOwner) {
      const profile = profileMap.get(ownerId);
      if (!profile?.createdAt || !profileMatchesRole(profile.role, "owner")) continue;
      ownerSignupToFirstRequest.push(toMinutes(profile.createdAt, firstRequestAt));
    }

    const requestIds = requests.map((row) => row.id);
    const { data: quotesData, error: quotesError } = await kpiDb
      .from("quotes")
      .select("id, request_id, owner_profile_id, concierge_profile_id, provider_profile_id, created_at")
      .gte("created_at", windowIso);
    if (quotesError && !isSchemaDriftError(quotesError)) throw quotesError;
    const quotes = (quotesError ? [] : quotesData ?? []) as Array<{
      id: string;
      request_id: string | null;
      owner_profile_id: string | null;
      concierge_profile_id: string | null;
      provider_profile_id: string | null;
      created_at: string | null;
    }>;

    for (const quote of quotes) {
      if (quote.owner_profile_id) markActivity(quote.owner_profile_id, "quote", quote.created_at);
      if (quote.concierge_profile_id) markActivity(quote.concierge_profile_id, "quote", quote.created_at);
      if (quote.provider_profile_id) markActivity(quote.provider_profile_id, "quote", quote.created_at);
    }

    const { data: missionsData, error: missionsError } = await kpiDb
      .from("missions")
      .select("id, request_id, owner_profile_id, concierge_profile_id, provider_profile_id, status, created_at")
      .gte("created_at", windowIso);
    if (missionsError && !isSchemaDriftError(missionsError)) throw missionsError;
    const missions = (missionsError ? [] : missionsData ?? []) as Array<{
      id: string;
      request_id: string | null;
      owner_profile_id: string | null;
      concierge_profile_id: string | null;
      provider_profile_id: string | null;
      status: string | null;
      created_at: string | null;
    }>;

    for (const mission of missions) {
      if (mission.owner_profile_id) markActivity(mission.owner_profile_id, "mission", mission.created_at);
      if (mission.concierge_profile_id) markActivity(mission.concierge_profile_id, "mission", mission.created_at);
      if (mission.provider_profile_id) markActivity(mission.provider_profile_id, "mission", mission.created_at);
    }

    const { data: invoicesData, error: invoicesError } = await kpiDb
      .from("invoices")
      .select("id, status, owner_profile_id, concierge_profile_id, provider_profile_id, created_at")
      .gte("created_at", windowIso);
    if (invoicesError && !isSchemaDriftError(invoicesError)) throw invoicesError;
    const invoices = (invoicesError ? [] : invoicesData ?? []) as Array<{
      id: string;
      status: string | null;
      owner_profile_id: string | null;
      concierge_profile_id: string | null;
      provider_profile_id: string | null;
      created_at: string | null;
    }>;

    for (const invoice of invoices) {
      if (invoice.owner_profile_id) markActivity(invoice.owner_profile_id, "invoice", invoice.created_at);
      if (invoice.concierge_profile_id) markActivity(invoice.concierge_profile_id, "invoice", invoice.created_at);
      if (invoice.provider_profile_id) markActivity(invoice.provider_profile_id, "invoice", invoice.created_at);
    }

    let { data: messagesData, error: messagesError } = await kpiDb
      .from("messages")
      .select("conversation_id, sender_id, created_at")
      .gte("created_at", windowIso);
    if (messagesError && isSchemaDriftError(messagesError)) {
      const contactMessagesResult = await kpiDb.from("contact_messages")
        .select("conversation_id, sender_profile_id, created_at")
        .gte("created_at", windowIso);
      messagesData = (contactMessagesResult.data ?? []).map((row) => {
        const value = row as { conversation_id?: unknown; sender_profile_id?: unknown; created_at?: unknown };
        return { conversation_id: value.conversation_id, sender_id: value.sender_profile_id, created_at: value.created_at };
      });
      messagesError = contactMessagesResult.error;
    }
    if (messagesError && !isSchemaDriftError(messagesError)) throw messagesError;
    const messages = (messagesError ? [] : messagesData ?? []) as Array<{
      conversation_id: string | null;
      sender_id: string | null;
      created_at: string | null;
    }>;

    for (const message of messages) {
      if (message.sender_id) markActivity(message.sender_id, "message", message.created_at);
    }

    const firstResponseByConversation = new Map<string, Date>();
    const firstMessageByConversation = new Map<string, Date>();
    for (const row of messages) {
      if (!row.conversation_id || !row.sender_id) continue;
      const createdAt = asDate(row.created_at);
      if (!createdAt) continue;
      const first = firstMessageByConversation.get(row.conversation_id);
      if (!first || createdAt < first) firstMessageByConversation.set(row.conversation_id, createdAt);
    }
    for (const row of messages) {
      if (!row.conversation_id || !row.sender_id) continue;
      const createdAt = asDate(row.created_at);
      if (!createdAt) continue;
      const firstAt = firstMessageByConversation.get(row.conversation_id);
      if (!firstAt || createdAt <= firstAt) continue;
      const existing = firstResponseByConversation.get(row.conversation_id);
      if (!existing || createdAt < existing) firstResponseByConversation.set(row.conversation_id, createdAt);
    }
    const firstResponseMinutes: number[] = [];
    for (const [conversationId, firstAt] of firstMessageByConversation) {
      const responseAt = firstResponseByConversation.get(conversationId);
      if (!responseAt) continue;
      firstResponseMinutes.push(toMinutes(firstAt, responseAt));
    }

    const activationProfiles = profiles.map((profile) => ({
      id: profile.id,
      role: profile.role,
      createdAt: asDate(profile.created_at),
      zone: profile.city,
    }));
    const activationFor = (role: RoleKey) => computeActivationCohort({
      role,
      profiles: activationProfiles,
      roleAliases: ROLE_GROUPS[role],
      activityByProfile,
      windowStart,
      now,
    });
    const ownerActivation = activationFor("owner");
    const conciergeActivation = activationFor("concierge");
    const providerActivation = activationFor("provider");
    const activationSeriesFor = (role: RoleKey) => computeWeeklyActivationSeries({
      role,
      profiles: activationProfiles,
      roleAliases: ROLE_GROUPS[role],
      activityByProfile,
      windowStart,
      now,
    });    const activationByZoneFor = (role: RoleKey) => computeActivationByZone({
      role,
      profiles: activationProfiles,
      roleAliases: ROLE_GROUPS[role],
      activityByProfile,
      windowStart,
      now,
    });

    const requestToQuoteRate =
      requestIds.length > 0
        ? round2(
            (new Set(
              quotes
                .map((quote) => quote.request_id)
                .filter((requestId): requestId is string => Boolean(requestId)),
            ).size /
              requestIds.length) *
              100,
          )
        : null;

    const quoteIds = new Set(quotes.map((quote) => quote.id));
    const missionsLinkedToQuote = missions.filter((mission) => {
      const requestId = mission.request_id;
      return Boolean(
        requestId &&
          quotes.some((quote) => quote.request_id === requestId),
      );
    }).length;
    const quoteToMissionRate =
      quoteIds.size > 0 ? round2((missionsLinkedToQuote / quoteIds.size) * 100) : null;

    const missionToPaidInvoiceRate =
      missions.length > 0
        ? round2(
            (invoices.filter((invoice) => invoice.status === "paid").length / missions.length) * 100,
          )
        : null;

    const providerMissions = missions.filter((mission) =>
      mission.provider_profile_id
        ? profileMatchesRole(profileMap.get(mission.provider_profile_id)?.role ?? "", "provider")
        : false,
    );
    const providerCompleted = providerMissions.filter((mission) => mission.status === "completed").length;
    const providerMissionCompletedRate =
      providerMissions.length > 0 ? round2((providerCompleted / providerMissions.length) * 100) : null;

    const activationSeries = {
      owner: activationSeriesFor("owner"),
      concierge: activationSeriesFor("concierge"),
      provider: activationSeriesFor("provider"),
    };
    const roleMetrics = {
      owner: { ...ownerActivation, median_signup_to_first_request_minutes: median(ownerSignupToFirstRequest), request_to_quote_rate: requestToQuoteRate },
      concierge: { ...conciergeActivation, median_signup_to_first_response_minutes: median(firstResponseMinutes), quote_to_mission_rate: quoteToMissionRate },
      provider: { ...providerActivation, median_signup_to_first_response_minutes: median(firstResponseMinutes), missions_completed_rate: providerMissionCompletedRate },
    };
    const payload: KpiOverviewPayload = {
      window_days: windowDays,
      generated_at: now.toISOString(),
      ...roleMetrics,
      activation_series: activationSeries,
      activation_by_zone: {
        owner: activationByZoneFor("owner"),
        concierge: activationByZoneFor("concierge"),
        provider: activationByZoneFor("provider"),
      },
      activation_alert_policy: ACTIVATION_ALERT_POLICY,
      activation_alerts: buildActivationAlerts(roleMetrics, activationSeries),
      shared: {
        mission_to_paid_invoice_rate: missionToPaidInvoiceRate,
        median_first_message_response_minutes: median(firstResponseMinutes),
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[GET /api/kpis/overview] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
