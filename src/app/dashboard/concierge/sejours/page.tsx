"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Filter,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { DashboardOperationalPage } from "@/components/dashboard/DashboardOperationalPage";
import { AsyncState } from "@/components/ui/AsyncState";
import {
  TRAVELER_STAY_STATUS_LABELS,
  buildTravelerStay,
  buildTravelerStayDashboard,
  type TravelerStay,
  type TravelerStayInput,
  type TravelerStayStatus,
} from "@/app/lib/travelerStayCenter";
import styles from "./page.module.scss";

type StayFilter = "all" | "today" | "arrivals" | "departures" | "in_progress" | "blockers" | "incidents";

type ReservationTimelineItem = {
  id: string;
  created_at?: string | null;
  event_type?: string | null;
  title?: string | null;
  body?: string | null;
};

type StayReservationDetail = {
  reservation?: {
    id: string;
    owner_name?: string | null;
    concierge_name?: string | null;
    property_label?: string | null;
    access_instructions?: string | null;
    owner_notes?: string | null;
    concierge_notes?: string | null;
    status?: string | null;
    updated_at?: string | null;
  } | null;
  timeline?: ReservationTimelineItem[];
};

const FILTERS: Array<{ id: StayFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "today", label: "Aujourd'hui" },
  { id: "arrivals", label: "Arrivées" },
  { id: "departures", label: "Départs" },
  { id: "in_progress", label: "En cours" },
  { id: "blockers", label: "Infos manquantes" },
  { id: "incidents", label: "Incidents" },
];

const STATUS_TONE: Record<TravelerStayStatus, string> = {
  to_prepare: "neutral",
  missing_information: "warning",
  arrival_to_confirm: "info",
  ready_for_arrival: "success",
  guest_arrived: "success",
  stay_in_progress: "info",
  departure_to_prepare: "warning",
  guest_left: "neutral",
  closed: "neutral",
  canceled: "danger",
  incident_open: "danger",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "À planifier";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "À planifier";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date à renseigner";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à renseigner";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function sameDay(value: string | null | undefined, now = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function statusClass(status: TravelerStayStatus) {
  return `${styles.statusPill} ${styles[`tone_${STATUS_TONE[status]}`]}`;
}

function formatTimelineDate(value: string | null | undefined) {
  if (!value) return "A l'instant";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "A l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className={styles.progressTrack} aria-label={`Progression ${value}%`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function WorkflowSteps({ steps }: { steps: TravelerStay["preparation"]["steps"] }) {
  return (
    <ul className={styles.stepList}>
      {steps.map((step) => (
        <li key={step.id} className={step.done ? styles.stepDone : styles.stepTodo}>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>
            <strong>{step.label}</strong>
            <small>{step.description}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function StayCard({ stay }: { stay: TravelerStay }) {
  return (
    <article className={styles.mobileCard}>
      <div className={styles.cardTop}>
        <div>
          <strong>{stay.primaryTraveler.displayName}</strong>
          <span>{stay.propertyLabel}</span>
        </div>
        <span className={statusClass(stay.status)}>{TRAVELER_STAY_STATUS_LABELS[stay.status]}</span>
      </div>
      <dl className={styles.cardFacts}>
        <div>
          <dt>Arrivée</dt>
          <dd>{formatDateTime(stay.checkIn)}</dd>
        </div>
        <div>
          <dt>Départ</dt>
          <dd>{formatDateTime(stay.checkOut)}</dd>
        </div>
        <div>
          <dt>Voyageurs</dt>
          <dd>{stay.guestCount ?? stay.adultCount ?? "À renseigner"}</dd>
        </div>
      </dl>
      <ProgressBar value={stay.preparation.completion} />
      <Link href="/dashboard/concierge/missions/overview">Ouvrir les missions</Link>
    </article>
  );
}

export default function ConciergeTravelerStaysPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stays, setStays] = useState<TravelerStayInput[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StayFilter>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StayReservationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState({
    accessInstructions: "",
    conciergeNotes: "",
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/concierge/stays?limit=160", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Erreur chargement séjours");
        }
        const payload = (await response.json()) as { stays?: TravelerStayInput[] };

        if (!active) return;
        setStays(payload.stays ?? []);
      } catch {
        if (active) setError("Impossible de charger les séjours voyageurs pour le moment.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const normalizedStays = useMemo(() => stays.map((stay) => buildTravelerStay(stay)), [stays]);
  const dashboard = useMemo(() => buildTravelerStayDashboard(stays), [stays]);
  const selectedStay = useMemo(
    () => normalizedStays.find((stay) => stay.id === selectedId) ?? normalizedStays[0] ?? null,
    [normalizedStays, selectedId],
  );

  useEffect(() => {
    let active = true;

    async function loadReservationDetail() {
      if (!selectedStay?.id) {
        setSelectedDetail(null);
        setDetailError(null);
        return;
      }

      setDetailLoading(true);
      setDetailError(null);
      try {
        const response = await fetch(`/api/reservations/${encodeURIComponent(selectedStay.id)}`, { cache: "no-store" });
        const payload = (await response.json()) as StayReservationDetail & { error?: string };
        if (!response.ok) throw new Error(payload?.error || "Erreur chargement detail sejour");
        if (active) setSelectedDetail(payload);
      } catch (err) {
        if (active) {
          setSelectedDetail(null);
          setDetailError(err instanceof Error ? err.message : "Impossible de charger la timeline du sejour.");
        }
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    void loadReservationDetail();
    return () => {
      active = false;
    };
  }, [selectedStay?.id]);

  useEffect(() => {
    setDetailDraft({
      accessInstructions: selectedDetail?.reservation?.access_instructions ?? "",
      conciergeNotes: selectedDetail?.reservation?.concierge_notes ?? "",
    });
  }, [selectedDetail?.reservation?.access_instructions, selectedDetail?.reservation?.concierge_notes, selectedDetail?.reservation?.status]);

  useEffect(() => {
    if (!detailSuccess) return;
    const timeout = window.setTimeout(() => setDetailSuccess(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [detailSuccess]);

  async function updateReservation(payload: Record<string, unknown>) {
    if (!selectedStay?.id) return;
    setDetailSaving(true);
    setDetailError(null);
    setDetailSuccess(null);
    try {
      const response = await fetch(`/api/reservations/${encodeURIComponent(selectedStay.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as StayReservationDetail & { error?: string };
      if (!response.ok) throw new Error(data?.error || "Impossible de mettre a jour le sejour.");
      setSelectedDetail(data);
      setDetailSuccess("Suivi collaboratif mis a jour.");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Impossible de mettre a jour le sejour.");
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleSaveCollaborativeBrief() {
    await updateReservation({
      patch: {
        access_instructions: detailDraft.accessInstructions,
        concierge_notes: detailDraft.conciergeNotes,
      },
    });
  }

  async function handleConciergeAction(action: "acknowledge" | "completed" | "in_stay") {
    if (action === "acknowledge") {
      await updateReservation({ action: "acknowledge" });
      return;
    }

    await updateReservation({
      patch: {
        status: action,
      },
    });
  }

  const filteredStays = useMemo(() => {
    const now = new Date();
    const search = query.trim().toLowerCase();
    return normalizedStays
      .filter((stay) => {
        if (filter === "today") return sameDay(stay.checkIn, now) || sameDay(stay.checkOut, now);
        if (filter === "arrivals") return sameDay(stay.checkIn, now) || stay.status === "arrival_to_confirm" || stay.status === "ready_for_arrival";
        if (filter === "departures") return sameDay(stay.checkOut, now) || stay.status === "departure_to_prepare";
        if (filter === "in_progress") return stay.status === "stay_in_progress";
        if (filter === "blockers") return stay.preparation.criticalBlockers.length > 0;
        if (filter === "incidents") return stay.status === "incident_open" || (stay.incidents ?? []).length > 0;
        return true;
      })
      .filter((stay) => {
        if (!search) return true;
        return [stay.primaryTraveler.displayName, stay.propertyLabel, stay.channel, stay.ownerName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => new Date(a.checkIn ?? 0).getTime() - new Date(b.checkIn ?? 0).getTime());
  }, [filter, normalizedStays, query]);

  return (
    <DashboardOperationalPage
      tone="concierge"
      badge="Centre voyageurs"
      title="Voyageurs et séjours"
      description="Pilotez les arrivées, départs, demandes spéciales, incidents et missions liées à chaque séjour."
      metrics={[]}
      focus={{
        title: "Préparation",
        status: "Actif",
        icon: <Users size={20} />,
        heading: "Séjours voyageurs",
        description: "Centre opérationnel concierge.",
      }}
      risks={[]}
      cadenceTitle="Cadence"
      cadence={[]}
      detailsBadge="Détails"
      detailsTitle="Séjours"
      detailsDescription="Vue opérationnelle"
      detailSections={[]}
      primaryActions={[
        { label: "Nouvelle réservation", href: "/dashboard/concierge/missions/overview" },
        { label: "Planning", href: "/dashboard/concierge/planning" },
      ]}
    >
      <section className={styles.kpiGrid} aria-label="Indicateurs séjours voyageurs">
        {[
          { label: "Aujourd'hui", value: dashboard.today, hint: "Arrivées et départs", Icon: CalendarCheck },
          { label: "Arrivées", value: dashboard.arrivalsToday, hint: "À préparer ce jour", Icon: Clock3 },
          { label: "Départs", value: dashboard.departuresToday, hint: "Check-out à suivre", Icon: ShieldCheck },
          { label: "Blocages", value: dashboard.criticalBlockers, hint: "Points critiques", Icon: AlertTriangle },
          { label: "Incidents", value: dashboard.incidentsOpen, hint: "À tracer", Icon: MessageSquare },
        ].map(({ label, value, hint, Icon }) => (
          <article key={label} className={styles.kpiCard}>
            <Icon size={18} aria-hidden="true" />
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{hint}</small>
          </article>
        ))}
      </section>

      <section className={styles.workspace}>
        <div className={styles.mainColumn}>
          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <Search size={16} aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher voyageur, logement, canal..." />
            </label>
            <div className={styles.filters} aria-label="Filtres séjours">
              <Filter size={16} aria-hidden="true" />
              {FILTERS.map((item) => (
                <button key={item.id} type="button" className={filter === item.id ? styles.filterActive : ""} onClick={() => setFilter(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <AsyncState
            loading={loading}
            error={error}
            isEmpty={!loading && !error && filteredStays.length === 0}
            loadingLabel="Chargement des séjours voyageurs..."
            emptyLabel="Aucun séjour ne correspond aux filtres. Créez une réservation ou enrichissez les missions existantes."
          >
            <div className={styles.tableWrap}>
              <table className={styles.desktopTable}>
                <thead>
                  <tr>
                    <th>Voyageur</th>
                    <th>Logement</th>
                    <th>Arrivée</th>
                    <th>Départ</th>
                    <th>Préparation</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStays.map((stay) => (
                    <tr key={stay.id} className={selectedStay?.id === stay.id ? styles.rowActive : ""} onClick={() => setSelectedId(stay.id)}>
                      <td>
                        <strong>{stay.primaryTraveler.displayName}</strong>
                        <span>{stay.guestCount ? `${stay.guestCount} voyageur(s)` : "Effectif à confirmer"}</span>
                      </td>
                      <td>
                        <strong>{stay.propertyLabel}</strong>
                        <span>{stay.channel || "Canal a renseigner"}</span>
                      </td>
                      <td>{formatDateTime(stay.checkIn)}</td>
                      <td>{formatDateTime(stay.checkOut)}</td>
                      <td>
                        <ProgressBar value={stay.preparation.completion} />
                        <small>{stay.preparation.completion}%</small>
                      </td>
                      <td>
                        <span className={statusClass(stay.status)}>{TRAVELER_STAY_STATUS_LABELS[stay.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.mobileList}>
                {filteredStays.map((stay) => (
                  <button key={stay.id} type="button" onClick={() => setSelectedId(stay.id)} className={styles.mobileButton}>
                    <StayCard stay={stay} />
                  </button>
                ))}
              </div>
            </div>
          </AsyncState>
        </div>

        <aside className={styles.detailPanel} aria-label="Détail séjour">
          {selectedStay ? (
            <>
              <div className={styles.detailHeader}>
                <span className={statusClass(selectedStay.status)}>{TRAVELER_STAY_STATUS_LABELS[selectedStay.status]}</span>
                <h2>{selectedStay.primaryTraveler.displayName}</h2>
                <p>{selectedStay.propertyLabel}</p>
              </div>

              <div className={styles.summaryGrid}>
                <div>
                  <span>Arrivée</span>
                  <strong>{formatDate(selectedStay.checkIn)}</strong>
                </div>
                <div>
                  <span>Départ</span>
                  <strong>{formatDate(selectedStay.checkOut)}</strong>
                </div>
                <div>
                  <span>Missions</span>
                  <strong>{selectedStay.missions?.length ?? 0}</strong>
                </div>
                <div>
                  <span>Messages</span>
                  <strong>{selectedStay.messagesCount ?? 0}</strong>
                </div>
              </div>

              <section className={styles.panelSection}>
                <div className={styles.sectionTitle}>
                  <Sparkles size={17} aria-hidden="true" />
                  <h3>Préparation arrivée</h3>
                </div>
                <ProgressBar value={selectedStay.preparation.completion} />
                {selectedStay.preparation.criticalBlockers.length > 0 ? (
                  <p className={styles.warningText}>
                    Prêt arrivée bloqué : {selectedStay.preparation.criticalBlockers.join(", ")}.
                  </p>
                ) : (
                  <p className={styles.successText}>Les points critiques sont prêts.</p>
                )}
                <WorkflowSteps steps={selectedStay.preparation.steps} />
              </section>

              <section className={styles.panelSection}>
                <div className={styles.sectionTitle}>
                  <CalendarCheck size={17} aria-hidden="true" />
                  <h3>Départ</h3>
                </div>
                <ProgressBar value={selectedStay.departure.completion} />
                <p>Prochaine action : {selectedStay.departure.nextAction}</p>
                <WorkflowSteps steps={selectedStay.departure.steps} />
              </section>

              <section className={styles.panelSection}>
                <div className={styles.sectionTitle}>
                  <UserRound size={17} aria-hidden="true" />
                  <h3>Historique voyageur</h3>
                </div>
                <p>
                  {selectedStay.primaryTraveler.previousStays
                    ? `${selectedStay.primaryTraveler.previousStays} séjour(s) déjà connus.`
                    : "Aucun historique consolidé pour ce voyageur."}
                </p>
                {selectedStay.primaryTraveler.notes ? <p className={styles.note}>{selectedStay.primaryTraveler.notes}</p> : null}
              </section>

              <section className={styles.panelSection}>
                <div className={styles.sectionTitle}>
                  <ShieldCheck size={17} aria-hidden="true" />
                  <h3>Lecture collaborative</h3>
                </div>
                <div className={styles.editorialFacts}>
                  <div>
                    <span>Proprietaire</span>
                    <strong>{selectedDetail?.reservation?.owner_name || selectedStay.ownerName || "A confirmer"}</strong>
                  </div>
                  <div>
                    <span>Derniere mise a jour</span>
                    <strong>{formatTimelineDate(selectedDetail?.reservation?.updated_at || selectedStay.updatedAt)}</strong>
                  </div>
                </div>
                {selectedDetail?.reservation?.access_instructions ? (
                  <div className={styles.editorialBlock}>
                    <strong>Consignes d'acces</strong>
                    <p>{selectedDetail.reservation.access_instructions}</p>
                  </div>
                ) : (
                  <p className={styles.note}>Aucune consigne d'acces canonique n'est encore renseignee.</p>
                )}
                {selectedDetail?.reservation?.owner_notes ? (
                  <div className={styles.editorialBlock}>
                    <strong>Note proprietaire</strong>
                    <p>{selectedDetail.reservation.owner_notes}</p>
                  </div>
                ) : null}
                <div className={styles.editorialForm}>
                  <label className={styles.fieldLabel}>
                    <span>Consignes d'acces partagees</span>
                    <textarea
                      rows={3}
                      value={detailDraft.accessInstructions}
                      onChange={(event) => setDetailDraft((current) => ({ ...current, accessInstructions: event.target.value }))}
                      placeholder="Codes, remise des cles, parking, accès residence..."
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span>Notes conciergerie</span>
                    <textarea
                      rows={3}
                      value={detailDraft.conciergeNotes}
                      onChange={(event) => setDetailDraft((current) => ({ ...current, conciergeNotes: event.target.value }))}
                      placeholder="Préparation, incident, consigne terrain, détail utile pour le propriétaire..."
                    />
                  </label>
                  {detailError ? <p className={styles.warningText}>{detailError}</p> : null}
                  {detailSuccess ? <p className={styles.successText}>{detailSuccess}</p> : null}
                  <div className={styles.editorialActions}>
                    <button type="button" onClick={() => void handleSaveCollaborativeBrief()} disabled={detailSaving}>
                      {detailSaving ? "Enregistrement..." : "Enregistrer le brief"}
                    </button>
                    {(selectedDetail?.reservation?.status === "shared" || selectedDetail?.reservation?.status === "draft") ? (
                      <button type="button" onClick={() => void handleConciergeAction("acknowledge")} disabled={detailSaving}>
                        Accuser reception
                      </button>
                    ) : null}
                    {selectedDetail?.reservation?.status !== "in_stay" && selectedDetail?.reservation?.status !== "completed" ? (
                      <button type="button" onClick={() => void handleConciergeAction("in_stay")} disabled={detailSaving}>
                        Marquer en sejour
                      </button>
                    ) : null}
                    {selectedDetail?.reservation?.status !== "completed" ? (
                      <button type="button" onClick={() => void handleConciergeAction("completed")} disabled={detailSaving}>
                        Cloturer
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className={styles.panelSection}>
                <div className={styles.sectionTitle}>
                  <Clock3 size={17} aria-hidden="true" />
                  <h3>Timeline recente</h3>
                </div>
                {detailLoading ? <p className={styles.note}>Chargement de la timeline...</p> : null}
                {detailError ? <p className={styles.warningText}>{detailError}</p> : null}
                {!detailLoading && !detailError && (selectedDetail?.timeline?.length ?? 0) === 0 ? (
                  <p className={styles.note}>La timeline se remplira avec les validations, notes et changements de statut.</p>
                ) : null}
                <div className={styles.timelineList}>
                  {(selectedDetail?.timeline ?? []).slice(0, 5).map((item) => (
                    <article key={item.id} className={styles.timelineItem}>
                      <small>{formatTimelineDate(item.created_at)}</small>
                      <strong>{item.title || "Evenement sejour"}</strong>
                      {item.body ? <p>{item.body}</p> : null}
                    </article>
                  ))}
                </div>
              </section>

              <div className={styles.actions}>
                <Link href="/dashboard/concierge/missions/overview">Voir missions</Link>
                <Link href="/dashboard/concierge/messages">Messages</Link>
                <Link href="/dashboard/concierge/maintenance">Incident</Link>
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <Users size={22} aria-hidden="true" />
              <strong>Aucun séjour sélectionné</strong>
              <p>Sélectionnez un séjour pour voir la préparation, le départ et l'historique.</p>
            </div>
          )}
        </aside>
      </section>
    </DashboardOperationalPage>
  );
}








