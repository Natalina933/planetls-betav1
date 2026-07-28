import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deriveCommercialWorkflowStatus, deriveMissionWorkflowStatus } from "@/app/lib/commercialWorkflow";
import { requireApiRole } from "@/server/auth/roleGuards";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const CONFIG_UNAVAILABLE_REASON = "Configuration Supabase serveur indisponible pour les opérations admin.";

type Row = Record<string, unknown>;
type QueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message: string } | null;
  count?: number | null;
};

type SafeResult<T> = {
  data: T[] | null;
  count?: number | null;
  error: null;
  available: boolean;
  reason: string | null;
};

type SourceHealth = {
  key: string;
  label: string;
  available: boolean;
  reason: string | null;
};

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
    message.includes("enotfound") ||
    message.includes("eacces")
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

async function safeReadRows<T extends Row>(
  query: PromiseLike<QueryResult<T>>,
  fallback: T[] = [],
): Promise<SafeResult<T>> {
  let result: QueryResult<T>;
  try {
    result = await query;
  } catch (error) {
    if (isTransportError(error)) {
      return buildUnavailableResult(fallback, "Connexion Supabase indisponible pour cette source.");
    }
    throw error;
  }

  if (result.error) {
    if (isTransportError(result.error)) {
      return buildUnavailableResult(fallback, "Connexion Supabase indisponible pour cette source.");
    }
    throw new Error(result.error.message);
  }

  return { ...result, error: null, available: true, reason: null };
}

async function safeReadCount(query: PromiseLike<QueryResult<Row>>): Promise<SafeResult<Row>> {
  return safeReadRows<Row>(query, []);
}

function createUnavailableSource<T>(adminClient: ReturnType<typeof createAdminClient>, fallback: T[] = []) {
  return Promise.resolve(buildUnavailableResult(fallback, adminClient ? "Source indisponible." : CONFIG_UNAVAILABLE_REASON));
}

function getString(row: Row | null | undefined, key: string) {
  const value = row?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getIdentifier(row: Row | null | undefined, key: string) {
  const value = row?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStringArray(row: Row | null | undefined, key: string) {
  const value = row?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}

function getRecord(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
}

function getMetadataString(row: Row | null | undefined, key: string) {
  return getString(getRecord(row?.metadata), key);
}

function getHousingId(row: Row) {
  const value = getRecord(row.metadata).property_housing_id;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getDisplayName(profile: Row | undefined, fallback: string) {
  if (!profile) return fallback;
  const fullName = [getString(profile, "first_name"), getString(profile, "last_name")].filter(Boolean).join(" ");
  return fullName || getString(profile, "company_name") || getString(profile, "username") || getString(profile, "email") || fallback;
}

function isNewer(candidate: Row, previous: Row | undefined) {
  if (!previous) return true;
  const candidateTime = new Date(getString(candidate, "updated_at") ?? getString(candidate, "created_at") ?? 0).getTime();
  const previousTime = new Date(getString(previous, "updated_at") ?? getString(previous, "created_at") ?? 0).getTime();
  return candidateTime >= previousTime;
}

function setLatest(map: Map<string, Row>, key: string | null, item: Row) {
  if (!key) return;
  const previous = map.get(key);
  if (isNewer(item, previous)) map.set(key, item);
}

function pickPrimaryStatus(rows: Array<{ status?: string | null }>, priorities: string[]) {
  const statuses = rows.map((row) => row.status).filter((status): status is string => Boolean(status));
  return priorities.find((status) => statuses.includes(status)) ?? statuses[0] ?? null;
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? "200");
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 200) : 200;
}

function parseOffset(value: string | null) {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 0) : 0;
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiRole(req, ADMIN_ROLES);
    if (!guard.ok) return guard.response;

    const url = new URL(req.url);
    const limit = parseLimit(url.searchParams.get("limit"));
    const offset = parseOffset(url.searchParams.get("offset"));
    const adminClient = createAdminClient();

    const [requestRowsRes, missionRowsRes] = await Promise.all([
      adminClient
        ? safeReadRows(
            adminClient
              .from("service_requests")
              .select("*")
              .order("created_at", { ascending: false })
              .range(offset, offset + limit - 1) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
      adminClient
        ? safeReadRows(
            adminClient
              .from("missions")
              .select("*")
              .order("created_at", { ascending: false })
              .range(offset, offset + limit - 1) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
    ]);

    const requestRows = requestRowsRes.data ?? [];
    const missionRows = missionRowsRes.data ?? [];

    const requestIds = requestRows.map((row) => getString(row, "id")).filter((id): id is string => Boolean(id));
    const missionIds = missionRows.map((row) => getString(row, "id")).filter((id): id is string => Boolean(id));

    const [recipientRowsRes, quoteRowsRes, invoiceCountRes, invoiceRowsRes] = await Promise.all([
      adminClient
        ? safeReadRows(
            adminClient
              .from("service_request_recipients")
              .select("*")
              .in("service_request_id", requestIds.length ? requestIds : [EMPTY_UUID]) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
      adminClient
        ? safeReadRows(
            adminClient
              .from("quotes")
              .select("*")
              .in("service_request_id", requestIds.length ? requestIds : [EMPTY_UUID])
              .limit(1000) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
      adminClient
        ? safeReadCount(
            adminClient
              .from("invoices")
              .select("id", { count: "exact", head: true }) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
      adminClient
        ? safeReadRows(
            adminClient
              .from("invoices")
              .select("*")
              .in("mission_id", missionIds.length ? missionIds : [EMPTY_UUID])
              .limit(1000) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
    ]);

    const recipientRows = recipientRowsRes.data ?? [];
    const quoteRows = quoteRowsRes.data ?? [];
    const invoiceRows = invoiceRowsRes.data ?? [];
    const invoiceCount = invoiceCountRes.count ?? 0;

    const profileIds = Array.from(
      new Set(
        [...requestRows, ...missionRows, ...recipientRows, ...quoteRows]
          .flatMap((row) => [
            getString(row, "owner_profile_id"),
            getString(row, "concierge_profile_id"),
            getString(row, "selected_concierge_profile_id"),
          ])
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const propertyIds = Array.from(
      new Set(
        [...requestRows, ...missionRows]
          .map((row) => getString(row, "property_id"))
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const housingIds = Array.from(
      new Set(
        requestRows
          .map(getHousingId)
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );

    const [profileRowsRes, propertyRowsRes, housingRowsRes] = await Promise.all([
      adminClient
        ? safeReadRows(
            adminClient
              .from("profiles")
              .select("id,email,first_name,last_name,username,company_name")
              .in("id", profileIds.length ? profileIds : [EMPTY_UUID]) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
      adminClient
        ? safeReadRows(
            adminClient
              .from("properties")
              .select("id,name,city")
              .in("id", propertyIds.length ? propertyIds : [EMPTY_UUID]) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
      adminClient
        ? safeReadRows(
            adminClient
              .from("housing")
              .select("id,nom_logement,ville")
              .in("id", housingIds.length ? housingIds : [-1]) as unknown as PromiseLike<QueryResult<Row>>,
          )
        : createUnavailableSource<Row>(adminClient),
    ]);

    const profileRows = profileRowsRes.data ?? [];
    const propertyRows = propertyRowsRes.data ?? [];
    const housingRows = housingRowsRes.data ?? [];

    const profilesById = new Map(
      profileRows.map((row) => [getString(row, "id"), row]).filter((entry): entry is [string, Row] => Boolean(entry[0])),
    );
    const propertiesById = new Map(
      propertyRows.map((row) => [getString(row, "id"), row]).filter((entry): entry is [string, Row] => Boolean(entry[0])),
    );
    const housingById = new Map(
      housingRows.map((row) => [getIdentifier(row, "id"), row]).filter((entry): entry is [string, Row] => Boolean(entry[0])),
    );
    const recipientsByRequestId = new Map<string, Row[]>();
    const quotesByRecipientId = new Map<string, Row>();
    const quotesByRequestAndConcierge = new Map<string, Row>();
    const quotesByMissionId = new Map<string, Row>();
    const invoicesByMissionId = new Map<string, Row>();
    const requestsByMissionId = new Map<string, Row>();

    recipientRows.forEach((recipient) => {
      const requestId = getString(recipient, "service_request_id");
      if (!requestId) return;
      recipientsByRequestId.set(requestId, [...(recipientsByRequestId.get(requestId) ?? []), recipient]);
    });
    quoteRows.forEach((quote) => {
      setLatest(quotesByRecipientId, getString(quote, "service_request_recipient_id"), quote);
      const requestId = getString(quote, "service_request_id") ?? getMetadataString(quote, "service_request_id");
      const conciergeId = getString(quote, "concierge_profile_id");
      if (requestId && conciergeId) setLatest(quotesByRequestAndConcierge, `${requestId}:${conciergeId}`, quote);
      setLatest(quotesByMissionId, getString(quote, "mission_id") ?? getMetadataString(quote, "mission_id"), quote);
    });
    invoiceRows.forEach((invoice) => setLatest(invoicesByMissionId, getString(invoice, "mission_id"), invoice));
    requestRows.forEach((requestRow) => {
      setLatest(requestsByMissionId, getString(requestRow, "mission_id") ?? getMetadataString(requestRow, "selected_mission_id"), requestRow);
    });

    const missionById = new Map(
      missionRows.map((row) => [getString(row, "id"), row]).filter((entry): entry is [string, Row] => Boolean(entry[0])),
    );
    const requests = requestRows.map((requestRow) => {
      const requestId = getString(requestRow, "id") ?? "";
      const recipients = (recipientsByRequestId.get(requestId) ?? []).map((recipient) => {
        const conciergeId = getString(recipient, "concierge_profile_id");
        const quote =
          quotesByRecipientId.get(getString(recipient, "id") ?? "") ??
          quotesByRequestAndConcierge.get(`${requestId}:${conciergeId ?? ""}`);
        return {
          concierge_name: getDisplayName(profilesById.get(conciergeId ?? ""), "Conciergerie"),
          status: getString(recipient, "status"),
          quote_id: getString(quote, "id"),
          quote_status: getString(quote, "status"),
        };
      });
      const primaryRecipientStatus = pickPrimaryStatus(
        recipients,
        ["selected", "quoted", "interested", "viewed", "sent", "declined", "not_selected"],
      );
      const primaryQuoteStatus = pickPrimaryStatus(
        recipients.map((recipient) => ({ status: recipient.quote_status })),
        ["accepted", "sent", "rejected", "expired", "canceled", "draft"],
      );
      const missionId = getString(requestRow, "mission_id") ?? getMetadataString(requestRow, "selected_mission_id");
      const linkedMission = missionId ? missionById.get(missionId) : undefined;
      const workflow = deriveCommercialWorkflowStatus({
        workflowStatus: getString(requestRow, "workflow_status"),
        serviceRequestStatus: getString(requestRow, "status"),
        recipientStatus: primaryRecipientStatus,
        quoteStatus: primaryQuoteStatus,
        missionStatus: getString(linkedMission, "status"),
        hasMission: Boolean(missionId),
        scheduledStart: getString(linkedMission, "scheduled_start"),
        scheduledEnd: getString(linkedMission, "scheduled_end"),
      });
      const property = propertiesById.get(getString(requestRow, "property_id") ?? "");
      const housing = housingById.get(getHousingId(requestRow) ?? "");
      const propertyName =
        getString(housing, "nom_logement") ??
        getString(property, "name") ??
        getMetadataString(requestRow, "property_label");

      return {
        id: requestId,
        mission_id: missionId,
        title: getString(requestRow, "title"),
        status: getString(requestRow, "status"),
        workflow_status: workflow.request_workflow_status,
        request_workflow_status: workflow.request_workflow_status,
        quote_workflow_status: workflow.quote_workflow_status,
        mission_workflow_status: workflow.mission_workflow_status,
        owner_name: getDisplayName(profilesById.get(getString(requestRow, "owner_profile_id") ?? ""), "Propriétaire"),
        property_name: propertyName,
        property_housing_id: getHousingId(requestRow),
        city: getString(housing, "ville") ?? getString(property, "city") ?? getString(requestRow, "city"),
        created_at: getString(requestRow, "created_at"),
        updated_at: getString(requestRow, "updated_at"),
        selected_concierge_name: getString(requestRow, "selected_concierge_profile_id")
          ? getDisplayName(
              profilesById.get(getString(requestRow, "selected_concierge_profile_id") ?? ""),
              "Conciergerie",
            )
          : null,
        requested_services: getStringArray(requestRow, "requested_services"),
        recipients,
      };
    });

    const missions = missionRows.map((missionRow) => {
      const missionId = getString(missionRow, "id") ?? "";
      const request = requestsByMissionId.get(missionId);
      const quote =
        quotesByMissionId.get(missionId) ??
        (request ? quoteRows.find((row) => getString(row, "service_request_id") === getString(request, "id")) : undefined);
      const invoice = invoicesByMissionId.get(missionId);
      const property = propertiesById.get(getString(missionRow, "property_id") ?? "");
      const workflowStatus = deriveMissionWorkflowStatus({
        status: getString(missionRow, "status"),
        scheduledStart: getString(missionRow, "scheduled_start"),
        scheduledEnd: getString(missionRow, "scheduled_end"),
      });

      return {
        id: missionId,
        title: getString(missionRow, "title"),
        status: getString(missionRow, "status"),
        priority: getString(missionRow, "priority"),
        property_id: getString(missionRow, "property_id"),
        property_name: getString(property, "name") ?? getMetadataString(request, "property_label"),
        city: getString(property, "city") ?? getString(request, "city"),
        owner_name: getDisplayName(profilesById.get(getString(missionRow, "owner_profile_id") ?? ""), "Propriétaire"),
        concierge_name: getDisplayName(profilesById.get(getString(missionRow, "concierge_profile_id") ?? ""), "Conciergerie"),
        scheduled_start: getString(missionRow, "scheduled_start"),
        scheduled_end: getString(missionRow, "scheduled_end"),
        completed_at: getString(missionRow, "completed_at"),
        created_at: getString(missionRow, "created_at"),
        updated_at: getString(missionRow, "updated_at"),
        workflow_status: workflowStatus,
        mission_workflow_status: workflowStatus,
        quote_id: getString(quote, "id") ?? getMetadataString(missionRow, "quote_id"),
        service_request_id: getString(request, "id") ?? getMetadataString(missionRow, "service_request_id"),
        invoice_id: getString(invoice, "id"),
        amount: missionRow.amount ?? null,
        total_amount: quote?.total_amount ?? null,
      };
    });

    const sources: SourceHealth[] = [
      { key: "service-requests", label: "Demandes", available: requestRowsRes.available, reason: requestRowsRes.reason },
      { key: "missions", label: "Missions", available: missionRowsRes.available, reason: missionRowsRes.reason },
      { key: "recipients", label: "Destinataires", available: recipientRowsRes.available, reason: recipientRowsRes.reason },
      { key: "quotes", label: "Devis", available: quoteRowsRes.available, reason: quoteRowsRes.reason },
      { key: "invoice-count", label: "Compteur factures", available: invoiceCountRes.available, reason: invoiceCountRes.reason },
      { key: "invoice-rows", label: "Factures liées", available: invoiceRowsRes.available, reason: invoiceRowsRes.reason },
      { key: "profiles", label: "Profils", available: profileRowsRes.available, reason: profileRowsRes.reason },
      { key: "properties", label: "Logements", available: propertyRowsRes.available, reason: propertyRowsRes.reason },
      { key: "housing", label: "Housing legacy", available: housingRowsRes.available, reason: housingRowsRes.reason },
    ];

    const unavailableSources = sources.filter((source) => !source.available);

    return NextResponse.json(
      {
        health: {
          available: unavailableSources.length === 0,
          availableSources: sources.length - unavailableSources.length,
          totalSources: sources.length,
          reasons: unavailableSources.map((source) => `${source.label} : ${source.reason ?? "indisponible"}`),
          updatedAt: new Date().toISOString(),
        },
        requests,
        missions,
        invoiceCount,
        nextOffset: requestRows.length === limit || missionRows.length === limit ? offset + limit : null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/admin/operations] error", error);
    return NextResponse.json({ error: "Erreur serveur admin" }, { status: 500 });
  }
}
