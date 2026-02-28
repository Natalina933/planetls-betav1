"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type HousingRow = {
  id: number;
  nom?: string | null;
  statut?: string | null;
};

type MissionRow = {
  id: string;
  priority: string | null;
  status: string | null;
};

function normalizeStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "non renseigné";
}

export default function ConciergeStocksPage() {
  const [housings, setHousings] = useState<HousingRow[]>([]);
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStocksContext() {
      try {
        setLoading(true);
        setError(null);
        const [housingResponse, missionsResponse] = await Promise.all([
          fetch("/api/housing", { cache: "no-store" }),
          fetch("/api/missions?scope=all&limit=80", { cache: "no-store" }),
        ]);

        const housingPayload = await housingResponse.json();
        const missionsPayload = await missionsResponse.json();

        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Impossible de charger vos logements.");
        }
        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger vos missions.");
        }

        setHousings(Array.isArray(housingPayload) ? housingPayload : []);
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos stocks.");
      } finally {
        setLoading(false);
      }
    }

    loadStocksContext();
  }, []);

  const activeMissions = useMemo(
    () =>
      missions.filter((mission) =>
        ["assigned", "accepted", "in_progress"].includes(mission.status || ""),
      ),
    [missions],
  );
  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent"),
    [missions],
  );
  const inactiveHousings = useMemo(
    () =>
      housings.filter(
        (housing) => housing.statut !== "active" && housing.statut !== "published",
      ),
    [housings],
  );

  const housingCount = housings.length;
  const welcomeKits = housingCount * 2;
  const linenSets = Math.max(housingCount * 3, activeMissions.length * 2);
  const cleaningUnits = Math.max(housingCount, activeMissions.length);
  const backupSets = Math.max(2, urgentMissions.length);

  const housingStockChecks = useMemo(
    () =>
      housings.slice(0, 8).map((housing) => ({
        title: housing.nom || `Logement #${housing.id}`,
        meta:
          housing.statut === "active" || housing.statut === "published"
            ? "Actif"
            : "À compléter",
        description:
          "Contrôle rapide du linge, des kits d'accueil et des consommables ménage pour ce bien.",
        href: `/dashboard/concierge/logements/${housing.id}`,
        actionLabel: "Ouvrir la fiche",
        tone:
          housing.statut === "active" || housing.statut === "published"
            ? ("success" as const)
            : ("warning" as const),
      })),
    [housings],
  );

  const urgentMissionItems = useMemo(
    () =>
      urgentMissions.slice(0, 6).map((mission) => ({
        title: `Mission ${mission.id.slice(0, 8)}`,
        meta: normalizeStatus(mission.status),
        description:
          "Prévoir linge, consommables et capacité de réaction adaptés à cette intervention urgente.",
        href: "/dashboard/concierge/profile?tab=missions",
        actionLabel: "Vérifier la mission",
        tone: "warning" as const,
      })),
    [urgentMissions],
  );

  const inactiveHousingItems = useMemo(
    () =>
      inactiveHousings.slice(0, 6).map((housing) => ({
        title: housing.nom || `Logement #${housing.id}`,
        meta: housing.statut || "Brouillon",
        description:
          "Ce bien doit être finalisé pour fiabiliser le stock à prévoir et la rotation des consommables.",
        href: `/dashboard/concierge/logements/${housing.id}`,
        actionLabel: "Compléter",
        tone: "warning" as const,
      })),
    [inactiveHousings],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Exploitation"
      title="Stocks et consommables"
      description={
        loading
          ? "Préparation du pilotage stock..."
          : error ||
            "Gardez un repère simple sur le linge, les kits d'accueil et les consommables pour éviter les tensions terrain."
      }
      chips={[
        `${housingCount} logement(s) suivis`,
        `${activeMissions.length} mission(s) actives`,
        `${urgentMissions.length} urgence(s) stock`,
      ]}
      actions={[
        { label: "Voir mes logements", href: "/dashboard/concierge/logements" },
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning" },
      ]}
      metrics={[
        {
          label: "Kits accueil",
          value: loading ? "..." : String(welcomeKits),
          hint: "Base minimale recommandée",
        },
        {
          label: "Jeux de linge",
          value: loading ? "..." : String(linenSets),
          hint: "Rotation estimée",
        },
        {
          label: "Réassort ménage",
          value: loading ? "..." : String(cleaningUnits),
          hint: "Unités à garder en réserve",
        },
        {
          label: "Tampon urgence",
          value: loading ? "..." : String(backupSets),
          hint: "Réserve minimum pour imprévus",
        },
      ]}
      cards={[
        {
          title: "Rotation linge",
          text: `Avec ${housingCount} logement(s), gardez au moins ${linenSets} jeux de linge disponibles pour absorber les check-in et ménages consécutifs.`,
        },
        {
          title: "Kits voyageurs",
          text:
            urgentMissions.length > 0
              ? `${urgentMissions.length} mission(s) urgente(s) sont en cours : vérifiez gels douche, café, papier et consommables d'accueil.`
              : "Aucune urgence remontée : profitez-en pour standardiser vos kits voyageurs et vos procédures de réapprovisionnement.",
        },
        {
          title: "Biens à fiabiliser",
          text:
            inactiveHousings.length > 0
              ? `${inactiveHousings.length} logement(s) restent incomplets ou inactifs : ils faussent votre estimation stock et votre rotation réelle.`
              : "Tous vos logements sont actifs ou publiés, votre base stock est plus simple à piloter.",
        },
      ]}
      detailSections={[
        {
          title: "Contrôle par logement",
          description:
            "Passez rapidement en revue les biens à réapprovisionner ou à fiabiliser avant les prochains séjours.",
          emptyText:
            loading
              ? "Chargement des logements."
              : error || "Aucun logement disponible pour votre checklist stock.",
          items: housingStockChecks,
        },
        {
          title: "Missions qui peuvent tendre vos stocks",
          description:
            "Priorisez ici les interventions qui risquent de consommer plus vite le linge, les produits ou les kits voyageurs.",
          emptyText:
            loading
              ? "Analyse des urgences en cours."
              : error || "Aucune mission urgente n'impacte vos stocks pour l'instant.",
          items: urgentMissionItems,
        },
        {
          title: "Biens à remettre au carré",
          description:
            "Les logements encore inactifs ou incomplets méritent une vérification rapide pour éviter les écarts de stock.",
          emptyText:
            loading
              ? "Analyse des logements incomplets."
              : error || "Aucun logement brouillon à corriger.",
          items: inactiveHousingItems,
        },
      ]}
    />
  );
}
