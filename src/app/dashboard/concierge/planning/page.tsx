"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  Home,
  KeyRound,
  MapPinned,
  Route,
  TimerReset,
  TriangleAlert,
} from "lucide-react";
import { DashboardOperationalPage, DashboardPanel, type OperationalDetailSection } from "@/components/dashboard";
import DashboardCalendar, { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import { takeFirst } from "../../shared";
import { isPlanningDone, normalizePlanningStatus, toTimestamp } from "./planningHelpers";
import OptimizedRoutePlanner from "./OptimizedRoutePlanner";
import type { Json } from "@/types/supabase";
import styles from "./page.module.scss";

type MissionRow = {
  id: string;
  concierge_profile_id?: string | null;
  owner_profile_id?: string | null;
  property_id?: string | null;
  service_id?: number | null;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
  metadata?: Json | null;
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
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatPlanningSummary(missions: MissionRow[]) {
  const withDates = missions.filter((mission) => toTimestamp(mission.scheduled_start) > 0);
  if (withDates.length === 0) return "Aucun créneau confirmé";

  const first = withDates[0];
  const last = withDates[withDates.length - 1];
  const firstDate = new Date(first.scheduled_start as string);
  const lastDate = new Date(last.scheduled_start as string);
  const firstLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(firstDate);

  if (firstDate.toDateString() === lastDate.toDateString()) {
    return `${firstLabel} ${getShortTime(first.scheduled_start)}-${getShortTime(last.scheduled_start)}`;
  }

  const lastLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(lastDate);
  return `${firstLabel} → ${lastLabel}`;
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

function toDetailItems(items: MissionRow[], fallbackAction: string): OperationalDetailSection["items"] {
  return items.slice(0, 6).map((mission) => ({
    title: mission.title || "Mission sans titre",
    meta: mission.scheduled_start
      ? `${getShortTime(mission.scheduled_start)} · ${normalizePlanningStatus(mission.status)}`
      : `À caler · ${normalizePlanningStatus(mission.status)}`,
    description: mission.description || (mission.priority === "urgent" ? "Intervention urgente à garder proche." : "Mission à suivre dans le planning."),
    action: {
      label: fallbackAction,
      href: `/dashboard/concierge/missions/${mission.id}`,
    },
  }));
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
        const response = await fetch("/api/missions?scope=all&limit=80", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) throw new Error(payload?.error || "Impossible de charger votre planning.");
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

  const backlogMissions = useMemo(
    () => [...overdueMissions, ...takeFirst(unscheduledMissions, 6)].slice(0, 6),
    [overdueMissions, unscheduledMissions],
  );

  const occupancyRate = useMemo(() => {
    const totalTracked = plannedActiveMissions.length + unscheduledMissions.length;
    if (totalTracked === 0) return 0;
    return Math.round((plannedActiveMissions.length / totalTracked) * 100);
  }, [plannedActiveMissions.length, unscheduledMissions.length]);

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
  const mainPriority = overdueMissions[0] || todayMissions[0] || nextMissions[0] || unscheduledMissions[0] || null;

  const detailSections: OperationalDetailSection[] = [
    {
      id: "jour",
      title: "À traiter aujourd'hui",
      description: "Interventions du jour à exécuter ou à surveiller.",
      emptyText: loading ? "Chargement des interventions du jour." : error || "Aucune intervention prévue aujourd'hui.",
      items: toDetailItems(todayMissions, "Voir la mission"),
    },
    {
      id: "48h",
      title: "À confirmer sous 48 h",
      description: "Missions proches à verrouiller avant l'exécution terrain.",
      emptyText: loading ? "Chargement des missions à venir." : error || "Aucune mission à confirmer dans les 48 prochaines heures.",
      items: toDetailItems(nextMissions, "Confirmer"),
    },
    {
      id: "cadrage",
      title: "Retards et sans date",
      description: "Missions qui demandent une replanification ou un créneau.",
      emptyText: loading ? "Analyse des points à cadrer." : error || "Aucun retard ni mission sans date à afficher.",
      items: toDetailItems(backlogMissions, "Cadrer"),
    },
    {
      id: "urgences",
      title: "Urgences planning",
      description: "Missions urgentes à garder visibles dans la tournée.",
      emptyText: loading ? "Analyse des urgences." : error || "Aucune urgence planning active.",
      items: toDetailItems(urgentMissions, "Traiter"),
    },
  ];

  return (
    <DashboardOperationalPage
      tone="concierge"
      badge="Vue opérationnelle"
      title="Planning terrain"
      description={
        loading
          ? "Préparation de votre planning..."
          : error || "Pilotez les interventions du jour, les confirmations proches et les créneaux à cadrer."
      }
      primaryActions={[
        { label: "Voir les demandes", href: "/dashboard/concierge/demandes" },
        { label: "Retour tableau de bord", href: "/dashboard/concierge" },
      ]}
      metrics={[
        {
          label: "Aujourd'hui",
          value: loading ? "..." : String(todayMissions.length),
          hint: todayMissions[0]?.title || "Interventions du jour",
          detailSectionId: "jour",
        },
        {
          label: "48 heures",
          value: loading ? "..." : String(nextMissions.length),
          hint: "Missions à confirmer",
          detailSectionId: "48h",
        },
        {
          label: "Sans date",
          value: loading ? "..." : String(unscheduledMissions.length),
          hint: "Missions à cadrer",
          detailSectionId: "cadrage",
        },
        {
          label: "Charge",
          value: loading ? "..." : `${occupancyRate}%`,
          hint: "Missions positionnées",
        },
      ]}
      focus={{
        title: "Point de charge",
        status: backlogMissions.length > 0 ? "À cadrer" : "Cadré",
        statusVariant: backlogMissions.length > 0 ? "gold" : "success",
        icon: <CalendarClock size={28} />,
        heading: mainPriority ? mainPriority.title || "Mission sans titre" : "Planning sous contrôle",
        description: mainPriority
          ? `${mainPriority.scheduled_start ? getShortTime(mainPriority.scheduled_start) : "Créneau à définir"} · ${normalizePlanningStatus(mainPriority.status)}`
          : "Aucune intervention imminente ou sans date à traiter en priorité.",
        action: mainPriority ? { label: "Ouvrir la mission", href: `/dashboard/concierge/missions/${mainPriority.id}` } : undefined,
      }}
      risks={[
        {
          label: "Terrain",
          value: loading ? "..." : todayMissions.length,
          hint: "À exécuter aujourd'hui",
          icon: MapPinned,
          tone: "info",
          detailSectionId: "jour",
        },
        {
          label: "Retards",
          value: loading ? "..." : overdueMissions.length,
          hint: "Créneaux dépassés",
          icon: TimerReset,
          tone: "danger",
          detailSectionId: "cadrage",
        },
        {
          label: "Urgences",
          value: loading ? "..." : urgentMissions.length,
          hint: "Priorité haute",
          icon: TriangleAlert,
          tone: "warning",
          detailSectionId: "urgences",
        },
        {
          label: "Tournée",
          value: loading ? "..." : plannedActiveMissions.length,
          hint: planningSummary,
          icon: Route,
          tone: "success",
        },
      ]}
      cadenceTitle="Cadence conseillée"
      cadence={[
        { label: "Maintenant", icon: Clock3, text: "Traiter les retards, urgences et interventions du jour." },
        { label: "Avant ce soir", icon: CalendarClock, text: "Confirmer les missions des prochaines 48 heures." },
        { label: "Cette semaine", icon: Route, text: "Optimiser la tournée et réduire les déplacements inutiles." },
      ]}
      detailsBadge="Planning à piloter"
      detailsTitle="Missions à ouvrir"
      detailsDescription="Cliquez sur une métrique ou un risque pour afficher uniquement les missions concernées."
      detailSections={detailSections}
      illustration={{ mainIcon: Home, topRightIcon: KeyRound, topLeftIcon: CalendarClock }}
    >
      <DashboardPanel title="Optimisation de tournée" className={styles.operationalPanel}>
        <OptimizedRoutePlanner missions={missions} />
      </DashboardPanel>

      <DashboardPanel title="Calendrier terrain" className={styles.operationalPanel}>
        <div className={styles.calendarSummary}>
          <span>{loading ? "Préparation de la vue semaine." : `${plannedActiveMissions.length} mission(s) visibles`}</span>
          <strong>{planningSummary}</strong>
        </div>

        <div className={styles.weekBoard}>
          {weekBuckets.map((bucket) => (
            <article key={bucket.key} className={`${styles.weekColumn} ${bucket.isToday ? styles.weekColumnToday : ""}`}>
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
                        <Link className={styles.weekEventTitle} href={`/dashboard/concierge/missions/${mission.id}`}>
                          {mission.title || "Mission sans titre"}
                        </Link>
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
      </DashboardPanel>
    </DashboardOperationalPage>
  );
}
