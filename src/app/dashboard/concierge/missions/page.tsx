"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { getMissionPriorityLabel, getMissionStatusLabel, normalizeMissionStatus } from "@/app/lib/missionStatus";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import { Input, Select } from "@/components/ui";
import styles from "@/app/dashboard/missions/MissionDetailPage.module.scss";

type MissionView = "to_plan" | "today" | "late" | "done" | "all";

type MissionRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  amount: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  metadata?: Record<string, unknown> | null;
};

function toTimestamp(value: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isSameLocalDay(left: number, right: number) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function isClosedStatus(status: string) {
  return status === "completed" || status === "canceled";
}

function getMissionView(mission: MissionRow, now: number): MissionView {
  const status = normalizeMissionStatus(mission.status);
  const start = toTimestamp(mission.scheduled_start);

  if (isClosedStatus(status)) return "done";
  if (!start || status === "draft" || status === "assigned") return "to_plan";
  if (start < now && !isClosedStatus(status)) return "late";
  if (isSameLocalDay(start, now)) return "today";
  return "all";
}

function getOperationalHint(mission: MissionRow, now: number) {
  const view = getMissionView(mission, now);
  if (view === "late") return "Retard à traiter avant toute nouvelle planification.";
  if (view === "today") return "Mission du jour : vérifier l'horaire, les accès et les consignes.";
  if (view === "to_plan") return "À planifier : il manque une date ou une validation opérationnelle.";
  if (view === "done") return "Clôturée : conserver les preuves et le contexte client.";
  return "Mission programmée : à surveiller dans le planning.";
}

export default function ConciergeMissionsListPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState<MissionView>("to_plan");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/missions?scope=all&limit=150", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Impossible de charger les missions.");
        setMissions(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les missions.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const now = Date.now();
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return missions
      .filter((mission) => viewFilter === "all" || getMissionView(mission, now) === viewFilter)
      .filter((mission) => statusFilter === "all" || normalizeMissionStatus(mission.status) === statusFilter)
      .filter((mission) => {
        if (!term) return true;
        return [mission.title, mission.description, mission.priority, mission.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => (toTimestamp(a.scheduled_start) || Number.MAX_SAFE_INTEGER) - (toTimestamp(b.scheduled_start) || Number.MAX_SAFE_INTEGER));
  }, [missions, now, search, statusFilter, viewFilter]);

  const delayed = filtered.filter((mission) => {
    const status = normalizeMissionStatus(mission.status);
    const start = toTimestamp(mission.scheduled_start);
    return start > 0 && start < now && status !== "completed" && status !== "canceled";
  });
  const undated = filtered.filter((mission) => !mission.scheduled_start && !["completed", "canceled"].includes(normalizeMissionStatus(mission.status)));
  const urgent = filtered.filter((mission) => mission.priority === "urgent" && normalizeMissionStatus(mission.status) !== "completed");
  const viewCounts = useMemo(
    () => ({
      to_plan: missions.filter((mission) => getMissionView(mission, now) === "to_plan").length,
      today: missions.filter((mission) => getMissionView(mission, now) === "today").length,
      late: missions.filter((mission) => getMissionView(mission, now) === "late").length,
      done: missions.filter((mission) => getMissionView(mission, now) === "done").length,
      all: missions.length,
    }),
    [missions, now],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Missions"
      title="Liste opérationnelle des missions"
      description={loading ? "Chargement des missions..." : error || "Pilotez les missions confiées, les retards, les urgences et les dossiers sans date."}
      chips={[`${filtered.length} mission(s)`, `${delayed.length} en retard`, `${undated.length} sans date`, `${urgent.length} urgente(s)`]}
      actions={[
        { label: "Planning", href: "/dashboard/concierge/planning" },
        { label: "Configurer mon profil missions", href: "/dashboard/concierge/profile?tab=missions" },
      ]}
      cards={[]}
      showCardsIntro={false}
      showDetailsIntro={false}
    >
      <div className={styles.page}>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Pilotage</p>
              <h2>Toutes les missions</h2>
            </div>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.label}>
              Recherche
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre, urgence, consigne" />
            </label>
            <label className={styles.label}>
              Statut
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous statuts</option>
                <option value="draft">À qualifier</option>
                <option value="assigned">Assignée</option>
                <option value="accepted">Acceptée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="canceled">Annulée</option>
              </Select>
            </label>
          </div>
        </section>

        <section className={styles.panel} aria-label="Files operationnelles">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Files opérationnelles</p>
              <h2>Missions à traiter</h2>
            </div>
          </div>
          <div className={styles.segmentedControl} role="tablist" aria-label="Filtrer par priorité opérationnelle">
            {[
              ["to_plan", "À planifier", viewCounts.to_plan],
              ["today", "Aujourd'hui", viewCounts.today],
              ["late", "En retard", viewCounts.late],
              ["done", "Terminées", viewCounts.done],
              ["all", "Toutes", viewCounts.all],
            ].map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={viewFilter === key}
                className={viewFilter === key ? styles.segmentActive : undefined}
                onClick={() => setViewFilter(key as MissionView)}
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </section>

        {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
        {loading ? <p>Chargement...</p> : null}
        {!loading && filtered.length === 0 ? <p className={styles.empty}>Aucune mission ne correspond aux filtres.</p> : null}

        <section className={styles.proofGrid}>
          {filtered.map((mission) => {
            const status = normalizeMissionStatus(mission.status);
            const isDelayed = toTimestamp(mission.scheduled_start) > 0 && toTimestamp(mission.scheduled_start) < now && status !== "completed" && status !== "canceled";
            return (
              <article className={styles.proofCard} key={mission.id}>
                <div className={styles.sectionHeader}>
                  <div>
                    <strong>{mission.title || "Mission sans titre"}</strong>
                    <p>{mission.description || "Sans consigne détaillée."}</p>
                  </div>
                  <span className={isDelayed ? `${styles.badge} ${styles.badgeWarning}` : styles.badge}>
                    {isDelayed ? "En retard" : getMissionStatusLabel(status)}
                  </span>
                </div>
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{getMissionPriorityLabel(mission.priority)}</span>
                  <span className={styles.badge}>{formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={styles.badge}>{formatEuroAmountLabel(mission.amount, "-")}</span>
                </div>
                <p className={styles.operationalHint}>{getOperationalHint(mission, now)}</p>
                <Link className={styles.linkButton} href={`/dashboard/concierge/missions/${mission.id}`}>
                  Ouvrir la mission
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </ConciergeWorkspacePage>
  );
}
