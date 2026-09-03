import { normalizeMissionStatus, type MissionStatus } from "./missionStatus.ts";

export type MaintenanceWorkflowStepId =
  | "incident"
  | "photo"
  | "artisan"
  | "quote"
  | "validation"
  | "mission"
  | "invoice"
  | "history";

export type MaintenanceTraceEvent = {
  id: string;
  label: string;
  at?: string | null;
  actor?: string | null;
  detail?: string | null;
};

export type MaintenanceIncidentInput = {
  id: string;
  title?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  missionId?: string | null;
  missionStatus?: string | null;
  propertyLabel?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  photos?: Array<{ id?: string; label?: string | null; url?: string | null; created_at?: string | null }>;
  artisan?: { id?: string | null; name?: string | null; status?: string | null } | null;
  quote?: { id?: string | null; number?: string | null; status?: string | null; amount?: number | null } | null;
  validation?: { status?: string | null; validatedAt?: string | null; validatedBy?: string | null } | null;
  invoice?: { id?: string | null; number?: string | null; status?: string | null; amount?: number | null } | null;
  history?: MaintenanceTraceEvent[];
};

export type MaintenanceWorkflowStep = {
  id: MaintenanceWorkflowStepId;
  label: string;
  done: boolean;
  current: boolean;
  detail: string;
};

export type MaintenanceWorkflow = {
  incidentId: string;
  missionId: string | null;
  traceabilityId: string;
  title: string;
  propertyLabel: string;
  priority: string;
  status: MissionStatus;
  completionPct: number;
  currentStepId: MaintenanceWorkflowStepId;
  missing: string[];
  steps: MaintenanceWorkflowStep[];
  history: MaintenanceTraceEvent[];
};

export type MaintenanceWorkflowDashboard = {
  total: number;
  urgent: number;
  waitingArtisan: number;
  waitingValidation: number;
  invoicing: number;
  completed: number;
  averageCompletionPct: number;
  workflows: MaintenanceWorkflow[];
};

const STEP_LABELS: Record<MaintenanceWorkflowStepId, string> = {
  incident: "Incident",
  photo: "Photo",
  artisan: "Artisan",
  quote: "Devis",
  validation: "Validation",
  mission: "Mission",
  invoice: "Facture",
  history: "Historique",
};

const STEP_ORDER = Object.keys(STEP_LABELS) as MaintenanceWorkflowStepId[];
const DONE_MISSION_STATUSES = new Set(["scheduled", "in_progress", "completed", "awaiting_owner_validation", "validated", "closed"]);
const DONE_QUOTE_STATUSES = new Set(["sent", "accepted", "validated", "approved"]);
const DONE_INVOICE_STATUSES = new Set(["draft", "sent", "issued", "paid", "partially_paid"]);

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function normalizePriority(value: string | null | undefined) {
  const priority = value?.trim().toLowerCase();
  if (priority === "urgent" || priority === "high") return priority;
  if (priority === "low") return "low";
  return "normal";
}

function uniqueHistory(input: MaintenanceIncidentInput) {
  const rawBase: Array<MaintenanceTraceEvent | null> = [
    input.createdAt
      ? { id: `${input.id}-created`, label: "Incident cree", at: input.createdAt, detail: input.title ?? null }
      : null,
    input.photos?.length
      ? { id: `${input.id}-photos`, label: "Photos ajoutees", at: input.photos[0]?.created_at ?? input.updatedAt ?? null, detail: `${input.photos.length} photo(s)` }
      : null,
    input.artisan?.name
      ? { id: `${input.id}-artisan`, label: "Artisan assigne", at: input.updatedAt ?? null, detail: input.artisan.name }
      : null,
    input.quote?.id
      ? { id: `${input.id}-quote`, label: "Devis rattache", at: input.updatedAt ?? null, detail: input.quote.number ?? input.quote.status ?? null }
      : null,
    input.invoice?.id
      ? { id: `${input.id}-invoice`, label: "Facture rattachee", at: input.updatedAt ?? null, detail: input.invoice.number ?? input.invoice.status ?? null }
      : null,
  ];
  const base = rawBase.filter((event): event is MaintenanceTraceEvent => Boolean(event));

  const seen = new Set<string>();
  return [...(input.history ?? []), ...base]
    .filter((event) => {
      const key = event.id || `${event.label}-${event.at ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const leftTime = left.at ? new Date(left.at).getTime() : 0;
      const rightTime = right.at ? new Date(right.at).getTime() : 0;
      return rightTime - leftTime;
    });
}

export function buildMaintenanceWorkflow(input: MaintenanceIncidentInput): MaintenanceWorkflow {
  const status = normalizeMissionStatus(input.missionStatus ?? input.status);
  const priority = normalizePriority(input.priority);
  const quoteStatus = input.quote?.status?.trim().toLowerCase() ?? "";
  const invoiceStatus = input.invoice?.status?.trim().toLowerCase() ?? "";
  const history = uniqueHistory(input);

  const doneByStep: Record<MaintenanceWorkflowStepId, boolean> = {
    incident: hasValue(input.id) && hasValue(input.title),
    photo: (input.photos?.length ?? 0) > 0,
    artisan: hasValue(input.artisan?.id) || hasValue(input.artisan?.name),
    quote: hasValue(input.quote?.id) || DONE_QUOTE_STATUSES.has(quoteStatus),
    validation:
      hasValue(input.validation?.validatedAt) ||
      input.validation?.status === "validated" ||
      ["accepted", "validated", "approved"].includes(quoteStatus),
    mission: hasValue(input.missionId) && DONE_MISSION_STATUSES.has(status),
    invoice: hasValue(input.invoice?.id) || DONE_INVOICE_STATUSES.has(invoiceStatus),
    history: history.length > 0,
  };

  const currentStepId = STEP_ORDER.find((step) => !doneByStep[step]) ?? "history";
  const steps = STEP_ORDER.map((step) => ({
    id: step,
    label: STEP_LABELS[step],
    done: doneByStep[step],
    current: step === currentStepId,
    detail: getStepDetail(step, input, doneByStep[step]),
  }));
  const missing = steps.filter((step) => !step.done).map((step) => step.label);

  return {
    incidentId: input.id,
    missionId: input.missionId ?? null,
    traceabilityId: `MT-${input.id.slice(0, 8).toUpperCase()}`,
    title: input.title?.trim() || "Incident maintenance",
    propertyLabel: input.propertyLabel?.trim() || "Logement a preciser",
    priority,
    status,
    completionPct: Math.round((steps.filter((step) => step.done).length / steps.length) * 100),
    currentStepId,
    missing,
    steps,
    history,
  };
}

export function buildMaintenanceWorkflowDashboard(input: { incidents?: MaintenanceIncidentInput[] }): MaintenanceWorkflowDashboard {
  const workflows = (input.incidents ?? []).map(buildMaintenanceWorkflow);
  const total = workflows.length;
  const averageCompletionPct =
    total > 0 ? Math.round(workflows.reduce((sum, workflow) => sum + workflow.completionPct, 0) / total) : 0;

  return {
    total,
    urgent: workflows.filter((workflow) => workflow.priority === "urgent" || workflow.priority === "high").length,
    waitingArtisan: workflows.filter((workflow) => workflow.currentStepId === "artisan").length,
    waitingValidation: workflows.filter((workflow) => workflow.currentStepId === "validation").length,
    invoicing: workflows.filter((workflow) => workflow.currentStepId === "invoice").length,
    completed: workflows.filter((workflow) => workflow.completionPct === 100).length,
    averageCompletionPct,
    workflows,
  };
}

function getStepDetail(step: MaintenanceWorkflowStepId, input: MaintenanceIncidentInput, done: boolean) {
  if (step === "incident") return done ? "Incident qualifie" : "Qualifier le probleme";
  if (step === "photo") return done ? `${input.photos?.length ?? 0} photo(s)` : "Ajouter une preuve visuelle";
  if (step === "artisan") return done ? input.artisan?.name || "Artisan assigne" : "Assigner un prestataire";
  if (step === "quote") return done ? input.quote?.number || input.quote?.status || "Devis rattache" : "Creer ou demander un devis";
  if (step === "validation") return done ? input.validation?.validatedBy || "Validation obtenue" : "Faire valider le devis";
  if (step === "mission") return done ? "Mission planifiee ou en cours" : "Creer et planifier la mission";
  if (step === "invoice") return done ? input.invoice?.number || input.invoice?.status || "Facture rattachee" : "Generer la facture";
  return done ? `${input.history?.length ?? 0} evenement(s)` : "Conserver une trace";
}




