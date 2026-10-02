import type { LooseSupabaseClient } from "./untypedSupabase";

export type CollaborationNextActionKind =
  | "finalize_contract"
  | "contract_scheduled"
  | "transmit_stay"
  | "unavailable";

export type CollaborationNextAction = {
  kind: CollaborationNextActionKind;
  collaborationId: string | null;
  collaborationStatus: string | null;
  signatureState: {
    ownerSigned: boolean;
    conciergeSigned: boolean;
    signed: boolean;
    effectiveStart: string | null;
  } | null;
  nextAction: string;
  nextHref: string | null;
  visibleIn: string[];
};

export type CollaborationRow = {
  id: string;
  status: string | null;
  service_request_id: string | null;
  quote_id: string | null;
};

export function effectiveStartFromConditions(conditions: unknown): string | null {
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) return null;
  const duration = (conditions as Record<string, unknown>).duration;
  if (!duration || typeof duration !== "object" || Array.isArray(duration)) return null;
  const startsOn = (duration as Record<string, unknown>).startsOn;
  return typeof startsOn === "string" && startsOn.trim() ? startsOn : null;
}

export function formatDateFr(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
/**
 * Lecture seule post-acceptation : ne modifie ni RPC, ni RLS, ni mission/facture.
 * Un devis accepted ne prouve jamais une collaboration active : seul le statut
 * réel de housing_collaborations (et ses signatures) décide de la prochaine action.
 */
export async function getCollaborationNextAction(input: {
  db: LooseSupabaseClient;
  quoteId: string;
  serviceRequestId?: string | null;
}): Promise<CollaborationNextAction> {
  const fallback: CollaborationNextAction = {
    kind: "finalize_contract",
    collaborationId: null,
    collaborationStatus: null,
    signatureState: null,
    nextAction: "Finaliser mon contrat : précisez les conditions avec votre concierge, puis signez à deux avant tout séjour.",
    nextHref: null,
    visibleIn: ["devis", "demandes", "messages"],
  };
  const { data: collaboration, error } = await input.db
    .from("housing_collaborations")
    .select("id,status,service_request_id,quote_id")
    .eq("quote_id", input.quoteId)
    .maybeSingle();

  if (error || !collaboration) return fallback;
  const row = collaboration as CollaborationRow;
  if (input.serviceRequestId && row.service_request_id && row.service_request_id !== input.serviceRequestId) {
    return fallback;
  }

  let signatureState: CollaborationNextAction["signatureState"] = null;
  try {
    const { data: envelope } = await input.db
      .from("services_contracts")
      .select("id")
      .eq("collaboration_id", row.id)
      .maybeSingle();
    const envelopeId = (envelope as { id?: string } | null)?.id ?? null;
    if (envelopeId) {
      const { data: versions } = await input.db
        .from("services_contract_versions")
        .select("id,conditions")
        .eq("contract_id", envelopeId)
        .order("version_number", { ascending: false })
        .limit(1);
      const version = (Array.isArray(versions) ? versions[0] : null) as { id: string; conditions?: unknown } | null;
      if (version?.id) {
        const { data: signatures } = await input.db
          .from("contract_version_signatures")
          .select("signer_role,contract_version_id")
          .eq("contract_version_id", version.id);
        const rows = (Array.isArray(signatures) ? signatures : []) as { signer_role: string }[];
        const ownerSigned = rows.some((signature) => signature.signer_role === "owner");
        const conciergeSigned = rows.some((signature) => signature.signer_role === "concierge");
        signatureState = {
          ownerSigned,
          conciergeSigned,
          signed: ownerSigned && conciergeSigned,
          effectiveStart: effectiveStartFromConditions(version.conditions),
        };
      }
    }
  } catch {
    signatureState = null;
  }

  const status = typeof row.status === "string" ? row.status : null;
  const requestParam = input.serviceRequestId ? `&request=${encodeURIComponent(input.serviceRequestId)}` : "";

  if (status === "active") {
    return {
      kind: "transmit_stay",
      collaborationId: row.id,
      collaborationStatus: status,
      signatureState,
      nextAction: "Collaboration active : transmettez maintenant votre premier séjour à votre concierge.",
      nextHref: `/dashboard/owner/missions/voyageurs?quote=${encodeURIComponent(input.quoteId)}${requestParam}`,
      visibleIn: ["missions", "planning", "partenaires"],
    };
  }

  if (status === "scheduled") {
    const startLabel = formatDateFr(signatureState?.effectiveStart ?? null);
    return {
      kind: "contract_scheduled",
      collaborationId: row.id,
      collaborationStatus: status,
      signatureState,
      nextAction: startLabel
        ? `Contrat signé par les deux parties : démarrage programmé le ${startLabel}. Vous pourrez transmettre un séjour dès l'activation.`
        : "Contrat signé par les deux parties : démarrage programmé. Vous pourrez transmettre un séjour dès l'activation.",
      nextHref: null,
      visibleIn: ["devis", "demandes", "messages"],
    };
  }

  if (signatureState && (signatureState.ownerSigned || signatureState.conciergeSigned) && !signatureState.signed) {
    return {
      kind: "finalize_contract",
      collaborationId: row.id,
      collaborationStatus: status,
      signatureState,
      nextAction: "Contrat signé par une seule partie : il manque encore une signature avant de transmettre un séjour.",
      nextHref: null,
      visibleIn: ["devis", "demandes", "messages"],
    };
  }

  return {
    kind: "finalize_contract",
    collaborationId: row.id,
    collaborationStatus: status,
    signatureState,
    nextAction: "Devis accepté : finalisez votre contrat avec votre concierge avant de transmettre un séjour.",
    nextHref: null,
    visibleIn: ["devis", "demandes", "messages"],
  };
}
