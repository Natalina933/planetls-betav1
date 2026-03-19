"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkflowStatusBadge from "@/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
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

function OwnerQuotesContent() {
  const searchParams = useSearchParams();
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);
  const targetQuoteId = searchParams.get("quote");

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

  useEffect(() => {
    void loadQuotes();
  }, []);

  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent"),
    [quotes],
  );
  const filteredQuotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return quotes.filter((quote) => {
      if (targetQuoteId && quote.id !== targetQuoteId) return false;

      const matchesStatus = statusFilter === "all" || (quote.status ?? "draft") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [quote.quote_number, quote.status].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [quotes, searchTerm, statusFilter, targetQuoteId]);
  const totalAmount = useMemo(
    () => filteredQuotes.reduce((sum, quote) => sum + (quote.total_amount ?? 0), 0),
    [filteredQuotes],
  );
  const targetedQuote = useMemo(
    () => quotes.find((quote) => quote.id === targetQuoteId) ?? null,
    [quotes, targetQuoteId],
  );

  async function updateQuoteStatus(quoteId: string, status: "accepted" | "rejected") {
    try {
      setBusyQuoteId(quoteId);
      setActionError(null);
      setFeedback(null);

      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de mettre a jour ce devis.");
      }

      setFeedback(
        status === "accepted"
          ? "Devis accepte. La mission et le rattachement au concierge ont ete crees automatiquement."
          : "Devis refuse.",
      );
      await loadQuotes();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Impossible de mettre a jour ce devis.");
    } finally {
      setBusyQuoteId(null);
    }
  }

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
        <h1>Suivi des devis</h1>
        <p>Retrouvez les propositions recues pour vos biens et priorisez celles qui demandent une decision.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Devis suivis</h3>
          <p>{loading ? "..." : quotes.length}</p>
        </div>
        <div className="stat-card">
          <h3>A arbitrer</h3>
          <p>{loading ? "..." : pendingQuotes.length}</p>
        </div>
        <div className="stat-card">
          <h3>Montant visible</h3>
          <p>{loading ? "..." : formatAmount(totalAmount)}</p>
        </div>
      </div>

      <div className="main-section">
        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un devis ou un statut"
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
        {feedback ? <p style={{ color: "#166534", fontWeight: 600 }}>{feedback}</p> : null}
        {actionError ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{actionError}</p> : null}
        {targetedQuote ? (
          <p style={{ color: "#7b5b23", fontWeight: 600 }}>
            Focus sur {targetedQuote.quote_number || "le devis selectionne"}.
          </p>
        ) : null}

        {!loading && !error && filteredQuotes.length === 0 ? (
          <p>Aucun devis disponible pour le moment.</p>
        ) : null}

        {!loading && !error && filteredQuotes.length > 0 ? (
          <ul>
            {filteredQuotes.map((quote) => (
              <li key={quote.id} className={styles.listItem}>
                <div
                  style={
                    quote.id === targetQuoteId
                      ? {
                          border: "1px solid rgba(123, 91, 35, 0.35)",
                          background: "rgba(123, 91, 35, 0.06)",
                          borderRadius: "18px",
                          padding: "0.75rem",
                        }
                      : undefined
                  }
                >
                  <strong>{quote.quote_number || "Devis sans numero"}</strong>
                  <br />
                  <span className={styles.inlineActions}>
                    <span>Statut :</span>
                    <WorkflowStatusBadge value={quote.status || "-"} />
                  </span>{" "}
                  | Total : {formatAmount(quote.total_amount)} | Valide jusqu&apos;au {formatDate(quote.valid_until)}
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
                  {quote.status === "sent" ? (
                    <>
                      <br />
                      <button
                        type="button"
                        onClick={() => void updateQuoteStatus(quote.id, "accepted")}
                        disabled={busyQuoteId === quote.id}
                        className={styles.buttonSecondary}
                        style={{ marginTop: "0.75rem" }}
                      >
                        {busyQuoteId === quote.id ? "Validation..." : "Accepter et creer la mission"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateQuoteStatus(quote.id, "rejected")}
                        disabled={busyQuoteId === quote.id}
                        className={styles.buttonSecondary}
                        style={{ marginTop: "0.75rem", marginLeft: "0.5rem" }}
                      >
                        Refuser
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export default function OwnerQuotesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid"><p>Chargement des devis...</p></section>}>
      <OwnerQuotesContent />
    </Suspense>
  );
}
