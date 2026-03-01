"use client";

import { useEffect, useState } from "react";
import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

interface ProviderMessagesPayload {
  items: Array<unknown>;
  summary: {
    total: number;
    unread: number;
  };
  note: string;
}

export default function ProviderMessagesPage() {
  const [data, setData] = useState<ProviderMessagesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/api/provider/messages", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les messages.");
        }
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger les messages.");
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
      eyebrow="Communication"
      title="Messages"
      description={error || data?.note || "Consultez ici vos echanges clients et suivis terrain."}
      chips={[`${data?.summary.total ?? 0} conversations`, `${data?.summary.unread ?? 0} non lus`]}
      actions={[
        { label: "Voir les clients", href: "/dashboard/provider/clients" },
        { label: "Voir les alertes", href: "/dashboard/provider/alertes" },
      ]}
      cards={[
        {
          title: "Contrat d'API en place",
          text: "La page Messages est maintenant branchee sur une API provider dediee.",
        },
        {
          title: "Limite du schema actuel",
          text: "Le schema des conversations est aujourd'hui centre sur owner/concierge, sans relation provider.",
        },
        {
          title: "Etape suivante",
          text: "L'ajout d'une table de conversations provider ou d'un participant polymorphe permettra un vrai branchement metier.",
        },
      ]}
    />
  );
}
