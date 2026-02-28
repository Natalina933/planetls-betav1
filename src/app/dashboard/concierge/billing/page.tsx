"use client";

import React, { useEffect, useMemo, useState } from "react";

type BillingHistoryPayload = {
  subscription: {
    is_pro: boolean;
    source: string | null;
    reference: string | null;
    updated_at: string | null;
  } | null;
  invoice_events: Array<{
    id: string;
    invoice_id: string;
    invoice_number: string | null;
    invoice_status: string | null;
    event_type: string;
    payload: Record<string, unknown> | null;
    created_at: string | null;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "Non renseignee";
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

  const subscriptionSourceLabel = useMemo(() => {
    if (data?.subscription?.source === "webhook") return "Webhook Stripe";
    if (data?.subscription?.source === "return") return "Retour navigateur";
    return "Aucune source enregistree";
  }, [data]);

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Historique Stripe</h1>
        <p>Suivez l’état de votre abonnement PRO et les derniers événements de facturation.</p>
      </header>

      {loading ? <p>Chargement de l'historique Stripe...</p> : null}
      {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 700 }}>{error}</p> : null}

      {!loading && !error && data ? (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <h3>Statut abonnement</h3>
              <p>{data.subscription?.is_pro ? "PRO actif" : "Standard"}</p>
            </div>
            <div className="stat-card">
              <h3>Source</h3>
              <p>{subscriptionSourceLabel}</p>
            </div>
            <div className="stat-card">
              <h3>Reference</h3>
              <p>{data.subscription?.reference || "Non renseignee"}</p>
            </div>
            <div className="stat-card">
              <h3>Derniere synchro</h3>
              <p>{formatDate(data.subscription?.updated_at ?? null)}</p>
            </div>
          </div>

          <div className="main-section">
            <h2>Evenements de facturation</h2>
            {data.invoice_events.length === 0 ? (
              <p>Aucun evenement Stripe ou facture enregistre pour le moment.</p>
            ) : (
              <ul>
                {data.invoice_events.map((event) => (
                  <li key={event.id} style={{ marginBottom: "1rem" }}>
                    <strong>{event.invoice_number || "Facture"}</strong>
                    <br />
                    Evenement : {event.event_type} | Statut facture : {event.invoice_status || "-"}
                    <br />
                    Date : {formatDate(event.created_at)}
                    <br />
                    Source :{" "}
                    {typeof event.payload?.source === "string" ? event.payload.source : "non renseignee"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
