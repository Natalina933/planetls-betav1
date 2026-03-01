"use client";

import { useEffect, useState } from "react";
import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

interface ProviderInterventionsPayload {
  items: Array<unknown>;
  summary: {
    total: number;
    in_progress: number;
    pending: number;
    completed: number;
  };
  note: string;
}

export default function ProviderInterventionsPage() {
  const [data, setData] = useState<ProviderInterventionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/api/provider/interventions", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les interventions.");
        }
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger les interventions.");
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProviderWorkspacePage
      eyebrow="Execution"
      title="Interventions"
      description={error || data?.note || "Suivez vos chantiers depuis un seul espace."}
      chips={[
        `${data?.summary.total ?? 0} total`,
        `${data?.summary.pending ?? 0} en attente`,
        `${data?.summary.in_progress ?? 0} en cours`,
        `${data?.summary.completed ?? 0} terminees`,
      ]}
      actions={[
        { label: "Voir la vue d'ensemble", href: "/dashboard/provider" },
        { label: "Voir le planning", href: "/dashboard/provider/planning" },
      ]}
      cards={[
        {
          title: "Etat du branchement",
          text:
            data?.items.length
              ? "Des interventions provider sont disponibles."
              : "Aucune intervention provider n'est encore reliee au schema courant.",
        },
        {
          title: "API dediee",
          text: "La page consomme maintenant une API provider specifique, prete a recevoir les futures donnees metier.",
        },
        {
          title: "Suite technique",
          text: "Le prochain branchement utile consiste a relier les missions ou une table provider_interventions au profil artisan.",
        },
      ]}
    />
  );
}
