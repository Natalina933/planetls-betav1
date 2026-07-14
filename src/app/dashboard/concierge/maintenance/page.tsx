"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Hammer,
  History,
  ReceiptText,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import {
  buildMaintenanceWorkflowDashboard,
  type MaintenanceIncidentInput,
  type MaintenanceTraceEvent,
} from "@/app/lib/maintenanceWorkflow";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import styles from "./MaintenancePage.module.scss";

type MissionRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  amount?: number | null;
  currency?: string | null;
  scheduled_start?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

const MAINTENANCE_KEYWORDS = [
  "maintenance",
  "incident",
  "panne",
  "fuite",
  "reparation",
  "artisan",
  "devis",
  "facture",
  "urgence",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asHistory(value: unknown): MaintenanceTraceEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry, index) => ({
      id: cleanString(entry.id) || `history-${index}`,
      label: cleanString(entry.label) || cleanString(entry.event_type) || "Evenement maintenance",
      at: cleanString(entry.at) || cleanString(entry.created_at) || null,
      actor: cleanString(entry.actor) || null,
      detail: cleanString(entry.detail) || cleanString(entry.body) || null,
    }));
}

function asPhotos(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry, index) => ({
      id: cleanString(entry.id) || `photo-${index}`,
      label: cleanString(entry.label) || cleanString(entry.name) || null,
      url: cleanString(entry.url) || cleanString(entry.storage_path) || null,
      created_at: cleanString(entry.created_at) || null,
    }));
}

function getPropertyLabel(mission: MissionRow, metadata: Record<string, unknown>) {
  return (
    cleanString(metadata.property_label) ||
    cleanString(metadata.housing_label) ||
    cleanString(metadata.location_label) ||
    cleanString(metadata.address) ||
    "Logement à préciser"
  );
}

function getMissionTitle(mission: MissionRow, metadata: Record<string, unknown>) {
  return (
    cleanString(metadata.maintenance_title) ||
    cleanString(metadata.incident_title) ||
    cleanString(metadata.mission_title) ||
    cleanString(mission.title) ||
    cleanString(mission.description) ||
    "Incident maintenance"
  );
}

function isMaintenanceMission(mission: MissionRow) {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  const haystack = [
    mission.title,
    mission.description,
    mission.priority,
    metadata.service_type,
    metadata.mission_type,
    metadata.maintenance_incident_id,
    metadata.provider_intervention_id,
    metadata.invoice_id,
    metadata.quote_id,
  ]
    .map((value) => String(value ?? "").toLowerCase())
    .join(" ");

  return MAINTENANCE_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function missionToIncident(mission: MissionRow): MaintenanceIncidentInput {
  const metadata = isRecord(mission.metadata) ? mission.metadata : {};
  const quote = isRecord(metadata.maintenance_quote) ? metadata.maintenance_quote : metadata;
  const invoice = isRecord(metadata.maintenance_invoice) ? metadata.maintenance_invoice : metadata;
  const validation = isRecord(metadata.maintenance_validation) ? metadata.maintenance_validation : metadata;

  return {
    id: cleanString(metadata.maintenance_incident_id) || mission.id,
    missionId: mission.id,
    title: getMissionTitle(mission, metadata),
    description: cleanString(metadata.maintenance_description) || cleanString(mission.description),
    priority: cleanString(metadata.maintenance_priority) || cleanString(mission.priority),
    status: cleanString(metadata.maintenance_status) || cleanString(mission.status),
    missionStatus: cleanString(mission.status),
    propertyLabel: getPropertyLabel(mission, metadata),
    createdAt: mission.created_at ?? null,
    updatedAt: mission.updated_at ?? null,
    photos: asPhotos(metadata.maintenance_photos).length > 0 ? asPhotos(metadata.maintenance_photos) : asPhotos(metadata.proof_links),
    artisan: {
      id: cleanString(metadata.provider_profile_id) || cleanString(metadata.assigned_team_member_id) || null,
      name:
        cleanString(metadata.provider_name) ||
        cleanString(metadata.assigned_team_member_name) ||
        cleanString(metadata.artisan_name) ||
        null,
      status: cleanString(metadata.provider_intervention_status) || null,
    },
    quote: {
      id: cleanString(quote.quote_id) || cleanString(metadata.quote_id) || null,
      number: cleanString(quote.quote_number) || cleanString(metadata.quote_number) || null,
      status: cleanString(quote.quote_status) || cleanString(metadata.quote_status) || null,
      amount: cleanNumber(quote.quote_amount) ?? cleanNumber(metadata.quote_amount),
    },
    validation: {
      status: cleanString(validation.validation_status) || cleanString(metadata.owner_validation_status) || null,
      validatedAt: cleanString(validation.validated_at) || cleanString(metadata.owner_validated_at) || null,
      validatedBy: cleanString(validation.validated_by) || cleanString(metadata.owner_validated_by) || null,
    },
    invoice: {
      id: cleanString(invoice.invoice_id) || cleanString(metadata.invoice_id) || null,
      number: cleanString(invoice.invoice_number) || cleanString(metadata.invoice_number) || null,
      status: cleanString(invoice.invoice_status) || cleanString(metadata.invoice_status) || null,
      amount: cleanNumber(invoice.invoice_amount) ?? cleanNumber(metadata.invoice_amount) ?? cleanNumber(mission.amount),
    },
    history: asHistory(metadata.maintenance_history),
  };
}

function formatDate(value?: string | null) {
  return value ? formatDateValue(value) : "Date a preciser";
}

export default function ConciergeMaintenancePage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMissions() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/missions?scope=concierge&limit=120", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Impossible de charger la maintenance.");
        if (active) setMissions(Array.isArray(payload) ? payload : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Impossible de charger la maintenance.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMissions();
    return () => {
      active = false;
    };
  }, []);

  const dashboard = useMemo(() => {
    const source = missions.filter(isMaintenanceMission).map(missionToIncident);
    return buildMaintenanceWorkflowDashboard({ incidents: source });
  }, [missions]);

  const leadWorkflow = dashboard.workflows[0] ?? null;
  const activeWorkflows = dashboard.workflows.filter((workflow) => workflow.completionPct < 100);
  const completedWorkflows = dashboard.workflows.filter((workflow) => workflow.completionPct === 100);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Maintenance + artisans</p>
          <h1>Workflow incidents tracable</h1>
          <p>
            Pilotez chaque incident depuis la photo terrain jusqu au devis, la validation, la mission, la facture
            et l historique complet.
          </p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/dashboard/concierge/urgences">
            <AlertTriangle size={17} /> Urgences
          </Link>
          <Link href="/dashboard/concierge/billing">
            <ReceiptText size={17} /> Devis & factures
          </Link>
        </div>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.kpis} aria-label="Indicateurs maintenance">
        <Kpi icon={<Wrench size={20} />} label="Incidents" value={loading ? "..." : String(dashboard.total)} hint="Flux maintenance ouvert" />
        <Kpi icon={<AlertTriangle size={20} />} label="Urgents" value={loading ? "..." : String(dashboard.urgent)} hint="Priorité haute" />
        <Kpi icon={<Hammer size={20} />} label="Artisan" value={loading ? "..." : String(dashboard.waitingArtisan)} hint="À assigner" />
        <Kpi icon={<ShieldCheck size={20} />} label="Avancement" value={loading ? "..." : `${dashboard.averageCompletionPct}%`} hint="Moyenne du workflow" />
      </section>

      <section className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Pipeline</p>
                <h2>Incidents actifs</h2>
              </div>
              <span>{activeWorkflows.length} en cours</span>
            </div>

            {loading ? <Empty title="Chargement" text="Analyse des missions maintenance en cours." /> : null}
            {!loading && dashboard.total === 0 ? (
              <Empty title="Aucun incident maintenance" text="Les missions taguées maintenance, incident, panne ou artisan apparaîtront ici." />
            ) : null}

            <div className={styles.workflowList}>
              {activeWorkflows.map((workflow) => (
                <article key={workflow.incidentId} className={styles.workflowCard}>
                  <div className={styles.workflowTop}>
                    <div>
                      <span className={styles.trace}>{workflow.traceabilityId}</span>
                      <h3>{workflow.title}</h3>
                      <p>{workflow.propertyLabel}</p>
                    </div>
                    <strong>{workflow.completionPct}%</strong>
                  </div>

                  <div className={styles.progress} aria-label={`Avancement ${workflow.completionPct}%`}>
                    <span style={{ width: `${workflow.completionPct}%` }} />
                  </div>

                  <div className={styles.steps}>
                    {workflow.steps.map((step) => (
                      <span
                        key={step.id}
                        className={`${styles.step} ${step.done ? styles.stepDone : ""} ${step.current ? styles.stepCurrent : ""}`}
                        title={step.detail}
                      >
                        {step.done ? <CheckCircle2 size={14} /> : getStepIcon(step.id)}
                        {step.label}
                      </span>
                    ))}
                  </div>

                  <div className={styles.workflowFooter}>
                    <span>Prochaine etape : {workflow.steps.find((step) => step.current)?.label}</span>
                    <Link href={`/dashboard/concierge/missions/${workflow.missionId ?? workflow.incidentId}`}>
                      Ouvrir <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Historique</p>
                <h2>Traçabilité récente</h2>
              </div>
              <span>{leadWorkflow?.history.length ?? 0} trace(s)</span>
            </div>
            <div className={styles.timeline}>
              {(leadWorkflow?.history ?? []).slice(0, 6).map((event) => (
                <div key={event.id} className={styles.timelineItem}>
                  <History size={17} />
                  <div>
                    <strong>{event.label}</strong>
                    <p>{event.detail || event.actor || "Evenement conserve dans le dossier incident."}</p>
                  </div>
                  <time>{formatDate(event.at)}</time>
                </div>
              ))}
              {!loading && !leadWorkflow ? <Empty title="Aucune trace" text="La timeline se remplit avec les photos, artisans, devis, factures et evenements mission." /> : null}
            </div>
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Action</p>
                <h2>Priorite du moment</h2>
              </div>
            </div>
            {leadWorkflow ? (
              <div className={styles.focus}>
                <span className={styles.trace}>{leadWorkflow.traceabilityId}</span>
                <h3>{leadWorkflow.title}</h3>
                <p>{leadWorkflow.missing.length > 0 ? `À faire : ${leadWorkflow.missing.join(", ")}` : "Workflow complet et facture."}</p>
                <Link href={`/dashboard/concierge/missions/${leadWorkflow.missionId ?? leadWorkflow.incidentId}`}>
                  Traiter l'incident <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <Empty title="Rien à arbitrer" text="Aucun incident actif détecté pour cette conciergerie." />
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Artisans</p>
                <h2>Mobilisation</h2>
              </div>
            </div>
            <div className={styles.artisans}>
              {dashboard.workflows.slice(0, 5).map((workflow) => (
                <div key={`${workflow.incidentId}-artisan`} className={styles.artisanRow}>
                  <Hammer size={18} />
                  <div>
                    <strong>{workflow.steps.find((step) => step.id === "artisan")?.detail}</strong>
                    <span>{workflow.title}</span>
                  </div>
                </div>
              ))}
              {!loading && dashboard.workflows.length === 0 ? <span>Aucun artisan rattache pour le moment.</span> : null}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Finance</p>
                <h2>Facturation</h2>
              </div>
            </div>
            <div className={styles.financeList}>
              {dashboard.workflows.slice(0, 4).map((workflow) => {
                const mission = missions.find((item) => item.id === (workflow.missionId ?? workflow.incidentId));
                return (
                  <div key={`${workflow.incidentId}-invoice`} className={styles.financeRow}>
                    <ReceiptText size={18} />
                    <div>
                      <strong>{workflow.steps.find((step) => step.id === "invoice")?.detail}</strong>
                      <span>{formatEuroAmountLabel(mission?.amount ?? null)}</span>
                    </div>
                  </div>
                );
              })}
              <Link href="/dashboard/concierge/billing">Voir les devis et factures</Link>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Clotures</p>
                <h2>Incidents resolus</h2>
              </div>
              <span>{completedWorkflows.length}</span>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Kpi({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <article className={styles.kpi}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function getStepIcon(step: string) {
  if (step === "incident") return <AlertTriangle size={14} />;
  if (step === "photo") return <Camera size={14} />;
  if (step === "artisan") return <Hammer size={14} />;
  if (step === "quote") return <FileText size={14} />;
  if (step === "validation") return <FileCheck2 size={14} />;
  if (step === "mission") return <ClipboardCheck size={14} />;
  if (step === "invoice") return <ReceiptText size={14} />;
  return <History size={14} />;
}




