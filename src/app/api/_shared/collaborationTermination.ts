import type { LooseSupabaseClient } from "./untypedSupabase.ts";
import { canRequestCollaborationEnd } from "./continuousCollaboration.ts";
import { collaborationLifecycle, lifecycleRecord, terminationSchedule } from "./collaborationLifecycle.ts";
import { commercialObjectId } from "../../../features/concierge-commercial/server/requestCommercialGuard.ts";

type Collaboration = { id: string; owner_profile_id: string; concierge_profile_id: string; status: string;
  scope?: unknown; ends_on?: string | null; updated_at?: string };

async function participantCollaboration(db: LooseSupabaseClient, id: string, actorId: string) {
  const result = await db.from("housing_collaborations")
    .select("id,owner_profile_id,concierge_profile_id,status,scope,ends_on,updated_at").eq("id", id).maybeSingle();
  if (result.error) throw new Error("Collaboration indisponible.");
  const row = result.data as Collaboration | null;
  return row && canRequestCollaborationEnd(row, actorId) ? row : null;
}

/** Quote notes, unilateral scope fields and drafts never prove a special notice. */
async function agreedNotice(db: LooseSupabaseClient, row: Collaboration, requestedAt: string) {
  const envelopes = await db.from("services_contracts").select("id").eq("collaboration_id", row.id);
  if (envelopes.error) throw new Error("Conditions convenues indisponibles.");
  const ids = (envelopes.data ?? []).map((item: { id: string }) => item.id);
  const versions = ids.length ? await db.from("services_contract_versions")
    .select("id,version_number,status,conditions,proposed_owner_id,proposed_concierge_id,owner_accepted_by,owner_accepted_at,concierge_accepted_by,concierge_accepted_at")
    .in("contract_id", ids).in("status", ["ready_to_sign", "signing", "signed", "superseded"])
    : { data: [], error: null };
  if (versions.error) throw new Error("Conditions convenues indisponibles.");
  const accepted = (versions.data ?? []).filter((version: Record<string, unknown>) => {
    const ownerAt = Date.parse(String(version.owner_accepted_at)), conciergeAt = Date.parse(String(version.concierge_accepted_at));
    return version.proposed_owner_id === row.owner_profile_id && version.proposed_concierge_id === row.concierge_profile_id
      && version.owner_accepted_by === row.owner_profile_id && version.concierge_accepted_by === row.concierge_profile_id
      && Number.isFinite(ownerAt) && Number.isFinite(conciergeAt)
      && Math.max(ownerAt, conciergeAt) <= Date.parse(requestedAt);
  }).sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
    Math.max(Date.parse(String(b.owner_accepted_at)), Date.parse(String(b.concierge_accepted_at)))
      - Math.max(Date.parse(String(a.owner_accepted_at)), Date.parse(String(a.concierge_accepted_at)))
      || Number(b.version_number) - Number(a.version_number));
  const version = accepted[0] as Record<string, unknown> | undefined;
  const duration = lifecycleRecord(lifecycleRecord(version?.conditions).duration);
  if (version && (duration.kind !== "INDETERMINEE" || duration.endsOn != null)) {
    return { error: "Ces conditions ne portent pas sur une collaboration à durée indéterminée." };
  }
  if (!version && lifecycleRecord(row.scope).continuous_collaboration !== true) {
    return { error: "Cette collaboration n’est pas identifiée comme étant à durée indéterminée." };
  }
  const days = version ? duration.noticeDays : 30;
  if (typeof days !== "number" || !Number.isInteger(days) || days < 0 || days > 3650) {
    return { error: "Le préavis convenu est invalide ; vérification des conditions nécessaire." };
  }
  return { days, versionId: version?.id ?? null, source: version ? "bilateral_contract_conditions" : "default_30_calendar_days" };
}

async function terminationView(db: LooseSupabaseClient, row: Collaboration, now: Date) {
  const lifecycle = collaborationLifecycle(row, now);
  if (lifecycle.invalid) return { status: 409, error: "Les dates de résiliation sont incohérentes. Vérification nécessaire." };
  const termination = lifecycle.termination;
  const arbitration: Record<string, unknown>[] = [];
  if (termination) {
    for (let offset = 0; ; offset += 500) {
      const missions = await db.from("missions").select("id,title,status,scheduled_start,scheduled_end")
        .eq("owner_profile_id", row.owner_profile_id).eq("concierge_profile_id", row.concierge_profile_id)
        .contains("metadata", { collaboration_id: row.id }).order("id", { ascending: true }).range(offset, offset + 499);
      if (missions.error) throw new Error("Les interventions à arbitrer sont indisponibles.");
      const rows = (missions.data ?? []) as Record<string, unknown>[];
      for (const mission of rows) {
        if (!["closed", "canceled", "cancelled", "validated", "completed"].includes(String(mission.status))
          && (Date.parse(String(mission.scheduled_start)) >= Date.parse(String(termination.effective_at))
            || Date.parse(String(mission.scheduled_end)) > Date.parse(String(termination.effective_at)))) {
          arbitration.push({ ...mission, requires_arbitration: true, reason: "intervention_after_collaboration_end" });
        }
      }
      if (rows.length < 500) break;
    }
  }
  return { status: lifecycle.status === "ended" || lifecycle.status === "cancelled" ? 200 : termination ? 202 : 200,
    collaboration_status: lifecycle.status, stored_status: row.status,
    termination_request: termination ?? lifecycleRecord(row.scope).termination_request ?? null,
    interventions_requiring_arbitration: arbitration,
    notification: { event_recorded: Array.isArray(lifecycleRecord(row.scope).termination_events)
      && (lifecycleRecord(row.scope).termination_events as unknown[]).some(event => lifecycleRecord(event).event_type === "termination_requested"),
      delivery: "participant_api", external_delivery: false } };
}

export async function readCollaborationTermination(db: LooseSupabaseClient, id: string, actorId: string, now = new Date()) {
  const row = await participantCollaboration(db, id, actorId);
  return row ? terminationView(db, row, now) : { status: 404, error: "Collaboration introuvable." };
}

export async function requestCollaborationTermination(db: LooseSupabaseClient, id: string, actorId: string, now = new Date()) {
  const row = await participantCollaboration(db, id, actorId);
  if (!row) return { status: 404, error: "Collaboration introuvable." };
  const lifecycle = collaborationLifecycle(row, now);
  if (lifecycle.invalid) return { status: 409, error: "Les dates de résiliation sont incohérentes. Vérification nécessaire." };
  if (lifecycle.termination || ["ended", "cancelled"].includes(row.status)) return terminationView(db, row, now);
  if (!["active", "paused"].includes(row.status)) return { status: 409, error: "Cette collaboration n’a pas commencé." };
  if (row.ends_on) return { status: 409, error: "Une date de fin historique existe déjà. Vérifiez-la sans l’écraser." };
  const scope = lifecycleRecord(row.scope), previous = lifecycleRecord(scope.termination_request);
  const legacy = Object.keys(previous).length > 0;
  if (legacy && (!canRequestCollaborationEnd(row, String(previous.requested_by))
    || !Number.isFinite(Date.parse(String(previous.requested_at))) || Date.parse(String(previous.requested_at)) > now.getTime())) {
    return { status: 409, error: "La demande historique de résiliation doit être vérifiée." };
  }
  const requestedAt = legacy ? new Date(String(previous.requested_at)).toISOString() : now.toISOString();
  const requestedBy = legacy ? String(previous.requested_by) : actorId;
  const notice = await agreedNotice(db, row, requestedAt);
  if (notice.error) return { status: 409, error: notice.error };
  const termination = { schema_version: 1, state: "notice", requested_by: requestedBy, requested_at: requestedAt,
    notice_days: notice.days!, notice_source: notice.source, conditions_version_id: notice.versionId,
    ...terminationSchedule(requestedAt, notice.days!), date_convention: "UTC_calendar_date_plus_notice_days" };
  const event = { id: commercialObjectId(`collaboration-termination:${row.id}`), event_type: "termination_requested",
    actor_profile_id: requestedBy, recipient_profile_id: requestedBy === row.owner_profile_id ? row.concierge_profile_id : row.owner_profile_id,
    created_at: requestedAt, termination };
  const events = Array.isArray(scope.termination_events) ? scope.termination_events : [];
  const history = Array.isArray(scope.termination_history) ? scope.termination_history : [];
  const nextScope = { ...scope, termination_request: termination,
    termination_events: events.some(item => lifecycleRecord(item).id === event.id) ? events : [...events, event],
    ...(legacy ? { termination_history: [...history, previous] } : {}) };
  const updated = await db.from("housing_collaborations").update({ scope: nextScope, ends_on: termination.effective_date,
    updated_at: new Date(Math.max(now.getTime(), Date.parse(row.updated_at ?? "") + 1 || 0)).toISOString() })
    .eq("id", id).eq("status", row.status).eq("updated_at", row.updated_at).select("id").maybeSingle();
  if (updated.error) return { status: 500, error: "La demande de fin n’a pas pu être enregistrée." };
  if (!updated.data) {
    const fresh = await participantCollaboration(db, id, actorId);
    if (fresh && collaborationLifecycle(fresh, now).termination) return terminationView(db, fresh, now);
    return { status: 409, error: "La collaboration a changé. Rechargez avant de renouveler la demande." };
  }
  return terminationView(db, { ...row, scope: nextScope, ends_on: termination.effective_date }, now);
}
