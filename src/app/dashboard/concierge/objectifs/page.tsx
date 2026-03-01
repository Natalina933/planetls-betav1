"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  buildCompletedMissionHighlights,
  buildObjectiveChecklist,
  computeAverageRevenue,
  computeCompletionRate,
  countActiveHousing,
  sumTrackedRevenue,
} from "./objectifsHelpers";

type MissionRow = {
  id: string;
  status: string | null;
  amount: number | null;
  title?: string | null;
};

type HousingRow = {
  id: number;
  statut: string | null;
};

export default function ConciergeObjectifsPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [housings, setHousings] = useState<HousingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [missionsResponse, housingResponse] = await Promise.all([
          fetch("/api/missions?scope=all&limit=100", { cache: "no-store" }),
          fetch("/api/housing", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsResponse.json();
        const housingPayload = await housingResponse.json();

        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger vos missions.");
        }
        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Impossible de charger vos logements.");
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setHousings(Array.isArray(housingPayload) ? housingPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos objectifs.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === "completed"),
    [missions],
  );
  const activeMissions = useMemo(
    () =>
      missions.filter((mission) =>
        ["assigned", "accepted", "in_progress"].includes(mission.status || ""),
      ),
    [missions],
  );
  const trackedRevenue = useMemo(() => sumTrackedRevenue(missions), [missions]);
  const activeHousing = useMemo(() => countActiveHousing(housings), [housings]);
  const averageRevenue = useMemo(
    () => computeAverageRevenue(trackedRevenue, completedMissions.length),
    [completedMissions.length, trackedRevenue],
  );
  const completionRate = useMemo(
    () => computeCompletionRate(missions.length, completedMissions.length),
    [completedMissions.length, missions.length],
  );

  const objectiveChecklist = useMemo(
    () =>
      buildObjectiveChecklist({
        activeHousing,
        activeMissionCount: activeMissions.length,
        averageRevenue,
        completionRate,
      }),
    [activeHousing, activeMissions.length, averageRevenue, completionRate],
  );

  const completedMissionHighlights = useMemo(
    () => buildCompletedMissionHighlights(completedMissions),
    [completedMissions],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Pilotage activite"
      title="Objectifs"
      description={
        loading
          ? "Calcul de vos objectifs d'activite..."
          : error ||
            "Suivez votre traction commerciale, votre volume d'execution et vos reperes de rentabilite depuis un seul ecran."
      }
      chips={[
        `${activeHousing} logement(s) actifs`,
        `${completedMissions.length} mission(s) terminee(s)`,
        `${completionRate} % de cloture`,
      ]}
      actions={[
        { label: "Mettre a jour mes tarifs", href: "/dashboard/concierge/profile?tab=tarifs" },
        { label: "Voir la recherche", href: "/dashboard/concierge/recherche" },
      ]}
      metrics={[
        {
          label: "Missions actives",
          value: loading ? "..." : String(activeMissions.length),
          hint: "Interventions a suivre maintenant",
        },
        {
          label: "Missions terminees",
          value: loading ? "..." : String(completedMissions.length),
          hint: "Livrables deja executes",
        },
        {
          label: "Revenus traces",
          value: loading ? "..." : `${trackedRevenue.toFixed(0)} EUR`,
          hint: "Montants consolides",
        },
        {
          label: "Panier moyen",
          value: loading ? "..." : averageRevenue > 0 ? `${averageRevenue.toFixed(0)} EUR` : "-",
          hint: "Revenu moyen par mission terminee",
        },
      ]}
      cards={[
        {
          title: "Cap sur la conversion",
          text:
            activeHousing === 0
              ? "Aucun logement actif n'est encore rattache a votre compte. Commencez par publier votre premier bien ou relancer un proprietaire."
              : `Votre portefeuille compte ${activeHousing} logement(s) actif(s). Conservez un taux de reponse rapide pour accelerer la signature des prochains proprietaires.`,
          actions: [
            {
              label: "Gerer mes logements",
              href: "/dashboard/concierge/logements",
              variant: "primary",
            },
          ],
        },
        {
          title: "Missions a prioriser",
          text:
            activeMissions.length > 0
              ? `${activeMissions.length} mission(s) necessitent encore un suivi. Appuyez-vous sur le planning et les messages pour garder le rythme.`
              : "Aucune mission en cours. Profitez-en pour mettre a jour votre profil public et capter de nouvelles demandes.",
          actions: [
            {
              label: "Voir mes missions",
              href: "/dashboard/concierge/profile?tab=missions",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Levier premium",
          text:
            "Activez ou consolidez votre offre PRO pour valoriser votre note, votre historique Stripe et votre niveau de service dans les parcours proprietaires.",
          actions: [
            {
              label: "Voir mon abonnement",
              href: "/abonnement/concierge-pro",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "Checklist objectifs",
          description:
            "Quatre leviers simples pour garder un pilotage clair : acquisition, execution, marge et cloture.",
          emptyText: "Aucun objectif disponible.",
          items: objectiveChecklist,
        },
        {
          title: "Dernieres missions terminees",
          description:
            "Appuyez-vous sur vos interventions deja livrees pour ajuster vos prix, votre charge et vos objectifs mensuels.",
          emptyText:
            loading
              ? "Chargement des missions terminees."
              : error || "Aucune mission terminee n'est encore disponible.",
          items: completedMissionHighlights,
        },
      ]}
    />
  );
}
