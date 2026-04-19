"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { FiTarget } from "react-icons/fi";
import DashboardCalendar, {
  DashboardEvent,
} from "@/app/components/dashboard/calendar/DashboardCalendar";
import MissionSnapshotShell from "@/app/components/dashboard/concierge/MissionSnapshotShell";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { takeFirst } from "../../shared";
import { EditableProfileSection } from "../profile/profileTabSections";
import {
  isPlanningDone,
  normalizePlanningStatus,
  toTimestamp,
} from "./planningHelpers";
import profileStyles from "../profile/ConciergeProfilePage.module.scss";
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

function getShortTime(value: string | null) {
  if (!value) return "--:--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPlanningSummary(missions: MissionRow[]) {
  const withDates = missions.filter((mission) => toTimestamp(mission.scheduled_start) > 0);
  if (withDates.length === 0) return "Aucun créneau confirmé";

  const first = withDates[0];
  const last = withDates[withDates.length - 1];
  const firstDate = new Date(first.scheduled_start as string);
  const lastDate = new Date(last.scheduled_start as string);

  const sameDay = firstDate.toDateString() === lastDate.toDateString();
  const firstLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(firstDate);

  if (sameDay) {
    return `${firstLabel} ${getShortTime(first.scheduled_start)}-${getShortTime(last.scheduled_start)}`;
  }

  const lastLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(lastDate);
  return `${firstLabel} -> ${lastLabel}`;
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

  const unscheduledMissions = useMemo(
    () => missions.filter((mission) => !mission.scheduled_start && !isPlanningDone(mission.status)),
    [missions],
  );

  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent" && !isPlanningDone(mission.status)),
    [missions],
  );

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

  const weekBuckets = useMemo(() => buildWeekBuckets(plannedActiveMissions), [plannedActiveMissions]);
  const planningSummary = useMemo(() => formatPlanningSummary(plannedActiveMissions), [plannedActiveMissions]);
  const todayPrimary = todayMissions[0] ?? null;
  const nextPrimary = nextMissions[0] ?? null;
  const backlogMissions = useMemo(
    () => [...overdueMissions, ...takeFirst(unscheduledMissions, 6)].slice(0, 6),
    [overdueMissions, unscheduledMissions],
  );
  const occupancyRate = useMemo(() => {
    const totalTracked = plannedActiveMissions.length + unscheduledMissions.length;
    if (totalTracked === 0) return 0;
    return Math.round((plannedActiveMissions.length / totalTracked) * 100);
  }, [plannedActiveMissions.length, unscheduledMissions.length]);

  const openLink = (href: string) => () => {
    window.location.href = href;
  };

  const renderPlanningList = (
    eyebrow: string,
    title: string,
    items: MissionRow[],
    emptyText: string,
    actionLabel: string,
    actionHref: string,
    tone: "focus" | "warning" | "neutral" = "neutral",
  ) => (
    <MissionSnapshotShell
      styles={profileStyles}
      eyebrow={eyebrow}
      title={title}
      footer={
        <Link href={actionHref} className={styles.inlineAction}>
          {actionLabel}
        </Link>
      }
    >
      {items.length > 0 ? (
        <div className={styles.priorityList}>
          {items.slice(0, 4).map((mission) => (
            <article key={mission.id} className={styles.priorityItem}>
              <div className={styles.priorityMain}>
                <strong className={styles.priorityTitle}>{mission.title || "Mission sans titre"}</strong>
                <span className={styles.priorityMeta}>
                  {mission.scheduled_start ? getShortTime(mission.scheduled_start) : "À caler"} ·{" "}
                  {normalizePlanningStatus(mission.status)}
                </span>
              </div>
              <span
                className={`${styles.priorityBadge} ${
                  tone === "focus"
                    ? styles.priorityBadgeFocus
                    : tone === "warning"
                      ? styles.priorityBadgeWarning
                      : styles.priorityBadgeNeutral
                }`}
              >
                {mission.priority === "urgent"
                  ? "Urgent"
                  : mission.scheduled_start
                    ? "Planifié"
                    : "À cadrer"}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.priorityEmpty}>{emptyText}</p>
      )}
    </MissionSnapshotShell>
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Planning"
      title="Planning conciergerie"
      description={
        loading
          ? "Préparation de votre planning..."
          : error ||
            "Suivez l'essentiel de votre semaine et ouvrez le calendrier pour ajuster vos créneaux."
      }
      actions={[
        { label: "Revenir au tableau de bord", href: "/dashboard/concierge" },
        { label: "Voir les demandes", href: "/dashboard/concierge/demandes" },
      ]}
      showHeroRailLabels={false}
      metrics={[]}
      cards={[]}
      showMetricsIntro={false}
      showCardsIntro={false}
      detailSections={[]}
      showDetailsIntro={false}
    >
      <div className={`${profileStyles.missionsLayout} ${styles.planningLayout}`}>
        <section className={`${profileStyles.missionsHero} ${styles.planningHero}`}>
          <div className={profileStyles.missionsHeroTitle}>
            <h3 className={styles.planningHeroHeading}>Pilotage du planning</h3>
            <p className={styles.planningHeroLead}>
              Même lecture que dans vos missions : priorités du jour, confirmations à venir, puis calendrier.
            </p>
          </div>

          <div className={`${profileStyles.missionsHeroProgress} ${styles.planningHeroProgress}`}>
            <div className={`${profileStyles.missionsHeroProgressMeta} ${styles.planningHeroProgressMeta}`}>
              <span>Charge de la semaine</span>
              <strong>{loading ? "..." : `${occupancyRate}% planifié`}</strong>
            </div>
            <p className={`${profileStyles.missionsHeroProgressHint} ${styles.planningHeroProgressHint}`}>
              {loading
                ? "Lecture de votre planning en cours."
                : error || `${planningSummary} · ${plannedActiveMissions.length} mission(s) positionnée(s)`}
            </p>
          </div>

          <div className={profileStyles.missionsHeroStats}>
            <article className={`${profileStyles.missionStat} ${styles.planningStat}`}>
              <div className={`${profileStyles.missionStatTop} ${styles.planningStatTop}`}>
                <span className={`${profileStyles.missionStatLabel} ${styles.planningStatLabel}`}>Aujourd&apos;hui</span>
                {todayMissions.length > 0 ? <span className={styles.heroBadge}>À exécuter</span> : null}
              </div>
              <strong>{loading ? "..." : todayMissions.length}</strong>
              <span className={styles.heroStatHint}>
                {todayPrimary?.title || "Aucune intervention prévue"}
              </span>
            </article>

            <article className={`${profileStyles.missionStat} ${styles.planningStat}`}>
              <div className={`${profileStyles.missionStatTop} ${styles.planningStatTop}`}>
                <span className={`${profileStyles.missionStatLabel} ${styles.planningStatLabel}`}>48 heures</span>
              </div>
              <strong>{loading ? "..." : nextMissions.length}</strong>
              <span className={styles.heroStatHint}>
                {nextPrimary?.title || "Aucune confirmation urgente"}
              </span>
            </article>

            <article className={`${profileStyles.missionStat} ${styles.planningStat}`}>
              <div className={`${profileStyles.missionStatTop} ${styles.planningStatTop}`}>
                <span className={`${profileStyles.missionStatLabel} ${styles.planningStatLabel}`}>Sans date</span>
              </div>
              <strong>{loading ? "..." : unscheduledMissions.length}</strong>
              <span className={styles.heroStatHint}>
                {unscheduledMissions.length > 0 ? "Missions à cadrer" : "Planning bien cadré"}
              </span>
            </article>

            <article className={`${profileStyles.missionStat} ${styles.planningStat}`}>
              <div className={`${profileStyles.missionStatTop} ${styles.planningStatTop}`}>
                <span className={`${profileStyles.missionStatLabel} ${styles.planningStatLabel}`}>Urgences</span>
              </div>
              <strong>{loading ? "..." : urgentMissions.length}</strong>
              <span className={styles.heroStatHint}>
                {urgentMissions.length > 0 ? "À garder proches" : "Aucune alerte chaude"}
              </span>
            </article>
          </div>

          <div className={profileStyles.missionsHeroAlerts}>
            <div className={`${profileStyles.missionsHeroAlertCard} ${styles.planningAlertCard}`}>
              <strong>Point de charge</strong>
              <p>
                {loading
                  ? "Analyse de votre semaine."
                  : todayMissions.length > 0
                    ? `${todayMissions.length} intervention(s) concentrée(s) aujourd'hui.`
                    : "Aucune intervention imminente. Vous pouvez sécuriser le reste du planning."}
              </p>
              <Link href="/dashboard/concierge/planning" className={profileStyles.missionsHeroAlertAction}>
                Ouvrir le calendrier
              </Link>
            </div>

            <div className={`${profileStyles.missionsHeroAlertCard} ${styles.planningAlertCard}`}>
              <strong>Points à cadrer</strong>
              <p>
                {loading
                  ? "Vérification des zones à arbitrer."
                  : backlogMissions.length > 0
                    ? `${backlogMissions.length} mission(s) demandent une replanification ou une date.`
                    : "Aucun retard ni mission sans date. Le planning reste centré sur l'exécution."}
              </p>
              <Link href="/dashboard/concierge/demandes" className={profileStyles.missionsHeroAlertAction}>
                Voir les demandes
              </Link>
            </div>
          </div>
        </section>

        <EditableProfileSection
          styles={profileStyles}
          title="Priorités planning"
          icon={<FiTarget />}
          canEdit
          collapsible={false}
          isOpen
          isEditing={false}
          isDirty={false}
          isLoading={false}
          onToggle={() => {}}
          onHeaderKeyDown={() => {}}
          onBeginEdit={openLink("/dashboard/concierge/demandes")}
          onSave={() => {}}
          onCancel={() => {}}
        >
          <div className={styles.priorityGrid}>
            {renderPlanningList(
              "Aujourd'hui",
              "À traiter aujourd'hui",
              todayMissions,
              loading ? "Chargement des interventions du jour." : error || "Aucune intervention prévue aujourd'hui.",
              "Voir le détail",
              "/dashboard/concierge/planning",
              "focus",
            )}

            {renderPlanningList(
              "48 heures",
              "À confirmer sous 48 h",
              nextMissions,
              loading
                ? "Chargement des missions à venir."
                : error || "Aucune mission à confirmer dans les 48 prochaines heures.",
              "Voir les demandes",
              "/dashboard/concierge/demandes",
              "neutral",
            )}

            {renderPlanningList(
              "Points à cadrer",
              "Retards et sans date",
              backlogMissions,
              loading
                ? "Analyse des points à cadrer."
                : error || "Aucun retard ni mission sans date à afficher.",
              "Nettoyer le suivi",
              "/dashboard/concierge/demandes",
              "warning",
            )}
          </div>
        </EditableProfileSection>

        <EditableProfileSection
          styles={profileStyles}
          title="Calendrier terrain"
          icon={<FiTarget />}
          canEdit
          collapsible={false}
          isOpen
          isEditing={false}
          isDirty={false}
          isLoading={false}
          onToggle={() => {}}
          onHeaderKeyDown={() => {}}
          onBeginEdit={openLink("/dashboard/concierge/planning")}
          onSave={() => {}}
          onCancel={() => {}}
        >
          <MissionSnapshotShell
            styles={profileStyles}
            eyebrow="Semaine en cours"
            title="Calendrier terrain"
            footer={
              <span className={styles.calendarFooter}>
                {loading
                  ? "Préparation de la vue semaine."
                  : plannedActiveMissions.length > 0
                    ? `${plannedActiveMissions.length} mission(s) visibles dans le calendrier`
                    : "Aucune intervention planifiée pour le moment"}
              </span>
            }
          >
            <div className={profileStyles.missionMetaGrid}>
              <div className={profileStyles.missionMetaItem}>
                <span>Aujourd&apos;hui</span>
                <strong>{loading ? "..." : todayMissions.length}</strong>
              </div>
              <div className={profileStyles.missionMetaItem}>
                <span>48 heures</span>
                <strong>{loading ? "..." : nextMissions.length}</strong>
              </div>
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
                            <strong className={styles.weekEventTitle}>{mission.title || "Mission sans titre"}</strong>
                            <span className={styles.weekEventMeta}>{normalizePlanningStatus(mission.status)}</span>
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

            <DashboardCalendar events={visualEvents} title="Calendrier" />
          </MissionSnapshotShell>
        </EditableProfileSection>
      </div>
    </ConciergeWorkspacePage>
  );
}
