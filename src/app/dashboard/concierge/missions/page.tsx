"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { getMissionPriorityLabel, getMissionStatusLabel, normalizeMissionStatus } from "@/app/lib/missionStatus";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import {
  getConciergeMissionHousingLabel,
  getConciergeMissionView,
  toMissionTimestamp,
  type ConciergeMissionDisplayRow,
  type ConciergeMissionView,
} from "../missionDisplay";
import { Input, Select, StatsCard, TableFilters } from "@/components/ui";
import { MetricGroup } from "@/components/ui/StatsCard/MetricGroup";
import { conciergeApiError } from "../conciergeFeedback";
import styles from "@/app/dashboard/missions/MissionDetailPage.module.scss";
import listStyles from "./page.module.scss";

type MissionRow = ConciergeMissionDisplayRow & {
  description: string | null;
  status: string | null;
  priority: string | null;
  amount: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
};

type HousingRow = {
  id: number | string;
  nom_logement?: string | null;
  ville?: string | null;
};

function getOperationalHint(mission: MissionRow, now: number) {
  const view = getConciergeMissionView(mission, now);
  if (view === "late") return "Retard à traiter avant toute nouvelle planification.";
  if (view === "today") return "Intervention du jour : vérifier l'horaire, les accès et les consignes.";
  if (view === "to_plan") return "À planifier : il manque une date ou une validation opérationnelle.";
  if (view === "done") return "Clôturée : conserver les preuves et le contexte client.";
  return "Intervention programmée : à surveiller dans le planning.";
}

function getNextActionLabel(mission: MissionRow, now: number) {
  const status = normalizeMissionStatus(mission.status);
  const view = getConciergeMissionView(mission, now);

  if (view === "to_plan") return "Planifier l'intervention";
  if (status === "in_progress") return "Poursuivre";
  if (status === "awaiting_owner_validation") return "Voir la validation";
  if (status === "assigned" || status === "accepted") return "Démarrer";
  return "Ouvrir l'intervention";
}

export default function ConciergeMissionsListPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [housings, setHousings] = useState<HousingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState<ConciergeMissionView>("all");
  const [search, setSearch] = useState("");

  const loadMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [missionResponse, housingResponse] = await Promise.all([
        fetch("/api/missions?scope=all&limit=150", { cache: "no-store" }),
        fetch("/api/housing", { cache: "no-store" }),
      ]);
      const missionPayload = await missionResponse.json();
      const housingPayload = await housingResponse.json().catch(() => []);
      if (!missionResponse.ok) {
        throw new Error(conciergeApiError("Impossible de charger les interventions.", missionPayload?.error));
      }
      setMissions(Array.isArray(missionPayload) ? missionPayload : []);
      setHousings(Array.isArray(housingPayload) ? housingPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : conciergeApiError("Impossible de charger les interventions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  const now = Date.now();
  const housingNameById = useMemo(
    () =>
      new Map(
        housings.map((housing) => [
          String(housing.id),
          housing.nom_logement?.trim() || (housing.ville ? `Logement à ${housing.ville}` : `Logement ${housing.id}`),
        ]),
      ),
    [housings],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return missions
      .filter((mission) => viewFilter === "all" || getConciergeMissionView(mission, now) === viewFilter)
      .filter((mission) => statusFilter === "all" || normalizeMissionStatus(mission.status) === statusFilter)
      .filter((mission) => {
        if (!term) return true;
        const housingLabel = getConciergeMissionHousingLabel(mission, housingNameById);
        return [mission.title, housingLabel, mission.description, mission.priority, mission.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          (toMissionTimestamp(a.scheduled_start) || Number.MAX_SAFE_INTEGER) -
          (toMissionTimestamp(b.scheduled_start) || Number.MAX_SAFE_INTEGER),
      );
  }, [housingNameById, missions, now, search, statusFilter, viewFilter]);

  const delayed = filtered.filter((mission) => getConciergeMissionView(mission, now) === "late");
  const undated = filtered.filter(
    (mission) => !mission.scheduled_start && !["completed", "canceled"].includes(normalizeMissionStatus(mission.status)),
  );
  const urgent = filtered.filter((mission) => mission.priority === "urgent" && normalizeMissionStatus(mission.status) !== "completed");
  const viewCounts = useMemo(
    () => ({
      all: missions.length,
      to_plan: missions.filter((mission) => getConciergeMissionView(mission, now) === "to_plan").length,
      today: missions.filter((mission) => getConciergeMissionView(mission, now) === "today").length,
      late: missions.filter((mission) => getConciergeMissionView(mission, now) === "late").length,
      done: missions.filter((mission) => getConciergeMissionView(mission, now) === "done").length,
    }),
    [missions, now],
  );
  const missionKpis = useMemo(
    () => ({
      today: missions.filter((mission) => getConciergeMissionView(mission, now) === "today").length,
      toPlan: missions.filter((mission) => getConciergeMissionView(mission, now) === "to_plan").length,
      inProgress: missions.filter((mission) => normalizeMissionStatus(mission.status) === "in_progress").length,
      awaitingValidation: missions.filter((mission) => normalizeMissionStatus(mission.status) === "awaiting_owner_validation").length,
    }),
    [missions, now],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Interventions"
      title="Mes interventions"
      description="Planifiez, suivez et réalisez les interventions de vos logements."
      chips={[`${delayed.length} en retard`, `${undated.length} sans date`, `${urgent.length} urgente(s)`]}
      actions={[
        { label: "Ajouter une intervention", href: "/dashboard/concierge/interventions/new" },
        { label: "Planning", href: "/dashboard/concierge/planning" },
      ]}
      cards={[]}
      showCardsIntro={false}
      showDetailsIntro={false}
    >
      <div className={styles.page} aria-busy={loading}>
        <MetricGroup className={listStyles.metrics} aria-label="Indicateurs des interventions">
          <StatsCard label="Aujourd'hui" value={String(missionKpis.today)} hint="Interventions prévues ce jour" />
          <StatsCard label="À planifier" value={String(missionKpis.toPlan)} hint="Date ou validation à préciser" />
          <StatsCard label="En cours" value={String(missionKpis.inProgress)} hint="Exécution démarrée" />
          <StatsCard label="En attente de validation" value={String(missionKpis.awaitingValidation)} hint="Réalisation à confirmer" />
        </MetricGroup>

        <section className={`${styles.panel} ${listStyles.filtersPanel}`}>
          <TableFilters showMeta={false} layout="toolbar">
            <label className={styles.label}>
              Recherche
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre, logement, urgence, consigne" />
            </label>
            <label className={styles.label}>
              Statut
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous statuts</option>
                <option value="draft">À qualifier</option>
                <option value="assigned">Assignée</option>
                <option value="accepted">Acceptée</option>
                <option value="scheduled">Planifiée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="canceled">Annulée</option>
              </Select>
            </label>
          </TableFilters>
        </section>

        <section className={styles.panel} aria-label="Files opérationnelles">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Files opérationnelles</p>
              <h2>Interventions à traiter</h2>
            </div>
          </div>
          <div className={styles.segmentedControl} role="tablist" aria-label="Filtrer par priorité opérationnelle">
            {[
              ["all", "Toutes", viewCounts.all],
              ["to_plan", "À planifier", viewCounts.to_plan],
              ["today", "Aujourd'hui", viewCounts.today],
              ["late", "En retard", viewCounts.late],
              ["done", "Terminées", viewCounts.done],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={viewFilter === key}
                className={viewFilter === key ? styles.segmentActive : undefined}
                onClick={() => setViewFilter(key as ConciergeMissionView)}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className={`${styles.message} ${styles.messageError}`} role="alert">
            <span>{error}</span>
            <button type="button" className={styles.linkButton} onClick={() => void loadMissions()}>
              Réessayer
            </button>
          </div>
        ) : null}
        {loading ? <p className={styles.message} role="status">Chargement...</p> : null}
        {!loading && filtered.length === 0 ? <p className={styles.empty}>Aucune intervention ne correspond aux filtres.</p> : null}

        <section className={styles.proofGrid}>
          {filtered.map((mission) => {
            const status = normalizeMissionStatus(mission.status);
            const housingLabel = getConciergeMissionHousingLabel(mission, housingNameById);
            const isDelayed = getConciergeMissionView(mission, now) === "late";
            return (
              <article className={`${styles.proofCard} ${listStyles.missionCard}`} key={mission.id}>
                <div className={styles.sectionHeader}>
                  <div>
                    <strong>{mission.title || "Intervention sans titre"}</strong>
                    {housingLabel ? <p className={listStyles.housingLabel}>{housingLabel}</p> : null}
                  </div>
                  <span className={isDelayed ? `${styles.badge} ${styles.badgeWarning}` : styles.badge}>
                    {isDelayed ? "En retard" : getMissionStatusLabel(status)}
                  </span>
                </div>
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{getMissionPriorityLabel(mission.priority)}</span>
                  <span className={styles.badge}>
                    {formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className={listStyles.description}>{mission.description || "Sans consigne détaillée."}</p>
                <p className={styles.operationalHint}>{getOperationalHint(mission, now)}</p>
                <div className={listStyles.cardFooter}>
                  <span className={listStyles.amount}>Montant : {formatEuroAmountLabel(mission.amount, "-")}</span>
                  <Link className={styles.linkButton} href={`/dashboard/concierge/missions/${mission.id}`}>
                    {getNextActionLabel(mission, now)}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </ConciergeWorkspacePage>
  );
}
