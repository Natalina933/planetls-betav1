"use client";

export const OWNER_SERVICE_REPLY_SEEN_EVENT = "owner-service-replies-seen";

const OWNER_SERVICE_REPLY_STORAGE_KEY = "owner-service-reply-signatures";
const OWNER_REPLY_STATUSES = new Set(["interested", "quoted", "declined"]);

type OwnerReplyRecipient = {
  id?: string | null;
  status?: string | null;
};

type OwnerReplyRequest = {
  id: string;
  recipients?: OwnerReplyRecipient[] | null;
};

export function isOwnerReplyStatus(status?: string | null) {
  return typeof status === "string" && OWNER_REPLY_STATUSES.has(status);
}

export function getOwnerReplySignature(request: OwnerReplyRequest) {
  const recipientTokens = (request.recipients ?? [])
    .filter((recipient) => isOwnerReplyStatus(recipient.status))
    .map((recipient) => `${recipient.id ?? "unknown"}:${recipient.status}`)
    .sort();

  return `${request.id}|${recipientTokens.join(",")}`;
}

export function getSeenOwnerReplySignatures() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const rawValue = window.localStorage.getItem(OWNER_SERVICE_REPLY_STORAGE_KEY);
    const parsed = rawValue ? (JSON.parse(rawValue) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markOwnerReplySignaturesAsSeen(signatures: string[]) {
  if (typeof window === "undefined" || signatures.length === 0) return;

  const nextSet = getSeenOwnerReplySignatures();
  signatures.forEach((signature) => {
    if (signature) nextSet.add(signature);
  });

  window.localStorage.setItem(OWNER_SERVICE_REPLY_STORAGE_KEY, JSON.stringify(Array.from(nextSet)));
  window.dispatchEvent(new Event(OWNER_SERVICE_REPLY_SEEN_EVENT));
}
