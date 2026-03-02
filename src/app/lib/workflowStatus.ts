export type WorkflowTone = "neutral" | "info" | "warning" | "success" | "danger";

export type WorkflowStatusKey =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "canceled"
  | "open"
  | "closed"
  | "read"
  | "resolved"
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "active"
  | "inactive"
  | "archived"
  | "low"
  | "normal"
  | "high"
  | "urgent";

type WorkflowMeta = {
  label: string;
  tone: WorkflowTone;
};

const WORKFLOW_STATUS_META: Partial<Record<WorkflowStatusKey, WorkflowMeta>> = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoye", tone: "info" },
  accepted: { label: "Accepte", tone: "success" },
  rejected: { label: "Refuse", tone: "danger" },
  issued: { label: "Emise", tone: "info" },
  partially_paid: { label: "Paiement partiel", tone: "warning" },
  paid: { label: "Reglee", tone: "success" },
  overdue: { label: "En retard", tone: "danger" },
  canceled: { label: "Annule", tone: "neutral" },
  open: { label: "Ouvert", tone: "info" },
  closed: { label: "Ferme", tone: "neutral" },
  read: { label: "Lu", tone: "neutral" },
  resolved: { label: "Traite", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  assigned: { label: "Assignee", tone: "info" },
  in_progress: { label: "En cours", tone: "warning" },
  completed: { label: "Terminee", tone: "success" },
  cancelled: { label: "Annulee", tone: "neutral" },
  active: { label: "Actif", tone: "success" },
  inactive: { label: "Inactif", tone: "neutral" },
  archived: { label: "Archive", tone: "neutral" },
  low: { label: "Basse", tone: "neutral" },
  normal: { label: "Normale", tone: "info" },
  high: { label: "Haute", tone: "warning" },
  urgent: { label: "Urgente", tone: "danger" },
};

export function getWorkflowStatusMeta(value: string | null | undefined): WorkflowMeta {
  const key = (value ?? "").toLowerCase() as WorkflowStatusKey;
  return WORKFLOW_STATUS_META[key] ?? { label: value || "-", tone: "neutral" };
}
