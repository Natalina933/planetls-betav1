export type MissionHealthTone = "positive" | "warning" | "danger";

export type MissionHealthStep = { id: string; label: string; ok: boolean };

type InvoiceHealthInput = {
  status?: string | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  balance_amount?: number | null;
  due_date?: string | null;
  paid_at?: string | null;
};

type MissionHealthInput = {
  status?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  completed_at?: string | null;
  hasRequest: boolean;
  quoteCount: number;
  invoices: InvoiceHealthInput[];
  assignmentCount: number;
  openMaintenanceCount: number;
  now?: string;
};

const CLOSED_MISSION_STATUSES = new Set(["completed", "closed", "cancelled", "canceled"]);
const ACTIVE_MISSION_STATUSES = new Set(["assigned", "scheduled", "in_progress", "completed", "closed"]);
const OPEN_INVOICE_STATUSES = new Set(["issued", "partially_paid", "overdue"]);

function validDate(value?: string | null) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function evaluateMissionHealth(input: MissionHealthInput) {
  const status = input.status?.trim().toLowerCase() ?? "";
  const isCancelled = status === "cancelled" || status === "canceled";
  const isCompleted = Boolean(input.completed_at) || status === "completed" || status === "closed";
  const requiresOperations = ACTIVE_MISSION_STATUSES.has(status) || Boolean(input.scheduled_start) || isCompleted;
  const start = validDate(input.scheduled_start);
  const end = validDate(input.scheduled_end);
  const planningCoherent = !requiresOperations || (start !== null && (end === null || end > start));
  const hasAssignment = !requiresOperations || input.assignmentCount > 0;
  const paidInvoice = input.invoices.some((invoice) => {
    const total = Number(invoice.total_amount ?? 0);
    const paid = Number(invoice.paid_amount ?? 0);
    const balance = Number(invoice.balance_amount ?? Math.max(0, total - paid));
    return invoice.status === "paid" && paid >= total && balance <= 0 && Boolean(invoice.paid_at);
  });
  const now = validDate(input.now) ?? Date.now();
  const hasOverdueInvoice = input.invoices.some((invoice) => {
    const due = validDate(invoice.due_date);
    return due !== null && due < now && OPEN_INVOICE_STATUSES.has(invoice.status ?? "");
  });
  const invoiceCoherent = input.invoices.every((invoice) => {
    const total = Number(invoice.total_amount ?? 0);
    const paid = Number(invoice.paid_amount ?? 0);
    const balance = Number(invoice.balance_amount ?? Math.max(0, total - paid));
    if (total < 0 || paid < 0 || balance < 0 || paid > total) return false;
    if (invoice.status === "paid") return paid >= total && balance <= 0 && Boolean(invoice.paid_at);
    return true;
  });
  const steps: MissionHealthStep[] = [
    { id: "request", label: "Demande liée", ok: input.hasRequest },
    { id: "quote", label: "Devis lié", ok: input.quoteCount > 0 },
    { id: "assignment", label: "Affectation opérationnelle", ok: hasAssignment },
    { id: "planning", label: "Planning cohérent", ok: planningCoherent },
    { id: "execution", label: "Exécution terminée", ok: isCancelled || !CLOSED_MISSION_STATUSES.has(status) || Boolean(input.completed_at) },
    { id: "invoice", label: "Facture cohérente", ok: invoiceCoherent && (!isCompleted || input.invoices.length > 0) },
    { id: "payment", label: "Paiement à jour", ok: !hasOverdueInvoice && (!isCompleted || paidInvoice) },
    { id: "maintenance", label: "Maintenance résolue", ok: !isCompleted || input.openMaintenanceCount === 0 },
  ];
  const failed = new Set(steps.filter((step) => !step.ok).map((step) => step.id));
  const danger = ["assignment", "planning", "invoice", "payment", "maintenance"].some((id) => failed.has(id));
  const tone: MissionHealthTone = danger ? "danger" : failed.size > 0 ? "warning" : "positive";
  return { steps, issueCount: failed.size, tone, paidInvoice, hasOverdueInvoice };
}
