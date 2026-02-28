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
  const urgentTimeline = useMemo(
    () =>
      missions
        .filter((mission) => mission.priority === "urgent")
        .sort((a, b) => toTimestamp(a.scheduled_start) - toTimestamp(b.scheduled_start))
        .slice(0, 5)
        .map((mission) => ({
          title: mission.title || "Mission urgente",
          meta: formatDate(mission.scheduled_start),
          description: `${mission.status || "Statut non renseigne"} - priorite urgente.`,
          href: "/dashboard/concierge/profile?tab=missions",
          actionLabel: "Traiter",
          tone: "warning" as const,
        })),
    [missions],
  );
  const unscheduledMissions = useMemo(
    () =>
      missions
        .filter((mission) => !mission.scheduled_start && mission.status !== "completed")
        .slice(0, 5)
        .map((mission) => ({
          title: mission.title || "Mission sans date",
          meta: mission.status || "Statut non renseigne",
          description:
            "Mission encore sans date planifiee. A cadrer pour fiabiliser le planning terrain.",
          href: "/dashboard/concierge/profile?tab=missions",
          actionLabel: "Planifier",
          tone: "warning" as const,
        })),
    [missions],
  );
  const statusBreakdown = useMemo(() => {
    const groups = new Map<string, number>();
    missions.forEach((mission) => {
      const key = mission.status || "non_renseigne";
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([status, count]) => ({
        title: status.replaceAll("_", " "),
        meta: `${count} mission(s)`,
        description: "Etat actuel de vos interventions dans le pipe operationnel.",
        href: "/dashboard/concierge/profile?tab=missions",
        actionLabel: "Voir les missions",
        tone:
          status === "completed"
            ? ("success" as const)
            : status === "urgent" || status === "canceled"
              ? ("warning" as const)
              : ("default" as const),
      }));
  }, [missions]);
  const upcomingTimeline = useMemo(
    () =>
      upcoming.map((mission) => ({
        title: mission.title || "Mission sans titre",
        meta: formatDate(mission.scheduled_start),
        description: `${mission.status || "Statut non renseigne"}${mission.priority ? ` - Priorite ${mission.priority}` : ""}`,
        href: "/dashboard/concierge/profile?tab=missions",
        actionLabel: "Mettre a jour",
        tone: mission.priority === "urgent" ? ("warning" as const) : ("default" as const),
      })),
    [upcoming],
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
        {
          label: "Sans date",
          value: loading ? "..." : String(unscheduledMissions.length),
          hint: "Missions encore a planifier",
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
      detailSections={[
        {
          title: "Prochaines interventions",
          description:
            "Votre file des prochaines missions planifiees, utile pour organiser les deplacements et les confirmations terrain.",
          emptyText:
            loading
              ? "Chargement de vos prochaines interventions."
              : error || "Aucune intervention a venir pour le moment.",
          items: upcomingTimeline,
        },
        {
          title: "Etat du pipe missions",
          description:
            "Repartition rapide des missions par statut pour voir ou se concentre votre charge operationnelle.",
          emptyText:
            loading
              ? "Analyse des statuts en cours."
              : error || "Aucune mission disponible pour etablir un etat des lieux.",
          items: statusBreakdown,
        },
        {
          title: "Urgences terrain",
          description:
            "Les interventions urgentes doivent rester visibles en permanence dans votre pilotage quotidien.",
          emptyText:
            loading
              ? "Chargement des urgences."
              : error || "Aucune urgence terrain n'est planifiee.",
          items: urgentTimeline,
        },
        {
          title: "Missions a planifier",
          description:
            "Liste des interventions sans date fixe pour eviter les angles morts dans le planning.",
          emptyText:
            loading
              ? "Analyse des missions sans date."
              : error || "Toutes les missions actives ont deja une date planifiee.",
          items: unscheduledMissions,
        },
      ]}
    />
  );
}
