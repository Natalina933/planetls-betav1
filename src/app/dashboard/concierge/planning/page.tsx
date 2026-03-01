"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  buildPlanningStatusBreakdown,
  formatPlanningDate,
  getEndOfToday,
  getStartOfToday,
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
    () => plannedActiveMissions.filter((mission) => toTimestamp(mission.scheduled_start) < now).slice(0, 6),
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
      title="Planning des interventions"
      description={
        loading
          ? "Préparation de votre planning..."
          : error ||
            "Repérez immédiatement ce qui doit être traité aujourd'hui, dans les 48 heures, ou replanifié."
      }
      chips={[
        `${missions.length} mission(s) chargée(s)`,
        `${urgentMissions.length} urgence(s)`,
        `${unscheduledMissions.length} mission(s) sans date`,
      ]}
      actions={[
        { label: "Voir le tableau de bord", href: "/dashboard/concierge" },
        { label: "Ouvrir les missions", href: "/dashboard/concierge/profile?tab=missions" },
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
          label: "En retard",
          value: loading ? "..." : String(overdueMissions.length),
          hint: "Interventions planifiées mais non clôturées",
        },
        {
          label: "Sans date",
          value: loading ? "..." : String(unscheduledMissions.length),
          hint: "Angles morts à sécuriser",
        },
      ]}
      cards={[
        {
          title: "Aujourd'hui sur le terrain",
          text:
            todayMissions.length > 0
              ? `${todayMissions.length} intervention(s) sont prévues aujourd'hui. Vérifiez les confirmations, l'accès au logement et les créneaux.`
              : loading
                ? "Chargement de vos interventions du jour."
                : error || "Aucune intervention n'est prévue aujourd'hui.",
          actions: [
            {
              label: "Voir les missions du jour",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "primary",
            },
          ],
        },
        {
          title: "Missions à replanifier",
          text:
            overdueMissions.length > 0
              ? `${overdueMissions.length} mission(s) semblent en retard ou non mises à jour. Reprenez-les avant qu'elles ne deviennent des irritants client.`
              : "Aucune mission planifiée en retard. Votre cadence terrain reste propre.",
          actions: [
            {
              label: "Traiter les retards",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Urgences et imprévus",
          text:
            urgentMissions.length > 0
              ? `${urgentMissions.length} mission(s) urgentes demandent une vérification immédiate du planning, du stock et de la disponibilité.`
              : "Aucune urgence active pour le moment. Profitez-en pour nettoyer vos missions sans date.",
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
          title: "À traiter aujourd'hui",
          description:
            "Le cœur de votre journée terrain : ce qui doit être confirmé, exécuté ou clos avant ce soir.",
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
          title: "Missions en retard",
          description:
            "Interventions déjà planifiées mais encore actives. Ce sont les premières sources de friction à résorber.",
          emptyText:
            loading
              ? "Analyse des missions en retard."
              : error || "Aucune mission en retard détectée.",
          items: overdueMissions.map((mission) => toPlanningItem(mission, "Replanifier", "warning")),
        },
        {
          title: "Missions sans date",
          description:
            "Liste des interventions encore non positionnées dans le temps pour éviter les angles morts opérationnels.",
          emptyText:
            loading
              ? "Analyse des missions sans date."
              : error || "Toutes les missions actives ont déjà une date planifiée.",
          items: unscheduledMissions.slice(0, 6).map((mission) => ({
            title: mission.title || "Mission sans date",
            meta: normalizePlanningStatus(mission.status),
            description:
              "Cette intervention doit être cadrée avec un créneau précis pour fiabiliser votre planning terrain.",
            href: "/dashboard/concierge/profile?tab=missions",
            actionLabel: "Planifier",
            tone: "warning" as const,
          })),
        },
        {
          title: "État du pipe missions",
          description:
            "Vue synthétique de vos statuts pour équilibrer exécution, suivi client et clôture des interventions.",
          emptyText:
            loading
              ? "Analyse des statuts en cours."
              : error || "Aucune mission disponible pour établir un état des lieux.",
          items: statusBreakdown,
        },
      ]}
    />
  );
}
