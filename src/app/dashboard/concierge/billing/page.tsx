"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  buildBillingCards,
  formatBillingDate,
  getBillingSourceLabel,
} from "./billingHelpers";

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

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => buildBillingCards(data, loading, error), [data, error, loading]);

  return (
    <ConciergeWorkspacePage
      eyebrow="Revenus et abonnement"
      title="Facturation et revenus"
      description={
        loading
          ? "Synchronisation de votre historique Stripe..."
          : error ||
            "Suivez l'etat de votre abonnement PRO, vos references de facturation et les derniers evenements synchronises sur votre compte."
      }
      chips={[
        data?.subscription?.is_pro ? "PRO actif" : "Compte standard",
        `${data?.events.length ?? 0} evenement(s)`,
      ]}
      actions={[
        { label: "Voir mon abonnement PRO", href: "/abonnement/concierge-pro" },
        { label: "Mettre a jour mes tarifs", href: "/dashboard/concierge/pricing" },
      ]}
      metrics={[
        {
          label: "Statut abonnement",
          value: loading ? "..." : data?.subscription?.is_pro ? "PRO actif" : "Standard",
        },
        {
          label: "Source",
          value: loading ? "..." : getBillingSourceLabel(data?.subscription?.source ?? null),
        },
        {
          label: "Reference",
          value: loading ? "..." : data?.subscription?.reference || "-",
        },
        {
          label: "Derniere synchro",
          value: loading ? "..." : formatBillingDate(data?.subscription?.updated_at ?? null),
        },
      ]}
      cards={cards}
    />
  );
}
