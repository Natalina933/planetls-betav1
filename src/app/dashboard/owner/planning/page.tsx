"use client";

import React, { useEffect, useMemo, useState } from "react";
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

function formatDate(value: string | null) {
  if (!value) return "A planifier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(2)} EUR` : "-";
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

    loadPlanning();
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

      const haystack = [mission.title, mission.priority, mission.status].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [upcomingMissions, searchTerm, statusFilter]);
  const visibleMissions = useMemo(
    () => filteredMissions.slice(0, viewMode === "list" ? 30 : 12),
    [filteredMissions, viewMode],
  );

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
    <section className="dashboard-grid">
      <header>
        <h1>Planning</h1>
        <p>Suivez les interventions planifiees pour vos logements et anticipez les prochaines etapes.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Total missions</h3>
          <p>{loading ? "..." : missions.length}</p>
        </div>
        <div className="stat-card">
          <h3>A venir</h3>
          <p>{loading ? "..." : upcomingMissions.filter((mission) => mission.status !== "completed").length}</p>
        </div>
        <div className="stat-card">
          <h3>Montant prevu</h3>
          <p>
            {loading
              ? "..."
              : formatAmount(filteredMissions.reduce((sum, mission) => sum + (mission.amount ?? 0), 0))}
          </p>
        </div>
      </div>

      <div className="main-section">
        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher une mission"
            className={styles.field}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
          >
            <option value="all">Tous statuts</option>
            <option value="assigned">Assignees</option>
            <option value="accepted">Acceptees</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminees</option>
          </select>
          <select
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as "list" | "week" | "month")}
            className={styles.select}
          >
            <option value="list">Vue liste</option>
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
          <p>Aucune mission planifiee pour le moment.</p>
        ) : null}

        {!loading && !error && filteredMissions.length > 0 ? (
          viewMode === "list" ? (
            <ul>
              {visibleMissions.map((mission) => (
                <li key={mission.id} className={styles.listItem}>
                  <strong>{mission.title || "Mission sans titre"}</strong>
                  <br />
                  Debut : {formatDate(mission.scheduled_start)} | Fin : {formatDate(mission.scheduled_end)}
                  <br />
                  Statut : {mission.status || "-"} | Priorite : {mission.priority || "-"} | Budget :{" "}
                  {formatAmount(mission.amount)}
                </li>
              ))}
            </ul>
          ) : (
            <div
              className={styles.sectionGrid}
            >
              {visibleMissions.map((mission) => (
                <article key={mission.id} className={styles.panel}>
                  <strong>{mission.title || "Mission sans titre"}</strong>
                  <span>{formatDate(mission.scheduled_start)}</span>
                  <span>Statut: {mission.status || "-"}</span>
                  <span>Priorite: {mission.priority || "-"}</span>
                  <span>Budget: {formatAmount(mission.amount)}</span>
                </article>
              ))}
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
