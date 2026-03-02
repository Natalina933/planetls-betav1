"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  buildPlanningStatusBreakdown,
  isPlanningDone,
  normalizePlanningStatus,
  toPlanningItem,
  toTimestamp,
} from "./planningHelpers";

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
      plannedActiveMissions
        .filter((mission) => {
          const ts = toTimestamp(mission.scheduled_start);
          return ts >= todayStart && ts <= todayEnd;
        })
        .slice(0, 6),
    [plannedActiveMissions, todayEnd, todayStart],
  );

  const nextMissions = useMemo(
    () =>
      plannedActiveMissions
        .filter((mission) => {
          const ts = toTimestamp(mission.scheduled_start);
          return ts > now && ts <= next48h;
        })
        .slice(0, 6),
    [next48h, now, plannedActiveMissions],
  );

  const overdueMissions = useMemo(
    () =>
      plannedActiveMissions.filter((mission) => toTimestamp(mission.scheduled_start) < now).slice(0, 6),
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

  const statusBreakdown = useMemo(() => buildPlanningStatusBreakdown(missions), [missions]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Organisation terrain"
      title="Pilotage terrain"
      description={
        loading
          ? "Preparation de votre planning..."
          : error ||
            "Reperez immediatement ce qui doit etre traite aujourd'hui, confirme sous 48 h ou replanifie sans delai."
      }
      chips={[
        `${missions.length} mission(s) chargee(s)`,
        `${urgentMissions.length} urgence(s)`,
        `${unscheduledMissions.length} mission(s) sans date`,
      ]}
      actions={[
        { label: "Revenir a la vue prioritaire", href: "/dashboard/concierge" },
        { label: "Ouvrir les missions", href: "/dashboard/concierge/profile?tab=missions" },
      ]}
      metrics={[
        {
          label: "Aujourd'hui",
          value: loading ? "..." : String(todayMissions.length),
          hint: "Interventions a executer dans la journee",
        },
        {
          label: "48 heures",
          value: loading ? "..." : String(nextMissions.length),
          hint: "Missions a confirmer tres vite",
        },
        {
          label: "En retard",
          value: loading ? "..." : String(overdueMissions.length),
          hint: "Interventions planifiees mais non cloturees",
        },
        {
          label: "Sans date",
          value: loading ? "..." : String(unscheduledMissions.length),
          hint: "Angles morts a securiser",
        },
      ]}
      cards={[
        {
          title: "Aujourd'hui sur le terrain",
          text:
            todayMissions.length > 0
              ? `${todayMissions.length} intervention(s) sont prevues aujourd'hui. Verifiez confirmations, acces au logement et creneaux avant execution.`
              : loading
                ? "Chargement de vos interventions du jour."
                : error || "Aucune intervention n'est prevue aujourd'hui.",
          actions: [
            {
              label: "Voir les missions du jour",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "primary",
            },
          ],
        },
        {
          title: "Missions a replanifier",
          text:
            overdueMissions.length > 0
              ? `${overdueMissions.length} mission(s) semblent en retard ou non mises a jour. Reprenez-les avant qu'elles ne deviennent des irritants client.`
              : "Aucune mission planifiee en retard. Votre cadence terrain reste propre.",
          actions: [
            {
              label: "Traiter les retards",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Urgences et imprevus",
          text:
            urgentMissions.length > 0
              ? `${urgentMissions.length} mission(s) urgentes demandent une verification immediate du planning, du stock et de la disponibilite.`
              : "Aucune urgence active pour le moment. Profitez-en pour assainir vos missions sans date.",
          actions: [
            {
              label: "Voir le pilotage urgent",
              href: "/dashboard/concierge/alertes",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "A traiter aujourd'hui",
          description:
            "Le coeur de votre journee terrain : ce qui doit etre confirme, execute ou clos avant ce soir.",
          emptyText:
            loading
              ? "Chargement des interventions du jour."
              : error || "Aucune intervention prevue aujourd'hui.",
          items: todayMissions.map((mission) => toPlanningItem(mission, "Ouvrir")),
        },
        {
          title: "A confirmer sous 48 h",
          description:
            "Les prochaines interventions qui demandent une validation rapide avec le proprietaire ou l'equipe terrain.",
          emptyText:
            loading
              ? "Chargement des missions a venir."
              : error || "Aucune mission a confirmer dans les 48 prochaines heures.",
          items: nextMissions.map((mission) => toPlanningItem(mission, "Confirmer")),
        },
        {
          title: "Missions en retard",
          description:
            "Interventions deja planifiees mais encore actives. Ce sont les premieres sources de friction a resorber.",
          emptyText:
            loading
              ? "Analyse des missions en retard."
              : error || "Aucune mission en retard detectee.",
          items: overdueMissions.map((mission) => toPlanningItem(mission, "Replanifier", "warning")),
        },
        {
          title: "Missions sans date",
          description:
            "Liste des interventions encore non positionnees dans le temps pour eviter les angles morts operationnels.",
          emptyText:
            loading
              ? "Analyse des missions sans date."
              : error || "Toutes les missions actives ont deja une date planifiee.",
          items: unscheduledMissions.slice(0, 6).map((mission) => ({
            title: mission.title || "Mission sans date",
            meta: normalizePlanningStatus(mission.status),
            description:
              "Cette intervention doit etre cadree avec un creneau precis pour fiabiliser votre planning terrain.",
            href: "/dashboard/concierge/profile?tab=missions",
            actionLabel: "Planifier",
            tone: "warning" as const,
          })),
        },
        {
          title: "Etat du pipe missions",
          description:
            "Vue synthetique de vos statuts pour equilibrer execution, suivi client et cloture des interventions.",
          emptyText:
            loading
              ? "Analyse des statuts en cours."
              : error || "Aucune mission disponible pour etablir un etat des lieux.",
          items: statusBreakdown,
        },
      ]}
    />
  );
}
