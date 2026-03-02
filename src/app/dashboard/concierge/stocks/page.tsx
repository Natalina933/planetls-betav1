"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  buildHousingStockChecks,
  buildInactiveHousingItems,
  buildStockForecast,
  buildUrgentMissionItems,
} from "./stocksHelpers";

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

    void loadStocksContext();
  }, []);

  const activeMissions = useMemo(
    () => missions.filter((mission) => ["assigned", "accepted", "in_progress"].includes(mission.status || "")),
    [missions],
  );
  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent"),
    [missions],
  );
  const inactiveHousings = useMemo(
    () => housings.filter((housing) => housing.statut !== "active" && housing.statut !== "published"),
    [housings],
  );

  const housingCount = housings.length;
  const stockForecast = useMemo(
    () => buildStockForecast(housingCount, activeMissions.length, urgentMissions.length),
    [activeMissions.length, housingCount, urgentMissions.length],
  );

  const housingStockChecks = useMemo(() => buildHousingStockChecks(housings), [housings]);
  const urgentMissionItems = useMemo(() => buildUrgentMissionItems(urgentMissions), [urgentMissions]);
  const inactiveHousingItems = useMemo(
    () => buildInactiveHousingItems(inactiveHousings),
    [inactiveHousings],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Exploitation"
      title="Stocks et consommables"
      description={
        loading
          ? "Preparation du pilotage stock..."
          : error ||
            "Gardez un repere simple sur le linge, les kits d'accueil et les consommables pour eviter les tensions terrain."
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
          value: loading ? "..." : String(stockForecast.welcomeKits),
          hint: "Base minimale recommandee",
        },
        {
          label: "Jeux de linge",
          value: loading ? "..." : String(stockForecast.linenSets),
          hint: "Rotation estimee",
        },
        {
          label: "Reassort menage",
          value: loading ? "..." : String(stockForecast.cleaningUnits),
          hint: "Unites a garder en reserve",
        },
        {
          label: "Tampon urgence",
          value: loading ? "..." : String(stockForecast.backupSets),
          hint: "Reserve minimum pour imprevus",
        },
      ]}
      cards={[
        {
          title: "1. Rotation linge",
          text: `Avec ${housingCount} logement(s), gardez au moins ${stockForecast.linenSets} jeux de linge disponibles pour absorber les check-in et menages consecutifs.`,
        },
        {
          title: "2. Kits voyageurs",
          text:
            urgentMissions.length > 0
              ? `${urgentMissions.length} mission(s) urgente(s) sont en cours : verifiez gels douche, cafe, papier et consommables d'accueil.`
              : "Aucune urgence remontee : profitez-en pour standardiser vos kits voyageurs et vos procedures de reapprovisionnement.",
        },
        {
          title: "3. Biens a fiabiliser",
          text:
            inactiveHousings.length > 0
              ? `${inactiveHousings.length} logement(s) restent incomplets ou inactifs : ils faussent votre estimation stock et votre rotation reelle.`
              : "Tous vos logements sont actifs ou publies, votre base stock est plus simple a piloter.",
        },
      ]}
      detailSections={[
        {
          title: "Controle par logement",
          description:
            "Passez rapidement en revue les biens a reapprovisionner ou a fiabiliser avant les prochains sejours.",
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
          title: "Biens a remettre au carre",
          description:
            "Les logements encore inactifs ou incomplets meritent une verification rapide pour eviter les ecarts de stock.",
          emptyText:
            loading
              ? "Analyse des logements incomplets."
              : error || "Aucun logement brouillon a corriger.",
          items: inactiveHousingItems,
        },
      ]}
    />
  );
}
