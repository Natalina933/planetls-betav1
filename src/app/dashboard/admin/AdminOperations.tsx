"use client";

import Link from "next/link";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiFlag,
  FiRepeat,
} from "react-icons/fi";
import styles from "./AdminOperations.module.scss";

export type AdminTone = "neutral" | "positive" | "warning" | "danger";

export type AdminRequestRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  workflow_status?: string | null;
  request_workflow_status?: string | null;
  quote_workflow_status?: string | null;
  mission_workflow_status?: string | null;
  owner_name?: string | null;
  property_name?: string | null;
  property_housing_id?: string | null;
  city?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  selected_concierge_name?: string | null;
  requested_services?: string[] | null;
  recipients?: Array<{
    concierge_name?: string | null;
    status?: string | null;
    quote_id?: string | null;
    quote_status?: string | null;
  }>;
};

export type AdminMissionRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  city?: string | null;
  owner_name?: string | null;
  concierge_name?: string | null;
  provider_name?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
  quote_id?: string | null;
  service_request_id?: string | null;
  invoice_id?: string | null;
  amount?: number | string | null;
  total_amount?: number | string | null;
};

export type AdminTimelineStep = {
  id: string;
  label: string;
  done: boolean;
  active?: boolean;
};

export type AdminKpi = {
  id: string;
  label: string;
  value: number | string;
  helper: string;
  tone?: AdminTone;
};

export const requestStatusOptions = [
  "Tous",
  "Brouillon",
  "Envoyée",
  "Reçue",
  "En attente de réponse",
  "Devis envoyé",
  "Devis accepté",
  "Mission générée",
  "Clôturée",
  "Annulée",
  "Bloquée",
] as const;

export const missionStatusOptions = [
  "Tous",
  "Générée",
  "Planifiée",
  "Confirmée",
  "En cours",
  "Réalisée",
  "Facturée",
  "En attente de règlement",
  "Réglée",
  "Clôturée",
  "Annulée",
  "En litige",
  "Bloquée",
] as const;

const requestSteps = [
  "Demande créée",
  "Demande envoyée",
  "Demande reçue",
  "Réponse conciergerie",
  "Devis envoyé",
  "Devis accepté",
  "Mission générée",
  "Planning synchronisé",
  "Demande clôturée",
];

const missionSteps = [
  "Mission générée",
  "Planning propriétaire",
  "Planning concierge",
  "Mission confirmée",
  "Mission en cours",
  "Mission réalisée",
  "Rapport envoyé",
  "Facture émise",
  "Règlement effectué",
  "Mission clôturée",
];

export function normalizeAdminText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .trim();
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return "Non renseignée";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getElapsedLabel(value: string | null | undefined) {
  if (!value) return "Date inconnue";
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return "Date inconnue";
  const hours = Math.max(0, Math.round((Date.now() - parsed) / 36e5));
  if (hours < 1) return "À l’instant";
  if (hours < 24) return `Depuis ${hours} h`;
  const days = Math.round(hours / 24);
  return `Depuis ${days} j`;
}

export function getRequestStatus(request: AdminRequestRow) {
  const raw = normalizeAdminText(
    request.request_workflow_status ?? request.workflow_status ?? request.status ?? request.quote_workflow_status,
  );
  const quote = normalizeAdminText(request.quote_workflow_status);
  const mission = normalizeAdminText(request.mission_workflow_status);

  if (raw.includes("block")) return "Bloquée";
  if (raw.includes("cancel")) return "Annulée";
  if (raw.includes("closed") || raw.includes("archive")) return "Clôturée";
  if (mission.includes("generated") || mission.includes("created") || mission.includes("scheduled")) {
    return "Mission générée";
  }
  if (quote.includes("accept") || raw.includes("accepted")) return "Devis accepté";
  if (quote.includes("sent") || raw.includes("quote sent") || raw.includes("quoted")) return "Devis envoyé";
  if (raw.includes("viewed") || raw.includes("received")) return "Reçue";
  if (raw.includes("sent")) return "Envoyée";
  if (raw.includes("discussion") || raw.includes("waiting") || raw.includes("pending")) return "En attente de réponse";
  if (!raw || raw.includes("draft") || raw.includes("new")) return "Brouillon";
  return request.status?.trim() || "En attente de réponse";
}

export function getMissionStatus(mission: AdminMissionRow) {
  const raw = normalizeAdminText(mission.status);
  if (raw.includes("block")) return "Bloquée";
  if (raw.includes("dispute") || raw.includes("litige")) return "En litige";
  if (raw.includes("cancel")) return "Annulée";
  if (raw.includes("paid") || raw.includes("regle")) return "Réglée";
  if (raw.includes("invoice") || raw.includes("factur")) return "Facturée";
  if (raw.includes("completed") || raw.includes("done") || raw.includes("realise")) return "Réalisée";
  if (raw.includes("progress")) return "En cours";
  if (raw.includes("confirm")) return "Confirmée";
  if (raw.includes("scheduled") || raw.includes("planned") || raw.includes("planifie")) return "Planifiée";
  if (raw.includes("generated") || raw.includes("created") || raw.includes("pending")) return "Générée";
  return mission.status?.trim() || "Générée";
}

export function getStatusTone(status: string): AdminTone {
  const normalized = normalizeAdminText(status);
  if (normalized.includes("bloque") || normalized.includes("retard") || normalized.includes("litige")) return "danger";
  if (normalized.includes("attente") || normalized.includes("envoye") || normalized.includes("generee")) return "warning";
  if (normalized.includes("accepte") || normalized.includes("realisee") || normalized.includes("reglee") || normalized.includes("cloturee")) return "positive";
  return "neutral";
}

export function getRequestTimeline(request: AdminRequestRow): AdminTimelineStep[] {
  const status = getRequestStatus(request);
  const quote = normalizeAdminText(request.quote_workflow_status);
  const mission = normalizeAdminText(request.mission_workflow_status);
  let activeIndex = 0;
  if (["Envoyée", "Reçue", "En attente de réponse"].includes(status)) activeIndex = status === "Envoyée" ? 1 : 2;
  if (quote.includes("sent") || status === "Devis envoyé") activeIndex = 4;
  if (quote.includes("accept") || status === "Devis accepté") activeIndex = 5;
  if (mission || status === "Mission générée") activeIndex = 6;
  if (status === "Clôturée") activeIndex = 8;

  return requestSteps.map((label, index) => ({
    id: label,
    label,
    done: index < activeIndex || status === "Clôturée",
    active: index === activeIndex && status !== "Clôturée",
  }));
}

export function getMissionTimeline(mission: AdminMissionRow): AdminTimelineStep[] {
  const status = getMissionStatus(mission);
  let activeIndex = 0;
  if (mission.scheduled_start || status === "Planifiée") activeIndex = 1;
  if (status === "Confirmée") activeIndex = 3;
  if (status === "En cours") activeIndex = 4;
  if (status === "Réalisée") activeIndex = 5;
  if (status === "Facturée") activeIndex = 7;
  if (status === "Réglée") activeIndex = 8;
  if (status === "Clôturée") activeIndex = 9;

  return missionSteps.map((label, index) => ({
    id: label,
    label,
    done: index < activeIndex || status === "Clôturée",
    active: index === activeIndex && status !== "Clôturée",
  }));
}

export function getRequestNextAction(request: AdminRequestRow) {
  const status = getRequestStatus(request);
  if (status === "Brouillon") return "Envoyer la demande";
  if (status === "Envoyée" || status === "Reçue" || status === "En attente de réponse") return "Relancer la conciergerie";
  if (status === "Devis envoyé") return "Attendre la décision propriétaire";
  if (status === "Devis accepté") return "Vérifier la mission générée";
  if (status === "Mission générée") return "Vérifier le planning";
  if (status === "Bloquée") return "Lever le blocage";
  return "Surveiller";
}

export function getMissionNextAction(mission: AdminMissionRow) {
  const status = getMissionStatus(mission);
  if (!mission.scheduled_start) return "Planifier la mission";
  if (status === "Générée" || status === "Planifiée") return "Confirmer l’intervention";
  if (status === "Réalisée" && !mission.invoice_id) return "Vérifier la facture";
  if (status === "Facturée") return "Suivre le règlement";
  if (status === "Bloquée" || status === "En litige") return "Traiter le blocage";
  return "Surveiller";
}

export function getRequestUrgency(request: AdminRequestRow): AdminTone {
  const status = getRequestStatus(request);
  const ageHours = getAgeHours(request.updated_at ?? request.created_at);
  if (status === "Bloquée") return "danger";
  if (["Envoyée", "Reçue", "En attente de réponse"].includes(status) && ageHours >= 48) return "danger";
  if (status === "Devis accepté" && !normalizeAdminText(request.mission_workflow_status)) return "warning";
  return "neutral";
}

export function getMissionUrgency(mission: AdminMissionRow): AdminTone {
  const status = getMissionStatus(mission);
  const scheduled = mission.scheduled_start ? new Date(mission.scheduled_start).getTime() : null;
  if (status === "Bloquée" || status === "En litige") return "danger";
  if (!mission.scheduled_start) return "warning";
  if (scheduled && scheduled < Date.now() && !["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(status)) {
    return "danger";
  }
  return "neutral";
}

export function getAgeHours(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.round((Date.now() - parsed) / 36e5));
}

export function getRequestAssignee(request: AdminRequestRow) {
  if (request.selected_concierge_name?.trim()) return request.selected_concierge_name.trim();
  const recipients = request.recipients ?? [];
  const firstName = recipients.find((recipient) => recipient.concierge_name?.trim())?.concierge_name;
  if (firstName) return firstName;
  return "Aucune conciergerie";
}

export function AdminStatusBadge({ label, tone = getStatusTone(label) }: { label: string; tone?: AdminTone }) {
  return <span className={`${styles.statusBadge} ${styles[`tone-${tone}`]}`}>{label}</span>;
}

export function AdminProcessTimeline({ steps }: { steps: AdminTimelineStep[] }) {
  return (
    <ol className={styles.timeline}>
      {steps.map((step) => (
        <li
          className={`${styles.timelineStep} ${step.done ? styles.timelineStepDone : ""} ${
            step.active ? styles.timelineStepActive : ""
          }`}
          key={step.id}
        >
          <span className={styles.timelineIcon}>{step.done ? <FiCheckCircle /> : step.active ? <FiClock /> : <FiFlag />}</span>
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function AdminKpiGrid({ kpis }: { kpis: AdminKpi[] }) {
  return (
    <div className={styles.kpiGrid}>
      {kpis.map((kpi) => (
        <article className={`${styles.kpiCard} ${styles[`tone-${kpi.tone ?? "neutral"}`]}`} key={kpi.id}>
          <strong>{kpi.value}</strong>
          <span>{kpi.label}</span>
          <small>{kpi.helper}</small>
        </article>
      ))}
    </div>
  );
}

export function AdminAlertList({
  alerts,
}: {
  alerts: Array<{ id: string; title: string; description: string; href?: string; tone?: AdminTone }>;
}) {
  if (!alerts.length) {
    return (
      <div className={styles.emptyState}>
        <FiCheckCircle />
        <strong>Aucun blocage critique</strong>
        <p>Les demandes, missions et paiements surveillés ne présentent pas d’alerte prioritaire.</p>
      </div>
    );
  }

  return (
    <div className={styles.alertList}>
      {alerts.map((alert) => {
        const content = (
          <>
            <span className={`${styles.alertIcon} ${styles[`tone-${alert.tone ?? "warning"}`]}`}>
              <FiAlertTriangle />
            </span>
            <span>
              <strong>{alert.title}</strong>
              <small>{alert.description}</small>
            </span>
          </>
        );

        return alert.href ? (
          <Link className={styles.alertItem} href={alert.href} key={alert.id}>
            {content}
          </Link>
        ) : (
          <div className={styles.alertItem} key={alert.id}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.emptyState}>
      <FiFileText />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function AdminFilterBar({
  search,
  status,
  statusOptions,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: string;
  statusOptions: readonly string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <div className={styles.filterBar}>
      <label>
        <span>Recherche</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Propriétaire, logement, ville, conciergerie..."
        />
      </label>
      <label>
        <span>Statut</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <span className={styles.filterHint}>
        <FiRepeat /> Les statuts sont harmonisés en français.
      </span>
    </div>
  );
}
