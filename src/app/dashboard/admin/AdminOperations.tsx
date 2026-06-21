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
  mission_id?: string | null;
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
  created_at?: string | null;
  workflow_status?: string | null;
  mission_workflow_status?: string | null;
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
  tone?: AdminTone;
  helper?: string;
  adminAction?: string;
  actionHref?: string;
};

export type AdminIssue = {
  id: string;
  title: string;
  description: string;
  tone?: AdminTone;
  href?: string;
};

export type AdminKpi = {
  id: string;
  label: string;
  value: number | string;
  helper: string;
  tone?: AdminTone;
};

export type AdminControlStep = {
  id: string;
  label: string;
  ok: boolean;
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
  const recipients = request.recipients ?? [];
  const recipientStatuses = recipients.map((recipient) => normalizeAdminText(recipient.status));
  const quoteStatuses = recipients.map((recipient) => normalizeAdminText(recipient.quote_status));
  const hasRecipients = recipients.length > 0;
  const hasResponse = recipients.some((recipient) => recipient.quote_id || normalizeAdminText(recipient.status).match(/interested|quoted|selected/));
  const quoteSent = quote.includes("sent") || quote.includes("quoted") || quoteStatuses.some((item) => item.includes("sent") || item.includes("quoted"));
  const quoteAccepted = quote.includes("accept") || status === "Devis accepté" || quoteStatuses.some((item) => item.includes("accept"));
  const missionGenerated = Boolean(request.mission_id) || Boolean(mission) || status === "Mission générée";
  const planningSynced = mission.includes("scheduled") || mission.includes("in progress") || mission.includes("completed") || mission.includes("done");
  const closed = status === "Clôturée";
  const missionHref = request.mission_id
    ? `/dashboard/admin/missions?search=${encodeURIComponent(request.mission_id)}`
    : "/dashboard/admin/missions";

  const steps: AdminTimelineStep[] = [
    {
      id: "created",
      label: requestSteps[0],
      done: Boolean(request.created_at || request.id),
      helper: request.created_at ? formatAdminDate(request.created_at) : "Demande enregistrée",
    },
    {
      id: "sent",
      label: requestSteps[1],
      done: hasRecipients || !["Brouillon"].includes(status),
      active: status === "Brouillon",
      tone: !hasRecipients ? "warning" : undefined,
      helper: hasRecipients ? `${recipients.length} destinataire(s)` : "Aucune conciergerie sollicitée",
      adminAction: !hasRecipients ? "Ajouter ou relancer une conciergerie" : undefined,
    },
    {
      id: "received",
      label: requestSteps[2],
      done: recipientStatuses.some((item) => item.includes("viewed") || item.includes("received") || item.includes("interested") || item.includes("quoted") || item.includes("selected")) || status === "Reçue",
      active: ["Envoyée", "Reçue", "En attente de réponse"].includes(status),
      tone: hasRecipients && getAgeHours(request.updated_at ?? request.created_at) >= 48 && !hasResponse ? "danger" : undefined,
      helper: hasRecipients ? "Réception à confirmer côté partenaire" : "En attente d'envoi",
      adminAction: hasRecipients && !hasResponse ? "Relancer la conciergerie" : undefined,
    },
    {
      id: "response",
      label: requestSteps[3],
      done: hasResponse || Boolean(request.selected_concierge_name),
      active: hasRecipients && !hasResponse,
      tone: hasRecipients && !hasResponse ? "warning" : undefined,
      helper: hasResponse ? "Réponse ou devis reçu" : "Aucune réponse exploitable",
      adminAction: hasRecipients && !hasResponse ? "Vérifier la conversation" : undefined,
    },
    {
      id: "quote-sent",
      label: requestSteps[4],
      done: quoteSent || quoteAccepted,
      active: hasResponse && !quoteSent && !quoteAccepted,
      tone: hasResponse && !quoteSent && !quoteAccepted ? "warning" : undefined,
      helper: quoteSent || quoteAccepted ? "Devis présent" : "Devis absent",
      adminAction: hasResponse && !quoteSent && !quoteAccepted ? "Demander l'envoi du devis" : undefined,
    },
    {
      id: "quote-accepted",
      label: requestSteps[5],
      done: quoteAccepted,
      active: quoteSent && !quoteAccepted,
      helper: quoteAccepted ? "Acceptation détectée" : "Décision propriétaire attendue",
    },
    {
      id: "mission-generated",
      label: requestSteps[6],
      done: missionGenerated,
      active: quoteAccepted && !missionGenerated,
      tone: quoteAccepted && !missionGenerated ? "danger" : undefined,
      helper: missionGenerated ? "Mission rattachée" : "Aucune mission rattachée",
      adminAction: quoteAccepted && !missionGenerated ? "Générer ou rattacher la mission" : undefined,
      actionHref: missionHref,
    },
    {
      id: "planning",
      label: requestSteps[7],
      done: planningSynced,
      active: missionGenerated && !planningSynced,
      tone: missionGenerated && !planningSynced ? "warning" : undefined,
      helper: planningSynced ? "Planning synchronisé" : "Date ou synchronisation à vérifier",
      adminAction: missionGenerated && !planningSynced ? "Contrôler le planning mission" : undefined,
      actionHref: missionHref,
    },
    {
      id: "closed",
      label: requestSteps[8],
      done: closed,
      active: planningSynced && !closed,
      helper: closed ? "Demande clôturée" : "Clôture à faire après vérification",
    },
  ];

  return steps;
}

export function getMissionTimeline(mission: AdminMissionRow): AdminTimelineStep[] {
  const status = getMissionStatus(mission);
  const normalized = normalizeAdminText(status);
  const hasPlanning = Boolean(mission.scheduled_start);
  const confirmed = ["Confirmée", "En cours", "Réalisée", "Facturée", "Réglée", "Clôturée"].includes(status);
  const inProgress = status === "En cours" || ["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(status);
  const completed = Boolean(mission.completed_at) || ["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(status);
  const invoiced = Boolean(mission.invoice_id) || status === "Facturée" || status === "Réglée" || status === "Clôturée";
  const paid = normalized.includes("reglee") || normalized.includes("paid") || status === "Clôturée";
  const closed = status === "Clôturée";
  const late = getMissionUrgency(mission) === "danger";

  return [
    {
      id: "generated",
      label: missionSteps[0],
      done: true,
      helper: mission.created_at ? formatAdminDate(mission.created_at) : "Mission enregistrée",
    },
    {
      id: "owner-planning",
      label: missionSteps[1],
      done: hasPlanning,
      active: !hasPlanning,
      tone: !hasPlanning ? "warning" : undefined,
      helper: hasPlanning ? formatAdminDate(mission.scheduled_start) : "Date propriétaire absente",
      adminAction: !hasPlanning ? "Planifier la mission" : undefined,
    },
    {
      id: "concierge-planning",
      label: missionSteps[2],
      done: hasPlanning && Boolean(mission.concierge_name || mission.provider_name),
      active: hasPlanning && !confirmed,
      helper: mission.concierge_name || mission.provider_name ? "Intervenant identifié" : "Intervenant à vérifier",
      adminAction: !(mission.concierge_name || mission.provider_name) ? "Rattacher l'intervenant" : undefined,
    },
    {
      id: "confirmed",
      label: missionSteps[3],
      done: confirmed,
      active: hasPlanning && !confirmed,
      helper: confirmed ? "Intervention confirmée" : "Confirmation attendue",
      adminAction: hasPlanning && !confirmed ? "Confirmer l'intervention" : undefined,
    },
    {
      id: "in-progress",
      label: missionSteps[4],
      done: inProgress,
      active: confirmed && !inProgress,
      tone: late && !completed ? "danger" : undefined,
      helper: late && !completed ? "Date dépassée sans réalisation" : "Suivi d'exécution",
      adminAction: late && !completed ? "Relancer l'intervenant" : undefined,
    },
    {
      id: "completed",
      label: missionSteps[5],
      done: completed,
      active: inProgress && !completed,
      helper: completed ? formatAdminDate(mission.completed_at ?? mission.updated_at) : "Réalisation à confirmer",
    },
    {
      id: "report",
      label: missionSteps[6],
      done: invoiced || paid || closed,
      active: completed && !invoiced,
      tone: completed && !invoiced ? "warning" : undefined,
      helper: completed && !invoiced ? "Rapport à vérifier avant facture" : "Contrôle rapport",
      adminAction: completed && !invoiced ? "Vérifier le rapport terrain" : undefined,
    },
    {
      id: "invoice",
      label: missionSteps[7],
      done: invoiced,
      active: completed && !invoiced,
      tone: completed && !invoiced ? "warning" : undefined,
      helper: invoiced ? "Facture liée" : "Facture absente",
      adminAction: completed && !invoiced ? "Créer ou rattacher la facture" : undefined,
    },
    {
      id: "payment",
      label: missionSteps[8],
      done: paid,
      active: invoiced && !paid,
      tone: invoiced && !paid ? "warning" : undefined,
      helper: paid ? "Règlement détecté" : "Règlement à suivre",
      adminAction: invoiced && !paid ? "Suivre le règlement" : undefined,
    },
    {
      id: "closed",
      label: missionSteps[9],
      done: closed,
      active: paid && !closed,
      helper: closed ? "Mission clôturée" : "Clôture finale à contrôler",
    },
  ];
}

export function getRequestAdminIssues(request: AdminRequestRow): AdminIssue[] {
  const status = getRequestStatus(request);
  const quoteAccepted = status === "Devis accepté" || normalizeAdminText(request.quote_workflow_status).includes("accept");
  const missionGenerated = Boolean(request.mission_id) || Boolean(normalizeAdminText(request.mission_workflow_status));
  const recipients = request.recipients ?? [];
  const hasResponse = recipients.some((recipient) => recipient.quote_id || normalizeAdminText(recipient.status).match(/interested|quoted|selected/));
  const ageHours = getAgeHours(request.updated_at ?? request.created_at);
  const issues: AdminIssue[] = [];

  if (status === "Bloquée") {
    issues.push({
      id: "blocked",
      title: "Demande bloquée",
      description: "Le statut indique un blocage à lever avant de poursuivre le parcours.",
      tone: "danger",
    });
  }

  if (!recipients.length) {
    issues.push({
      id: "no-recipient",
      title: "Aucune conciergerie sollicitée",
      description: "La demande ne peut pas recevoir de réponse ni de devis tant qu'aucun destinataire n'est rattaché.",
      tone: "warning",
    });
  } else if (!hasResponse && ageHours >= 48) {
    issues.push({
      id: "no-response",
      title: "Réponse en retard",
      description: "Une relance est recommandée: aucun retour exploitable n'est détecté après 48 h.",
      tone: "danger",
    });
  }

  if (quoteAccepted && !missionGenerated) {
    issues.push({
      id: "accepted-without-mission",
      title: "Devis accepté sans mission",
      description: "La mission doit être générée ou rattachée pour que le planning et l'exécution puissent suivre.",
      tone: "danger",
      href: "/dashboard/admin/missions",
    });
  }

  if (missionGenerated && !normalizeAdminText(request.mission_workflow_status).includes("scheduled")) {
    issues.push({
      id: "mission-without-planning",
      title: "Mission à planifier",
      description: "Une mission existe, mais aucune synchronisation planning claire n'est détectée côté demande.",
      tone: "warning",
      href: request.mission_id ? `/dashboard/admin/missions?search=${encodeURIComponent(request.mission_id)}` : "/dashboard/admin/missions",
    });
  }

  return issues;
}

export function getMissionAdminIssues(mission: AdminMissionRow): AdminIssue[] {
  const status = getMissionStatus(mission);
  const scheduled = mission.scheduled_start ? new Date(mission.scheduled_start).getTime() : null;
  const completed = Boolean(mission.completed_at) || ["Réalisée", "Facturée", "Réglée", "Clôturée"].includes(status);
  const issues: AdminIssue[] = [];

  if (status === "Bloquée" || status === "En litige") {
    issues.push({
      id: "blocked",
      title: status,
      description: "La mission nécessite une intervention admin avant de poursuivre le parcours.",
      tone: "danger",
    });
  }

  if (!mission.scheduled_start) {
    issues.push({
      id: "no-planning",
      title: "Planning manquant",
      description: "Aucune date d'intervention n'est rattachée à cette mission.",
      tone: "warning",
    });
  }

  if (scheduled && scheduled < Date.now() && !completed) {
    issues.push({
      id: "late",
      title: "Mission en retard",
      description: "La date prévue est passée et la réalisation n'est pas confirmée.",
      tone: "danger",
    });
  }

  if (completed && !mission.invoice_id) {
    issues.push({
      id: "invoice-missing",
      title: "Facture à vérifier",
      description: "La mission est réalisée mais aucune facture liée n'est visible.",
      tone: "warning",
    });
  }

  if (!mission.service_request_id && !mission.quote_id) {
    issues.push({
      id: "origin-missing",
      title: "Origine à rattacher",
      description: "Aucune demande ni devis lié n'est visible, ce qui complique le contrôle du parcours complet.",
      tone: "warning",
    });
  }

  return issues;
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

export function getControlToneLabel(tone: AdminTone) {
  if (tone === "danger") return "Problème";
  if (tone === "warning") return "Surveillance";
  return "OK";
}

export function formatControlStepLabel(step: AdminControlStep) {
  return `${step.ok ? "OK" : "À vérifier"} · ${step.label}`;
}

export function AdminProcessTimeline({ steps }: { steps: AdminTimelineStep[] }) {
  return (
    <ol className={styles.timeline}>
      {steps.map((step) => (
        <li
          className={`${styles.timelineStep} ${step.done ? styles.timelineStepDone : ""} ${
            step.active ? styles.timelineStepActive : ""
          } ${step.tone === "warning" ? styles.timelineStepWarning : ""} ${
            step.tone === "danger" ? styles.timelineStepDanger : ""
          }`}
          key={step.id}
        >
          <span className={styles.timelineIcon}>
            {step.tone === "danger" || step.tone === "warning" ? <FiAlertTriangle /> : step.done ? <FiCheckCircle /> : step.active ? <FiClock /> : <FiFlag />}
          </span>
          <strong>{step.label}</strong>
          {step.helper ? <small className={styles.timelineHelper}>{step.helper}</small> : null}
          {step.adminAction ? (
            step.actionHref ? (
              <Link className={styles.timelineAction} href={step.actionHref}>
                {step.adminAction}
              </Link>
            ) : (
              <small className={styles.timelineAction}>{step.adminAction}</small>
            )
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function AdminIssueList({ issues }: { issues: AdminIssue[] }) {
  if (!issues.length) {
    return (
      <div className={styles.issueOk}>
        <FiCheckCircle />
        <span>Aucun problème détecté sur ce parcours.</span>
      </div>
    );
  }

  return (
    <div className={styles.issueList}>
      {issues.map((issue) => {
        const content = (
          <>
            <span className={`${styles.alertIcon} ${styles[`tone-${issue.tone ?? "warning"}`]}`}>
              <FiAlertTriangle />
            </span>
            <span>
              <strong>{issue.title}</strong>
              <small>{issue.description}</small>
            </span>
          </>
        );

        return issue.href ? (
          <Link className={styles.issueItem} href={issue.href} key={issue.id}>
            {content}
          </Link>
        ) : (
          <div className={styles.issueItem} key={issue.id}>
            {content}
          </div>
        );
      })}
    </div>
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
