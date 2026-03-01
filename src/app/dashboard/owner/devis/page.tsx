"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "../OwnerDashboardPages.module.scss";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
  const filteredQuotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === "all" || (quote.status ?? "draft") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [quote.quote_number, quote.status].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [quotes, searchTerm, statusFilter]);
  const totalAmount = useMemo(
    () => filteredQuotes.reduce((sum, quote) => sum + (quote.total_amount ?? 0), 0),
    [filteredQuotes],
  );

  function exportQuotesCsv() {
    const rows = [
      ["Numero", "Statut", "Total", "Valide jusqu'au", "Cree le"],
      ...filteredQuotes.map((quote) => [
        quote.quote_number ?? "",
        quote.status ?? "",
        quote.total_amount?.toString() ?? "",
        quote.valid_until ?? "",
        quote.created_at ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "owner-devis.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Devis</h1>
        <p>Retrouvez les propositions envoyees pour vos biens et leur statut actuel.</p>
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
        <div className="stat-card">
          <h3>Montant filtre</h3>
          <p>{loading ? "..." : formatAmount(totalAmount)}</p>
        </div>
      </div>

      <div className="main-section">
        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un devis"
            className={styles.field}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
          >
            <option value="all">Tous statuts</option>
            <option value="draft">Brouillons</option>
            <option value="sent">Envoyes</option>
            <option value="accepted">Acceptes</option>
            <option value="rejected">Refuses</option>
          </select>
          <button
            type="button"
            onClick={exportQuotesCsv}
            disabled={filteredQuotes.length === 0}
            className={styles.buttonSecondary}
          >
            Export CSV
          </button>
        </div>

        {loading ? <p>Chargement des devis...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && filteredQuotes.length === 0 ? (
          <p>Aucun devis disponible pour le moment.</p>
        ) : null}

        {!loading && !error && filteredQuotes.length > 0 ? (
          <ul>
            {filteredQuotes.map((quote) => (
              <li key={quote.id} className={styles.listItem}>
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
                  className={styles.linkButton}
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
