"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import { formatDateValue } from "@/app/utils/formatters";
import { Button, ButtonLink } from "@/components/ui";
import { DashboardSectionShell } from "@/components/dashboard";
import { takeFirst } from "../../shared";
import styles from "../ProviderCrudPage.module.scss";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type ProviderIntervention = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  location_label: string | null;
};

type ProviderInterventionsPayload = {
  items: ProviderIntervention[];
  summary: {
    total: number;
    in_progress: number;
    pending: number;
    completed: number;
  };
  note: string | null;
};

export default function ProviderPlanningPage() {
  const [data, setData] = useState<ProviderInterventionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/api/provider/interventions", { cache: "no-store" });
        const payload = (await response.json()) as ProviderInterventionsPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger le planning.");
        }
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le planning.");
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = useMemo(() => {
    const rows = data?.items ?? [];
    return takeFirst(
      [...rows]
        .filter((item) => item.scheduled_start)
        .sort(
          (a, b) =>
            new Date(a.scheduled_start ?? 0).getTime() - new Date(b.scheduled_start ?? 0).getTime(),
        ),
      10,
    );
  }, [data]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return (data?.items ?? []).filter(
      (item) => item.scheduled_start && new Date(item.scheduled_start).toDateString() === today,
    ).length;
  }, [data]);

  const weekBuckets = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);

    return WEEK_DAYS.map((label, index) => {
      const start = new Date(monday);
      start.setDate(monday.getDate() + index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const events = (data?.items ?? []).filter((item) => {
        if (!item.scheduled_start) return false;
        const date = new Date(item.scheduled_start);
        return date >= start && date < end;
      });
      return { label, events };
    });
  }, [data]);

  const monthCells = useMemo(() => {
    const base = new Date();
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);

    return Array.from({ length: 35 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const events = (data?.items ?? []).filter((item) => {
        if (!item.scheduled_start) return false;
        const eventDate = new Date(item.scheduled_start);
        return eventDate.toDateString() === date.toDateString();
      });
      return {
        key: date.toISOString(),
        day: date.getDate(),
        inMonth: date.getMonth() === base.getMonth(),
        events,
      };
    });
  }, [data]);

  return (
    <DashboardSectionShell
      persona="artisan"
      title="Planning interventions"
      subtitle="Visualisez les échéances, urgences et charges à venir avec une lecture priorisée."
      stats={[
        { label: "Missions", value: `${data?.summary.total ?? 0}` },
        { label: "Aujourd'hui", value: `${todayCount}` },
        { label: "En cours", value: `${data?.summary.in_progress ?? 0}` },
      ]}
      actions={[
        { label: "Voir interventions", href: "/dashboard/provider/interventions" },
        { label: "Voir alertes", href: "/dashboard/provider/alertes" },
      ]}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Planning</p>
            <h1>Suivi des interventions</h1>
            <p>
              {error ||
                data?.note ||
                "Visualisez les prochaines interventions et les charges à venir avec une lecture priorisée."}
            </p>
          </div>
          <div className={styles.metrics}>
            <span>{data?.summary.total ?? 0} missions</span>
            <span>{todayCount} aujourd&apos;hui</span>
            <span>{data?.summary.in_progress ?? 0} en cours</span>
          </div>
        </header>

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Vue d&apos;ensemble</h2>
            </div>
            <div className={styles.counterRow}>
              <span className={styles.counter}>{upcoming.length} à venir</span>
              <span className={styles.counter}>
                {(data?.items ?? []).filter((item) => item.priority === "urgent").length} urgentes
              </span>
              <span className={styles.counter}>
                {(data?.items ?? []).filter((item) => !item.scheduled_start).length} sans date
              </span>
            </div>
            <div className={styles.formActions}>
              <ButtonLink href="/dashboard/provider/interventions" variant="outline" className={styles.actionButton}>
                Voir les interventions
              </ButtonLink>
              <ButtonLink href="/dashboard/provider/alertes" variant="outline" className={styles.actionButton}>
                Voir les alertes
              </ButtonLink>
            </div>
            <div className={styles.spotlightGrid}>
              {takeFirst(weekBuckets, 3).map((bucket) => (
                <article key={bucket.label} className={styles.spotlightCard}>
                  <div className={styles.spotlightHeader}>
                    <span className={styles.badge}>{bucket.label}</span>
                    <strong>{bucket.events.length}</strong>
                  </div>
                  <p className={styles.emptyState}>
                    {bucket.events.length > 0
                      ? `${bucket.events.filter((item) => item.priority === "urgent").length} urgente(s) sur la journée.`
                      : "Journée libre pour absorber les imprévus."}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Prochaines échéances</h2>
              <span>{upcoming.length} ligne(s)</span>
            </div>

            <div className={styles.viewTabs}>
              <Button type="button" variant={viewMode === "list" ? "primary" : "secondary"} size="sm" className={styles.viewTabButton} onClick={() => setViewMode("list")}>
                Prioritaire
              </Button>
              <Button type="button" variant={viewMode === "week" ? "primary" : "secondary"} size="sm" className={styles.viewTabButton} onClick={() => setViewMode("week")}>
                Semaine
              </Button>
              <Button type="button" variant={viewMode === "month" ? "primary" : "secondary"} size="sm" className={styles.viewTabButton} onClick={() => setViewMode("month")}>
                Mois
              </Button>
            </div>

            {viewMode === "list" && upcoming.length === 0 ? (
              <p className={styles.emptyState}>Aucune intervention planifiée pour le moment.</p>
            ) : null}

            {viewMode === "list" && upcoming.length > 0 ? (
              <div className={styles.cardList}>
                {upcoming.map((item) => (
                  <article key={item.id} className={styles.itemCard}>
                    <div className={styles.itemHead}>
                      <div>
                        <h3>
                          <Link href="/dashboard/provider/interventions" className={styles.weekEventTitle}>
                            {item.title}
                          </Link>
                        </h3>
                        <p>{item.location_label || "Lieu à confirmer"}</p>
                      </div>
                      <WorkflowStatusBadge value={item.status || "pending"} />
                    </div>
                    <div className={styles.itemMeta}>
                      <span>
                        {formatDateValue(item.scheduled_start, {
                          emptyLabel: "Non planifié",
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        Fin:{" "}
                        {formatDateValue(item.scheduled_end, {
                          emptyLabel: "Non planifié",
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <WorkflowStatusBadge value={item.priority || "normal"} />
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {viewMode === "week" ? (
              <div className={styles.weekBoard}>
                {weekBuckets.map((bucket) => (
                  <article key={bucket.label} className={styles.weekColumn}>
                    <div className={styles.weekColumnHeader}>
                      <div className={styles.calendarDay}>{bucket.label}</div>
                      <span className={styles.counter}>{bucket.events.length}</span>
                    </div>
                    {bucket.events.length === 0 ? (
                      <span className={styles.weekEmpty}>Libre</span>
                    ) : (
                      bucket.events.map((item) => (
                        <article key={item.id} className={styles.weekEventCard}>
                          <div className={styles.weekEventHead}>
                            <strong>
                              {formatDateValue(item.scheduled_start, {
                                emptyLabel: "--:--",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </strong>
                            <WorkflowStatusBadge value={item.priority || "normal"} />
                          </div>
                          <Link href="/dashboard/provider/interventions" className={styles.weekEventTitle}>
                            {item.title}
                          </Link>
                          <div className={styles.inlineBadge}>
                            <WorkflowStatusBadge value={item.status || "pending"} />
                          </div>
                          <span className={styles.itemMeta}>{item.location_label || "Lieu à confirmer"}</span>
                        </article>
                      ))
                    )}
                  </article>
                ))}
              </div>
            ) : null}

            {viewMode === "month" ? (
              <div className={styles.calendarGrid}>
                {WEEK_DAYS.map((day) => (
                  <div key={day} className={styles.calendarHeader}>
                    {day}
                  </div>
                ))}
                {monthCells.map((cell) => (
                  <article
                    key={cell.key}
                    className={`${styles.calendarCell} ${!cell.inMonth ? styles.calendarCellMuted : ""}`}
                  >
                    <div className={styles.calendarDay}>{cell.day}</div>
                    {takeFirst(cell.events, 2).map((item) => (
                      <Link
                        key={item.id}
                        href="/dashboard/provider/interventions"
                        className={styles.calendarEvent}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </DashboardSectionShell>
  );
}
