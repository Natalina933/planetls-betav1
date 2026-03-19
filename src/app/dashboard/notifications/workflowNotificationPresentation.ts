type WorkflowNotificationTone = "default" | "warning" | "success";

export type WorkflowNotificationItem = {
  id: string;
  notification_type?: string | null;
  title?: string | null;
  body?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  read_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function formatWorkflowNotificationDate(value?: string | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getWorkflowNotificationTone(
  notificationType?: string | null,
  entityType?: string | null,
): WorkflowNotificationTone {
  if (notificationType?.includes("accepted") || entityType === "mission") return "success";
  if (
    notificationType?.includes("rejected") ||
    notificationType?.includes("expired") ||
    notificationType?.includes("canceled")
  ) {
    return "warning";
  }
  return "default";
}

export function getWorkflowNotificationMeta(item: WorkflowNotificationItem) {
  const type = item.notification_type ?? "";

  if (type === "quote_received") return "Devis";
  if (type === "quote_accepted" || type === "quote_accepted_confirmation") return "Devis accepte";
  if (type === "quote_rejected") return "Devis refuse";
  if (type === "mission_created") return "Mission";
  if (type === "quote_expired") return "Devis expire";
  if (type === "quote_canceled") return "Devis annule";
  if (item.entity_type === "mission") return "Mission";
  if (item.entity_type === "quote") return "Devis";
  return "Notification";
}

export function getWorkflowNotificationHref(item: WorkflowNotificationItem, fallbackHref: string) {
  return item.action_url || fallbackHref;
}
