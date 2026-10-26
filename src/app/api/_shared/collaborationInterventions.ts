import type { LooseSupabaseClient } from "./untypedSupabase.ts";
import { agreedServiceSlugs, isContinuousCollaboration } from "./continuousCollaboration.ts";
import { commercialObjectId } from "../../../features/concierge-commercial/server/requestCommercialGuard.ts";
import { PLANETLS_SERVICE_TARGET } from "../../lib/planetlsServiceCatalogTarget.ts";
import { collaborationLifecycle } from "./collaborationLifecycle.ts";

export class CollaborationInterventionError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

/** An explicit operational order; never creates an invoice or a legal contract. */
export async function addCollaborationIntervention(db: LooseSupabaseClient, input: {
  collaborationId: string; actorId: string; operationId: string; serviceSlug: string; start: string; end: string;
}) {
  const collaborationResult = await db.from("housing_collaborations").select("*")
    .eq("id", input.collaborationId).eq("owner_profile_id", input.actorId).maybeSingle();
  if (collaborationResult.error) throw new CollaborationInterventionError("Collaboration indisponible.", 500);
  const collaboration = collaborationResult.data;
  if (!collaboration) throw new CollaborationInterventionError("Collaboration introuvable.", 404);
  if (!collaborationLifecycle(collaboration).canCreateInterventions) throw new CollaborationInterventionError("Cette collaboration n’est pas active ou sa résiliation a pris effet.", 409);
  const [quoteResult, requestResult, housingResult] = await Promise.all([
    db.from("quotes").select("*").eq("id", collaboration.quote_id).maybeSingle(),
    db.from("service_requests").select("*").eq("id", collaboration.service_request_id).maybeSingle(),
    db.from("housing").select("id,proprietaire").eq("id", collaboration.housing_id).maybeSingle(),
  ]);
  if ([quoteResult, requestResult, housingResult].some(r => r.error)) throw new CollaborationInterventionError("Accord commercial indisponible.", 500);
  const quote = quoteResult.data, request = requestResult.data, housing = housingResult.data;
  const ownerKeys = ["owner_profile_id", "owner_id", "proprietaire_id", "id", "userId", "profile_id"];
  const owners = ownerKeys.map(key => housing?.proprietaire?.[key]).filter(value => value != null && value !== "");
  if (!quote || quote.status !== "accepted" || quote.owner_profile_id !== input.actorId
    || quote.concierge_profile_id !== collaboration.concierge_profile_id
    || !request || request.owner_profile_id !== input.actorId || quote.service_request_id !== request.id
    || request.metadata?.selected_quote_id !== quote.id || !isContinuousCollaboration(request)
    || !owners.length || owners.some(owner => owner !== input.actorId)) {
    throw new CollaborationInterventionError("Références de collaboration incohérentes.", 409);
  }
  const service = PLANETLS_SERVICE_TARGET.find(entry => entry.slug === input.serviceSlug && entry.kind === "service");
  if (!service || !agreedServiceSlugs(request).includes(input.serviceSlug)
    || !Array.isArray(collaboration.scope?.operational_service_slugs)
    || !collaboration.scope.operational_service_slugs.includes(input.serviceSlug)) {
    throw new CollaborationInterventionError("Prestation absente du périmètre convenu.", 400);
  }
  const start = new Date(input.start), end = new Date(input.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new CollaborationInterventionError("Les dates d’intervention sont invalides.", 400);
  }
  const id = commercialObjectId(`collaboration-intervention:${collaboration.id}:${input.operationId}`);
  const read = () => db.from("missions").select("*").eq("id", id).maybeSingle();
  const verifyReplay = (row: Record<string, unknown>) => {
    const meta = row.metadata as Record<string, unknown> | null;
    if (row.owner_profile_id !== input.actorId || row.concierge_profile_id !== collaboration.concierge_profile_id
      || meta?.collaboration_id !== collaboration.id || meta?.operational_service_slug !== input.serviceSlug
      || new Date(String(row.scheduled_start)).getTime() !== start.getTime()
      || new Date(String(row.scheduled_end)).getTime() !== end.getTime()) {
      throw new CollaborationInterventionError("Cette clé de reprise correspond à une autre intervention.", 409);
    }
    return row;
  };
  const existing = await read();
  if (existing.error) throw existing.error;
  if (existing.data) return verifyReplay(existing.data);
  if (!collaborationLifecycle(collaboration).canCreateInterventions) throw new CollaborationInterventionError("La résiliation a pris effet.", 409);
  const created = await db.from("missions").insert({ id,
    owner_profile_id: input.actorId, concierge_profile_id: collaboration.concierge_profile_id,
    property_id: request.property_id ?? null, service_id: service.legacyId ?? null,
    title: service.label, status: "date_requested", amount: null, currency: quote.currency ?? "EUR",
    scheduled_start: start.toISOString(), scheduled_end: end.toISOString(),
    metadata: { source: "continuous_collaboration_order", collaboration_id: collaboration.id,
      property_housing_id: collaboration.housing_id, operational_service_slug: input.serviceSlug,
      collaboration_operation_id: input.operationId, commercial_terms_quote_id: quote.id },
  }).select("*").single();
  if (created.error?.code === "23505") {
    const replay = await read();
    if (replay.error || !replay.data) throw replay.error ?? created.error;
    return verifyReplay(replay.data);
  }
  if (created.error || !created.data) throw created.error ?? new Error("Intervention non persistée.");
  return created.data;
}
