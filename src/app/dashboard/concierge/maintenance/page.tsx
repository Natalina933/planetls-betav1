"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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

type ProviderOption = {
  id: string;
  displayName: string;
  companyName?: string | null;
  category?: string | null;
  city?: string | null;
  isPro?: boolean;
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  reported: "Signale",
  qualified: "Qualifie",
  assigned: "Artisan affecte",
  quoted: "Devis recu",
  approved: "Devis valide",
  scheduled: "Planifie",
  in_progress: "En cours",
  resolved: "Resolu",
  closed: "Cloture",
  cancelled: "Annule",
};

const INCIDENT_NEXT_STATUSES: Record<string, string[]> = {
  reported: ["qualified", "cancelled"],
  qualified: ["assigned", "cancelled"],
  assigned: ["quoted", "scheduled", "cancelled"],
  quoted: ["approved", "cancelled"],
  approved: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["resolved", "cancelled"],
  resolved: ["closed", "in_progress"],
  closed: [],
  cancelled: [],
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
  const [persistedIncidents, setPersistedIncidents] = useState<MaintenanceIncidentInput[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [schemaReady, setSchemaReady] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [savingIncidentId, setSavingIncidentId] = useState<string | null>(null);
  const [uploadingIncidentId, setUploadingIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMissions() {
      try {
        setLoading(true);
        setError(null);
        const [missionsResponse, incidentsResponse, providersResponse] = await Promise.all([
          fetch("/api/missions?scope=concierge&limit=120", { cache: "no-store" }),
          fetch("/api/concierge/maintenance", { cache: "no-store" }),
          fetch("/api/profiles/providers?limit=120", { cache: "no-store" }),
        ]);
        const missionsPayload = await missionsResponse.json();
        const incidentsPayload = await incidentsResponse.json();
        const providersPayload = await providersResponse.json();
        if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger la maintenance.");
        if (!incidentsResponse.ok) throw new Error(incidentsPayload?.error || "Impossible de charger les incidents.");
        if (!providersResponse.ok) throw new Error(providersPayload?.error || "Impossible de charger les artisans.");
        if (active) {
          setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
          setPersistedIncidents(Array.isArray(incidentsPayload.items) ? incidentsPayload.items : []);
          setProviders(Array.isArray(providersPayload.items) ? providersPayload.items : []);
          setSchemaReady(incidentsPayload.schema_ready === true);
        }
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
    const legacyIncidents = missions.filter(isMaintenanceMission).map(missionToIncident);
    const persistedMissionIds = new Set(persistedIncidents.map((incident) => incident.missionId).filter(Boolean));
    const source = [...persistedIncidents, ...legacyIncidents.filter((incident) => !persistedMissionIds.has(incident.missionId))];
    return buildMaintenanceWorkflowDashboard({ incidents: source });
  }, [missions, persistedIncidents]);

  const leadWorkflow = dashboard.workflows[0] ?? null;
  const activeWorkflows = dashboard.workflows.filter((workflow) => workflow.completionPct < 100);
  const completedWorkflows = dashboard.workflows.filter((workflow) => workflow.completionPct === 100);

  async function createIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/concierge/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Creation incident impossible.");
      setPersistedIncidents((current) => [payload, ...current]);
      setTitle("");
      setDescription("");
      setPriority("normal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation incident impossible.");
    } finally {
      setSaving(false);
    }
  }
  async function updateIncidentStatus(incidentId: string, status: string) {
    if (!status) return;
    try {
      setSavingIncidentId(incidentId);
      setError(null);
      const response = await fetch(`/api/concierge/maintenance/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Mise a jour impossible.");
      setPersistedIncidents((current) => current.map((incident) => incident.id === incidentId ? payload : incident));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise a jour impossible.");
    } finally {
      setSavingIncidentId(null);
    }
  }
  async function uploadEvidence(incidentId: string, file: File | undefined) {
    if (!file) return;
    try {
      setUploadingIncidentId(incidentId);
      setError(null);
      const form = new FormData();
      form.append("file", file);
      form.append("label", file.name);
      const response = await fetch(`/api/concierge/maintenance/${incidentId}/media`, { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Upload preuve impossible.");
      const photo = {
        id: String(payload.id),
        label: typeof payload.label === "string" ? payload.label : file.name,
        url: `/api/concierge/maintenance/${incidentId}/media/${payload.id}/download`,
        created_at: typeof payload.created_at === "string" ? payload.created_at : new Date().toISOString(),
      };
      setPersistedIncidents((current) => current.map((incident) =>
        incident.id === incidentId ? { ...incident, photos: [photo, ...(incident.photos ?? [])] } : incident,
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload preuve impossible.");
    } finally {
      setUploadingIncidentId(null);
    }
  }
  async function assignProvider(incidentId: string, providerProfileId: string) {
    try {
      setSavingIncidentId(incidentId);
      setError(null);
      const response = await fetch(`/api/concierge/maintenance/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerProfileId: providerProfileId || null }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Affectation impossible.");
      const selectedProvider = providers.find((provider) => provider.id === providerProfileId);
      const hydratedPayload = selectedProvider
        ? { ...payload, artisan: { ...payload.artisan, name: selectedProvider.displayName } }
        : payload;
      setPersistedIncidents((current) => current.map((incident) => incident.id === incidentId ? hydratedPayload : incident));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Affectation impossible.");
    } finally {
      setSavingIncidentId(null);
    }
  }
  function nextIncidentStatuses(incidentId: string) {
    const incident = persistedIncidents.find((entry) => entry.id === incidentId);
    return incident ? INCIDENT_NEXT_STATUSES[String(incident.status ?? "reported")] ?? [] : [];
  }
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

      {schemaReady ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Nouvel incident</p>
              <h2>Qualifier une demande de maintenance</h2>
            </div>
          </div>
          <form className={styles.incidentForm} onSubmit={(event) => void createIncident(event)}>
            <label>
              Titre
              <input value={title} minLength={3} maxLength={160} required onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Priorite
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <label className={styles.descriptionField}>
              Description
              <textarea value={description} maxLength={5000} rows={3} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <button type="submit" disabled={saving}>{saving ? "Creation..." : "Creer l'incident"}</button>
          </form>
        </section>
      ) : (
        <div className={styles.notice}>Mode historique : appliquez la migration maintenance pour creer des incidents persistants.</div>
      )}

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
                    {persistedIncidents.some((incident) => incident.id === workflow.incidentId) ? (
                      <label className={styles.uploadButton}>
                        {uploadingIncidentId === workflow.incidentId ? "Envoi..." : "Ajouter une preuve"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
                          disabled={uploadingIncidentId === workflow.incidentId}
                          onChange={(event) => void uploadEvidence(workflow.incidentId, event.target.files?.[0])}
                        />
                      </label>
                    ) : null}
                    {persistedIncidents.some((incident) => incident.id === workflow.incidentId) ? (
                      <select
                        aria-label={`Affecter un artisan a ${workflow.title}`}
                        value={persistedIncidents.find((incident) => incident.id === workflow.incidentId)?.artisan?.id ?? ""}
                        disabled={savingIncidentId === workflow.incidentId}
                        onChange={(event) => void assignProvider(workflow.incidentId, event.target.value)}
                      >
                        <option value="">Sans artisan</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.displayName}{provider.category ? ` - ${provider.category}` : ""}{provider.city ? ` (${provider.city})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {nextIncidentStatuses(workflow.incidentId).length > 0 ? (
                      <select
                        aria-label={`Faire evoluer ${workflow.title}`}
                        value=""
                        disabled={savingIncidentId === workflow.incidentId}
                        onChange={(event) => void updateIncidentStatus(workflow.incidentId, event.target.value)}
                      >
                        <option value="">Changer le statut</option>
                        {nextIncidentStatuses(workflow.incidentId).map((status) => (
                          <option key={status} value={status}>{INCIDENT_STATUS_LABELS[status] ?? status}</option>
                        ))}
                      </select>
                    ) : null}
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




