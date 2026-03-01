"use client";

import { useEffect, useState } from "react";
import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

interface ProviderAlertsPayload {
  items: Array<unknown>;
  summary: {
    total: number;
    urgent: number;
  };
  note: string;
}

export default function ProviderAlertesPage() {
  const [data, setData] = useState<ProviderAlertsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/api/provider/alerts", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les alertes.");
        }
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger les alertes.");
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
      eyebrow="Surveillance"
      title="Alertes"
      description={error || data?.note || "Retrouvez les urgences et points de vigilance du compte artisan."}
      chips={[`${data?.summary.total ?? 0} alertes`, `${data?.summary.urgent ?? 0} urgentes`]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/provider/planning" },
        { label: "Voir les interventions", href: "/dashboard/provider/interventions" },
      ]}
      cards={[
        {
          title: "Source d'alertes",
          text: "L'API alertes provider est prete et pourra agreger les urgences metier des que les sources existeront.",
        },
        {
          title: "Couverture future",
          text: "Les retards d'intervention, messages non lus et validations bloquantes pourront alimenter cette vue.",
        },
        {
          title: "Statut actuel",
          text: "Aucune alerte metier provider n'est encore disponible dans le schema en base.",
        },
      ]}
    />
  );
}
