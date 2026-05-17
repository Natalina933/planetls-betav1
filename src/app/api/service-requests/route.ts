import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { db } from "@/app/lib/dbServer";
import { getApiAuthContext } from "@/app/lib/apiAuth";
import type { Json } from "@/types/supabase";
import { z } from "zod";

type ServiceRequestType = "ponctuel" | "renfort" | "durable";
type ServiceRequestStatus =
  | "draft"
  | "sent"
  | "in_review"
  | "quoted"
  | "accepted"
  | "closed"
  | "cancelled";
type RecipientStatus =
  | "sent"
  | "viewed"
  | "interested"
  | "quoted"
  | "declined"
  | "selected"
  | "not_selected";

interface CreateServiceRequestBody {
  property_id?: string | null;
  property_name?: string | null;
  request_type?: ServiceRequestType;
  title?: string;
  description?: string | null;
  requested_services?: string[];
  region?: string | null;
  city?: string | null;
  postal_code?: string | null;
  desired_date?: string | null;
  urgency?: boolean;
  budget_max?: number | null;
  currency?: string | null;
  recipient_ids?: string[];
}

const OWNER_ROLES = new Set(["owner", "owner_pro", "admin", "super_admin"]);
const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro", "admin", "super_admin"]);
const VALID_REQUEST_TYPES: ServiceRequestType[] = ["ponctuel", "renfort", "durable"];

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const createServiceRequestSchema = z.object({
  property_id: z.string().uuid().optional().nullable(),
  property_name: z.string().trim().max(180).optional().nullable(),
  request_type: z.enum(["ponctuel", "renfort", "durable"]).optional(),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).optional().nullable(),
  requested_services: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  region: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  postal_code: z.string().trim().max(20).optional().nullable(),
  desired_date: z.string().trim().max(40).optional().nullable(),
  urgency: z.boolean().optional(),
  budget_max: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
  recipient_ids: z.array(z.string().uuid()).max(100).optional(),
});

const updateServiceRequestSchema = createServiceRequestSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

type ServiceRequestRecipientRow = {
  id: string;
  service_request_id: string;
  concierge_profile_id: string;
  status: RecipientStatus;
  concierge_name?: string;
  response_message?: string | null;
  viewed_at?: string | null;
  responded_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
  conversation_id?: string | null;
  quote_id?: string | null;
  quote_number?: string | null;
  quote_status?: string | null;
};

type ServiceRequestRow = {
  id: string;
  owner_profile_id?: string | null;
  selected_concierge_profile_id?: string | null;
  [key: string]: unknown;
};

type ContactConversationRow = {
  id: string;
  concierge_profile_id: string;
  owner_profile_id: string;
  source_reference?: string | null;
  source?: string | null;
  created_at?: string | null;
};

type QuoteLookupRow = {
  id: string;
  quote_number?: string | null;
  status?: string | null;
  owner_profile_id?: string | null;
  concierge_profile_id?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

// Legacy Supabase typing is incomplete on these tables in this project.
const dbAny = asLooseSupabaseClient(db);

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRecipientIds(value: unknown): string[] {
  return Array.from(new Set(normalizeStringArray(value)));
}

function normalizeCurrency(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "EUR";
  return value.trim().toUpperCase();
}

function readPropertyLabelFromMetadata(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const propertyLabel = "property_label" in value ? value.property_label : null;
  return typeof propertyLabel === "string" && propertyLabel.trim()
    ? propertyLabel.trim()
    : null;
}

function parseLimit(raw: string | null, fallback = 20) {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeMessage = "message" in error ? error.message : null;
  return (
    typeof maybeMessage === "string" &&
    (maybeMessage.includes("relation") || maybeMessage.includes("does not exist"))
  );
}

function buildRequestPrefillMessage(body: CreateServiceRequestBody, requestedServices: string[]) {
  const lines = [
    `Bonjour, je souhaite vous adresser une demande ${body.request_type ?? "ponctuelle"}.`,
    typeof body.title === "string" && body.title.trim() ? `Titre : ${body.title.trim()}` : null,
    typeof body.region === "string" && body.region.trim() ? `Region : ${body.region.trim()}` : null,
    typeof body.city === "string" && body.city.trim() ? `Ville : ${body.city.trim()}` : null,
    typeof body.postal_code === "string" && body.postal_code.trim()
      ? `Code postal : ${body.postal_code.trim()}`
      : null,
    requestedServices.length > 0
      ? `Services recherches : ${requestedServices.join(", ")}`
      : null,
    typeof body.budget_max === "number" ? `Budget max : ${body.budget_max} ${normalizeCurrency(body.currency)}` : null,
    body.urgency === true ? "Urgence : oui" : null,
    typeof body.description === "string" && body.description.trim()
      ? `Details : ${body.description.trim()}`
      : null,
  ];

  return lines.filter((line): line is string => typeof line === "string" && line.length > 0).join("\n");
}

async function ensureContactConversations(params: {
  ownerProfileId: string;
  conciergeIds: string[];
  subject: string;
  prefillMessage: string;
  sourceReference: string | null;
  metadata: Record<string, unknown>;
}) {
  const ownerProfileId = params.ownerProfileId;
  const conciergeIds = Array.from(new Set(params.conciergeIds));
  if (conciergeIds.length === 0) return [];

  const { data: existingRows, error: existingError } = await dbAny
    .from("contact_conversations")
    .select("id, concierge_profile_id, owner_profile_id")
    .eq("owner_profile_id", ownerProfileId)
    .eq("source", "search")
    .in("concierge_profile_id", conciergeIds)
    .is("source_reference", params.sourceReference);

  if (existingError) {
    console.error("[service-requests] load contact conversations error:", existingError);
    throw new Error("Impossible de preparer les conversations.");
  }

  const existingByConcierge = new Map<string, ContactConversationRow>();
  (existingRows ?? []).forEach((row: ContactConversationRow) => {
    existingByConcierge.set(row.concierge_profile_id, row);
  });

  const missingConciergeIds = conciergeIds.filter((id) => !existingByConcierge.has(id));
  let createdRows: ContactConversationRow[] = [];

  if (missingConciergeIds.length > 0) {
    const { data: insertedRows, error: insertError } = await dbAny
      .from("contact_conversations")
      .insert(
        missingConciergeIds.map((conciergeId) => ({
          concierge_profile_id: conciergeId,
          owner_profile_id: ownerProfileId,
          source: "search",
          source_reference: params.sourceReference,
          subject: params.subject,
          metadata: {
            ...params.metadata,
            prefilled: true,
          } as Json,
        })),
      )
      .select("id, concierge_profile_id, owner_profile_id");

    if (insertError) {
      console.error("[service-requests] create contact conversations error:", insertError);
      throw new Error("Impossible de creer les conversations de suivi.");
    }

    createdRows = (insertedRows ?? []) as ContactConversationRow[];
  }

  const allConversations = [...(existingRows ?? []), ...createdRows] as ContactConversationRow[];
  if (allConversations.length === 0) return [];

  const { error: messagesError } = await dbAny.from("contact_messages").insert(
    allConversations.map((conversation) => ({
      conversation_id: conversation.id,
      sender_profile_id: ownerProfileId,
      message_type: "text",
      body: params.prefillMessage,
      metadata: {
        ...params.metadata,
        source: "search",
        source_reference: params.sourceReference,
        prefill: true,
      } as Json,
    })),
  );

  if (messagesError) {
    console.error("[service-requests] create contact messages error:", messagesError);
    throw new Error("Impossible d'envoyer le message d'introduction.");
  }

  return allConversations;
}

async function hydrateOwnerRequests(ownerId: string, limit: number) {
  const { data: requests, error } = await dbAny
    .from("service_requests")
    .select("*")
    .eq("owner_profile_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[GET /api/service-requests] owner requests error:", error);
    throw new Error("Impossible de charger les demandes proprietaire.");
  }

  const requestIds = (requests ?? []).map((row: { id: string }) => row.id);
  const selectedConciergeIds = (requests ?? [])
    .map((row: { selected_concierge_profile_id?: string | null }) => row.selected_concierge_profile_id)
    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
  const propertyIds = Array.from(
    new Set(
      (requests ?? [])
        .map((row: { property_id?: string | null }) => row.property_id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const { data: recipients, error: recipientsError } = await dbAny
    .from("service_request_recipients")
    .select("*")
    .in("service_request_id", requestIds.length > 0 ? requestIds : ["00000000-0000-0000-0000-000000000000"]);

  if (recipientsError) {
    console.error("[GET /api/service-requests] owner recipients error:", recipientsError);
    throw new Error("Impossible de charger les destinataires.");
  }

  const conciergeIds = Array.from(
    new Set(
      (recipients ?? [])
        .map((row: { concierge_profile_id?: string | null }) => row.concierge_profile_id)
        .concat(selectedConciergeIds)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const { data: conciergeProfiles, error: conciergeProfilesError } = await dbAny
    .from("profiles")
    .select("id, first_name, last_name, username, company_name")
    .in("id", conciergeIds.length > 0 ? conciergeIds : ["00000000-0000-0000-0000-000000000000"]);

  if (conciergeProfilesError) {
    console.error("[GET /api/service-requests] owner concierge profiles error:", conciergeProfilesError);
    throw new Error("Impossible de charger les profils concierges.");
  }

  const { data: properties, error: propertiesError } = await dbAny
    .from("properties")
    .select("id, name, city")
    .in("id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);

  if (propertiesError) {
    console.error("[GET /api/service-requests] owner properties error:", propertiesError);
    throw new Error("Impossible de charger les logements lies.");
  }

  const conciergeNameById = new Map<string, string>();
  const propertyNameById = new Map<string, string>();
  (conciergeProfiles ?? []).forEach(
    (profile: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      username?: string | null;
      company_name?: string | null;
    }) => {
      const displayName =
        `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
        profile.company_name ||
        profile.username ||
        "Concierge";
      conciergeNameById.set(profile.id, displayName);
    },
  );
  (properties ?? []).forEach((property: { id: string; name?: string | null; city?: string | null }) => {
    const label = property.name?.trim() || (property.city ? `Logement à ${property.city}` : "") || "Logement";
    propertyNameById.set(property.id, label);
  });

  const recipientsByRequestId = new Map<string, ServiceRequestRecipientRow[]>();
  (recipients ?? []).forEach((recipient: ServiceRequestRecipientRow) => {
    const current = recipientsByRequestId.get(recipient.service_request_id) ?? [];
    current.push({
      ...recipient,
      concierge_name: conciergeNameById.get(recipient.concierge_profile_id) ?? "Concierge",
    });
    recipientsByRequestId.set(recipient.service_request_id, current);
  });

  const { data: conversations, error: conversationsError } = await dbAny
    .from("contact_conversations")
    .select("id, concierge_profile_id, owner_profile_id, source, source_reference, created_at")
    .eq("owner_profile_id", ownerId)
    .eq("source", "search")
    .in(
      "concierge_profile_id",
      conciergeIds.length > 0 ? conciergeIds : ["00000000-0000-0000-0000-000000000000"],
    );

  if (conversationsError) {
    console.error("[GET /api/service-requests] owner conversations error:", conversationsError);
    throw new Error("Impossible de charger les conversations liees.");
  }

  const conversationByRequestAndConcierge = new Map<string, ContactConversationRow>();
  const fallbackConversationByConcierge = new Map<string, ContactConversationRow>();
  (conversations ?? []).forEach((conversation: ContactConversationRow) => {
    const conciergeId = conversation.concierge_profile_id;
    const requestId = typeof conversation.source_reference === "string" ? conversation.source_reference : "";

    if (requestId) {
      conversationByRequestAndConcierge.set(`${requestId}:${conciergeId}`, conversation);
    }

    const previous = fallbackConversationByConcierge.get(conciergeId);
    const previousTime = previous?.created_at ? new Date(previous.created_at).getTime() : 0;
    const currentTime = conversation.created_at ? new Date(conversation.created_at).getTime() : 0;
    if (!previous || currentTime >= previousTime) {
      fallbackConversationByConcierge.set(conciergeId, conversation);
    }
  });

  const { data: quotes, error: quotesError } = await dbAny
    .from("quotes")
    .select("id, quote_number, status, owner_profile_id, concierge_profile_id, created_at, metadata")
    .eq("owner_profile_id", ownerId)
    .in(
      "concierge_profile_id",
      conciergeIds.length > 0 ? conciergeIds : ["00000000-0000-0000-0000-000000000000"],
    );

  if (quotesError) {
    console.error("[GET /api/service-requests] owner quotes error:", quotesError);
    throw new Error("Impossible de charger les devis lies.");
  }

  const quoteByRequestAndConcierge = new Map<string, QuoteLookupRow>();
  (quotes ?? []).forEach((quote: QuoteLookupRow) => {
    const conciergeId =
      typeof quote.concierge_profile_id === "string" ? quote.concierge_profile_id : "";
    const metadata =
      quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
        ? quote.metadata
        : null;
    const requestId =
      metadata && typeof metadata.service_request_id === "string" ? metadata.service_request_id : "";
    if (!requestId || !conciergeId) return;

    const key = `${requestId}:${conciergeId}`;
    const previous = quoteByRequestAndConcierge.get(key);
    const previousTime = previous?.created_at ? new Date(previous.created_at).getTime() : 0;
    const currentTime = quote.created_at ? new Date(quote.created_at).getTime() : 0;
    if (!previous || currentTime >= previousTime) {
      quoteByRequestAndConcierge.set(key, quote);
    }
  });

  return (requests ?? []).map((request: ServiceRequestRow) => ({
    ...request,
    property_name:
      (typeof request.property_id === "string" ? propertyNameById.get(request.property_id) ?? null : null) ??
      readPropertyLabelFromMetadata(request.metadata),
    selected_concierge_name: request.selected_concierge_profile_id
      ? conciergeNameById.get(request.selected_concierge_profile_id) ?? "Concierge"
      : null,
    recipients: (recipientsByRequestId.get(request.id) ?? []).map((recipient) => {
      const conversation =
        conversationByRequestAndConcierge.get(`${request.id}:${recipient.concierge_profile_id}`) ??
        fallbackConversationByConcierge.get(recipient.concierge_profile_id);
      const quote =
        quoteByRequestAndConcierge.get(`${request.id}:${recipient.concierge_profile_id}`) ?? null;

      return {
        ...recipient,
        conversation_id: conversation?.id ?? null,
        quote_id: quote?.id ?? null,
        quote_number: quote?.quote_number ?? null,
        quote_status: quote?.status ?? null,
      };
    }),
  }));
}

async function hydrateConciergeRequests(conciergeId: string, limit: number) {
  const { data: recipients, error } = await dbAny
    .from("service_request_recipients")
    .select("*")
    .eq("concierge_profile_id", conciergeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[GET /api/service-requests] concierge recipients error:", error);
    throw new Error("Impossible de charger les demandes recues.");
  }

  const requestIds = (recipients ?? []).map((row: { service_request_id: string }) => row.service_request_id);
  const { data: requests, error: requestsError } = await dbAny
    .from("service_requests")
    .select("*")
    .in("id", requestIds.length > 0 ? requestIds : ["00000000-0000-0000-0000-000000000000"]);

  if (requestsError) {
    console.error("[GET /api/service-requests] concierge requests error:", requestsError);
    throw new Error("Impossible de charger les details des demandes.");
  }

  const ownerIds = Array.from(
    new Set(
      (requests ?? [])
        .map((row: { owner_profile_id?: string | null }) => row.owner_profile_id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
    ),
  );
  const propertyIds = Array.from(
    new Set(
      (requests ?? [])
        .map((row: { property_id?: string | null }) => row.property_id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const { data: ownerProfiles, error: ownerProfilesError } = await dbAny
    .from("profiles")
    .select("id, first_name, last_name, username, company_name")
    .in("id", ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);

  if (ownerProfilesError) {
    console.error("[GET /api/service-requests] concierge owner profiles error:", ownerProfilesError);
    throw new Error("Impossible de charger les proprietaires.");
  }

  const { data: properties, error: propertiesError } = await dbAny
    .from("properties")
    .select("id, name, city")
    .in("id", propertyIds.length > 0 ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);

  if (propertiesError) {
    console.error("[GET /api/service-requests] concierge properties error:", propertiesError);
    throw new Error("Impossible de charger les logements lies.");
  }

  const ownerNameById = new Map<string, string>();
  const propertyNameById = new Map<string, string>();
  (ownerProfiles ?? []).forEach(
    (profile: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      username?: string | null;
      company_name?: string | null;
    }) => {
      const displayName =
        `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
        profile.company_name ||
        profile.username ||
        "Proprietaire";
      ownerNameById.set(profile.id, displayName);
    },
  );
  (properties ?? []).forEach((property: { id: string; name?: string | null; city?: string | null }) => {
    const label = property.name?.trim() || (property.city ? `Logement à ${property.city}` : "") || "Logement";
    propertyNameById.set(property.id, label);
  });

  const requestById = new Map<string, ServiceRequestRow>();
  (requests ?? []).forEach((request: ServiceRequestRow) => {
    requestById.set(request.id, request);
  });

  const { data: conversations, error: conversationsError } = await dbAny
    .from("contact_conversations")
    .select("id, concierge_profile_id, owner_profile_id, source, source_reference, created_at")
    .eq("concierge_profile_id", conciergeId)
    .eq("source", "search")
    .in("owner_profile_id", ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);

  if (conversationsError) {
    console.error("[GET /api/service-requests] concierge conversations error:", conversationsError);
    throw new Error("Impossible de charger les conversations liees.");
  }

  const conversationByRequestAndOwner = new Map<string, ContactConversationRow>();
  const fallbackConversationByOwner = new Map<string, ContactConversationRow>();
  (conversations ?? []).forEach((conversation: ContactConversationRow) => {
    const ownerId = conversation.owner_profile_id;
    const requestId = typeof conversation.source_reference === "string" ? conversation.source_reference : "";

    if (requestId) {
      conversationByRequestAndOwner.set(`${requestId}:${ownerId}`, conversation);
    }

    const previous = fallbackConversationByOwner.get(ownerId);
    const previousTime = previous?.created_at ? new Date(previous.created_at).getTime() : 0;
    const currentTime = conversation.created_at ? new Date(conversation.created_at).getTime() : 0;
    if (!previous || currentTime >= previousTime) {
      fallbackConversationByOwner.set(ownerId, conversation);
    }
  });

  const { data: quotes, error: quotesError } = await dbAny
    .from("quotes")
    .select("id, quote_number, status, owner_profile_id, concierge_profile_id, created_at, metadata")
    .eq("concierge_profile_id", conciergeId)
    .in("owner_profile_id", ownerIds.length > 0 ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);

  if (quotesError) {
    console.error("[GET /api/service-requests] concierge quotes error:", quotesError);
    throw new Error("Impossible de charger les devis lies.");
  }

  const quoteByRequestAndOwner = new Map<string, QuoteLookupRow>();
  (quotes ?? []).forEach((quote: QuoteLookupRow) => {
    const ownerId = typeof quote.owner_profile_id === "string" ? quote.owner_profile_id : "";
    const metadata =
      quote.metadata && typeof quote.metadata === "object" && !Array.isArray(quote.metadata)
        ? quote.metadata
        : null;
    const requestId =
      metadata && typeof metadata.service_request_id === "string" ? metadata.service_request_id : "";
    if (!requestId || !ownerId) return;

    const key = `${requestId}:${ownerId}`;
    const previous = quoteByRequestAndOwner.get(key);
    const previousTime = previous?.created_at ? new Date(previous.created_at).getTime() : 0;
    const currentTime = quote.created_at ? new Date(quote.created_at).getTime() : 0;
    if (!previous || currentTime >= previousTime) {
      quoteByRequestAndOwner.set(key, quote);
    }
  });

  return (recipients ?? []).map((recipient: ServiceRequestRecipientRow) => {
    const request = requestById.get(recipient.service_request_id);
    const ownerId = typeof request?.owner_profile_id === "string" ? request.owner_profile_id : "";
    const conversation =
      conversationByRequestAndOwner.get(`${recipient.service_request_id}:${ownerId}`) ??
      fallbackConversationByOwner.get(ownerId);
    const quote = quoteByRequestAndOwner.get(`${recipient.service_request_id}:${ownerId}`) ?? null;

    return {
      ...request,
      property_name:
        (typeof request?.property_id === "string" ? propertyNameById.get(request.property_id) ?? null : null) ??
        readPropertyLabelFromMetadata(request?.metadata),
      recipient_id: recipient.id,
      recipient_status: recipient.status,
      response_message: recipient.response_message,
      viewed_at: recipient.viewed_at,
      responded_at: recipient.responded_at,
      conversation_id: conversation?.id ?? null,
      quote_id: quote?.id ?? null,
      quote_number: quote?.quote_number ?? null,
      quote_status: quote?.status ?? null,
      owner_name: request?.owner_profile_id
        ? ownerNameById.get(request.owner_profile_id) ?? "Proprietaire"
        : "Proprietaire",
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!OWNER_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = createServiceRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }
    const body = parsedBody.data as CreateServiceRequestBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
    }

    const recipientIds = normalizeRecipientIds(body.recipient_ids);

    const requestType: ServiceRequestType = VALID_REQUEST_TYPES.includes(body.request_type as ServiceRequestType)
      ? (body.request_type as ServiceRequestType)
      : "ponctuel";

    const requestedServices = normalizeStringArray(body.requested_services);
    const desiredDate =
      typeof body.desired_date === "string" && body.desired_date.trim().length > 0
        ? body.desired_date
        : null;
    const requestSubject = title;
    const prefillMessage = buildRequestPrefillMessage(body, requestedServices);

    let validRecipientIds: string[] = [];
    if (recipientIds.length > 0) {
      const { data: conciergeProfiles, error: conciergeProfilesError } = await dbAny
        .from("profiles")
        .select("id, role, category")
        .in("id", recipientIds);

      if (conciergeProfilesError) {
        console.error("[POST /api/service-requests] concierge profiles error:", conciergeProfilesError);
        return NextResponse.json({ error: "Impossible de verifier les concierges." }, { status: 500 });
      }

      validRecipientIds = (conciergeProfiles ?? [])
        .filter((profile: { role?: string | null; category?: string | null }) => {
          const roleValue = (profile.role ?? "").toLowerCase();
          const categoryValue = (profile.category ?? "").toLowerCase();
          return (
            roleValue === "concierge" ||
            roleValue === "concierge_pro" ||
            categoryValue.startsWith("concierge")
          );
        })
        .map((profile: { id: string }) => profile.id);

      if (validRecipientIds.length === 0) {
        return NextResponse.json({ error: "Aucun concierge valide selectionne." }, { status: 400 });
      }
    }

    const insertPayload = {
      owner_profile_id: userId,
      property_id: body.property_id ?? null,
      request_type: requestType,
      status: (validRecipientIds.length > 0 ? "sent" : "draft") as ServiceRequestStatus,
      title,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      requested_services: requestedServices,
      city: typeof body.city === "string" ? body.city.trim() || null : null,
      postal_code: typeof body.postal_code === "string" ? body.postal_code.trim() || null : null,
      desired_date: desiredDate,
      urgency: body.urgency === true,
      budget_max: typeof body.budget_max === "number" ? body.budget_max : null,
      currency: normalizeCurrency(body.currency),
      metadata: {
        origin: validRecipientIds.length > 0 ? "owner_search_flow" : "owner_direct_request",
        region: typeof body.region === "string" ? body.region.trim() || null : null,
        property_label: typeof body.property_name === "string" ? body.property_name.trim() || null : null,
      },
    };

    const { data: createdRequest, error: requestError } = await dbAny
      .from("service_requests")
      .insert(insertPayload)
      .select("*")
      .single();

    if (requestError || !createdRequest) {
      if (isMissingRelationError(requestError)) {
        const conversations = await ensureContactConversations({
          ownerProfileId: userId,
          conciergeIds: validRecipientIds,
          subject: requestSubject,
          prefillMessage,
          sourceReference: null,
          metadata: {
            origin: "owner_search_flow",
            fallback_mode: "messages_only",
          },
        });

        return NextResponse.json(
          {
            request: null,
            recipients: validRecipientIds.map((conciergeId: string) => ({
              concierge_profile_id: conciergeId,
              status: "sent",
            })),
            conversations,
            fallback_mode: "messages_only",
          },
          { status: 201 },
        );
      }

      console.error("[POST /api/service-requests] create request error:", requestError);
      return NextResponse.json({ error: "Impossible de creer la demande." }, { status: 500 });
    }

    if (validRecipientIds.length === 0) {
      return NextResponse.json(
        {
          request: createdRequest,
          recipients: [],
          conversations: [],
        },
        { status: 201 },
      );
    }

    const recipientRows = validRecipientIds.map((conciergeId: string) => ({
      service_request_id: createdRequest.id,
      concierge_profile_id: conciergeId,
      status: "sent" as RecipientStatus,
      metadata: {
        origin: "owner_search_flow",
      },
    }));

    const { data: createdRecipients, error: recipientsError } = await dbAny
      .from("service_request_recipients")
      .insert(recipientRows)
      .select("*");

    if (recipientsError) {
      console.error("[POST /api/service-requests] create recipients error:", recipientsError);
      await dbAny.from("service_requests").delete().eq("id", createdRequest.id);
      return NextResponse.json({ error: "Impossible d'ajouter les destinataires." }, { status: 500 });
    }

    const conversations = await ensureContactConversations({
      ownerProfileId: userId,
      conciergeIds: validRecipientIds,
      subject: requestSubject,
      prefillMessage,
      sourceReference: createdRequest.id,
      metadata: {
        origin: "owner_search_flow",
        service_request_id: createdRequest.id,
      },
    });

    return NextResponse.json(
      {
        request: createdRequest,
        recipients: createdRecipients ?? [],
        conversations,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/service-requests] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    if (!OWNER_ROLES.has(role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = updateServiceRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    const body = parsedBody.data as Partial<CreateServiceRequestBody> & { id: string };
    const updatePayload: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
      updatePayload.title = title;
    }
    if (typeof body.description === "string" || body.description === null) {
      updatePayload.description = typeof body.description === "string" ? body.description.trim() || null : null;
    }
    if (typeof body.property_id === "string" || body.property_id === null) updatePayload.property_id = body.property_id ?? null;
    if (typeof body.request_type === "string" && VALID_REQUEST_TYPES.includes(body.request_type)) updatePayload.request_type = body.request_type;
    if (Array.isArray(body.requested_services)) updatePayload.requested_services = normalizeStringArray(body.requested_services);
    if (typeof body.city === "string" || body.city === null) updatePayload.city = typeof body.city === "string" ? body.city.trim() || null : null;
    if (typeof body.postal_code === "string" || body.postal_code === null) updatePayload.postal_code = typeof body.postal_code === "string" ? body.postal_code.trim() || null : null;
    if (typeof body.desired_date === "string" || body.desired_date === null) updatePayload.desired_date = body.desired_date || null;
    if (typeof body.urgency === "boolean") updatePayload.urgency = body.urgency;
    if (typeof body.budget_max === "number" || body.budget_max === null) updatePayload.budget_max = body.budget_max ?? null;
    if (typeof body.currency === "string" || body.currency === null) updatePayload.currency = normalizeCurrency(body.currency);

    if (typeof body.property_name === "string" || body.property_name === null) {
      updatePayload.metadata = {
        property_label: typeof body.property_name === "string" ? body.property_name.trim() || null : null,
        updated_from: "owner_requests_page",
      } as Json;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const { data: updatedRequest, error: updateError } = await dbAny
      .from("service_requests")
      .update(updatePayload)
      .eq("id", body.id)
      .eq("owner_profile_id", userId)
      .select("*")
      .single();

    if (updateError || !updatedRequest) {
      console.error("[PATCH /api/service-requests] update request error:", updateError);
      return NextResponse.json({ error: "Impossible de modifier la demande." }, { status: 500 });
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (err) {
    console.error("[PATCH /api/service-requests] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getApiAuthContext(req);
    if (!userId || !isUuidLike(userId)) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const url = new URL(req.url);
    const view = url.searchParams.get("view") ?? "";
    if (view !== "" && view !== "owner" && view !== "concierge") {
      return NextResponse.json({ error: "view invalide" }, { status: 400 });
    }
    const limit = parseLimit(url.searchParams.get("limit"), 20);

    if (OWNER_ROLES.has(role) && view !== "concierge") {
      const items = await hydrateOwnerRequests(userId, limit);
      return NextResponse.json({ items, scope: "owner" });
    }

    if (CONCIERGE_ROLES.has(role)) {
      const items = await hydrateConciergeRequests(userId, limit);
      return NextResponse.json({ items, scope: "concierge" });
    }

    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  } catch (err) {
    console.error("[GET /api/service-requests] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
