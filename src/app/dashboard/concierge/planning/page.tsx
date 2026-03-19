"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardCalendar, {
  DashboardEvent,
} from "@/components/dashboard/calendar/DashboardCalendar";
import { formatDateValue } from "@/app/utils/formatters";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { takeFirst } from "../../shared";
import {
  formatPlanningDate,
  isPlanningDone,
  normalizePlanningStatus,
  toPlanningItem,
  toTimestamp,
} from "./planningHelpers";
import styles from "./page.module.scss";

type MissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
};

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getEndOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function getWeekdayLabel(value: string | null) {
  return formatDateValue(value, {
    emptyLabel: "Sans date",
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function getShortTime(value: string | null) {
  if (!value) return "--:--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildWeekBuckets(missions: MissionRow[]) {
  const now = new Date();
  const monday = new Date(now);
  const day = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + index);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const items = missions.filter((mission) => {
      const ts = toTimestamp(mission.scheduled_start);
      return ts >= start.getTime() && ts < end.getTime();
    });

    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(start),
      dateLabel: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(start),
      items,
      isToday: start.toDateString() === now.toDateString(),
    };
  });
}

function getTimelineTone(mission: MissionRow, now: number) {
  const scheduledAt = toTimestamp(mission.scheduled_start);

  if (mission.priority === "urgent" || scheduledAt < now) {
    return "warning";
  }

  if (scheduledAt <= now + 48 * 60 * 60 * 1000) {
    return "focus";
  }

  return "default";
}

export default function ConciergePlanningPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlanning() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/missions?scope=all&limit=80", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger votre planning.");
        }

        setMissions(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger votre planning.");
      } finally {
        setLoading(false);
      }
    }

    void loadPlanning();
  }, []);

  const now = Date.now();
  const todayStart = getStartOfToday();
  const todayEnd = getEndOfToday();
  const next48h = now + 48 * 60 * 60 * 1000;

  const plannedActiveMissions = useMemo(
    () =>
      missions
        .filter((mission) => !isPlanningDone(mission.status) && toTimestamp(mission.scheduled_start) > 0)
        .sort((a, b) => toTimestamp(a.scheduled_start) - toTimestamp(b.scheduled_start)),
    [missions],
  );

  const todayMissions = useMemo(
    () =>
      takeFirst(
        plannedActiveMissions.filter((mission) => {
          const ts = toTimestamp(mission.scheduled_start);
          return ts >= todayStart && ts <= todayEnd;
        }),
        6,
      ),
    [plannedActiveMissions, todayEnd, todayStart],
  );

  const nextMissions = useMemo(
    () =>
      takeFirst(
        plannedActiveMissions.filter((mission) => {
          const ts = toTimestamp(mission.scheduled_start);
          return ts > now && ts <= next48h;
        }),
        6,
      ),
    [next48h, now, plannedActiveMissions],
  );

  const overdueMissions = useMemo(
    () => takeFirst(plannedActiveMissions.filter((mission) => toTimestamp(mission.scheduled_start) < now), 6),
    [now, plannedActiveMissions],
  );

  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent"),
    [missions],
  );

  const unscheduledMissions = useMemo(
    () => missions.filter((mission) => !mission.scheduled_start && !isPlanningDone(mission.status)),
    [missions],
  );

  const occupancyRate = useMemo(() => {
    const totalTracked = plannedActiveMissions.length + unscheduledMissions.length;
    if (totalTracked === 0) return 0;
    return Math.round((plannedActiveMissions.length / totalTracked) * 100);
  }, [plannedActiveMissions.length, unscheduledMissions.length]);

  const dailyLoad = useMemo(() => {
    const buckets = new Map<string, number>();

    plannedActiveMissions.forEach((mission) => {
      const key = getWeekdayLabel(mission.scheduled_start);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return takeFirst(
      Array.from(buckets.entries()).map(([label, count]) => ({ label, count })),
      5,
    );
  }, [plannedActiveMissions]);

  const visualEvents = useMemo<DashboardEvent[]>(
    () =>
      plannedActiveMissions.map((mission) => {
        const start = new Date(mission.scheduled_start as string);
        const end = new Date(start.getTime() + 90 * 60 * 1000);

        return {
          title: mission.title || "Mission sans titre",
          start,
          end,
          type: mission.priority === "urgent" ? "reminder" : "mission",
        };
      }),
    [plannedActiveMissions],
  );

  const timeline = useMemo(
    () =>
      takeFirst(plannedActiveMissions, 8).map((mission) => ({
        id: mission.id,
        title: mission.title || "Mission sans titre",
        meta: formatPlanningDate(mission.scheduled_start),
        status: normalizePlanningStatus(mission.status),
        tone: getTimelineTone(mission, now),
      })),
    [now, plannedActiveMissions],
  );

  const weekBuckets = useMemo(() => buildWeekBuckets(plannedActiveMissions), [plannedActiveMissions]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Planning"
      title="Planning conciergerie"
      description={
        loading
          ? "Préparation de votre planning..."
          : error ||
            "Repérez immédiatement ce qui doit être traité aujourd'hui, confirmé sous 48 h ou cadré avant de créer un trou dans la semaine."
      }
      chips={[
        `${missions.length} mission(s) chargée(s)`,
        `${urgentMissions.length} urgence(s)`,
        `${unscheduledMissions.length} mission(s) sans date`,
      ]}
      actions={[
        { label: "Revenir au tableau de bord", href: "/dashboard/concierge" },
        { label: "Voir les demandes", href: "/dashboard/concierge/demandes" },
        { label: "Voir les urgences", href: "/dashboard/concierge/urgences" },
      ]}
      metrics={[
        {
          label: "Aujourd'hui",
          value: loading ? "..." : String(todayMissions.length),
          hint: "Interventions à exécuter dans la journée",
        },
        {
          label: "48 heures",
          value: loading ? "..." : String(nextMissions.length),
          hint: "Missions à confirmer très vite",
        },
        {
          label: "Sans date",
          value: loading ? "..." : String(unscheduledMissions.length),
          hint: "Angles morts à sécuriser",
        },
      ]}
      cards={[
        {
          title: "Point de charge",
          text:
            todayMissions.length > 0 || nextMissions.length > 0
              ? `${todayMissions.length} intervention(s) aujourd'hui et ${nextMissions.length} dans les 48 heures. C'est le bon niveau de lecture pour sécuriser confirmations, accès et passage de relais.`
              : loading
                ? "Chargement de votre cadence terrain."
                : error || "Aucune intervention imminente. Vous pouvez assainir le reste du pipe.",
          actions: [
            {
              label: "Ouvrir le calendrier",
              href: "/dashboard/concierge/planning",
              variant: "primary",
            },
          ],
        },
        {
          title: "Points à cadrer",
          text:
            urgentMissions.length > 0 || overdueMissions.length > 0 || unscheduledMissions.length > 0
              ? `${urgentMissions.length} urgence(s), ${overdueMissions.length} retard(s) et ${unscheduledMissions.length} mission(s) sans date restent à verrouiller pour garder un planning fiable.`
              : "Aucun retard ni mission sans date. Le planning est propre et peut rester centré sur l'exécution.",
          actions: [
            {
              label: "Traiter les urgences",
              href: "/dashboard/concierge/urgences",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "À traiter aujourd'hui",
          description:
            "Le coeur de votre journée terrain : ce qui doit être confirmé, exécuté ou clos avant ce soir.",
          emptyText:
            loading
              ? "Chargement des interventions du jour."
              : error || "Aucune intervention prévue aujourd'hui.",
          items: todayMissions.map((mission) => toPlanningItem(mission, "Ouvrir")),
        },
        {
          title: "À confirmer sous 48 h",
          description:
            "Les prochaines interventions qui demandent une validation rapide avec le propriétaire ou l'équipe terrain.",
          emptyText:
            loading
              ? "Chargement des missions à venir."
              : error || "Aucune mission à confirmer dans les 48 prochaines heures.",
          items: nextMissions.map((mission) => toPlanningItem(mission, "Confirmer")),
        },
        {
          title: "Retards et missions sans date",
          description:
            "Le stock à fiabiliser en priorité : retards de suivi et interventions encore non positionnées dans le temps.",
          emptyText:
            loading
              ? "Analyse des points à cadrer."
              : error || "Aucun retard ni mission sans date à afficher.",
          items: [
            ...overdueMissions.map((mission) => toPlanningItem(mission, "Replanifier", "warning")),
            ...takeFirst(unscheduledMissions, 6).map((mission) => ({
              title: mission.title || "Mission sans date",
              meta: normalizePlanningStatus(mission.status),
              description:
                "Cette intervention doit être calée sur un créneau précis pour fiabiliser votre semaine.",
              href: "/dashboard/concierge/profile?tab=missions",
              actionLabel: "Planifier",
              tone: "warning" as const,
            })),
          ].slice(0, 6),
        },
      ]}
    >
      <section className={styles.showcase}>
        <div className={styles.overviewCard}>
          <div className={styles.overviewHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Semaine en cours</p>
              <h2 className={styles.sectionTitle}>Lecture visuelle de la charge</h2>
            </div>
            <span className={styles.overviewBadge}>{occupancyRate}% planifié</span>
          </div>

          <div className={styles.loadStrip}>
            {dailyLoad.length > 0 ? (
              dailyLoad.map((item) => (
                <article key={item.label} className={styles.loadCard}>
                  <span className={styles.loadLabel}>{item.label}</span>
                  <strong className={styles.loadValue}>{item.count}</strong>
                  <span className={styles.loadHint}>mission(s)</span>
                </article>
              ))
            ) : (
              <p className={styles.emptyState}>
                {loading
                  ? "Analyse des créneaux en cours."
                  : error || "Aucun créneau exploitable à afficher dans la vue calendrier."}
              </p>
            )}
          </div>

          <div className={styles.weekBoard}>
            {weekBuckets.map((bucket) => (
              <article
                key={bucket.key}
                className={`${styles.weekColumn} ${bucket.isToday ? styles.weekColumnToday : ""}`}
              >
                <div className={styles.weekColumnHeader}>
                  <span className={styles.weekLabel}>{bucket.label}</span>
                  <strong className={styles.weekDate}>{bucket.dateLabel}</strong>
                </div>
                <div className={styles.weekColumnBody}>
                  {bucket.items.length > 0 ? (
                    takeFirst(bucket.items, 3).map((mission) => (
                      <div key={mission.id} className={styles.weekEvent}>
                        <span className={styles.weekEventTime}>{getShortTime(mission.scheduled_start)}</span>
                        <div className={styles.weekEventContent}>
                          <strong className={styles.weekEventTitle}>
                            {mission.title || "Mission sans titre"}
                          </strong>
                          <span className={styles.weekEventMeta}>
                            {normalizePlanningStatus(mission.status)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.weekEmpty}>Libre</p>
                  )}
                </div>
              </article>
            ))}
          </div>

          <DashboardCalendar events={visualEvents} title="Calendrier terrain" />
        </div>

        <aside className={styles.timelinePanel}>
          <div className={styles.timelineHeader}>
            <p className={styles.sectionEyebrow}>Cadence</p>
            <h2 className={styles.sectionTitle}>Prochaines étapes</h2>
            <p className={styles.timelineText}>
              Une timeline courte pour repérer ce qui arrive vite et ce qui glisse.
            </p>
          </div>

          <div className={styles.timelineList}>
            {timeline.length > 0 ? (
              timeline.map((item) => (
                <article key={item.id} className={styles.timelineItem}>
                  <span
                    className={`${styles.timelineDot} ${
                      item.tone === "warning"
                        ? styles.timelineDotWarning
                        : item.tone === "focus"
                          ? styles.timelineDotFocus
                          : styles.timelineDotDefault
                    }`}
                  />
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineMeta}>{item.meta}</p>
                    <h3 className={styles.timelineTitle}>{item.title}</h3>
                    <p className={styles.timelineStatus}>{item.status}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className={styles.emptyState}>
                {loading
                  ? "Chargement de la timeline."
                  : error || "Aucune mission planifiée pour alimenter la timeline."}
              </p>
            )}
          </div>
        </aside>
      </section>
    </ConciergeWorkspacePage>
  );
}
