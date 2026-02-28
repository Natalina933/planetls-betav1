"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type MissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
};

function toTimestamp(value: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatDate(value: string | null) {
  if (!value) return "A planifier";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

    loadPlanning();
  }, []);

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      missions
        .filter((mission) => toTimestamp(mission.scheduled_start) >= now)
        .sort((a, b) => toTimestamp(a.scheduled_start) - toTimestamp(b.scheduled_start))
        .slice(0, 4),
    [missions, now],
  );
  const urgent = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent").length,
    [missions],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Organisation terrain"
      title="Planning des interventions"
      description={
        loading
          ? "Preparation de votre planning..."
          : error || "Visualisez vos prochaines interventions et reperez vite les urgences a traiter."
      }
      chips={[`${missions.length} mission(s) chargee(s)`, `${urgent} urgence(s)`]}
      actions={[
        { label: "Voir le calendrier dashboard", href: "/dashboard/concierge" },
        { label: "Ouvrir les missions", href: "/dashboard/concierge/profile?tab=missions" },
      ]}
      metrics={[
        {
          label: "A venir",
          value: loading ? "..." : String(upcoming.length),
          hint: "Interventions planifiees prochainement",
        },
        {
          label: "Urgences",
          value: loading ? "..." : String(urgent),
          hint: "Missions marquees prioritaires",
        },
      ]}
      cards={
        upcoming.length > 0
          ? upcoming.map((mission) => ({
              title: mission.title || "Mission sans titre",
              text: `${formatDate(mission.scheduled_start)} - ${mission.status || "Statut non renseigne"}${mission.priority ? ` - Priorite ${mission.priority}` : ""}`,
              actions: [
                {
                  label: "Mettre a jour mes missions",
                  href: "/dashboard/concierge/profile?tab=missions",
                  variant: "primary",
                },
              ],
            }))
          : [
              {
                title: "Aucune intervention planifiee",
                text: loading
                  ? "Chargement du planning en cours."
                  : error ||
                    "Ajoutez ou confirmez une mission pour voir vos prochaines interventions ici.",
                actions: [
                  {
                    label: "Creer une mission",
                    href: "/dashboard/concierge/profile?tab=missions",
                    variant: "primary",
                  },
                ],
              },
            ]
      }
    />
  );
}
