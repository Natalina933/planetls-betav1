export type WorkflowTone = "neutral" | "info" | "warning" | "success" | "danger" | "progress";

export type WorkflowStatusKey =
  | "draft"
  | "sent"
  | "in_review"
  | "accepted"
  | "rejected"
  | "quoted"
  | "interested"
  | "viewed"
  | "selected"
  | "not_selected"
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
  sent: { label: "Envoyé", tone: "progress" },
  in_review: { label: "En cours d'examen", tone: "progress" },
  accepted: { label: "Accepté", tone: "success" },
  rejected: { label: "Refusé", tone: "danger" },
  quoted: { label: "Devis préparé", tone: "progress" },
  interested: { label: "Intéressé", tone: "progress" },
  viewed: { label: "Consulté", tone: "neutral" },
  selected: { label: "Retenu", tone: "success" },
  not_selected: { label: "Non retenu", tone: "neutral" },
  issued: { label: "Émise", tone: "progress" },
  partially_paid: { label: "Paiement partiel", tone: "warning" },
  paid: { label: "Réglée", tone: "success" },
  overdue: { label: "En retard", tone: "danger" },
  canceled: { label: "Annulé", tone: "neutral" },
  open: { label: "Ouvert", tone: "info" },
  closed: { label: "Fermé", tone: "neutral" },
  read: { label: "Lu", tone: "neutral" },
  resolved: { label: "Traité", tone: "success" },
  pending: { label: "En attente", tone: "progress" },
  assigned: { label: "Assignée", tone: "progress" },
  in_progress: { label: "En cours", tone: "progress" },
  completed: { label: "Terminée", tone: "success" },
  cancelled: { label: "Annulée", tone: "neutral" },
  active: { label: "Actif", tone: "success" },
  inactive: { label: "Inactif", tone: "neutral" },
  archived: { label: "Archivé", tone: "neutral" },
  low: { label: "Basse", tone: "neutral" },
  normal: { label: "Normale", tone: "info" },
  high: { label: "Haute", tone: "warning" },
  urgent: { label: "Urgente", tone: "danger" },
};

export function getWorkflowStatusMeta(value: string | null | undefined): WorkflowMeta {
  const key = (value ?? "").toLowerCase() as WorkflowStatusKey;
  return WORKFLOW_STATUS_META[key] ?? { label: value || "-", tone: "neutral" };
}
