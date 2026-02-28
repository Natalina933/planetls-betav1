"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type BillingHistoryPayload = {
  subscription: {
    is_pro: boolean;
    source: string | null;
    reference: string | null;
    updated_at: string | null;
  } | null;
  events: Array<{
    id: string;
    profile_id: string | null;
    stripe_object_id: string;
    stripe_event_type: string;
    source: string;
    payload: Record<string, unknown> | null;
    created_at: string | null;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSourceLabel(source: string | null) {
  if (source === "webhook") return "Webhook Stripe";
  if (source === "return") return "Retour navigateur";
  return "Source non renseignée";
}

export default function ConciergeBillingPage() {
  const [data, setData] = useState<BillingHistoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/billing/history", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger l'historique Stripe.");
        }

        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger l'historique Stripe.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    if (!data || data.events.length === 0) {
      return [
        {
          title: "Aucun événement pour le moment",
          text: loading
            ? "Chargement de l'historique en cours."
            : error || "Les paiements et webhooks apparaîtront ici dès qu'un checkout sera traité.",
          actions: [
            {
              label: "Voir l'abonnement PRO",
              href: "/abonnement/concierge-pro",
              variant: "primary" as const,
            },
          ],
        },
      ];
    }

    return data.events.slice(0, 6).map((event) => ({
      title: event.stripe_event_type || "Evenement Stripe",
      text: `${event.stripe_object_id || "Objet Stripe"} - ${getSourceLabel(event.source)} - ${formatDate(event.created_at)}`,
    }));
  }, [data, error, loading]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Abonnement et paiements"
      title="Historique Stripe concierge"
      description={
        loading
          ? "Synchronisation de votre historique Stripe..."
          : error ||
            "Suivez l'état de votre abonnement PRO, vos références Stripe et les derniers événements synchronisés sur votre compte."
      }
      chips={[
        data?.subscription?.is_pro ? "PRO actif" : "Compte standard",
        `${data?.events.length ?? 0} événement(s)`,
      ]}
      actions={[
        { label: "Voir mon abonnement PRO", href: "/abonnement/concierge-pro" },
        { label: "Mettre à jour mes tarifs", href: "/dashboard/concierge/pricing" },
      ]}
      metrics={[
        {
          label: "Statut abonnement",
          value: loading ? "..." : data?.subscription?.is_pro ? "PRO actif" : "Standard",
        },
        {
          label: "Source",
          value: loading ? "..." : getSourceLabel(data?.subscription?.source ?? null),
        },
        {
          label: "Référence",
          value: loading ? "..." : data?.subscription?.reference || "-",
        },
        {
          label: "Dernière synchro",
          value: loading ? "..." : formatDate(data?.subscription?.updated_at ?? null),
        },
      ]}
      cards={cards}
    />
  );
}
