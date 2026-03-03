"use client";

import { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import { formatMissionWhen } from "@/app/lib/urgentMissions";

type UrgentMissionRow = {
  id: string;
  title: string | null;
  status: string;
  property_address: string;
  scheduled_at: string;
  price: number | null;
  payment_status: string;
};

export default function OwnerUrgentMissionDashboardPage() {
  const [items, setItems] = useState<UrgentMissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/urgent-missions?scope=owner", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les missions urgentes.");
        }
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger les missions urgentes.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const acceptedCount = useMemo(
    () => items.filter((item) => item.status === "accepted").length,
    [items],
  );
  const openCount = useMemo(() => items.filter((item) => item.status === "open").length, [items]);

  return (
    <OwnerWorkspacePage
      eyebrow="Mission urgente"
      title="Sauver un check-in ou check-out rapidement"
      description={
        loading
          ? "Chargement de vos demandes urgentes..."
          : error ||
            "Postez une mission en quelques champs, suivez le broadcast et voyez quand un concierge verrouille l'intervention."
      }
      chips={[`${items.length} demande(s)`, `${openCount} ouverte(s)`, `${acceptedCount} acceptee(s)`]}
      actions={[
        { label: "Nouvelle mission urgente", href: "/mission-urgente" },
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
      ]}
      metrics={[
        {
          label: "Demandes",
          value: loading ? "..." : String(items.length),
          hint: "Missions urgentes creees",
        },
        {
          label: "Broadcast ouvert",
          value: loading ? "..." : String(openCount),
          hint: "En attente d'un concierge",
        },
        {
          label: "Verrouillees",
          value: loading ? "..." : String(acceptedCount),
          hint: "Concierge deja positionne",
        },
      ]}
      cards={[
        {
          title: "1. Declenchement express",
          text: "Un seul formulaire pour check-in, check-out, coordonnees et consignes critiques.",
          actions: [{ label: "Poster une urgence", href: "/mission-urgente", variant: "primary" }],
        },
        {
          title: "2. Matching instantane",
          text: "Le moteur croise zone, disponibilite urgente, note et temps de reponse moyen.",
        },
        {
          title: "3. Paiement securise",
          text: "Le flux est prepare pour un paiement a la reservation avec securisation jusqu'a la mission.",
        },
      ]}
      detailSections={[
        {
          title: "Dernieres missions urgentes",
          description: "Suivez les demandes les plus recentes et voyez lesquelles ont deja un concierge.",
          emptyText:
            loading
              ? "Chargement des demandes."
              : error || "Aucune mission urgente enregistree pour le moment.",
          items: items.map((item) => ({
            title: item.title || "Mission urgente",
            meta: item.status === "accepted" ? "Acceptee" : item.status === "open" ? "Ouverte" : item.status,
            description: `${formatMissionWhen(item.scheduled_at)} - ${item.property_address} - ${item.price ? `${item.price} EUR` : "Prix a confirmer"} - paiement ${item.payment_status}`,
            href: "/mission-urgente",
            actionLabel: item.status === "open" ? "Relancer une urgence" : "Voir le module",
            tone: item.status === "accepted" ? "success" : item.status === "open" ? "warning" : "default",
          })),
        },
      ]}
    />
  );
}
