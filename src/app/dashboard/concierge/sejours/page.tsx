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

const FILTERS: Array<{ id: StayFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "today", label: "Aujourd'hui" },
  { id: "arrivals", label: "Arrivees" },
  { id: "departures", label: "Departs" },
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
  if (!value) return "A planifier";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "A planifier";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date a renseigner";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date a renseigner";
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
          <dt>Arrivee</dt>
          <dd>{formatDateTime(stay.checkIn)}</dd>
        </div>
        <div>
          <dt>Depart</dt>
          <dd>{formatDateTime(stay.checkOut)}</dd>
        </div>
        <div>
          <dt>Voyageurs</dt>
          <dd>{stay.guestCount ?? stay.adultCount ?? "A renseigner"}</dd>
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

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/concierge/stays?limit=160", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Erreur chargement sejours");
        }
        const payload = (await response.json()) as { stays?: TravelerStayInput[] };

        if (!active) return;
        setStays(payload.stays ?? []);
      } catch {
        if (active) setError("Impossible de charger les sejours voyageurs pour le moment.");
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
      title="Voyageurs et sejours"
      description="Pilotez les arrivees, departs, demandes speciales, incidents et missions liees a chaque sejour."
      metrics={[]}
      focus={{
        title: "Preparation",
        status: "Actif",
        icon: <Users size={20} />,
        heading: "Sejours voyageurs",
        description: "Centre operationnel concierge.",
      }}
      risks={[]}
      cadenceTitle="Cadence"
      cadence={[]}
      detailsBadge="Details"
      detailsTitle="Sejours"
      detailsDescription="Vue operationnelle"
      detailSections={[]}
      primaryActions={[
        { label: "Nouvelle reservation", href: "/dashboard/concierge/missions/overview" },
        { label: "Planning", href: "/dashboard/concierge/planning" },
      ]}
    >
      <section className={styles.kpiGrid} aria-label="Indicateurs sejours voyageurs">
        {[
          { label: "Aujourd'hui", value: dashboard.today, hint: "Arrivees et departs", Icon: CalendarCheck },
          { label: "Arrivees", value: dashboard.arrivalsToday, hint: "A preparer ce jour", Icon: Clock3 },
          { label: "Departs", value: dashboard.departuresToday, hint: "Check-out a suivre", Icon: ShieldCheck },
          { label: "Blocages", value: dashboard.criticalBlockers, hint: "Points critiques", Icon: AlertTriangle },
          { label: "Incidents", value: dashboard.incidentsOpen, hint: "A tracer", Icon: MessageSquare },
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
            <div className={styles.filters} aria-label="Filtres sejours">
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
            loadingLabel="Chargement des sejours voyageurs..."
            emptyLabel="Aucun sejour ne correspond aux filtres. Creez une reservation ou enrichissez les missions existantes."
          >
            <div className={styles.tableWrap}>
              <table className={styles.desktopTable}>
                <thead>
                  <tr>
                    <th>Voyageur</th>
                    <th>Logement</th>
                    <th>Arrivee</th>
                    <th>Depart</th>
                    <th>Preparation</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStays.map((stay) => (
                    <tr key={stay.id} className={selectedStay?.id === stay.id ? styles.rowActive : ""} onClick={() => setSelectedId(stay.id)}>
                      <td>
                        <strong>{stay.primaryTraveler.displayName}</strong>
                        <span>{stay.guestCount ? `${stay.guestCount} voyageur(s)` : "Effectif a confirmer"}</span>
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

        <aside className={styles.detailPanel} aria-label="Detail sejour">
          {selectedStay ? (
            <>
              <div className={styles.detailHeader}>
                <span className={statusClass(selectedStay.status)}>{TRAVELER_STAY_STATUS_LABELS[selectedStay.status]}</span>
                <h2>{selectedStay.primaryTraveler.displayName}</h2>
                <p>{selectedStay.propertyLabel}</p>
              </div>

              <div className={styles.summaryGrid}>
                <div>
                  <span>Arrivee</span>
                  <strong>{formatDate(selectedStay.checkIn)}</strong>
                </div>
                <div>
                  <span>Depart</span>
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
                  <h3>Preparation arrivee</h3>
                </div>
                <ProgressBar value={selectedStay.preparation.completion} />
                {selectedStay.preparation.criticalBlockers.length > 0 ? (
                  <p className={styles.warningText}>
                    Pret arrivee bloque : {selectedStay.preparation.criticalBlockers.join(", ")}.
                  </p>
                ) : (
                  <p className={styles.successText}>Les points critiques sont prets.</p>
                )}
                <WorkflowSteps steps={selectedStay.preparation.steps} />
              </section>

              <section className={styles.panelSection}>
                <div className={styles.sectionTitle}>
                  <CalendarCheck size={17} aria-hidden="true" />
                  <h3>Depart</h3>
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
                    ? `${selectedStay.primaryTraveler.previousStays} sejour(s) deja connus.`
                    : "Aucun historique consolide pour ce voyageur."}
                </p>
                {selectedStay.primaryTraveler.notes ? <p className={styles.note}>{selectedStay.primaryTraveler.notes}</p> : null}
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
              <strong>Aucun sejour selectionne</strong>
              <p>Selectionnez un sejour pour voir la preparation, le depart et l'historique.</p>
            </div>
          )}
        </aside>
      </section>
    </DashboardOperationalPage>
  );
}




