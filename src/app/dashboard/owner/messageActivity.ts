export type OwnerConversationActivity = {
  id: string;
  last_message_at: string | null;
  source?: string | null;
  source_reference?: string | null;
};

const STORAGE_KEY = "owner-conversation-last-seen-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadSeenMap() {
  if (!canUseStorage()) return {} as Record<string, string>;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function saveSeenMap(value: Record<string, string>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function isUnread(activity: OwnerConversationActivity, seenMap: Record<string, string>) {
  if (!activity.last_message_at) return false;
  const lastMessageTime = new Date(activity.last_message_at).getTime();
  if (Number.isNaN(lastMessageTime)) return false;

  const seenAt = seenMap[activity.id];
  if (!seenAt) return true;

  const seenTime = new Date(seenAt).getTime();
  if (Number.isNaN(seenTime)) return true;

  return lastMessageTime > seenTime;
}

export function markOwnerConversationSeen(conversationId: string, seenAt?: string | null) {
  if (!conversationId) return;
  const nextSeenMap = loadSeenMap();
  nextSeenMap[conversationId] = seenAt || new Date().toISOString();
  saveSeenMap(nextSeenMap);
}

export function getOwnerUnreadConversationCount(
  activities: OwnerConversationActivity[],
  predicate?: (activity: OwnerConversationActivity) => boolean,
) {
  const seenMap = loadSeenMap();
  return activities.filter((activity) => {
    if (predicate && !predicate(activity)) return false;
    return isUnread(activity, seenMap);
  }).length;
}

export function isOwnerConversationUnread(activity: OwnerConversationActivity) {
  return isUnread(activity, loadSeenMap());
}
