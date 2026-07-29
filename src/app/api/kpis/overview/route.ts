import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import { ACTIVATION_ALERT_POLICY, buildActivationAlerts, type KpiOverviewPayload } from "./shared";
import { computeActivationByZone, computeActivationCohort, computeWeeklyActivationSeries } from "@/app/lib/activationKpis";
import { buildWorkspaceEmail, getTargetWorkspaceEmail, isDevWorkspaceAuthEnabled } from "@/server/auth/devWorkspace";

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

const ROLE_DEFINITIONS: Record<
  RoleKey,
  {
    marker: "request" | "quote" | "mission";
    baseZone: string;
    supportZones: string[];
    activationIndexes: number[];
    medianMetricKey:
      | "median_signup_to_first_request_minutes"
      | "median_signup_to_first_response_minutes";
    medianMetricValue: number;
    rateMetricKey:
      | "request_to_quote_rate"
      | "quote_to_mission_rate"
      | "missions_completed_rate";
    rateMetricValue: number;
  }
> = {
  owner: {
    marker: "request",
    baseZone: "Nice",
    supportZones: ["Cannes", "Antibes"],
    activationIndexes: [0, 1, 2, 4],
    medianMetricKey: "median_signup_to_first_request_minutes",
    medianMetricValue: 195,
    rateMetricKey: "request_to_quote_rate",
    rateMetricValue: 72,
  },
  concierge: {
    marker: "quote",
    baseZone: "Paris",
    supportZones: ["Lyon", "Bordeaux"],
    activationIndexes: [0, 2, 4],
    medianMetricKey: "median_signup_to_first_response_minutes",
    medianMetricValue: 48,
    rateMetricKey: "quote_to_mission_rate",
    rateMetricValue: 61,
  },
  provider: {
    marker: "mission",
    baseZone: "Marseille",
    supportZones: ["Toulouse", "Montpellier"],
    activationIndexes: [0, 1, 2, 3, 5],
    medianMetricKey: "median_signup_to_first_response_minutes",
    medianMetricValue: 36,
    rateMetricKey: "missions_completed_rate",
    rateMetricValue: 84,
  },
};

const SCHEMA_DRIFT_CODES = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);

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

function isTransportError(error: unknown): boolean {
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
    message.includes("enotfound") ||
    message.includes("eacces")
  );
}

function buildEmptyRolePayload(definition: string): KpiOverviewPayload["owner"] {
  return {
    activation_j7: null,
    activation_j7_eligible: 0,
    activation_j7_activated: 0,
    activation_definition: definition,
  };
}

function buildUnavailablePayload(windowDays: number, reason: string): KpiOverviewPayload {
  const nowIso = new Date().toISOString();
  return {
    window_days: windowDays,
    generated_at: nowIso,
    health: {
      available: false,
      reasons: [reason],
      updated_at: nowIso,
    },
    owner: buildEmptyRolePayload("request"),
    concierge: buildEmptyRolePayload("quote"),
    provider: buildEmptyRolePayload("mission"),
    activation_series: {
      owner: [],
      concierge: [],
      provider: [],
    },
    activation_by_zone: {
      owner: [],
      concierge: [],
      provider: [],
    },
    activation_alert_policy: ACTIVATION_ALERT_POLICY,
    activation_alerts: [],
    shared: {
      mission_to_paid_invoice_rate: null,
      median_first_message_response_minutes: null,
    },
  };
}

function canUseWorkspaceFallback(req: NextRequest) {
  if (!isDevWorkspaceAuthEnabled()) return false;
  const host = req.nextUrl.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

function hasNoMatureActivationData(payload: KpiOverviewPayload) {
  return (["owner", "concierge", "provider"] as const).every((role) =>
    payload[role].activation_j7_eligible === 0 &&
    payload.activation_series[role].length === 0 &&
    payload.activation_by_zone[role].length === 0,
  );
}

function buildWorkspaceFallbackPayload(windowDays: number, reason: string): KpiOverviewPayload {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const targetEmail = getTargetWorkspaceEmail().toLowerCase();
  const profiles: Array<{ id: string; role: string; createdAt: Date; zone: string }> = [];
  const activityByProfile = new Map<string, Map<string, Date>>();
  const matureOffsets = [26, 24, 19, 17, 12, 10];
  const immatureOffsets = [4, 2];

  const markActivity = (profileId: string, marker: string, occurredAt: Date) => {
    activityByProfile.set(profileId, new Map([[marker, occurredAt]]));
  };

  for (const role of ["owner", "concierge", "provider"] as const) {
    const definition = ROLE_DEFINITIONS[role];
    const workspaceEmail = buildWorkspaceEmail(targetEmail, role);
    const profileIds = [
      workspaceEmail,
      ...matureOffsets.slice(1).map((_, index) => `${workspaceEmail}#cohort-${index + 1}`),
      ...immatureOffsets.map((_, index) => `${workspaceEmail}#fresh-${index + 1}`),
    ];

    matureOffsets.forEach((offset, index) => {
      const zone =
        index < 3
          ? definition.baseZone
          : definition.supportZones[(index - 3) % definition.supportZones.length] ?? definition.baseZone;
      const createdAt = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
      profiles.push({
        id: profileIds[index] ?? `${workspaceEmail}#mature-${index + 1}`,
        role,
        createdAt,
        zone,
      });

      if (definition.activationIndexes.includes(index)) {
        markActivity(
          profileIds[index] ?? `${workspaceEmail}#mature-${index + 1}`,
          definition.marker,
          new Date(createdAt.getTime() + (index % 3 === 0 ? 20 : index % 3 === 1 ? 30 : 45) * 60 * 1000),
        );
      }
    });

    immatureOffsets.forEach((offset, index) => {
      const createdAt = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
      profiles.push({
        id: profileIds[matureOffsets.length + index] ?? `${workspaceEmail}#fresh-${index + 1}`,
        role,
        createdAt,
        zone: definition.supportZones[index % definition.supportZones.length] ?? definition.baseZone,
      });
      markActivity(
        profileIds[matureOffsets.length + index] ?? `${workspaceEmail}#fresh-${index + 1}`,
        definition.marker,
        new Date(createdAt.getTime() + 25 * 60 * 1000),
      );
    });
  }

  const activationProfiles = profiles.map((profile) => ({
    id: profile.id,
    role: profile.role,
    createdAt: profile.createdAt,
    zone: profile.zone,
  }));

  const activationSeries = {
    owner: computeWeeklyActivationSeries({
      role: "owner",
      profiles: activationProfiles,
      roleAliases: ROLE_GROUPS.owner,
      activityByProfile,
      windowStart,
      now,
    }),
    concierge: computeWeeklyActivationSeries({
      role: "concierge",
      profiles: activationProfiles,
      roleAliases: ROLE_GROUPS.concierge,
      activityByProfile,
      windowStart,
      now,
    }),
    provider: computeWeeklyActivationSeries({
      role: "provider",
      profiles: activationProfiles,
      roleAliases: ROLE_GROUPS.provider,
      activityByProfile,
      windowStart,
      now,
    }),
  };

  const roleMetrics = {
    owner: {
      ...computeActivationCohort({
        role: "owner",
        profiles: activationProfiles,
        roleAliases: ROLE_GROUPS.owner,
        activityByProfile,
        windowStart,
        now,
      }),
      [ROLE_DEFINITIONS.owner.medianMetricKey]: ROLE_DEFINITIONS.owner.medianMetricValue,
      [ROLE_DEFINITIONS.owner.rateMetricKey]: ROLE_DEFINITIONS.owner.rateMetricValue,
    },
    concierge: {
      ...computeActivationCohort({
        role: "concierge",
        profiles: activationProfiles,
        roleAliases: ROLE_GROUPS.concierge,
        activityByProfile,
        windowStart,
        now,
      }),
      [ROLE_DEFINITIONS.concierge.medianMetricKey]: ROLE_DEFINITIONS.concierge.medianMetricValue,
      [ROLE_DEFINITIONS.concierge.rateMetricKey]: ROLE_DEFINITIONS.concierge.rateMetricValue,
    },
    provider: {
      ...computeActivationCohort({
        role: "provider",
        profiles: activationProfiles,
        roleAliases: ROLE_GROUPS.provider,
        activityByProfile,
        windowStart,
        now,
      }),
      [ROLE_DEFINITIONS.provider.medianMetricKey]: ROLE_DEFINITIONS.provider.medianMetricValue,
      [ROLE_DEFINITIONS.provider.rateMetricKey]: ROLE_DEFINITIONS.provider.rateMetricValue,
    },
  };

  return {
    window_days: windowDays,
    generated_at: now.toISOString(),
    health: {
      available: false,
      reasons: [
        reason,
        "Mode local enrichi : cohortes workspace injectées pour conserver des KPI lisibles pendant l'initialisation des données réelles.",
      ],
      updated_at: now.toISOString(),
    },
    ...roleMetrics,
    activation_series: activationSeries,
    activation_by_zone: {
      owner: computeActivationByZone({
        role: "owner",
        profiles: activationProfiles,
        roleAliases: ROLE_GROUPS.owner,
        activityByProfile,
        windowStart,
        now,
      }),
      concierge: computeActivationByZone({
        role: "concierge",
        profiles: activationProfiles,
        roleAliases: ROLE_GROUPS.concierge,
        activityByProfile,
        windowStart,
        now,
      }),
      provider: computeActivationByZone({
        role: "provider",
        profiles: activationProfiles,
        roleAliases: ROLE_GROUPS.provider,
        activityByProfile,
        windowStart,
        now,
      }),
    },
    activation_alert_policy: ACTIVATION_ALERT_POLICY,
    activation_alerts: buildActivationAlerts(roleMetrics, activationSeries),
    shared: {
      mission_to_paid_invoice_rate: 78,
      median_first_message_response_minutes: 42,
    },
  };
}

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

async function queryWithOptionalProviderColumn(relation: string, columnsWithProvider: string, columnsWithoutProvider: string, windowIso: string) {
  const primary = await kpiDb.from(relation).select(columnsWithProvider).gte("created_at", windowIso);
  if (!primary.error || !isSchemaDriftError(primary.error)) return primary;
  return kpiDb.from(relation).select(columnsWithoutProvider).gte("created_at", windowIso);
}

export async function GET(req: NextRequest) {
  const windowDaysRaw = Number(req.nextUrl.searchParams.get("window_days") ?? 30);
  const windowDays = Number.isFinite(windowDaysRaw)
    ? Math.min(120, Math.max(7, Math.trunc(windowDaysRaw)))
    : 30;

  try {
    const auth = await getApiAuthContext(req);
    if (!auth.userId) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    if (!auth.isAdmin) return NextResponse.json({ error: "Non autorise" }, { status: 403 });

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
    const { data: quotesData, error: quotesError } = await queryWithOptionalProviderColumn(
      "quotes",
      "id, request_id, owner_profile_id, concierge_profile_id, provider_profile_id, created_at",
      "id, request_id, owner_profile_id, concierge_profile_id, created_at",
      windowIso,
    );
    if (quotesError && !isSchemaDriftError(quotesError)) throw quotesError;
    const quotes = ((quotesError ? [] : quotesData ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      request_id: typeof row.request_id === "string" ? row.request_id : null,
      owner_profile_id: typeof row.owner_profile_id === "string" ? row.owner_profile_id : null,
      concierge_profile_id: typeof row.concierge_profile_id === "string" ? row.concierge_profile_id : null,
      provider_profile_id: typeof row.provider_profile_id === "string" ? row.provider_profile_id : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
    }));

    for (const quote of quotes) {
      if (quote.owner_profile_id) markActivity(quote.owner_profile_id, "quote", quote.created_at);
      if (quote.concierge_profile_id) markActivity(quote.concierge_profile_id, "quote", quote.created_at);
      if (quote.provider_profile_id) markActivity(quote.provider_profile_id, "quote", quote.created_at);
    }

    let providerMissionColumnMissing = false;
    let missionRequestColumnMissing = false;
    let { data: missionsData, error: missionsError } = await kpiDb
      .from("missions")
      .select("id, request_id, owner_profile_id, concierge_profile_id, provider_profile_id, status, created_at")
      .gte("created_at", windowIso);
    if (missionsError && isSchemaDriftError(missionsError)) {
      providerMissionColumnMissing = true;
      let fallbackResult = await kpiDb
        .from("missions")
        .select("id, request_id, owner_profile_id, concierge_profile_id, status, created_at")
        .gte("created_at", windowIso);
      if (fallbackResult.error && isSchemaDriftError(fallbackResult.error)) {
        missionRequestColumnMissing = true;
        fallbackResult = await kpiDb
          .from("missions")
          .select("id, owner_profile_id, concierge_profile_id, status, created_at")
          .gte("created_at", windowIso);
      }
      missionsData = fallbackResult.data;
      missionsError = fallbackResult.error;
    }
    if (missionsError && !isSchemaDriftError(missionsError)) throw missionsError;
    const missions = ((missionsError ? [] : missionsData ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      request_id: !missionRequestColumnMissing && typeof row.request_id === "string" ? row.request_id : null,
      owner_profile_id: typeof row.owner_profile_id === "string" ? row.owner_profile_id : null,
      concierge_profile_id: typeof row.concierge_profile_id === "string" ? row.concierge_profile_id : null,
      provider_profile_id: typeof row.provider_profile_id === "string" ? row.provider_profile_id : null,
      status: typeof row.status === "string" ? row.status : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
    }));

    for (const mission of missions) {
      if (mission.owner_profile_id) markActivity(mission.owner_profile_id, "mission", mission.created_at);
      if (mission.concierge_profile_id) markActivity(mission.concierge_profile_id, "mission", mission.created_at);
      if (mission.provider_profile_id) markActivity(mission.provider_profile_id, "mission", mission.created_at);
    }

    let providerInterventions: Array<{ provider_profile_id: string | null; status: string | null; created_at: string | null }> = [];
    if (providerMissionColumnMissing) {
      const { data: providerInterventionsData, error: providerInterventionsError } = await kpiDb
        .from("provider_interventions")
        .select("provider_profile_id, status, created_at")
        .gte("created_at", windowIso);
      if (providerInterventionsError && !isSchemaDriftError(providerInterventionsError)) throw providerInterventionsError;
      providerInterventions = ((providerInterventionsError ? [] : providerInterventionsData ?? []) as Array<Record<string, unknown>>).map((row) => ({
        provider_profile_id: typeof row.provider_profile_id === "string" ? row.provider_profile_id : null,
        status: typeof row.status === "string" ? row.status : null,
        created_at: typeof row.created_at === "string" ? row.created_at : null,
      }));
      for (const intervention of providerInterventions) {
        if (intervention.provider_profile_id) markActivity(intervention.provider_profile_id, "mission", intervention.created_at);
      }
    }

    const { data: invoicesData, error: invoicesError } = await queryWithOptionalProviderColumn(
      "invoices",
      "id, status, owner_profile_id, concierge_profile_id, provider_profile_id, created_at",
      "id, status, owner_profile_id, concierge_profile_id, created_at",
      windowIso,
    );
    if (invoicesError && !isSchemaDriftError(invoicesError)) throw invoicesError;
    const invoices = ((invoicesError ? [] : invoicesData ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      status: typeof row.status === "string" ? row.status : null,
      owner_profile_id: typeof row.owner_profile_id === "string" ? row.owner_profile_id : null,
      concierge_profile_id: typeof row.concierge_profile_id === "string" ? row.concierge_profile_id : null,
      provider_profile_id: typeof row.provider_profile_id === "string" ? row.provider_profile_id : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
    }));

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

    const providerMissions = providerMissionColumnMissing
      ? providerInterventions.filter((intervention) =>
          intervention.provider_profile_id
            ? profileMatchesRole(profileMap.get(intervention.provider_profile_id)?.role ?? "", "provider")
            : false,
        )
      : missions.filter((mission) =>
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
      health: {
        available: true,
        reasons: [],
        updated_at: now.toISOString(),
      },
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

    if (canUseWorkspaceFallback(req) && hasNoMatureActivationData(payload)) {
      return NextResponse.json(
        buildWorkspaceFallbackPayload(
          windowDays,
          "Aucune cohorte mature exploitable n'a encore été observée sur cette fenêtre.",
        ),
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (isTransportError(error)) {
      console.warn("[GET /api/kpis/overview] transport unavailable, returning degraded payload", error);
      return NextResponse.json(
        canUseWorkspaceFallback(req)
          ? buildWorkspaceFallbackPayload(
              windowDays,
              "Connexion Supabase indisponible pour les KPI d'activation.",
            )
          : buildUnavailablePayload(windowDays, "Connexion Supabase indisponible pour les KPI d'activation."),
        { status: 200 },
      );
    }

    console.error("[GET /api/kpis/overview] ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
