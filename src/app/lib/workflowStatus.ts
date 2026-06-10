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
  | "cancelled"
  | "open"
  | "closed"
  | "read"
  | "resolved"
  | "pending"
  | "quote_pending"
  | "invoice_pending"
  | "assigned"
  | "to_schedule"
  | "date_requested"
  | "date_proposed"
  | "date_confirmed"
  | "confirmed"
  | "scheduled"
  | "in_progress"
  | "completed"
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
  accepted: { label: "Acceptée", tone: "success" },
  rejected: { label: "Refusée", tone: "danger" },
  quoted: { label: "Devis préparé", tone: "progress" },
  interested: { label: "Intéressé", tone: "progress" },
  viewed: { label: "Consulté", tone: "neutral" },
  selected: { label: "Retenu", tone: "success" },
  not_selected: { label: "Non retenu", tone: "neutral" },
  issued: { label: "Émise", tone: "progress" },
  partially_paid: { label: "Paiement partiel", tone: "warning" },
  paid: { label: "Réglée", tone: "success" },
  overdue: { label: "En retard", tone: "danger" },
  canceled: { label: "Annulée", tone: "neutral" },
  cancelled: { label: "Annulée", tone: "neutral" },
  open: { label: "Ouvert", tone: "info" },
  closed: { label: "Fermé", tone: "neutral" },
  read: { label: "Lu", tone: "neutral" },
  resolved: { label: "Traité", tone: "success" },
  pending: { label: "En attente", tone: "progress" },
  quote_pending: { label: "Devis en attente", tone: "warning" },
  invoice_pending: { label: "Facture en attente", tone: "warning" },
  assigned: { label: "Assignée", tone: "progress" },
  to_schedule: { label: "À planifier", tone: "warning" },
  date_requested: { label: "Date demandée", tone: "warning" },
  date_proposed: { label: "Date proposée", tone: "warning" },
  date_confirmed: { label: "Date confirmée", tone: "success" },
  confirmed: { label: "Confirmée", tone: "success" },
  scheduled: { label: "Planifiée", tone: "info" },
  in_progress: { label: "En cours", tone: "progress" },
  completed: { label: "Terminée", tone: "success" },
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
  const fallbackLabels: Record<string, WorkflowMeta> = {
    planifiee: { label: "Planifiée", tone: "info" },
    planifie: { label: "Planifié", tone: "info" },
    confirmee: { label: "Confirmée", tone: "success" },
    confirme: { label: "Confirmé", tone: "success" },
    terminee: { label: "Terminée", tone: "success" },
    termine: { label: "Terminé", tone: "success" },
    annulee: { label: "Annulée", tone: "neutral" },
    annule: { label: "Annulé", tone: "neutral" },
    assignee: { label: "Assignée", tone: "progress" },
    prepare: { label: "Préparé", tone: "success" },
    prete: { label: "Prête", tone: "success" },
  };

  return WORKFLOW_STATUS_META[key] ?? fallbackLabels[key] ?? { label: value || "-", tone: "neutral" };
}
