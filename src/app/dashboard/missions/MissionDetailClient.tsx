"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  FilePlus2,
  MessageSquareText,
  Play,
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
  events: Array<{ id: string; event_type: string; created_at: string }>;
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

function getProofHref(missionId: string, proof: ProofLink) {
  if (proof.storage_path && proof.id) {
    return `/api/missions/${encodeURIComponent(missionId)}/files/${encodeURIComponent(proof.id)}/download`;
  }
  return proof.url || null;
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
      setChecklist(
        Array.isArray(payload.evidence?.checklist) && payload.evidence.checklist.length > 0
          ? payload.evidence.checklist
          : DEFAULT_CHECKLIST,
      );
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
  const messageHref = `/dashboard/${persona}/messages${detail?.conversation_id ? `?conversation=${detail.conversation_id}` : `?mission=${missionId}`}`;
  const canConciergeAct = persona === "concierge";
  const canShowAccept = canConciergeAct && ["draft", "assigned"].includes(currentStatus);
  const canShowStart = canConciergeAct && ["assigned", "accepted"].includes(currentStatus);
  const canShowComplete = canConciergeAct && currentStatus === "in_progress";
  const canShowOwnerValidate = persona === "owner" && ["awaiting_owner_validation", "completed"].includes(currentStatus);
  const canShowCancel = !["completed", "validated", "closed", "canceled"].includes(currentStatus);
  const hasPlanningDate = Boolean(editForm.scheduled_start || mission?.scheduled_start);
  const canRequestDate = ["to_schedule"].includes(currentStatus);
  const canProposeDate = ["to_schedule", "date_requested"].includes(currentStatus);
  const canConfirmDate = ["to_schedule", "date_requested", "date_proposed"].includes(currentStatus);
  const canScheduleDate = ["date_confirmed"].includes(currentStatus);

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
        amount: editForm.amount ? Number(editForm.amount) : undefined,
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

  return (
    <div className={styles.page}>
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
      {success ? <p className={`${styles.message} ${styles.messageSuccess}`}>{success}</p> : null}

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
