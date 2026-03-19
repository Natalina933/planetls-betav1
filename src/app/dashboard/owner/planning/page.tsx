"use client";

import React, { useEffect, useMemo, useState } from "react";
import WorkflowStatusBadge from "@/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import { DashboardSectionShell } from "@/components/dashboard";
import { takeFirst } from "../../shared";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import styles from "../OwnerDashboardPages.module.scss";

type OwnerMissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  amount: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
};

function formatShortTime(value: string | null) {
  if (!value) return "--:--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildWeekBuckets(missions: OwnerMissionRow[]) {
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
      if (!mission.scheduled_start) return false;
      const eventDate = new Date(mission.scheduled_start);
      return eventDate >= start && eventDate < end;
    });

    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(start),
      dateLabel: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(start),
      items,
    };
  });
}

export default function OwnerPlanningPage() {
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");

  useEffect(() => {
    async function loadPlanning() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/missions?scope=owner&limit=30", { cache: "no-store" });
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

  const upcomingMissions = useMemo(
    () =>
      [...missions].sort((a, b) => {
        const aTime = a.scheduled_start ? new Date(a.scheduled_start).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.scheduled_start ? new Date(b.scheduled_start).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [missions],
  );

  const filteredMissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return upcomingMissions.filter((mission) => {
      const matchesStatus = statusFilter === "all" || (mission.status ?? "pending") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [mission.title, mission.priority, mission.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [upcomingMissions, searchTerm, statusFilter]);

  const visibleMissions = useMemo(
    () => takeFirst(filteredMissions, viewMode === "list" ? 30 : 12),
    [filteredMissions, viewMode],
  );

  const weekBuckets = useMemo(() => buildWeekBuckets(filteredMissions), [filteredMissions]);

  function exportPlanningCsv() {
    const rows = [
      ["Mission", "Statut", "Priorite", "Debut", "Fin", "Montant"],
      ...filteredMissions.map((mission) => [
        mission.title ?? "",
        mission.status ?? "",
        mission.priority ?? "",
        mission.scheduled_start ?? "",
        mission.scheduled_end ?? "",
        mission.amount?.toString() ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "owner-planning.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <DashboardSectionShell
      persona="owner"
      title="Planning propriétaire"
      subtitle="Repérez en priorité ce qui doit être confirmé, exécuté ou replanifié sur votre parc."
      stats={[
        { label: "Interventions", value: loading ? "..." : `${missions.length}` },
        {
          label: "À traiter",
          value: loading
            ? "..."
            : `${upcomingMissions.filter((mission) => mission.status !== "completed").length}`,
        },
        {
          label: "Budget suivi",
          value: loading
            ? "..."
            : formatEuroAmountLabel(filteredMissions.reduce((sum, mission) => sum + (mission.amount ?? 0), 0), "-"),
        },
      ]}
      actions={[
        { label: "Mission urgente", href: "/dashboard/owner/mission-urgente" },
        { label: "Messages", href: "/dashboard/owner/messages" },
      ]}
    >
      <header>
        <h1>Suivi des interventions</h1>
        <p>Repérez en priorité ce qui doit être confirmé, exécuté ou replanifié sur votre parc.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Interventions suivies</h3>
          <p>{loading ? "..." : missions.length}</p>
        </div>
        <div className="stat-card">
          <h3>À traiter</h3>
          <p>{loading ? "..." : upcomingMissions.filter((mission) => mission.status !== "completed").length}</p>
        </div>
        <div className="stat-card">
          <h3>Budget suivi</h3>
          <p>
            {loading
              ? "..."
              : formatEuroAmountLabel(filteredMissions.reduce((sum, mission) => sum + (mission.amount ?? 0), 0), "-")}
          </p>
        </div>
      </div>

      <div className="main-section">
        <section className={styles.heroPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Vue planning</p>
              <h2>Semaine propriétaire</h2>
            </div>
          </div>

          <div className={styles.priorityGrid}>
            {weekBuckets.slice(0, 4).map((bucket) => (
              <article key={bucket.key} className={styles.priorityCard}>
                <p className={styles.cardLabel}>
                  {bucket.label} {bucket.dateLabel}
                </p>
                <strong className={styles.cardValue}>{bucket.items.length}</strong>
                <p className={styles.meta}>
                  {bucket.items.length > 0
                    ? `${bucket.items.filter((mission) => mission.priority === "urgent").length} urgente(s) à surveiller.`
                    : "Aucune intervention planifiée."}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher une intervention"
            className={styles.field}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
            aria-label="Filtrer les interventions par statut"
            title="Filtrer les interventions par statut"
          >
            <option value="all">Tous statuts</option>
            <option value="assigned">Assignées</option>
            <option value="accepted">Acceptées</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminées</option>
          </select>
          <select
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as "list" | "week" | "month")}
            className={styles.select}
            aria-label="Choisir le mode d'affichage du planning"
            title="Choisir le mode d'affichage du planning"
          >
            <option value="list">Vue prioritaire</option>
            <option value="week">Vue semaine</option>
            <option value="month">Vue mois</option>
          </select>
          <button
            type="button"
            onClick={exportPlanningCsv}
            disabled={filteredMissions.length === 0}
            className={styles.buttonSecondary}
          >
            Export CSV
          </button>
        </div>

        {loading ? <p>Chargement du planning...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && filteredMissions.length === 0 ? (
          <p>Aucune intervention planifiée pour le moment.</p>
        ) : null}

        {!loading && !error && filteredMissions.length > 0 ? (
          viewMode === "list" ? (
            <ul>
              {visibleMissions.map((mission) => (
                <li key={mission.id} className={styles.listItem}>
                  <strong>{mission.title || "Mission sans titre"}</strong>
                  <br />
                  Début : {formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} | Fin : {formatDateValue(mission.scheduled_end, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  <br />
                  Statut : {mission.status || "-"} | Priorité : {mission.priority || "-"} | Budget :{" "}
                  {formatEuroAmountLabel(mission.amount, "-")}
                </li>
              ))}
            </ul>
          ) : viewMode === "week" ? (
            <div className={styles.weekBoard}>
              {weekBuckets.map((bucket) => (
                <article key={bucket.key} className={styles.weekColumn}>
                  <div className={styles.metricLabel}>
                    <span>
                      {bucket.label} {bucket.dateLabel}
                    </span>
                    <span>{bucket.items.length}</span>
                  </div>
                  {bucket.items.length > 0 ? (
                    bucket.items.map((mission) => (
                      <article key={mission.id} className={styles.weekEventCard}>
                        <strong>{formatShortTime(mission.scheduled_start)}</strong>
                        <span>{mission.title || "Mission sans titre"}</span>
                        <div className={styles.inlineActions}>
                          <WorkflowStatusBadge value={mission.status || "pending"} />
                          <WorkflowStatusBadge value={mission.priority || "normal"} />
                        </div>
                        <span className={styles.meta}>
                          {mission.status || "-"} | {formatEuroAmountLabel(mission.amount, "-")}
                        </span>
                      </article>
                    ))
                  ) : (
                    <p className={styles.meta}>Libre</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.sectionGrid}>
              {visibleMissions.map((mission) => (
                <article key={mission.id} className={styles.panel}>
                  <strong>{mission.title || "Mission sans titre"}</strong>
                  <span>{formatDateValue(mission.scheduled_start, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <div className={styles.inlineActions}>
                    <WorkflowStatusBadge value={mission.status || "pending"} />
                    <WorkflowStatusBadge value={mission.priority || "normal"} />
                  </div>
                  <span>Budget: {formatEuroAmountLabel(mission.amount, "-")}</span>
                </article>
              ))}
            </div>
          )
        ) : null}
      </div>
    </DashboardSectionShell>
  );
}

