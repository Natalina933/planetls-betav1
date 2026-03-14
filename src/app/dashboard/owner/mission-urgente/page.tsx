"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrencyAmount } from "@/app/utils/formatters";
import { formatMissionWhen } from "@/app/lib/urgentMissions";
import { takeFirst } from "../../shared/collections.ts";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

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
      chips={[`${items.length} demande(s)`, `${openCount} ouverte(s)`, `${acceptedCount} acceptée(s)`]}
      actions={[
        { label: "Nouvelle mission urgente", href: "/mission-urgente" },
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
      ]}
      metrics={[
        {
          label: "Demandes",
          value: loading ? "..." : String(items.length),
          hint: "Missions urgentes créées",
        },
        {
          label: "Broadcast ouvert",
          value: loading ? "..." : String(openCount),
          hint: "En attente d'un concierge",
        },
        {
          label: "Verrouillées",
          value: loading ? "..." : String(acceptedCount),
          hint: "Concierge déjà positionné",
        },
      ]}
      cards={[
        {
          title: "1. Déclenchement express",
          text: "Un seul formulaire pour check-in, check-out, coordonnées et consignes critiques.",
          actions: [{ label: "Poster une urgence", href: "/mission-urgente", variant: "primary" }],
        },
        {
          title: "2. Matching instantané",
          text: "Le moteur croise zone, disponibilité urgente, note et temps de réponse moyen.",
        },
        {
          title: "3. Paiement sécurisé",
          text: "Le flux est préparé pour un paiement à la réservation avec sécurisation jusqu'à la mission.",
        },
      ]}
      detailSections={[
        {
          title: "Dernières missions urgentes",
          description: "Suivez les demandes les plus récentes et voyez lesquelles ont déjà un concierge.",
          emptyText:
            loading
              ? "Chargement des demandes."
              : error || "Aucune mission urgente enregistrée pour le moment.",
          items: takeFirst(items, 8).map((item) => ({
            title: item.title || "Mission urgente",
            meta: item.status === "accepted" ? "Acceptée" : item.status === "open" ? "Ouverte" : item.status,
            description: `${formatMissionWhen(item.scheduled_at)} - ${item.property_address} - ${formatCurrencyAmount(item.price, { emptyLabel: "Prix à confirmer" })} - paiement ${item.payment_status}`,
            href: "/mission-urgente",
            actionLabel: item.status === "open" ? "Relancer une urgence" : "Voir le module",
            tone: item.status === "accepted" ? "success" : item.status === "open" ? "warning" : "default",
          })),
        },
      ]}
    />
  );
}
