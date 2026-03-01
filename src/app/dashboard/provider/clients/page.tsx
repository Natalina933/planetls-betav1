"use client";

import { useEffect, useState } from "react";
import ProviderWorkspacePage from "../_components/ProviderWorkspacePage";

interface ProviderClientsPayload {
  items: Array<unknown>;
  summary: {
    total: number;
    active: number;
  };
  note: string;
}

export default function ProviderClientsPage() {
  const [data, setData] = useState<ProviderClientsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/api/provider/clients", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les clients.");
        }
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger les clients.");
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
      eyebrow="Relation client"
      title="Clients"
      description={error || data?.note || "Retrouvez vos clients et demandes a suivre."}
      chips={[`${data?.summary.total ?? 0} clients`, `${data?.summary.active ?? 0} actifs`]}
      actions={[
        { label: "Voir les messages", href: "/dashboard/provider/messages" },
        { label: "Voir les interventions", href: "/dashboard/provider/interventions" },
      ]}
      cards={[
        {
          title: "Portefeuille clients",
          text: "L'API clients provider est en place et attend maintenant le branchement du modele metier correspondant.",
        },
        {
          title: "Suivi commercial",
          text: "Les fiches clients, demandes et historiques pourront etre relies ici des que la table cible sera disponible.",
        },
        {
          title: "Priorite produit",
          text: "Le prochain ajout utile est une relation provider <-> client ou provider <-> intervention avec reference client.",
        },
      ]}
    />
  );
}
