import { createHash } from "node:crypto";
import type { LooseSupabaseClient } from "../../../app/api/_shared/untypedSupabase.ts";

export class RequestCommercialError extends Error {
  status: number;
  constructor(message: string, status = 409) { super(message); this.status = status; }
}

export const OPEN_REQUEST_STATUSES = ["sent", "received", "viewed", "in_review", "information_requested", "quoted", "quote_refused"];
const terminalRecipients = new Set(["declined", "selected", "not_selected"]);
type Link = { service_request_id?: unknown; service_request_recipient_id?: unknown;
  concierge_profile_id?: unknown; owner_profile_id?: unknown; metadata?: unknown };
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function readRequestQuoteLink(quote: Link) {
  const metadata = record(quote.metadata);
  const read = (key: "service_request_id" | "service_request_recipient_id") => {
    const column = typeof quote[key] === "string" ? quote[key] as string : null;
    const old = typeof metadata[key] === "string" ? metadata[key] as string : null;
    if (column && old && column !== old) throw new RequestCommercialError("Rattachement commercial incohérent.");
    return column || old;
  };
  return { requestId: read("service_request_id"), recipientId: read("service_request_recipient_id") };
}

export function assertRequestOpen(request: { status?: unknown; selected_concierge_profile_id?: unknown; metadata?: unknown },
  recipient?: { status?: unknown } | null) {
  if (!OPEN_REQUEST_STATUSES.includes(String(request.status)) || request.selected_concierge_profile_id ||
    record(request.metadata).selected_quote_id || (recipient && terminalRecipients.has(String(recipient.status)))) {
    throw new RequestCommercialError("Cette invitation est clôturée ou la demande est déjà attribuée.");
  }
}

/** Validate both foreign keys and actors; never infer an invitation from an owner ID alone. */
export async function loadOpenRequestForQuote(db: LooseSupabaseClient, quote: Link, allowTerminalReplay = false) {
  if (record(quote.metadata).draft_preparation_pending) throw new RequestCommercialError("La préparation du devis doit être reprise avant modification ou envoi.");
  const { requestId, recipientId } = readRequestQuoteLink(quote);
  if (!requestId && !recipientId) return null;
  if (!requestId || !recipientId) throw new RequestCommercialError("Rattachement à la demande incomplet.");
  const { data: request, error } = await db.from("service_requests").select("*").eq("id", requestId).maybeSingle();
  if (error) throw new RequestCommercialError("Impossible de vérifier la demande.", 500);
  if (!request || request.owner_profile_id !== quote.owner_profile_id) throw new RequestCommercialError("Accès à la demande refusé.", 403);
  const { data: recipient, error: recipientError } = await db.from("service_request_recipients").select("*")
    .eq("id", recipientId).eq("service_request_id", requestId).eq("concierge_profile_id", quote.concierge_profile_id).maybeSingle();
  if (recipientError) throw new RequestCommercialError("Impossible de vérifier l'invitation.", 500);
  if (!recipient) throw new RequestCommercialError("Vous n'êtes pas destinataire de cette demande.", 403);
  if (!allowTerminalReplay) assertRequestOpen(request, recipient);
  return { request, recipient };
}

/** RFC 4122 UUID v5: the existing quote PK arbitrates concurrent draft creation. */
export function commercialObjectId(key: string) {
  const namespace = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");
  const bytes = createHash("sha1").update(namespace).update(`https://planetls.fr/commercial/${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const requestQuoteDraftId = (recipientId: string) => commercialObjectId(`request-recipient/${recipientId}/quote`);
