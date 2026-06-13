"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FilePlus2,
  FileText,
  Handshake,
  KeyRound,
  MessageSquareText,
  PackageCheck,
  ReceiptText,
  Send,
  Play,
  Shirt,
  Sparkles,
  Trees,
  Wrench,
  XCircle,
} from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { WorkflowTimeline, type WorkflowTimelineStep } from "@/features/service-requests";
import { getInvoicePaymentSummary } from "@/app/lib/invoiceStatus";
import {
  getMissionPriorityLabel,
  getMissionStatusLabel,
  normalizeMissionStatus,
  type MissionPriority,
  type MissionStatus,
} from "@/app/lib/missionStatus";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import OwnerMissionPage from "./OwnerMissionPage";
import type { OwnerMissionItem, OwnerMissionKpi, OwnerMissionStatus } from "./ownerMissionTypes";
import styles from "./MissionDetailPage.module.scss";

type Persona = "owner" | "concierge";

type ProfileSummary = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  company_name?: string | null;
  city?: string | null;
  role?: string | null;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type ProofLink = {
  id?: string;
  label?: string;
  url?: string | null;
  kind?: string;
  storage_bucket?: string;
  storage_path?: string;
  created_at?: string;
};

type MissionDetail = {
  mission: {
    id: string;
    title: string | null;
    description: string | null;
    status: MissionStatus;
    priority: MissionPriority;
    amount: number | null;
    currency: string | null;
    scheduled_start: string | null;
    scheduled_end: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  };
  participants: {
    owner?: ProfileSummary | null;
    concierge?: ProfileSummary | null;
  };
  property?: {
    id: string | number;
    nom_logement?: string | null;
    ville?: string | null;
    adresse?: string | null;
  } | null;
  events: Array<{ id: string; event_type: string; created_at: string; payload?: Record<string, unknown> | null }>;
  conversations: Array<{
    id: string;
    subject: string | null;
    last_message_preview: string | null;
    last_message_at: string | null;
  }>;
  quotes: Array<{ id: string; quote_number: string | null; status: string | null; total_amount: number | null }>;
  invoices: Array<{
    id: string;
    invoice_number: string | null;
    status: string | null;
    total_amount?: number | null;
    paid_amount?: number | null;
    balance_amount: number | null;
    currency?: string | null;
    due_date?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
  provider_interventions: Array<{
    id: string;
    provider_profile_id: string | null;
    title: string;
    status: string | null;
    priority: string | null;
    scheduled_start: string | null;
    budget_amount: number | null;
  }>;
  providers: ProfileSummary[];
  evidence: {
    proof_links: ProofLink[];
    checklist: ChecklistItem[];
    signature?: unknown;
  };
  conversation_id?: string | null;
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "arrival_confirmed", label: "Horaire confirmé", done: false },
  { id: "access_ready", label: "Accès et clés vérifiés", done: false },
  { id: "photos_added", label: "Photos ou preuves ajoutées", done: false },
  { id: "owner_informed", label: "Propriétaire informé", done: false },
];

function profileName(profile?: ProfileSummary | null) {
  if (!profile) return "Non renseigné";
  return (
    profile.company_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username ||
    "Contact"
  );
}

const SERVICE_LABELS: Record<string, string> = {
  check_in: "Arrivée voyageur",
  checkin: "Arrivée voyageur",
  check_out: "Départ voyageur",
  checkout: "Départ voyageur",
  cleaning: "Ménage",
  menage: "Ménage",
  ménage: "Ménage",
  maintenance: "Maintenance",
  inspection: "Contrôle logement",
  linen: "Linge",
  laundry: "Linge",
  restocking: "Réapprovisionnement",
  terrace: "Terrasse",
};

function normalizeServiceLabel(value: unknown) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  return SERVICE_LABELS[key] || raw.replace(/_/g, " ");
}

function collectServiceLabelsFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return [];
  const values = [
    metadata.requested_services,
    metadata.services,
    metadata.service_labels,
    metadata.service_label,
    metadata.service_type,
    metadata.mission_type,
  ];

  return values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(normalizeServiceLabel).filter((entry): entry is string => Boolean(entry));
    const label = normalizeServiceLabel(value);
    return label ? [label] : [];
  });
}

function buildMissionChecklist(detail: MissionDetail) {
  const baseChecklist =
    Array.isArray(detail.evidence?.checklist) && detail.evidence.checklist.length > 0
      ? detail.evidence.checklist
      : DEFAULT_CHECKLIST;
  const serviceLabels = Array.from(new Set(collectServiceLabelsFromMetadata(detail.mission.metadata)));
  const serviceChecklist = serviceLabels.map((service) => ({
    id: `service_${service.toLowerCase().replace(/[^a-z0-9]+/gi, "_")}`,
    label: `${service} contrôlé`,
    done: false,
  }));
  const existingIds = new Set(baseChecklist.map((item) => item.id));

  return [...baseChecklist, ...serviceChecklist.filter((item) => !existingIds.has(item.id))];
}

function cleanFrenchText(value: string) {
  return value
    .replaceAll("Ã€", "À")
    .replaceAll("Ã‚", "Â")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã¨", "è")
    .replaceAll("Ãª", "ê")
    .replaceAll("Ã¢", "â")
    .replaceAll("Ã´", "ô")
    .replaceAll("Ã®", "î")
    .replaceAll("Ã¯", "ï")
    .replaceAll("Ã§", "ç")
    .replaceAll("Â·", "·");
}

function ServiceIcon({ label }: { label: string }) {
  const normalized = cleanFrenchText(label).toLowerCase();
  if (normalized.includes("check") || normalized.includes("arriv") || normalized.includes("départ")) {
    return <KeyRound size={17} aria-hidden="true" />;
  }
  if (normalized.includes("ménage") || normalized.includes("menage")) {
    return <Sparkles size={17} aria-hidden="true" />;
  }
  if (normalized.includes("linge")) {
    return <Shirt size={17} aria-hidden="true" />;
  }
  if (normalized.includes("terrasse")) {
    return <Trees size={17} aria-hidden="true" />;
  }
  if (normalized.includes("maintenance") || normalized.includes("réparation")) {
    return <Wrench size={17} aria-hidden="true" />;
  }
  if (normalized.includes("contrôle") || normalized.includes("controle")) {
    return <ClipboardCheck size={17} aria-hidden="true" />;
  }
  return <PackageCheck size={17} aria-hidden="true" />;
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function statusBadgeClass(status: MissionStatus) {
  if (["completed", "validated", "closed"].includes(status)) return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === "canceled" || status === "assigned" || status === "in_progress") {
    return `${styles.badge} ${styles.badgeWarning}`;
  }
  return styles.badge;
}

function getEventLabel(eventType: string) {
  switch (eventType) {
    case "created":
      return "Mission créée";
    case "accepted":
      return "Mission acceptée";
    case "started":
      return "Mission démarrée";
    case "completed":
      return "Mission terminée";
    case "canceled":
      return "Mission annulée";
    case "updated":
      return "Mission mise à jour";
    default:
      return eventType;
  }
}

function getEventDetail(event: { payload?: Record<string, unknown> | null }) {
  const payload = event.payload && typeof event.payload === "object" ? event.payload : {};
  const message = payload.message || payload.fallback_reason;
  if (typeof message === "string" && message.trim()) return cleanFrenchText(message);
  const fields = Array.isArray(payload.updated_fields) ? payload.updated_fields.filter((field): field is string => typeof field === "string") : [];
  if (fields.length > 0) return `Champs modifiés : ${fields.join(", ")}`;
  if (payload.next_status === "validated") return "Réalisation confirmée par le propriétaire.";
  if (payload.next_status === "canceled") return "Mission annulée et concierge prévenue.";
  return "Action enregistrée sur la mission.";
}

function getOwnerEventLabel(event: { event_type: string; payload?: Record<string, unknown> | null }) {
  const payload = event.payload && typeof event.payload === "object" ? event.payload : {};
  if (Array.isArray(payload.updated_fields)) return "Mission modifiée";
  if (payload.next_status === "validated" || payload.owner_validation_status === "validated") return "Réalisation confirmée";
  if (payload.next_status === "canceled") return "Mission annulée";
  return getEventLabel(event.event_type);
}

function getMissionWorkflowSteps(status: MissionStatus): WorkflowTimelineStep[] {
  const currentStatus = normalizeMissionStatus(status);
  const doneStatuses = ["awaiting_owner_validation", "validated", "completed", "closed"];
  const planned = ["date_confirmed", "scheduled", "accepted", "in_progress", ...doneStatuses].includes(currentStatus);
  const active = ["accepted", "in_progress", ...doneStatuses].includes(currentStatus);
  const completed = doneStatuses.includes(currentStatus);
  const canceled = currentStatus === "canceled";

  return [
    {
      label: "Mission créée",
      detail: "Issue du devis accepté",
      state: canceled ? "done" : "done",
      Icon: Wrench,
    },
    {
      label: "Date à cadrer",
      detail: planned ? "Créneau confirmé" : "Créneau à confirmer",
      state: planned ? "done" : "active",
      Icon: CalendarClock,
    },
    {
      label: "Exécution",
      detail: active ? "Mission opérationnelle" : "En attente planning",
      state: active ? (completed ? "done" : "active") : "todo",
      Icon: Play,
    },
    {
      label: canceled ? "Annulée" : "Terminée",
      detail: canceled ? "Mission annulée" : "Clôture terrain",
      state: completed || canceled ? "done" : "todo",
      Icon: canceled ? XCircle : CheckCircle2,
    },
  ];
}

function getOwnerRequestWorkflowSteps(input: {
  hasRequest: boolean;
  hasQuote: boolean;
  quoteAccepted: boolean;
  hasMission: boolean;
}): WorkflowTimelineStep[] {
  const quoteSent = input.hasQuote;
  const quoteAccepted = input.quoteAccepted;

  return [
    {
      label: "Demande envoyée",
      detail: input.hasRequest ? "Votre besoin est transmis" : "À créer",
      state: input.hasRequest ? "done" : "todo",
      Icon: Send,
    },
    {
      label: "Devis reçu",
      detail: quoteSent ? "La conciergerie a répondu" : "En attente",
      state: quoteSent ? "done" : input.hasRequest ? "active" : "todo",
      Icon: FileText,
    },
    {
      label: "Devis accepté",
      detail: quoteAccepted ? "Services validés" : "Décision attendue",
      state: quoteAccepted ? "done" : quoteSent ? "active" : "todo",
      Icon: Handshake,
    },
    {
      label: "Mission créée",
      detail: input.hasMission ? "Visible dans le suivi" : "Après acceptation",
      state: input.hasMission ? "done" : quoteAccepted ? "active" : "todo",
      Icon: ClipboardList,
    },
  ];
}

function getOwnerMissionWorkflowSteps(input: {
  status: MissionStatus;
  hasPlanningDate: boolean;
  hasConversation: boolean;
  hasChecklistDone: boolean;
  hasProofs: boolean;
  ownerValidated: boolean;
  hasPaidInvoice: boolean;
}): WorkflowTimelineStep[] {
  const status = normalizeMissionStatus(input.status);
  const canceled = status === "canceled";
  const activeStatuses = ["accepted", "in_progress", "awaiting_owner_validation", "completed", "validated", "closed"];
  const completedStatuses = ["awaiting_owner_validation", "completed", "validated", "closed"];
  const missionActive = activeStatuses.includes(status);
  const missionCompleted = completedStatuses.includes(status);

  return [
    {
      label: "Planifiée",
      detail: input.hasPlanningDate ? "Date renseignée" : "Date à confirmer",
      state: input.hasPlanningDate ? "done" : canceled ? "todo" : "active",
      Icon: CalendarClock,
    },
    {
      label: "Concierge prévenue",
      detail: input.hasConversation ? "Message envoyé" : "Aucun message lié",
      state: input.hasConversation ? "done" : input.hasPlanningDate ? "active" : "todo",
      Icon: MessageSquareText,
    },
    {
      label: "En cours",
      detail: missionActive ? "Prise en charge" : "À démarrer",
      state: missionActive ? "done" : input.hasConversation ? "active" : "todo",
      Icon: Play,
    },
    {
      label: "Checklist",
      detail: input.hasChecklistDone ? "Contrôles cochés" : "À compléter",
      state: input.hasChecklistDone ? "done" : missionActive ? "active" : "todo",
      Icon: ClipboardCheck,
    },
    {
      label: "Preuves",
      detail: input.hasProofs ? "Photos ou documents ajoutés" : "En attente",
      state: input.hasProofs ? "done" : input.hasChecklistDone ? "active" : "todo",
      Icon: FilePlus2,
    },
    {
      label: "Validation propriétaire",
      detail: input.ownerValidated ? "Réalisation confirmée" : missionCompleted ? "À vérifier" : "Après réalisation",
      state: input.ownerValidated ? "done" : missionCompleted ? "active" : "todo",
      Icon: CheckCircle2,
    },
    {
      label: "Règlement",
      detail: input.hasPaidInvoice ? "Paiement enregistré" : "À suivre",
      state: input.hasPaidInvoice ? "done" : input.ownerValidated ? "active" : "todo",
      Icon: ReceiptText,
    },
  ];
}

function getProofHref(missionId: string, proof: ProofLink) {
  if (proof.storage_path && proof.id) {
    return `/api/missions/${encodeURIComponent(missionId)}/files/${encodeURIComponent(proof.id)}/download`;
  }
  return proof.url || null;
}

function getOwnerMissionType(value: string | null | undefined): OwnerMissionItem["type"] {
  const key = (value || "").toLowerCase();
  if (key.includes("clean") || key.includes("ménage") || key.includes("menage")) return "menage";
  if (key.includes("maintenance") || key.includes("serrure") || key.includes("plomberie") || key.includes("réparation")) return "maintenance";
  if (key.includes("check_in") || key.includes("check-in") || key.includes("arrivée") || key.includes("arrivee")) return "checkin";
  if (key.includes("check_out") || key.includes("check-out") || key.includes("départ") || key.includes("depart")) return "checkout";
  return "autre";
}

function getOwnerMissionStatus(status: string | null | undefined, scheduledStart: string | null | undefined): OwnerMissionStatus {
  const normalized = normalizeMissionStatus(status);
  const isPast = scheduledStart ? new Date(scheduledStart).getTime() < Date.now() : false;
  const isOpen = !["completed", "validated", "closed", "canceled"].includes(normalized);

  if (isPast && isOpen) return "en_retard";
  if (["awaiting_owner_validation", "date_requested", "date_proposed", "to_schedule"].includes(normalized)) return "en_attente_validation";
  if (["in_progress", "accepted", "assigned", "scheduled", "date_confirmed"].includes(normalized)) return "en_cours";
  if (["completed", "validated", "closed"].includes(normalized)) return "termine";
  return "a_faire";
}

function buildOwnerMissionKpis(missions: OwnerMissionItem[]): OwnerMissionKpi[] {
  const inProgress = missions.filter((mission) => mission.status === "en_cours").length;
  const waitingValidation = missions.filter((mission) => mission.status === "en_attente_validation").length;
  const late = missions.filter((mission) => mission.status === "en_retard").length;
  const completed = missions.filter((mission) => mission.status === "termine").length;
  const criticalOpen = missions.filter((mission) => mission.isCriticalForNextStay && mission.status !== "termine").length;

  return [
    {
      id: "en-cours",
      label: "Missions en cours",
      value: inProgress,
      helperText: "Interventions suivies actuellement",
      tone: "neutral",
    },
    {
      id: "a-valider",
      label: "Missions à valider",
      value: waitingValidation,
      helperText: waitingValidation > 0 ? "Votre accord est attendu" : "Rien à valider",
      tone: waitingValidation > 0 ? "warning" : "positive",
    },
    {
      id: "en-retard",
      label: "Missions en retard",
      value: late,
      helperText: late > 0 ? "À traiter rapidement" : "Aucun retard",
      tone: late > 0 ? "warning" : "positive",
    },
    {
      id: "terminees",
      label: "Missions terminées",
      value: completed,
      helperText: "Clôturées ou validées",
      tone: "positive",
    },
    {
      id: "voyageurs",
      label: "Prêt voyageurs",
      value: criticalOpen === 0 ? 1 : 0,
      helperText: criticalOpen === 0 ? "Aucun blocage critique" : `${criticalOpen} point(s) à traiter`,
      tone: criticalOpen === 0 ? "positive" : "warning",
    },
  ];
}

function getOwnerMissionPriorities(missions: OwnerMissionItem[]) {
  return missions
    .filter(
      (mission) =>
        mission.status === "en_retard" ||
        mission.status === "en_attente_validation" ||
        mission.isCriticalForNextStay,
    )
    .sort((a, b) => {
      const score = (mission: OwnerMissionItem) => {
        if (mission.status === "en_retard") return 0;
        if (mission.status === "en_attente_validation") return 1;
        if (mission.isCriticalForNextStay) return 2;
        return 3;
      };
      return score(a) - score(b) || new Date(a.date).getTime() - new Date(b.date).getTime();
    });
}

export default function MissionDetailClient({ missionId, persona }: { missionId: string; persona: Persona }) {
  const [detail, setDetail] = useState<MissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    scheduled_start: "",
    scheduled_end: "",
    amount: "",
  });
  const [cancelReason, setCancelReason] = useState("");
  const [proofForm, setProofForm] = useState({ label: "", url: "", kind: "photo" });
  const [fileForm, setFileForm] = useState({ label: "", kind: "photo" });
  const [providerForm, setProviderForm] = useState({
    provider_profile_id: "",
    title: "",
    service_label: "",
    budget_amount: "",
  });
  const [signature, setSignature] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/missions/${missionId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de charger la mission.");
      setDetail(payload);
      setEditForm({
        title: payload.mission?.title ?? "",
        description: payload.mission?.description ?? "",
        priority: payload.mission?.priority ?? "normal",
        scheduled_start: toDatetimeLocal(payload.mission?.scheduled_start ?? null),
        scheduled_end: toDatetimeLocal(payload.mission?.scheduled_end ?? null),
        amount: typeof payload.mission?.amount === "number" ? String(payload.mission.amount) : "",
      });
      setChecklist(buildMissionChecklist(payload));
      setProviderForm((current) => ({
        ...current,
        provider_profile_id: current.provider_profile_id || payload.providers?.[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la mission.");
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const mission = detail?.mission ?? null;
  const currentStatus = normalizeMissionStatus(mission?.status);
  const missionMetadata =
    mission?.metadata && typeof mission.metadata === "object" && !Array.isArray(mission.metadata)
      ? mission.metadata
      : {};
  const ownerAlreadyValidated = Boolean(missionMetadata.validated_by_owner_at);
  const missionConciergeName = profileName(detail?.participants.concierge);
  const messageHref = `/dashboard/${persona}/messages${detail?.conversation_id ? `?conversation=${detail.conversation_id}` : `?mission=${missionId}`}`;
  const canConciergeAct = persona === "concierge";
  const canShowAccept = canConciergeAct && ["draft", "assigned"].includes(currentStatus);
  const canShowStart = canConciergeAct && ["assigned", "accepted"].includes(currentStatus);
  const canShowComplete = canConciergeAct && currentStatus === "in_progress";
  const canShowOwnerValidate =
    persona === "owner" && !ownerAlreadyValidated && ["awaiting_owner_validation", "completed"].includes(currentStatus);
  const canShowCancel = !ownerAlreadyValidated && !["validated", "closed", "canceled"].includes(currentStatus);
  const hasPlanningDate = Boolean(editForm.scheduled_start || mission?.scheduled_start);
  const canRequestDate = ["to_schedule"].includes(currentStatus);
  const canProposeDate = ["to_schedule", "date_requested"].includes(currentStatus);
  const canConfirmDate = ["to_schedule", "date_requested", "date_proposed"].includes(currentStatus);
  const canScheduleDate = ["date_confirmed"].includes(currentStatus);
  const latestQuote = detail?.quotes[0] ?? null;
  const bookingSource =
    typeof missionMetadata.booking_source === "string"
      ? missionMetadata.booking_source
      : typeof missionMetadata.source_plateforme === "string"
        ? missionMetadata.source_plateforme
        : typeof missionMetadata.platform === "string"
          ? missionMetadata.platform
          : "";
  const guestName =
    typeof missionMetadata.guest_name === "string"
      ? missionMetadata.guest_name
      : typeof missionMetadata.traveler_name === "string"
        ? missionMetadata.traveler_name
        : "";
  const guestCount =
    typeof missionMetadata.guest_count === "number"
      ? missionMetadata.guest_count
      : typeof missionMetadata.guests === "number"
        ? missionMetadata.guests
        : null;
  const checkInDate =
    typeof missionMetadata.check_in_date === "string"
      ? missionMetadata.check_in_date
      : typeof missionMetadata.checkin_date === "string"
        ? missionMetadata.checkin_date
        : "";
  const checkOutDate =
    typeof missionMetadata.check_out_date === "string"
      ? missionMetadata.check_out_date
      : typeof missionMetadata.checkout_date === "string"
        ? missionMetadata.checkout_date
        : "";
  const bookingChanged = Boolean(missionMetadata.booking_changed || missionMetadata.bookingChanged);
  const paymentStatus =
    typeof missionMetadata.payment_status === "string"
      ? missionMetadata.payment_status
      : detail?.invoices.some((invoice) => invoice.status === "paid")
        ? "paye"
        : detail?.invoices.length
          ? "en_attente"
          : "a_payer";
  const requestWorkflowSteps = getOwnerRequestWorkflowSteps({
    hasRequest: Boolean(missionMetadata.service_request_id || latestQuote?.id || mission?.id),
    hasQuote: Boolean(latestQuote?.id),
    quoteAccepted: latestQuote?.status === "accepted" || Boolean(mission?.id),
    hasMission: Boolean(mission?.id),
  });
  const missionWorkflowSteps = getOwnerMissionWorkflowSteps({
    status: currentStatus,
    hasPlanningDate: Boolean(mission?.scheduled_start || mission?.scheduled_end),
    hasConversation: Boolean(detail?.conversation_id || detail?.conversations.length),
    hasChecklistDone: checklist.some((item) => item.done),
    hasProofs: Boolean(detail?.evidence.proof_links.length),
    ownerValidated: ownerAlreadyValidated || currentStatus === "validated" || currentStatus === "closed",
    hasPaidInvoice: paymentStatus === "paye",
  });

  async function patchMission(payload: Record<string, unknown>, message: string) {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/missions/${missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Impossible de mettre à jour la mission.");
      setDetail(result);
      setSuccess(message);
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour la mission.");
    } finally {
      setSaving(false);
    }
  }

  async function patchPlanning(action: "request_date" | "propose_date" | "confirm_date" | "schedule", message: string) {
    await patchMission(
      {
        action,
        scheduled_start: fromDatetimeLocal(editForm.scheduled_start),
        scheduled_end: fromDatetimeLocal(editForm.scheduled_end),
      },
      message,
    );
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await patchMission(
      {
        action: "update",
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        scheduled_start: fromDatetimeLocal(editForm.scheduled_start),
        scheduled_end: fromDatetimeLocal(editForm.scheduled_end),
        ...(canConciergeAct && editForm.amount ? { amount: Number(editForm.amount) } : {}),
      },
      "Mission mise à jour.",
    );
  }

  async function submitProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await patchMission({ action: "add_proof", ...proofForm }, "Preuve ajoutée à la mission.");
    setProofForm({ label: "", url: "", kind: "photo" });
  }

  async function submitFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("Sélectionnez un fichier.");
      return;
    }
    try {
      setFileUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("label", fileForm.label || file.name);
      formData.append("kind", fileForm.kind);
      const response = await fetch(`/api/missions/${missionId}/files`, { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Upload impossible.");
      setSuccess("Fichier ajouté aux preuves mission.");
      setFileForm({ label: "", kind: "photo" });
      if (input) input.value = "";
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload impossible.");
    } finally {
      setFileUploading(false);
    }
  }

  async function createProviderIntervention(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/missions/${missionId}/provider-interventions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_profile_id: providerForm.provider_profile_id,
          title: providerForm.title || undefined,
          service_label: providerForm.service_label || undefined,
          budget_amount: providerForm.budget_amount ? Number(providerForm.budget_amount) : undefined,
          priority: mission?.priority ?? "normal",
          scheduled_start: mission?.scheduled_start,
          scheduled_end: mission?.scheduled_end,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de créer l'intervention artisan.");
      setSuccess("Intervention artisan créée et liée à la mission.");
      setProviderForm((current) => ({ ...current, title: "", service_label: "", budget_amount: "" }));
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer l'intervention artisan.");
    } finally {
      setSaving(false);
    }
  }

  async function saveChecklist() {
    await patchMission({ action: "update_checklist", checklist }, "Checklist mission mise à jour.");
  }

  async function signMission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await patchMission({ action: "signoff", signature }, "Validation ajoutée à la mission.");
    setSignature("");
  }

  if (loading && !detail) return <p>Chargement de la mission...</p>;
  if (!mission || !detail) {
    return <p className={`${styles.message} ${styles.messageError}`}>{error || "Mission introuvable."}</p>;
  }

  const firstInvoicePayment = detail.invoices[0]
    ? getInvoicePaymentSummary({
        invoiceStatus: detail.invoices[0].status,
        totalAmount: detail.invoices[0].total_amount,
        paidAmount: detail.invoices[0].paid_amount,
        balanceAmount: detail.invoices[0].balance_amount,
        dueDate: detail.invoices[0].due_date,
        metadata: detail.invoices[0].metadata,
      })
    : null;

  const relationFacts = [
    { label: "Propriétaire", value: profileName(detail.participants.owner) },
    { label: "Conciergerie", value: profileName(detail.participants.concierge) },
    { label: "Logement", value: detail.property?.nom_logement || detail.property?.ville || "Non rattaché" },
    { label: "Budget", value: formatEuroAmountLabel(mission.amount, "-") },
    ...(firstInvoicePayment ? [{ label: "Paiement", value: firstInvoicePayment.workflow.nextActionOwner }] : []),
  ];

  const ownerMissionItems: OwnerMissionItem[] = [
    {
      id: mission.id,
      propertyName: detail.property?.nom_logement || "Logement à préciser",
      city: detail.property?.ville || undefined,
      type: getOwnerMissionType(mission.title || mission.description),
      date: mission.scheduled_start || mission.created_at,
      timeSlot:
        mission.scheduled_start && mission.scheduled_end
          ? `${formatDateValue(mission.scheduled_start, { hour: "2-digit", minute: "2-digit" })} - ${formatDateValue(mission.scheduled_end, { hour: "2-digit", minute: "2-digit" })}`
          : undefined,
      status: getOwnerMissionStatus(currentStatus, mission.scheduled_start),
      assignedTo: missionConciergeName,
      isCriticalForNextStay:
        ["urgent", "high"].includes(mission.priority) ||
        ["to_schedule", "date_requested", "date_proposed", "awaiting_owner_validation"].includes(currentStatus),
      notes: mission.description || undefined,
    },
    ...detail.provider_interventions.map((intervention) => ({
      id: intervention.id,
      propertyName: detail.property?.nom_logement || "Logement à préciser",
      city: detail.property?.ville || undefined,
      type: getOwnerMissionType(intervention.title),
      date: intervention.scheduled_start || mission.scheduled_start || mission.created_at,
      status: getOwnerMissionStatus(intervention.status, intervention.scheduled_start || mission.scheduled_start),
      assignedTo:
        profileName(detail.providers.find((provider) => provider.id === intervention.provider_profile_id)) ||
        "Prestataire à préciser",
      isCriticalForNextStay: intervention.priority === "urgent" || intervention.priority === "high",
      notes: intervention.title,
    })),
  ];
  const ownerMissionKpis = buildOwnerMissionKpis(ownerMissionItems);
  const ownerMissionPriorities = getOwnerMissionPriorities(ownerMissionItems);
  const signedServiceLabels = Array.from(new Set(collectServiceLabelsFromMetadata(mission.metadata)));
  const concernedConcierges = Array.from(
    new Set(
      [
        profileName(detail.participants.concierge),
        ...detail.providers.map((provider) => profileName(provider)),
      ].filter((name) => name && name !== "Non renseignÃ©" && name !== "Contact"),
    ),
  );

  return (
    <div className={`${styles.page} ${persona === "owner" ? styles.ownerMissionView : ""}`}>
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}

      {persona === "owner" ? (
        <OwnerMissionPage
          kpis={ownerMissionKpis}
          priorities={ownerMissionPriorities}
          missions={ownerMissionItems}
        />
      ) : null}

      {persona === "owner" ? (
        <section className={styles.ownerPanel} aria-labelledby="owner-mission-actions-title">
          <div className={styles.ownerPanelHeader}>
            <div>
              <p className={styles.eyebrow}>Mission</p>
              <h2 id="owner-mission-actions-title">{mission.title || "Mission à suivre"}</h2>
            </div>
            <span className={statusBadgeClass(currentStatus)}>{getMissionStatusLabel(currentStatus)}</span>
          </div>

          <div className={styles.ownerSummaryGrid}>
            <article>
              <span>Logement</span>
              <strong>{detail.property?.nom_logement || mission.title || "Logement concerné"}</strong>
              {detail.property?.ville ? <small>{detail.property.ville}</small> : null}
            </article>
            <article>
              <span>Intervenant</span>
              <strong>{cleanFrenchText(missionConciergeName)}</strong>
            </article>
            <article>
              <span>Date prévue</span>
              <strong>
                {formatDateValue(mission.scheduled_start, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </article>
            <article>
              <span>Devis signé</span>
              <strong>{detail.quotes[0]?.quote_number || "Devis accepté"}</strong>
              <small>{formatEuroAmountLabel(detail.quotes[0]?.total_amount ?? mission.amount, "-")}</small>
            </article>
            <article>
              <span>Services prévus</span>
              {signedServiceLabels.length > 0 ? (
                <div className={styles.serviceChipList}>
                  {signedServiceLabels.map((service) => (
                    <strong className={styles.serviceChip} key={service}>
                      <ServiceIcon label={service} />
                      {cleanFrenchText(service)}
                    </strong>
                  ))}
                </div>
              ) : (
                <strong>Services du devis à préciser</strong>
              )}
            </article>
            <article>
              <span>Action attendue</span>
              <strong>
                {canShowOwnerValidate ? "Vérifier puis valider" : canShowCancel ? "Suivre l’avancement" : "Mission clôturée"}
              </strong>
            </article>
          </div>

          <div className={styles.ownerWorkflowGrid}>
            <WorkflowTimeline title="Demande et devis" steps={requestWorkflowSteps} />
            <WorkflowTimeline title="Étapes de la mission" steps={missionWorkflowSteps} />
          </div>

          {bookingChanged ? (
            <div className={styles.bookingAlert}>
              <strong>Réservation modifiée</strong>
              <span>Vérifiez la date de mission, le nombre de voyageurs et les consignes envoyées à la conciergerie.</span>
            </div>
          ) : null}

          <div className={styles.ownerInfoGrid}>
            <article className={styles.ownerInfoCard}>
              <p className={styles.eyebrow}>Devis signé</p>
              <h3>{latestQuote?.quote_number || "Devis accepté"}</h3>
              <div className={styles.infoRows}>
                <span>Montant</span>
                <strong>{formatEuroAmountLabel(latestQuote?.total_amount ?? mission.amount, "-")}</strong>
                <span>Services</span>
                <strong>{signedServiceLabels.length > 0 ? signedServiceLabels.map(cleanFrenchText).join(", ") : "À préciser"}</strong>
              </div>
              {latestQuote ? (
                <Link href={`/dashboard/owner/devis?quote=${latestQuote.id}`} className={styles.secondaryLink}>
                  Voir le devis signé
                </Link>
              ) : null}
            </article>

            <article className={styles.ownerInfoCard}>
              <p className={styles.eyebrow}>Voyageurs</p>
              <h3>{guestName || "Aucun voyageur renseigné"}</h3>
              <div className={styles.infoRows}>
                <span>Source</span>
                <strong>{bookingSource ? cleanFrenchText(bookingSource) : "Airbnb / Abritel à préciser"}</strong>
                <span>Séjour</span>
                <strong>
                  {checkInDate || checkOutDate
                    ? `${formatDateValue(checkInDate, { day: "2-digit", month: "short" })} - ${formatDateValue(checkOutDate, { day: "2-digit", month: "short" })}`
                    : "Dates à renseigner"}
                </strong>
                <span>Voyageurs</span>
                <strong>{guestCount ? `${guestCount} voyageur(s)` : "Nombre à préciser"}</strong>
              </div>
            </article>

            <article className={styles.ownerInfoCard}>
              <p className={styles.eyebrow}>Paiement</p>
              <h3>
                {paymentStatus === "paye"
                  ? "Payé"
                  : paymentStatus === "litige"
                    ? "Litige"
                    : paymentStatus === "en_attente"
                      ? "En attente"
                      : "À payer"}
              </h3>
              <p className={styles.empty}>Le règlement sera relié aux factures de cette mission.</p>
              <Link href="/dashboard/owner/factures" className={styles.secondaryLink}>
                Voir les factures
              </Link>
            </article>
          </div>

          <div className={styles.ownerSplit}>
            <div className={styles.ownerCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Réalisation</p>
                  <h3>Checklist cochée par la conciergerie</h3>
                </div>
              </div>
              {signedServiceLabels.length > 0 ? (
                <div className={styles.serviceChipList}>
                  {signedServiceLabels.map((service) => (
                    <span className={styles.serviceChip} key={`checklist-${service}`}>
                      <ServiceIcon label={service} />
                      {cleanFrenchText(service)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.operationalHint}>Aucun service détaillé dans le devis.</p>
              )}
              <div className={styles.checklist}>
                {checklist.map((item) => (
                  <label key={item.id} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      disabled
                      checked={Boolean(item.done)}
                      readOnly
                    />
                    {cleanFrenchText(item.label)}
                  </label>
                ))}
              </div>
              <div className={styles.ownerProofs}>
                <h4>Preuves ajoutées par la conciergerie</h4>
                {detail.evidence.proof_links.length > 0 ? (
                  <div className={styles.ownerProofList}>
                    {detail.evidence.proof_links.map((proof, index) => {
                      const proofHref = getProofHref(missionId, proof);
                      return (
                        <a
                          key={proof.id || `${proof.url}-${index}`}
                          href={proofHref || "#"}
                          target={proofHref ? "_blank" : undefined}
                          rel={proofHref ? "noreferrer" : undefined}
                          className={styles.ownerProofLink}
                        >
                          <strong>{cleanFrenchText(proof.label || "Preuve terrain")}</strong>
                          <span>{cleanFrenchText(proof.kind || proof.storage_bucket || "document")}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.empty}>Aucune preuve ajoutée pour le moment.</p>
                )}
              </div>
            </div>

            <div className={styles.ownerCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Décision</p>
                  <h3>Votre action</h3>
                </div>
              </div>
              <form className={styles.ownerEditForm} onSubmit={submitEdit}>
                <label className={styles.label}>
                  Début
                  <Input
                    type="datetime-local"
                    value={editForm.scheduled_start}
                    onChange={(event) => setEditForm((current) => ({ ...current, scheduled_start: event.target.value }))}
                  />
                </label>
                <label className={styles.label}>
                  Fin
                  <Input
                    type="datetime-local"
                    value={editForm.scheduled_end}
                    onChange={(event) => setEditForm((current) => ({ ...current, scheduled_end: event.target.value }))}
                  />
                </label>
                <label className={`${styles.label} ${styles.fullWidth}`}>
                  Message ou consigne pour la conciergerie
                  <Textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Exemple : merci de décaler le créneau, vérifier la terrasse, prévoir du linge supplémentaire..."
                  />
                </label>
                <div className={styles.fullWidth}>
                  <Button type="submit" variant="secondary" disabled={saving}>
                    <CalendarClock size={16} aria-hidden="true" /> Modifier et prévenir la conciergerie
                  </Button>
                </div>
              </form>
              {canShowOwnerValidate ? (
                <Button disabled={saving} onClick={() => patchMission({ action: "validate_completion" }, "Mission validée.")}>
                  <CheckCircle2 size={16} aria-hidden="true" /> Confirmer la réalisation
                </Button>
              ) : null}
              {canShowCancel ? (
                <div className={styles.cancelBox}>
                  <label className={`${styles.label} ${styles.fullWidth}`}>
                    Motif d&apos;annulation
                    <small>Indiquez la raison principale pour garder un historique clair.</small>
                    <Textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      placeholder="Exemple : voyageur absent, prestation reportée, demande annulée..."
                    />
                  </label>
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => patchMission({ action: "cancel", cancel_reason: cancelReason }, "Mission annulée.")}
                  >
                    <XCircle size={16} aria-hidden="true" /> Annuler la mission
                  </Button>
                </div>
              ) : null}
              <Link href={messageHref} className={styles.linkButton}>
                <MessageSquareText size={16} aria-hidden="true" /> Contacter la conciergerie
              </Link>
            </div>
          </div>

          <div className={styles.ownerActivity}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Preuves de suivi</p>
                <h3>Modifications et messages envoyés</h3>
              </div>
              <Link href={messageHref} className={styles.linkButton}>
                Voir la conversation
              </Link>
            </div>
            <div className={styles.ownerActivityList}>
              {detail.conversations[0]?.last_message_preview ? (
                <article className={styles.ownerActivityItem}>
                  <strong>Dernier message envoyé à la conciergerie</strong>
                  <p>{cleanFrenchText(detail.conversations[0].last_message_preview)}</p>
                  <span>
                    {formatDateValue(detail.conversations[0].last_message_at, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </article>
              ) : null}
              {detail.events.slice(0, 5).map((event) => (
                <article className={styles.ownerActivityItem} key={event.id}>
                  <strong>{getOwnerEventLabel(event)}</strong>
                  <p>{getEventDetail(event)}</p>
                  <span>
                    {formatDateValue(event.created_at, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <p className={styles.eyebrow}>Détail mission</p>
            <h1 className={styles.title}>{mission.title || "Mission sans titre"}</h1>
          </div>
          <span className={statusBadgeClass(currentStatus)}>{getMissionStatusLabel(currentStatus)}</span>
        </div>
        <p className={styles.description}>
          {mission.description || "Ajoutez les consignes, preuves et validations nécessaires pour garder un suivi clair."}
        </p>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>{getMissionPriorityLabel(mission.priority)}</span>
          <span className={styles.badge}>
            <CalendarClock size={15} aria-hidden="true" />{" "}
            {formatDateValue(mission.scheduled_start, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <WorkflowTimeline title="Parcours métier" steps={getMissionWorkflowSteps(currentStatus)} />
        <div className={styles.actions}>
          {canRequestDate ? (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => patchPlanning("request_date", "Date demandée pour cette mission.")}
            >
              <CalendarClock size={16} aria-hidden="true" /> Demander une date
            </Button>
          ) : null}
          {canProposeDate ? (
            <Button
              variant="secondary"
              disabled={saving || !hasPlanningDate}
              onClick={() => patchPlanning("propose_date", "Créneau proposé.")}
            >
              <CalendarClock size={16} aria-hidden="true" /> Proposer ce créneau
            </Button>
          ) : null}
          {canConfirmDate ? (
            <Button
              variant="secondary"
              disabled={saving || !hasPlanningDate}
              onClick={() => patchPlanning("confirm_date", "Date confirmée.")}
            >
              <CheckCircle2 size={16} aria-hidden="true" /> Confirmer la date
            </Button>
          ) : null}
          {canScheduleDate ? (
            <Button
              variant="secondary"
              disabled={saving || !hasPlanningDate}
              onClick={() => patchPlanning("schedule", "Mission planifiée.")}
            >
              <CalendarClock size={16} aria-hidden="true" /> Planifier
            </Button>
          ) : null}
          {canShowAccept ? (
            <Button disabled={saving} onClick={() => patchMission({ action: "accept" }, "Mission acceptée.")}>
              <CheckCircle2 size={16} aria-hidden="true" /> Accepter
            </Button>
          ) : null}
          {canShowStart ? (
            <Button disabled={saving} onClick={() => patchMission({ action: "start" }, "Mission démarrée.")}>
              <Play size={16} aria-hidden="true" /> Démarrer
            </Button>
          ) : null}
          {canShowComplete ? (
            <Button disabled={saving} onClick={() => patchMission({ action: "complete" }, "Mission terminée.")}>
              <CheckCircle2 size={16} aria-hidden="true" /> Terminer
            </Button>
          ) : null}
          {canShowOwnerValidate ? (
            <Button disabled={saving} onClick={() => patchMission({ action: "validate_completion" }, "Mission validee.")}>
              <CheckCircle2 size={16} aria-hidden="true" /> Confirmer la realisation
            </Button>
          ) : null}
          {canShowCancel ? (
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => patchMission({ action: "cancel", cancel_reason: cancelReason }, "Mission annulée.")}
            >
              <XCircle size={16} aria-hidden="true" /> Annuler
            </Button>
          ) : null}
          <Link href={messageHref} className={styles.linkButton}>
            <MessageSquareText size={16} aria-hidden="true" /> Messages
          </Link>
        </div>
      </section>

      <div className={styles.layout}>
        <main className={styles.page}>
          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Pilotage</p>
                <h2>Informations et replanification</h2>
              </div>
            </div>
            <form className={styles.formGrid} onSubmit={submitEdit}>
              <label className={styles.label}>
                Titre
                <Input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className={styles.label}>
                Priorité
                <Select value={editForm.priority} onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}>
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </label>
              <label className={styles.label}>
                Début
                <Input type="datetime-local" value={editForm.scheduled_start} onChange={(event) => setEditForm((current) => ({ ...current, scheduled_start: event.target.value }))} />
              </label>
              <label className={styles.label}>
                Fin
                <Input type="datetime-local" value={editForm.scheduled_end} onChange={(event) => setEditForm((current) => ({ ...current, scheduled_end: event.target.value }))} />
              </label>
              <label className={styles.label}>
                Montant
                <Input type="number" min="0" step="0.01" value={editForm.amount} onChange={(event) => setEditForm((current) => ({ ...current, amount: event.target.value }))} />
              </label>
              <label className={`${styles.label} ${styles.fullWidth}`}>
                Consignes
                <Textarea rows={4} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className={`${styles.label} ${styles.fullWidth}`}>
                Motif d&apos;annulation
                <small>Expliquez brièvement la raison : prestation reportée, voyageur absent, problème résolu ou autre décision.</small>
                <Input value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Optionnel, utilisé si vous annulez la mission" />
              </label>
              <div className={styles.fullWidth}>
                <Button type="submit" disabled={saving}>Enregistrer les modifications</Button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Preuves terrain</p>
                <h2>Checklist et pièces jointes</h2>
              </div>
              <Button variant="secondary" disabled={saving} onClick={saveChecklist}>Sauver la checklist</Button>
            </div>
            <div className={styles.checklistSummary}>
              <div>
                <span>Services signés</span>
                <strong>{signedServiceLabels.length > 0 ? signedServiceLabels.join(", ") : "Aucun service détaillé dans le devis"}</strong>
              </div>
              <div>
                <span>Conciergerie concernée</span>
                <strong>{concernedConcierges.length > 0 ? concernedConcierges.join(", ") : "À préciser"}</strong>
              </div>
            </div>
            <div className={styles.checklist}>
              {checklist.map((item) => (
                <label key={item.id} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={Boolean(item.done)}
                    onChange={(event) =>
                      setChecklist((current) =>
                        current.map((entry) => (entry.id === item.id ? { ...entry, done: event.target.checked } : entry)),
                      )
                    }
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {canConciergeAct ? (
              <form className={styles.formGrid} onSubmit={submitFile}>
                <label className={styles.label}>
                  Type
                  <Select value={fileForm.kind} onChange={(event) => setFileForm((current) => ({ ...current, kind: event.target.value }))}>
                    <option value="photo">Photo</option>
                    <option value="document">Document</option>
                    <option value="video">Vidéo</option>
                  </Select>
                </label>
                <label className={styles.label}>
                  Titre
                  <Input value={fileForm.label} onChange={(event) => setFileForm((current) => ({ ...current, label: event.target.value }))} />
                </label>
                <label className={`${styles.label} ${styles.fullWidth}`}>
                  Fichier
                  <Input name="file" type="file" accept="image/*,video/*,application/pdf" />
                </label>
                <div className={styles.fullWidth}>
                  <Button type="submit" disabled={fileUploading}>
                    <FilePlus2 size={16} aria-hidden="true" /> {fileUploading ? "Upload..." : "Uploader une preuve"}
                  </Button>
                </div>
              </form>
            ) : null}

            {canConciergeAct ? (
              <form className={styles.formGrid} onSubmit={submitProof}>
                <label className={styles.label}>
                  Type
                  <Select value={proofForm.kind} onChange={(event) => setProofForm((current) => ({ ...current, kind: event.target.value }))}>
                    <option value="photo">Photo</option>
                    <option value="document">Document</option>
                    <option value="video">Vidéo</option>
                    <option value="note">Note</option>
                  </Select>
                </label>
                <label className={styles.label}>
                  Titre
                  <Input value={proofForm.label} onChange={(event) => setProofForm((current) => ({ ...current, label: event.target.value }))} />
                </label>
                <label className={`${styles.label} ${styles.fullWidth}`}>
                  Lien externe
                  <Input value={proofForm.url} onChange={(event) => setProofForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://..." />
                </label>
                <div className={styles.fullWidth}>
                  <Button type="submit" disabled={saving}>
                    <FilePlus2 size={16} aria-hidden="true" /> Ajouter un lien
                  </Button>
                </div>
              </form>
            ) : null}

            <div className={styles.proofGrid}>
              {detail.evidence.proof_links.length > 0 ? (
                detail.evidence.proof_links.map((proof, index) => {
                  const proofHref = getProofHref(missionId, proof);
                  return (
                    <article className={styles.proofCard} key={proof.id || `${proof.url}-${index}`}>
                      <strong>{proof.label || "Preuve"}</strong>
                      <span>{proof.kind || proof.storage_bucket || "document"}</span>
                      {proofHref ? <a href={proofHref} target="_blank" rel="noreferrer">Télécharger</a> : null}
                      {proof.storage_path ? <span>{proof.storage_path}</span> : null}
                    </article>
                  );
                })
              ) : (
                <p className={styles.empty}>Aucune preuve ajoutée pour le moment.</p>
              )}
            </div>
          </section>

          {canConciergeAct ? (
            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Artisan / provider</p>
                  <h2>Créer une intervention liée</h2>
                </div>
              </div>
              <form className={styles.formGrid} onSubmit={createProviderIntervention}>
                <label className={styles.label}>
                  Artisan
                  <Select value={providerForm.provider_profile_id} onChange={(event) => setProviderForm((current) => ({ ...current, provider_profile_id: event.target.value }))}>
                    <option value="">Choisir</option>
                    {detail.providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {profileName(provider)}{provider.city ? ` - ${provider.city}` : ""}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className={styles.label}>
                  Titre
                  <Input value={providerForm.title} onChange={(event) => setProviderForm((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className={styles.label}>
                  Service
                  <Input value={providerForm.service_label} onChange={(event) => setProviderForm((current) => ({ ...current, service_label: event.target.value }))} />
                </label>
                <label className={styles.label}>
                  Budget
                  <Input type="number" min="0" step="0.01" value={providerForm.budget_amount} onChange={(event) => setProviderForm((current) => ({ ...current, budget_amount: event.target.value }))} />
                </label>
                <div className={styles.fullWidth}>
                  <Button type="submit" disabled={saving || !providerForm.provider_profile_id}>
                    <Wrench size={16} aria-hidden="true" /> Créer l&apos;intervention
                  </Button>
                </div>
              </form>
            </section>
          ) : null}
        </main>

        <aside className={styles.page}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Relation</p>
            <div className={styles.factGrid}>
              {relationFacts.map((fact) => (
                <div className={styles.fact} key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Documents liés</p>
            {detail.quotes.length > 0 || detail.invoices.length > 0 ? (
              <div className={styles.timeline}>
                {detail.quotes.map((quote) => (
                  <div className={styles.timelineItem} key={quote.id}>
                    <strong>{quote.quote_number || "Devis"}</strong>
                    <span>{quote.status || "-"} · {formatEuroAmountLabel(quote.total_amount, "-")}</span>
                  </div>
                ))}
                {detail.invoices.map((invoice) => (
                  <div className={styles.timelineItem} key={invoice.id}>
                    <strong>{invoice.invoice_number || "Facture"}</strong>
                    <span>{invoice.status || "-"} · solde {formatEuroAmountLabel(invoice.balance_amount, "-")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Aucun devis ou facture rattaché.</p>
            )}
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Interventions artisan</p>
            {detail.provider_interventions.length > 0 ? (
              <div className={styles.timeline}>
                {detail.provider_interventions.map((intervention) => (
                  <div className={styles.timelineItem} key={intervention.id}>
                    <strong>{intervention.title}</strong>
                    <span>{intervention.status || "pending"} · {formatEuroAmountLabel(intervention.budget_amount, "-")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>Aucune intervention artisan liée.</p>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Messages</p>
                <h3>Conversation mission</h3>
              </div>
            </div>
            {detail.conversations.length > 0 ? (
              detail.conversations.map((conversation) => (
                <p key={conversation.id}>
                  <strong>{conversation.subject || "Conversation mission"}</strong>
                  <br />
                  {conversation.last_message_preview || "Aucun message récent."}
                </p>
              ))
            ) : (
              <p className={styles.empty}>La conversation sera créée au premier changement de statut.</p>
            )}
            <Link href={messageHref} className={styles.linkButton}>Ouvrir les messages</Link>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Validation</p>
            <form className={styles.formGrid} onSubmit={signMission}>
              <label className={`${styles.label} ${styles.fullWidth}`}>
                Nom du signataire
                <Input value={signature} onChange={(event) => setSignature(event.target.value)} />
              </label>
              <div className={styles.fullWidth}>
                <Button type="submit" disabled={saving}>Valider la mission</Button>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <p className={styles.eyebrow}>Historique</p>
            <div className={styles.timeline}>
              {detail.events.length > 0 ? (
                detail.events.map((event) => (
                  <div className={styles.timelineItem} key={event.id}>
                    <strong>{getEventLabel(event.event_type)}</strong>
                    <span>{formatDateValue(event.created_at, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))
              ) : (
                <p className={styles.empty}>Aucun événement historisé.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
