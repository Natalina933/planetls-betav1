"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import styles from "../OwnerDashboardPages.module.scss";

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
  created_at: string | null;
  notes?: string | null;
  package?: {
    id: string;
    name: string | null;
    description?: string | null;
    category?: string | null;
  } | null;
  quote_items?: Array<{
    id: string;
    label: string;
    description?: string | null;
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
  const targetQuoteId = searchParams.get("quote");

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

      const haystack = [
        quote.quote_number,
        quote.status,
        quote.package?.name,
        ...(quote.quote_items ?? []).map((item) => item.label),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

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

  function exportQuotesCsv() {
    const rows = [
      ["Numero", "Statut", "Pack", "Total", "Valide jusqu'au", "Cree le"],
      ...filteredQuotes.map((quote) => [
        quote.quote_number ?? "",
        quote.status ?? "",
        quote.package?.name ?? "",
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
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Devis"
        title="Devis recus"
        description={
          loading
            ? "Chargement des devis..."
            : error ||
              "Retrouvez les propositions recues, comparez les prestations incluses et identifiez rapidement le devis a valider."
        }
        chips={[
          `${quotes.length} devis`,
          `${pendingQuotes.length} a arbitrer`,
          targetedQuote ? "Focus actif" : "Vue globale",
        ]}
        metrics={[
          { label: "Devis suivis", value: loading ? "..." : String(quotes.length) },
          { label: "A arbitrer", value: loading ? "..." : String(pendingQuotes.length) },
          { label: "Montant visible", value: loading ? "..." : formatAmount(totalAmount) },
        ]}
        actions={[
          { label: "Voir mes demandes", href: "/dashboard/owner/conciergerie" },
          { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
        ]}
        cards={[
          {
            title: "Lecture simplifiee",
            text: "Chaque devis met en avant le pack rattache, les lignes de prestation et le total visible sans jargon technique inutile.",
          },
          {
            title: "Comparaison rapide",
            text: pendingQuotes.length > 0
              ? `${pendingQuotes.length} devis demandent encore une decision.`
              : "Aucun devis en attente d'arbitrage actuellement.",
          },
          {
            title: "Signal commercial",
            text: targetedQuote?.package?.name
              ? `Le focus courant inclut le pack ${targetedQuote.package.name}.`
              : "Les packs proposes par les concierges apparaitront ici quand ils sont rattaches au devis.",
          },
        ]}
      />

      <section className={styles.conciergeDashboardFlow}>
        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher un numero, un pack ou une prestation"
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
        {!loading && error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
        {targetedQuote ? (
          <p className={`${styles.message} ${styles.messageSuccess}`}>
            Focus sur {targetedQuote.quote_number || "le devis selectionne"}.
          </p>
        ) : null}

        {!loading && !error && filteredQuotes.length === 0 ? (
          <div className={styles.conciergeEmptyState}>
            <h3>Aucun devis disponible.</h3>
            <p>Les propositions recues apparaitront ici des qu'un concierge vous enverra un devis.</p>
          </div>
        ) : null}

        {!loading && !error && filteredQuotes.length > 0 ? (
          <div className={styles.conciergeTimeline}>
            {filteredQuotes.map((quote) => (
              <article key={quote.id} className={styles.conciergeRequestCard}>
                <div className={styles.conciergeRequestTopline}>
                  <div className={styles.conciergeRequestHeading}>
                    <span className={`${styles.conciergeStatusPill} ${styles.statusInfo}`}>
                      {quote.status || "devis"}
                    </span>
                    <h3>{quote.quote_number || "Devis sans numero"}</h3>
                    <p>
                      Cree le {formatDate(quote.created_at)} · Valide jusqu&apos;au{" "}
                      {formatDate(quote.valid_until)}
                    </p>
                  </div>
                  <div className={styles.inlineActions}>
                    <WorkflowStatusBadge value={quote.status || "-"} />
                    <a
                      href={`/api/quotes/${quote.id}/document`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.linkButton}
                    >
                      Apercu PDF
                    </a>
                  </div>
                </div>

                <div className={styles.conciergeFactRow}>
                  <div className={styles.conciergeFactCard}>
                    <span>Total</span>
                    <strong>{formatAmount(quote.total_amount)}</strong>
                  </div>
                  <div className={styles.conciergeFactCard}>
                    <span>Pack</span>
                    <strong>{quote.package?.name || "Aucun pack"}</strong>
                  </div>
                  <div className={styles.conciergeFactCard}>
                    <span>Lignes</span>
                    <strong>{quote.quote_items?.length ?? 0}</strong>
                  </div>
                </div>

                {quote.package ? (
                  <div className={styles.conciergeRecipientCard}>
                    <div className={styles.conciergeRecipientSummary}>
                      <strong>Pack propose</strong>
                      <span>{quote.package.category || "Pack commercial"}</span>
                    </div>
                    <p className={styles.conciergeRequestDescription}>
                      {quote.package.description || "Ce devis s'appuie sur un pack de services structure."}
                    </p>
                  </div>
                ) : null}

                <div className={styles.conciergeRecipientList}>
                  {(quote.quote_items ?? []).map((item) => (
                    <div key={item.id} className={styles.conciergeRecipientCard}>
                      <div className={styles.conciergeRecipientSummary}>
                        <strong>{item.label}</strong>
                        <span>
                          {item.quantity} x {formatAmount(item.line_total)}
                        </span>
                      </div>
                      {item.description ? (
                        <p className={styles.conciergeRequestDescription}>{item.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                {quote.notes ? (
                  <p className={styles.conciergeNextStep}>{quote.notes}</p>
                ) : (
                  <p className={styles.conciergeNextStep}>
                    Le devis detaille les prestations proposees, leur total et, le cas echeant, le pack commercial retenu par le concierge.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function OwnerQuotesPage() {
  return (
    <Suspense
      fallback={
        <section className="dashboard-grid">
          <p>Chargement des devis...</p>
        </section>
      }
    >
      <OwnerQuotesContent />
    </Suspense>
  );
}
