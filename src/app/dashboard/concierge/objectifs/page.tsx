"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type MissionRow = {
  id: string;
  status: string | null;
  amount: number | null;
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
  const trackedRevenue = useMemo(
    () =>
      missions.reduce(
        (sum, mission) => sum + (typeof mission.amount === "number" ? mission.amount : 0),
        0,
      ),
    [missions],
  );
  const activeHousing = useMemo(
    () =>
      housings.filter((housing) => housing.statut === "active" || housing.statut === "published")
        .length,
    [housings],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Pilotage activite"
      title="Objectifs concierge"
      description={
        loading
          ? "Calcul de vos objectifs d'activite..."
          : error ||
            "Suivez votre charge operationnelle, vos missions terminees et la base de logements que vous pilotez."
      }
      chips={[
        `${activeHousing} logement(s) actifs`,
        `${completedMissions.length} mission(s) terminee(s)`,
      ]}
      actions={[
        { label: "Mettre a jour ma grille tarifaire", href: "/dashboard/concierge/profile?tab=tarifs" },
        { label: "Rechercher de nouveaux biens", href: "/dashboard/concierge/recherche" },
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
          hint: "Somme des montants de missions charges",
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
              ? `${activeMissions.length} mission(s) necessitent encore un suivi. Appuyez-vous sur le planning et la messagerie pour garder le rythme.`
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
    />
  );
}
