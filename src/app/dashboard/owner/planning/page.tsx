"use client";

import React, { useEffect, useMemo, useState } from "react";

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

export default function OwnerPlanningPage() {
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Planning</h1>
        <p>Suivez les interventions planifiees pour vos logements et anticipez les prochaines etapes.</p>
      </header>

      <div className="main-section">
        {loading ? <p>Chargement du planning...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && upcomingMissions.length === 0 ? (
          <p>Aucune mission planifiee pour le moment.</p>
        ) : null}

        {!loading && !error && upcomingMissions.length > 0 ? (
          <ul>
            {upcomingMissions.map((mission) => (
              <li key={mission.id} style={{ marginBottom: "1rem" }}>
                <strong>{mission.title || "Mission sans titre"}</strong>
                <br />
                Debut : {formatDate(mission.scheduled_start)} | Fin : {formatDate(mission.scheduled_end)}
                <br />
                Statut : {mission.status || "-"} | Priorite : {mission.priority || "-"}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
