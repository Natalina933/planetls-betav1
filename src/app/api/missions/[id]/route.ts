import { NextRequest, NextResponse } from "next/server";
import { asLooseSupabaseClient } from "@/app/api/_shared/untypedSupabase";
import { recordWorkflowEvent } from "@/app/api/_shared/workflowEvents";
import { deriveMissionWorkflowStatus, deriveQuoteWorkflowStatus } from "@/app/lib/commercialWorkflow";
import { db } from "@/app/lib/dbServer";
import {
  canAccessMissionForRole,
  canMutateMissionStatus,
  canUpdateMissionFields,
  CONCIERGE_MISSION_ROLES,
  OWNER_MISSION_ROLES,
} from "@/app/lib/missionPermissions";
import {
  getMissionActionTarget,
  normalizeMissionPriority,
  normalizeMissionStatus,
  type MissionStatus,
} from "@/app/lib/missionStatus";
import { canPlanMissionWithPayment, computePaymentPlanAmounts } from "@/app/lib/paymentWorkflow";
import {
  findMissionScheduleConflicts,
  validateMissionScheduleRange,
} from "@/app/lib/missionScheduleConflicts";
import { requireApiRole } from "@/server/auth/roleGuards";
import type { Json } from "@/types/supabase";

const dbAny = asLooseSupabaseClient(db);

const MISSION_ROLES = new Set(["admin", "super_admin", "concierge", "concierge_pro", "owner", "owner_pro"]);
type MissionRow = {
  id: string;
  concierge_profile_id: string | null;
  owner_profile_id: string | null;
  property_id: string | null;
  reservation_id?: string | null;
  service_id: number | null;
  title?: string | null;
  service_label?: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  amount: number | null;
  currency: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  response_time_minutes?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

const missionSelect =
  "id, concierge_profile_id, owner_profile_id, property_id, reservation_id, service_id, title, description, status, priority, amount, currency, scheduled_start, scheduled_end, response_time_minutes, started_at, completed_at, canceled_at, cancel_reason, metadata, created_at, updated_at";
const missionSelectFallback =
  "id, concierge_profile_id, owner_profile_id, property_id, service_id, service_label, description, status, priority, amount, currency, scheduled_start, scheduled_end, response_time_minutes, started_at, completed_at, canceled_at, cancel_reason, metadata, created_at, updated_at";

const isUuidLike = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function normalizeRouteId(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isMissingTitleColumn(error: { code?: string; message?: string; details?: string } | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return error?.code === "42703" || error?.code === "PGRST204" || (message.includes("title") && message.includes("column"));
}

function isMissingReservationIdColumn(error: { code?: string; message?: string; details?: string } | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return error?.code === "42703" || error?.code === "PGRST204" || (message.includes("reservation_id") && message.includes("column"));
}

async function loadProviderInterventionsForMission(mission: MissionRow) {
  const reservationId = typeof mission.reservation_id === "string" ? mission.reservation_id : null;
  if (reservationId) {
    const withReservationLink = await dbAny
      .from("provider_interventions")
      .select("id, provider_profile_id, title, status, priority, scheduled_start, scheduled_end, budget_amount, currency, location_label, metadata, created_at, updated_at")
      .or(`reservation_id.eq.${reservationId},metadata->>mission_id.eq.${mission.id}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!isMissingReservationIdColumn(withReservationLink.error)) {
      return withReservationLink;
    }
  }

  return dbAny
    .from("provider_interventions")
    .select("id, provider_profile_id, title, status, priority, scheduled_start, scheduled_end, budget_amount, currency, location_label, metadata, created_at, updated_at")
    .contains("metadata", { mission_id: mission.id })
    .order("created_at", { ascending: false })
    .limit(10);
}
function canAccessMission(mission: MissionRow, userId: string, role: string) {
  return canAccessMissionForRole({
    role,
    userId,
    ownerProfileId: mission.owner_profile_id,
    conciergeProfileId: mission.concierge_profile_id,
  });
}

function buildStatusTimestamps(status: MissionStatus, reason: string | null) {
  const now = new Date().toISOString();
  if (status === "in_progress") return { started_at: now };
  if (status === "awaiting_owner_validation" || status === "completed") return { completed_at: now };
  if (status === "canceled") return { canceled_at: now, cancel_reason: reason };
  return {};
}

function getMissionStatusWorkflowCopy(status: MissionStatus) {
  switch (status) {
    case "date_requested":
      return {
        title: "Date demandee",
        message: "Une date est demandee pour planifier la mission.",
      };
    case "date_proposed":
      return {
        title: "Date proposee",
        message: "Un creneau est propose pour cette mission.",
      };
    case "date_confirmed":
      return {
        title: "Date confirmee",
        message: "La date de mission est confirmee par les parties.",
      };
    case "scheduled":
      return {
        title: "Mission planifiee",
        message: "La mission est planifiee dans le calendrier operationnel.",
      };
    case "in_progress":
      return {
        title: "Mission demarree",
        message: "La mission a demarre.",
      };
    case "completed":
      return {
        title: "Mission terminee",
        message: "La mission est terminee.",
      };
    case "awaiting_owner_validation":
      return {
        title: "Validation proprietaire demandee",
        message: "La mission est terminee cote terrain et attend la validation du proprietaire.",
      };
    case "validated":
      return {
        title: "Mission validee",
        message: "Le proprietaire a valide la realisation de la mission.",
      };
    case "closed":
      return {
        title: "Mission cloturee",
        message: "La mission est cloturee apres paiement final.",
      };
    case "canceled":
      return {
        title: "Mission annulee",
        message: "La mission est annulee.",
      };
    default:
      return {
        title: "Mission mise a jour",
        message: `Statut mission mis a jour: ${status}.`,
      };
  }
}

function formatMissionChangeMessage(input: {
  action: string;
  fields: string[];
  nextStatus: MissionStatus | null;
  cancelReason: string | null;
}) {
  if (input.nextStatus === "validated") {
    return "Le propriétaire a confirmé la réalisation de la mission.";
  }
  if (input.nextStatus === "canceled") {
    return input.cancelReason
      ? `Le propriétaire a annulé la mission. Motif : ${input.cancelReason}`
      : "Le propriétaire a annulé la mission.";
  }
  if (input.fields.length > 0) {
    const labels: Record<string, string> = {
      title: "titre",
      description: "consignes",
      priority: "priorité",
      scheduled_start: "date de début",
      scheduled_end: "date de fin",
      concierge_profile_id: "conciergerie",
      amount: "montant",
    };
    const changed = input.fields.map((field) => labels[field] ?? field).join(", ");
    return `Le propriétaire a modifié la mission : ${changed}. Merci de vérifier le planning et les consignes.`;
  }
  if (input.nextStatus) return getMissionStatusWorkflowCopy(input.nextStatus).message;
  return null;
}

function attachMissionWorkflow<T extends MissionRow>(mission: T) {
  const workflowStatus = deriveMissionWorkflowStatus({
    status: mission.status,
    scheduledStart: mission.scheduled_start,
    scheduledEnd: mission.scheduled_end,
  });

  return {
    ...mission,
    workflow_status: workflowStatus,
    mission_workflow_status: workflowStatus,
  };
}

function attachQuoteWorkflow<T extends { status?: string | null }>(quote: T) {
  const workflowStatus = deriveQuoteWorkflowStatus(quote.status);

  return {
    ...quote,
    workflow_status: workflowStatus,
    quote_workflow_status: workflowStatus,
  };
}

async function loadMission(id: string) {
  const result = await dbAny.from("missions").select(missionSelect).eq("id", id).single<MissionRow>();
  if (!isMissingTitleColumn(result.error) && !isMissingReservationIdColumn(result.error)) {

    return { mission: result.data, error: result.error };
  }

  const fallback = await dbAny
    .from("missions")
    .select(missionSelectFallback)
    .eq("id", id)
    .single<MissionRow>();
  return { mission: fallback.data, error: fallback.error };
}

async function loadProfiles(profileIds: string[]) {
  if (profileIds.length === 0) return new Map<string, unknown>();
  const { data } = await dbAny
    .from("profiles")
    .select("id, first_name, last_name, username, company_name, role, city, phone, email")
    .in("id", profileIds);
  return new Map(((data ?? []) as Array<{ id: string }>).map((profile) => [profile.id, profile]));
}

async function loadMissionHousing(propertyId: string | null, metadata: Record<string, unknown>) {
  const housingId =
    typeof metadata.property_housing_id === "string" || typeof metadata.property_housing_id === "number"
      ? String(metadata.property_housing_id)
      : null;
  const lookupId = housingId ?? propertyId;
  if (!lookupId) return null;
  const { data } = await dbAny
    .from("housing")
    .select("id, nom_logement, ville, adresse, photo_principale, proprietaire, location, documents")
    .eq("id", lookupId)
    .maybeSingle();
  return data ?? null;
}

async function findOrCreateMissionConversation(mission: MissionRow, actorProfileId: string, prefill?: string) {
  if (!mission.owner_profile_id || !mission.concierge_profile_id) return null;

  const { data: existing } = await dbAny
    .from("contact_conversations")
    .select("id")
    .eq("owner_profile_id", mission.owner_profile_id)
    .eq("concierge_profile_id", mission.concierge_profile_id)
    .eq("source", "mission")
    .eq("source_reference", mission.id)
    .limit(1);

  let conversationId = existing?.[0]?.id ?? null;

  if (!conversationId) {
    const { data: conversation, error } = await dbAny
      .from("contact_conversations")
      .insert({
        owner_profile_id: mission.owner_profile_id,
        concierge_profile_id: mission.concierge_profile_id,
        source: "mission",
        source_reference: mission.id,
        subject: mission.title || "Mission",
        metadata: {
          mission_id: mission.id,
        },
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      console.error("[missions/[id]] conversation create error:", error);
      return null;
    }
    conversationId = conversation?.id ?? null;
  }

  if (conversationId && prefill) {
    await dbAny.from("contact_messages").insert({
      conversation_id: conversationId,
      sender_profile_id: actorProfileId,
      message_type: "text",
      body: prefill,
      metadata: {
        mission_id: mission.id,
        system_context: "mission_status",
      },
    });
    await dbAny
      .from("contact_conversations")
      .update({
        last_message_preview: prefill,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  }

  return conversationId;
}

async function notifyMissionParticipants(mission: MissionRow, actorProfileId: string, body: string, reason: string) {
  const conversationId = await findOrCreateMissionConversation(mission, actorProfileId, body);
  return conversationId
    ? dbAny
        .from("contact_conversations")
        .update({
          metadata: {
            mission_id: mission.id,
            notification_reason: reason,
            last_mission_notification_at: new Date().toISOString(),
          },
        })
        .eq("id", conversationId)
    : null;
}

async function assertMissionCanBePlanned(mission: MissionRow) {
  const [{ data: invoiceRows }, { data: quoteRows }] = await Promise.all([
    dbAny
      .from("invoices")
      .select("id, status, total_amount, paid_amount, balance_amount, metadata")
      .eq("mission_id", mission.id)
      .neq("status", "canceled"),
    dbAny
      .from("quotes")
      .select("metadata")
      .eq("mission_id", mission.id)
      .limit(1),
  ]);

  const guard = canPlanMissionWithPayment({
    invoices: ((invoiceRows ?? []) as Array<Record<string, unknown>>).map((invoice) => ({
      id: typeof invoice.id === "string" ? invoice.id : null,
      invoiceStatus: typeof invoice.status === "string" ? invoice.status : null,
      totalAmount: Number(invoice.total_amount ?? 0),
      paidAmount: Number(invoice.paid_amount ?? 0),
      balanceAmount: Number(invoice.balance_amount ?? 0),
      metadata: toRecord(invoice.metadata),
    })),
    quoteMetadata: toRecord((quoteRows ?? [])[0]?.metadata),
  });

  return guard;
}

async function requestMissionBalance(input: {
  mission: MissionRow;
  actorProfileId: string;
}) {
  const { data: invoices } = await dbAny
    .from("invoices")
    .select("id, invoice_number, status, total_amount, paid_amount, balance_amount, metadata")
    .eq("mission_id", input.mission.id)
    .neq("status", "paid")
    .neq("status", "canceled");

  const invoiceRows = (invoices ?? []) as Array<Record<string, unknown>>;
  const balanceInvoices = invoiceRows.filter((invoice) => Number(invoice.balance_amount ?? invoice.total_amount ?? 0) > 0);

  await Promise.all(
    balanceInvoices.map(async (invoice) => {
      const paidAmount = Number(invoice.paid_amount ?? 0);
      const totalAmount = Number(invoice.total_amount ?? 0);
      const plan = computePaymentPlanAmounts({
        totalAmount,
        metadata: toRecord(invoice.metadata),
      });
      const nextStatus = paidAmount > 0 && plan.plan === "deposit_then_balance" ? "partially_paid" : "issued";
      const invoiceId = String(invoice.id);

      await dbAny
        .from("invoices")
        .update({
          status: nextStatus,
          issued_at: new Date().toISOString(),
          balance_amount: Math.max(totalAmount - paidAmount, 0),
        })
        .eq("id", invoiceId);

      await dbAny.from("invoice_events").insert({
        invoice_id: invoiceId,
        actor_profile_id: input.actorProfileId,
        event_type: "balance_requested",
        payload: {
          source: "owner_validation",
          mission_id: input.mission.id,
          paid_amount: paidAmount,
          balance_amount: Math.max(totalAmount - paidAmount, 0),
        },
      });

      await recordWorkflowEvent(dbAny, {
        actorProfileId: input.actorProfileId,
        ownerProfileId: input.mission.owner_profile_id,
        conciergeProfileId: input.mission.concierge_profile_id,
        reservationId: input.mission.reservation_id ?? null,
        missionId: input.mission.id,
        eventType: "invoice_balance_due",
        title: "Solde a regler",
        body: `Le solde de la facture ${invoice.invoice_number || invoiceId} est demande apres validation.`,
        actionHref: `/dashboard/owner/factures?invoice=${invoiceId}`,
        missionStatus: "validated",
        hasMission: true,
        metadata: {
          invoice_id: invoiceId,
          invoice_number: typeof invoice.invoice_number === "string" ? invoice.invoice_number : null,
          payment_plan: plan.plan,
        },
      });
    }),
  );

  return {
    visible_in: ["missions_validees", "finances", "factures_a_regler"],
    balance_invoice_count: balanceInvoices.length,
  };
}

async function syncMissionOutcome(input: {
  mission: MissionRow;
  nextStatus: MissionStatus | null;
  actorProfileId: string;
}) {
  if (!input.nextStatus) return null;

  if (input.nextStatus === "awaiting_owner_validation" || input.nextStatus === "completed") {
    const { data: draftInvoices } = await dbAny
      .from("invoices")
      .select("id")
      .eq("mission_id", input.mission.id)
      .eq("status", "draft");

    const invoiceIds = ((draftInvoices ?? []) as Array<{ id: string }>).map((invoice) => invoice.id);
    if (invoiceIds.length > 0) {
      await Promise.all(
        invoiceIds.map((invoiceId) =>
          dbAny
            .from("invoices")
            .update({
              status: "issued",
              issued_at: new Date().toISOString(),
            })
            .eq("id", invoiceId),
        ),
      );

      await Promise.all(
        invoiceIds.map((invoiceId) =>
          dbAny.from("invoice_events").insert({
            invoice_id: invoiceId,
            actor_profile_id: input.actorProfileId,
            event_type: "issued",
            payload: {
              source: "mission_completed",
              mission_id: input.mission.id,
            },
          }),
        ),
      );
    }

    return {
      visible_in: ["missions_a_valider", "finances", "factures", "planning"],
      issued_invoice_count: invoiceIds.length,
    };
  }

  if (input.nextStatus === "validated") {
    return requestMissionBalance({
      mission: input.mission,
      actorProfileId: input.actorProfileId,
    });
  }

  if (input.nextStatus === "closed") {
    return { visible_in: ["missions_cloturees", "finances", "historique"] };
  }

  if (input.nextStatus === "canceled") {
    const { data: draftInvoices } = await dbAny
      .from("invoices")
      .select("id")
      .eq("mission_id", input.mission.id)
      .eq("status", "draft");

    const invoiceIds = ((draftInvoices ?? []) as Array<{ id: string }>).map((invoice) => invoice.id);
    await Promise.all(
      invoiceIds.map((invoiceId) =>
        dbAny
          .from("invoices")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("id", invoiceId),
      ),
    );

    return {
      visible_in: ["missions_annulees", "planning", "finances"],
      canceled_invoice_count: invoiceIds.length,
    };
  }

  if (input.nextStatus === "in_progress") {
    return { visible_in: ["missions_en_cours", "planning", "messages"] };
  }

  if (input.nextStatus === "accepted") {
    return { visible_in: ["missions_a_planifier", "planning", "messages"] };
  }

  return null;
}

async function hydrateMissionDetail(mission: MissionRow) {
  const metadata = toRecord(mission.metadata);
  const profileIds = [mission.owner_profile_id, mission.concierge_profile_id].filter(
    (value): value is string => Boolean(value),
  );
  const profiles = await loadProfiles(profileIds);

  const [
    { data: events },
    { data: conversations },
    { data: quotes },
    { data: invoices },
    { data: providerInterventions },
    { data: providers },
    property,
  ] =
    await Promise.all([
      dbAny
        .from("mission_events")
        .select("id, actor_profile_id, event_type, payload, created_at")
        .eq("mission_id", mission.id)
        .order("created_at", { ascending: false })
        .limit(40),
      dbAny
        .from("contact_conversations")
        .select("id, subject, status, last_message_preview, last_message_at, source, source_reference")
        .eq("source", "mission")
        .eq("source_reference", mission.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(5),
      dbAny
        .from("quotes")
        .select("id, quote_number, status, total_amount, currency, valid_until, created_at")
        .eq("mission_id", mission.id)
        .order("created_at", { ascending: false })
        .limit(10),
      dbAny
        .from("invoices")
        .select("id, invoice_number, status, total_amount, paid_amount, balance_amount, currency, due_date, metadata, created_at")
        .eq("mission_id", mission.id)
        .order("created_at", { ascending: false })
        .limit(10),
      loadProviderInterventionsForMission(mission),
      dbAny
        .from("profiles")
        .select("id, first_name, last_name, username, company_name, role, city")
        .in("role", ["provider", "provider_pro", "artisan", "artisan_pro"])
        .order("company_name", { ascending: true })
        .limit(80),
      loadMissionHousing(mission.property_id, metadata),
    ]);

  const displayTitle =
    (typeof metadata.mission_title === "string" && metadata.mission_title.trim()) ||
    (typeof metadata.title === "string" && metadata.title.trim()) ||
    mission.title ||
    mission.service_label ||
    (typeof metadata.property_label === "string" ? `Mission ${metadata.property_label}` : null);
  const proofLinks = Array.isArray(metadata.proof_links) ? metadata.proof_links : [];
  const checklist = Array.isArray(metadata.checklist) ? metadata.checklist : [];
  const conversationId = conversations?.[0]?.id ?? null;

  return {
    mission: {
      ...attachMissionWorkflow(mission),
      title: displayTitle,
      status: normalizeMissionStatus(mission.status),
      priority: normalizeMissionPriority(mission.priority),
    },
    participants: {
      owner: mission.owner_profile_id ? profiles.get(mission.owner_profile_id) ?? null : null,
      concierge: mission.concierge_profile_id ? profiles.get(mission.concierge_profile_id) ?? null : null,
    },
    property,
    events: events ?? [],
    conversations: conversations ?? [],
    conversation_id: conversationId,
    quotes: (quotes ?? []).map(attachQuoteWorkflow),
    invoices: invoices ?? [],
    provider_interventions: providerInterventions ?? [],
    providers: providers ?? [],
    evidence: {
      proof_links: proofLinks,
      checklist,
      signature: metadata.owner_signature ?? metadata.concierge_signature ?? null,
    },
    quick_links: {
      messages: conversationId ? `/dashboard/messages?conversation=${conversationId}` : null,
    },
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, MISSION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const { id: rawId } = await params;
    const id = normalizeRouteId(rawId);

    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Mission invalide" }, { status: 400 });
    }

    const { mission, error } = await loadMission(id);
    if (error || !mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }
    if (!canAccessMission(mission, userId, role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    return NextResponse.json(await hydrateMissionDetail(mission));
  } catch (err) {
    console.error("[GET /api/missions/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireApiRole(req, MISSION_ROLES);
    if (!guard.ok) return guard.response;
    const { userId, role } = guard.auth;
    const { id: rawId } = await params;
    const id = normalizeRouteId(rawId);

    if (!isUuidLike(id)) {
      return NextResponse.json({ error: "Mission invalide" }, { status: 400 });
    }

    const { mission, error } = await loadMission(id);
    if (error || !mission) {
      return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    }
    if (!canAccessMission(mission, userId, role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "update";
    const patch: Record<string, unknown> = {};
    const eventPayload: Record<string, unknown> = { action };
    let eventType = "updated";
    let statusMessage: string | null = null;

    const actionStatus = getMissionActionTarget(action);
    let requestedStatus = actionStatus ?? (body.status ? normalizeMissionStatus(body.status) : null);
    const cancelReason =
      typeof body.cancel_reason === "string" ? body.cancel_reason.trim() || null : null;

    if (requestedStatus) {
      if (!canMutateMissionStatus(role, mission.status, requestedStatus)) {
        return NextResponse.json({ error: "Statut reserve a la conciergerie" }, { status: 403 });
      }
      if (requestedStatus === "scheduled" || requestedStatus === "date_confirmed") {
        const paymentGuard = await assertMissionCanBePlanned(mission);
        if (!paymentGuard.canPlan) {
          return NextResponse.json(
            {
              error: paymentGuard.reason || "Acompte requis avant planification.",
              payment_guard: paymentGuard,
            },
            { status: 409 },
          );
        }
      }
      patch.status = requestedStatus;
      Object.assign(
        patch,
        buildStatusTimestamps(requestedStatus, cancelReason),
      );
      eventType = requestedStatus === "accepted" ? "accepted" : requestedStatus === "in_progress" ? "started" : requestedStatus;
      eventPayload.previous_status = mission.status;
      eventPayload.next_status = requestedStatus;
      statusMessage = getMissionStatusWorkflowCopy(requestedStatus).message;
    }

    const fieldPatch: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) fieldPatch.title = body.title.trim();
    if (typeof body.description === "string") fieldPatch.description = body.description.trim() || null;
    if (typeof body.priority === "string") fieldPatch.priority = normalizeMissionPriority(body.priority);
    if (typeof body.scheduled_start === "string") fieldPatch.scheduled_start = body.scheduled_start || null;
    if (typeof body.scheduled_end === "string") fieldPatch.scheduled_end = body.scheduled_end || null;
    if (typeof body.amount === "number") fieldPatch.amount = body.amount;

    if (typeof body.concierge_profile_id === "string" && isUuidLike(body.concierge_profile_id)) {
      fieldPatch.concierge_profile_id = body.concierge_profile_id;
    }

    const requestedFields = Object.keys(fieldPatch);
    if (requestedFields.length > 0 && !canUpdateMissionFields(role, requestedFields)) {
      return NextResponse.json({ error: "Modification non autorisee pour votre role" }, { status: 403 });
    }
    const plannedStart = typeof fieldPatch.scheduled_start === "string"
      ? fieldPatch.scheduled_start
      : mission.scheduled_start;
    const plannedEnd = typeof fieldPatch.scheduled_end === "string"
      ? fieldPatch.scheduled_end
      : mission.scheduled_end;
    const checksPlanning =
      requestedStatus === "scheduled" ||
      requestedStatus === "date_confirmed" ||
      requestedFields.includes("scheduled_start") ||
      requestedFields.includes("scheduled_end");
    if (checksPlanning && plannedStart && plannedEnd) {
      const range = validateMissionScheduleRange(plannedStart, plannedEnd);
      if (!range.valid) return NextResponse.json({ error: range.error }, { status: 400 });

      const { data: overlapping, error: overlapError } = await dbAny
        .from("missions")
        .select("id, property_id, scheduled_start, scheduled_end, metadata")
        .eq("concierge_profile_id", mission.concierge_profile_id)
        .neq("id", mission.id)
        .not("status", "in", "(canceled,closed)")
        .lt("scheduled_start", plannedEnd)
        .gt("scheduled_end", plannedStart);
      if (overlapError) {
        console.error("[PATCH /api/missions/[id]] conflict lookup error:", overlapError);
        return NextResponse.json({ error: "Vérification du planning impossible." }, { status: 500 });
      }

      const missionMetadata = toRecord(mission.metadata);
      const conflicts = findMissionScheduleConflicts(
        {
          id: mission.id,
          propertyId: mission.property_id,
          assignedTeamMemberId:
            typeof missionMetadata.assigned_team_member_id === "string"
              ? missionMetadata.assigned_team_member_id
              : null,
          scheduledStart: plannedStart,
          scheduledEnd: plannedEnd,
        },
        overlapping ?? [],
      );
      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: "Ce créneau chevauche une mission existante.", conflicts },
          { status: 409 },
        );
      }
    }
    if (requestedFields.length > 0) {
      eventPayload.updated_fields = requestedFields;
      if (action === "update") {
        eventType = "created";
      }
    }
    Object.assign(patch, fieldPatch);

    const metadata = toRecord(mission.metadata);
    if (action === "add_proof") {
      if (!CONCIERGE_MISSION_ROLES.has(role)) {
        return NextResponse.json({ error: "Preuves reservees a la conciergerie" }, { status: 403 });
      }
      const label = typeof body.label === "string" ? body.label.trim() : "";
      const url = typeof body.url === "string" ? body.url.trim() : "";
      const kind = typeof body.kind === "string" ? body.kind.trim() : "document";
      if (!label || !url) {
        return NextResponse.json({ error: "Titre et lien de preuve requis" }, { status: 400 });
      }
      patch.metadata = {
        ...metadata,
        proof_links: [
          ...(Array.isArray(metadata.proof_links) ? metadata.proof_links : []),
          { id: crypto.randomUUID(), label, url, kind, created_at: new Date().toISOString(), created_by: userId },
        ],
      } as Json;
      eventType = "updated";
      eventPayload.proof_added = label;
    }

    if (action === "update_checklist") {
      if (!CONCIERGE_MISSION_ROLES.has(role)) {
        return NextResponse.json({ error: "Checklist reservee a la conciergerie" }, { status: 403 });
      }
      const checklist = Array.isArray(body.checklist) ? body.checklist : [];
      patch.metadata = {
        ...metadata,
        checklist: checklist.slice(0, 30),
      } as Json;
      eventPayload.checklist_updated = true;
    }

    if (action === "assign_team_member") {
      if (!CONCIERGE_MISSION_ROLES.has(role)) {
        return NextResponse.json({ error: "Attribution reservee a la conciergerie" }, { status: 403 });
      }
      const teamMemberId = typeof body.team_member_id === "string" ? body.team_member_id.trim() : "";
      const teamMemberName = typeof body.team_member_name === "string" ? body.team_member_name.trim() : "";
      if (!teamMemberId) {
        return NextResponse.json({ error: "Membre equipe requis" }, { status: 400 });
      }
      patch.metadata = {
        ...metadata,
        assigned_team_member_id: teamMemberId,
        assigned_team_member_name: teamMemberName || null,
        assigned_team_member_at: new Date().toISOString(),
        assigned_team_member_by: userId,
      } as Json;
      eventType = "assigned";
      eventPayload.assigned_team_member_id = teamMemberId;
      eventPayload.assigned_team_member_name = teamMemberName || null;
    }

    if (action === "signoff") {
      const signature = typeof body.signature === "string" ? body.signature.trim() : "";
      if (!signature) {
        return NextResponse.json({ error: "Signature requise" }, { status: 400 });
      }
      const ownerSignsCompletedMission =
        OWNER_MISSION_ROLES.has(role) &&
        ["awaiting_owner_validation", "completed"].includes(normalizeMissionStatus(mission.status));
      patch.metadata = {
        ...metadata,
        [OWNER_MISSION_ROLES.has(role) ? "owner_signature" : "concierge_signature"]: {
          name: signature,
          signed_at: new Date().toISOString(),
          profile_id: userId,
        },
        ...(ownerSignsCompletedMission
          ? {
              validated_by_owner_at: new Date().toISOString(),
              validated_by_owner_profile_id: userId,
            }
          : {}),
      } as Json;
      eventPayload.signature_added = true;
      if (ownerSignsCompletedMission) {
        requestedStatus = "validated";
        patch.status = "validated";
        eventType = "validated";
        eventPayload.previous_status = mission.status;
        eventPayload.next_status = "validated";
        statusMessage = getMissionStatusWorkflowCopy("validated").message;
      }
    }

    if (action === "validate_completion") {
      if (!OWNER_MISSION_ROLES.has(role)) {
        return NextResponse.json({ error: "Validation reservee au proprietaire" }, { status: 403 });
      }
      patch.metadata = {
        ...metadata,
        validated_by_owner_at: new Date().toISOString(),
        validated_by_owner_profile_id: userId,
      } as Json;
      requestedStatus = "validated";
      patch.status = "validated";
      eventType = "validated";
      eventPayload.previous_status = mission.status;
      eventPayload.next_status = "validated";
      statusMessage = getMissionStatusWorkflowCopy("validated").message;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
    }

    let { data: updatedMission, error: updateError } = await dbAny
      .from("missions")
      .update(patch)
      .eq("id", mission.id)
      .select(missionSelect)
      .single<MissionRow>();

    if (isMissingTitleColumn(updateError)) {
      const fallbackResult = await dbAny
        .from("missions")
        .update(patch)
        .eq("id", mission.id)
        .select(missionSelectFallback)
        .single<MissionRow>();
      updatedMission = fallbackResult.data;
      updateError = fallbackResult.error;
    }

    if (updateError?.code === "23514" && patch.status === "validated") {
      const fallbackPatch = {
        ...patch,
        status: "completed",
        metadata: {
          ...toRecord(patch.metadata),
          owner_validation_status: "validated",
        },
      };
      const fallbackResult = await dbAny
        .from("missions")
        .update(fallbackPatch)
        .eq("id", mission.id)
        .select(missionSelect)
        .single<MissionRow>();
      updatedMission = fallbackResult.data;
      updateError = fallbackResult.error;
      if (!updateError) {
        eventPayload.persisted_status = "completed";
        eventPayload.owner_validation_status = "validated";
      }
    }

    if (updateError || !updatedMission) {
      console.error("[PATCH /api/missions/[id]] update error:", updateError);
      return NextResponse.json({ error: "Erreur mise a jour mission" }, { status: 500 });
    }

    const eventInsert = await dbAny.from("mission_events").insert({
      mission_id: mission.id,
      actor_profile_id: userId,
      event_type: eventType,
      payload: eventPayload,
    });
    if (eventInsert.error) {
      await dbAny.from("mission_events").insert({
        mission_id: mission.id,
        actor_profile_id: userId,
        event_type: requestedStatus === "canceled" ? "canceled" : requestedStatus === "validated" ? "completed" : "created",
        payload: {
          ...eventPayload,
          original_event_type: eventType,
          fallback_reason: eventInsert.error.message,
        },
      });
    }

    const changeMessage = formatMissionChangeMessage({
      action,
      fields: requestedFields,
      nextStatus: requestedStatus,
      cancelReason,
    });

    if (changeMessage || statusMessage) {
      await notifyMissionParticipants(
        updatedMission,
        userId,
        changeMessage || statusMessage || "La mission a été mise à jour.",
        requestedFields.length > 0 ? "mission_updated_by_owner" : "mission_status_changed",
      );
    }

    const completedAction = await syncMissionOutcome({
      mission: updatedMission,
      nextStatus: requestedStatus,
      actorProfileId: userId,
    });

    if (requestedStatus) {
      const metadata = toRecord(updatedMission.metadata);
      const serviceRequestId =
        typeof metadata.service_request_id === "string" ? metadata.service_request_id : null;

      await recordWorkflowEvent(dbAny, {
        actorProfileId: userId,
        ownerProfileId: updatedMission.owner_profile_id,
        conciergeProfileId: updatedMission.concierge_profile_id,
        reservationId: updatedMission.reservation_id ?? null,
        serviceRequestId,
        missionId: updatedMission.id,
        eventType: `mission_${requestedStatus}`,
        title: getMissionStatusWorkflowCopy(requestedStatus).title,
        body: cancelReason || statusMessage || null,
        actionHref: `/dashboard/missions/${updatedMission.id}`,
        serviceRequestStatus: serviceRequestId ? "accepted" : null,
        missionStatus: updatedMission.status,
        hasMission: true,
        scheduledStart: updatedMission.scheduled_start,
        scheduledEnd: updatedMission.scheduled_end,
        metadata: {
          action,
          reason: cancelReason,
        },
      });
    }

    const hydrated = await hydrateMissionDetail(updatedMission);
    return NextResponse.json({
      ...hydrated,
      completed_action: completedAction,
    });
  } catch (err) {
    console.error("[PATCH /api/missions/[id]] ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
