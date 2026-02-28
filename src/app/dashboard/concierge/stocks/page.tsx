"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type HousingRow = {
  id: number;
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

    loadStocksContext();
  }, []);

  const activeMissions = useMemo(
    () =>
      missions.filter((mission) =>
        ["assigned", "accepted", "in_progress"].includes(mission.status || ""),
      ).length,
    [missions],
  );
  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "urgent").length,
    [missions],
  );
  const housingCount = housings.length;
  const welcomeKits = housingCount * 2;
  const linenSets = Math.max(housingCount * 3, activeMissions * 2);
  const cleaningUnits = Math.max(housingCount, activeMissions);

  return (
    <ConciergeWorkspacePage
      eyebrow="Exploitation"
      title="Stocks et consommables"
      description={
        loading
          ? "Preparation du pilotage stock..."
          : error ||
            "En attendant un inventaire detaille, cette vue vous donne un repere operationnel pour anticiper linge, kits d'accueil et produits menagers."
      }
      chips={[`${housingCount} logement(s) suivis`, `${activeMissions} mission(s) actives`]}
      actions={[
        { label: "Voir mes logements", href: "/dashboard/concierge/logements" },
        { label: "Ouvrir le planning", href: "/dashboard/concierge/planning" },
      ]}
      metrics={[
        {
          label: "Kits accueil",
          value: loading ? "..." : String(welcomeKits),
          hint: "Recommandation minimale",
        },
        {
          label: "Jeux de linge",
          value: loading ? "..." : String(linenSets),
          hint: "Rotation estimee",
        },
        {
          label: "Urgences stock",
          value: loading ? "..." : String(urgentMissions),
          hint: "Missions urgentes pouvant impacter le stock",
        },
      ]}
      cards={[
        {
          title: "Produits menagers",
          text: `Base conseillee: ${cleaningUnits} unite(s) de reapprovisionnement pour couvrir les interventions terrain et les remises en etat.`,
        },
        {
          title: "Linge et rotation",
          text: `Avec ${housingCount} logement(s), gardez au moins ${linenSets} jeux de linge disponibles pour absorber les check-in et menages consecutifs.`,
        },
        {
          title: "Kits voyageurs",
          text:
            urgentMissions > 0
              ? `${urgentMissions} mission(s) urgente(s) sont en cours: verifiez gels douche, cafe, papier et consommables d'accueil.`
              : "Aucune urgence remontee: profitez-en pour standardiser vos kits voyageurs et vos procedures de reappro.",
        },
      ]}
    />
  );
}
