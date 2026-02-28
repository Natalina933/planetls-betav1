"use client";

import React, { useEffect, useMemo, useState } from "react";

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
  created_at: string | null;
  quote_items?: Array<{
    id: string;
    label: string;
    quantity: number;
    line_total: number;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(2)} EUR` : "-";
}

export default function OwnerQuotesPage() {
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuotes() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/quotes?limit=30", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos devis.");
        }

        setQuotes(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos devis.");
      } finally {
        setLoading(false);
      }
    }

    loadQuotes();
  }, []);

  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent"),
    [quotes],
  );

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Mes devis</h1>
        <p>Retrouvez les propositions envoyees pour vos logements et leur statut actuel.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Total devis</h3>
          <p>{loading ? "..." : quotes.length}</p>
        </div>
        <div className="stat-card">
          <h3>En attente</h3>
          <p>{loading ? "..." : pendingQuotes.length}</p>
        </div>
      </div>

      <div className="main-section">
        {loading ? <p>Chargement des devis...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && quotes.length === 0 ? (
          <p>Aucun devis disponible pour le moment.</p>
        ) : null}

        {!loading && !error && quotes.length > 0 ? (
          <ul>
            {quotes.map((quote) => (
              <li key={quote.id} style={{ marginBottom: "1rem" }}>
                <strong>{quote.quote_number || "Devis sans numero"}</strong>
                <br />
                Statut : {quote.status || "-"} | Total : {formatAmount(quote.total_amount)} | Valide
                jusqu&apos;au {formatDate(quote.valid_until)}
                <br />
                Lignes : {quote.quote_items?.length ?? 0}
                <br />
                <a
                  href={`/api/quotes/${quote.id}/document`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apercu PDF
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
