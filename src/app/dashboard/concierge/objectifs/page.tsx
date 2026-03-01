"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

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
  const averageRevenue = useMemo(
    () => (completedMissions.length > 0 ? trackedRevenue / completedMissions.length : 0),
    [completedMissions.length, trackedRevenue],
  );
  const completionRate = useMemo(() => {
    if (missions.length === 0) return 0;
    return Math.round((completedMissions.length / missions.length) * 100);
  }, [completedMissions.length, missions.length]);

  const objectiveChecklist = useMemo(
    () => [
      {
        title: "Developper le portefeuille actif",
        meta: `${activeHousing} logement(s) actif(s)`,
        description:
          activeHousing >= 5
            ? "Votre base active commence a etre solide. Continuez a qualifier les nouveaux biens."
            : "Captez ou activez davantage de logements pour lisser votre charge et vos revenus.",
        href: "/dashboard/concierge/recherche",
        actionLabel: "Voir la recherche",
        tone: activeHousing >= 5 ? ("success" as const) : ("warning" as const),
      },
      {
        title: "Maintenir le pipe missions",
        meta: `${activeMissions.length} mission(s) en cours`,
        description:
          activeMissions.length > 0
            ? "Votre pipe est actif. Gardez du rythme dans les confirmations et les clotures."
            : "Aucune mission active. Relancez vos contacts et reveillez le pipe commercial.",
        href: "/dashboard/concierge/profile?tab=missions",
        actionLabel: "Voir les missions",
        tone: activeMissions.length > 0 ? ("success" as const) : ("warning" as const),
      },
      {
        title: "Valoriser votre revenu moyen",
        meta: averageRevenue > 0 ? `${averageRevenue.toFixed(0)} EUR / mission` : "Aucun historique",
        description:
          averageRevenue > 0
            ? "Analysez vos prix et vos forfaits pour proteger la marge sur chaque intervention."
            : "Commencez a tracer les montants de mission pour piloter vos objectifs financiers.",
        href: "/dashboard/concierge/profile?tab=tarifs",
        actionLabel: "Revoir mes tarifs",
      },
      {
        title: "Ameliorer le taux de cloture",
        meta: `${completionRate} % de missions cloturees`,
        description:
          completionRate >= 60
            ? "Votre cadence de livraison est saine. Continuez a fermer rapidement les dossiers termines."
            : "Travaillez le suivi des missions ouvertes pour eviter l'accumulation de taches non cloturees.",
        href: "/dashboard/concierge/planning",
        actionLabel: "Voir le planning",
        tone: completionRate >= 60 ? ("success" as const) : ("warning" as const),
      },
    ],
    [activeHousing, activeMissions.length, averageRevenue, completionRate],
  );

  const completedMissionHighlights = useMemo(
    () =>
      completedMissions.slice(0, 6).map((mission) => ({
        title: mission.title || `Mission ${mission.id.slice(0, 8)}`,
        meta:
          typeof mission.amount === "number"
            ? `${mission.amount.toFixed(0)} EUR`
            : "Montant non renseigne",
        description:
          "Mission cloturee. Utilisez ces donnees pour evaluer votre rythme de livraison et votre rentabilite.",
        href: "/dashboard/concierge/profile?tab=missions",
        actionLabel: "Analyser",
        tone: "success" as const,
      })),
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
        {
          label: "Mettre a jour mes tarifs",
          href: "/dashboard/concierge/profile?tab=tarifs",
        },
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
