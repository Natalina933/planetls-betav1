"use client";

import React, { useEffect, useMemo, useState } from "react";

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  total_amount: number | null;
  balance_amount: number | null;
  due_date: string | null;
  created_at: string | null;
  invoice_items?: Array<{
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

export default function OwnerInvoicesPage() {
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/invoices?limit=30", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos factures.");
        }

        setInvoices(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos factures.");
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled"),
    [invoices],
  );

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Mes factures</h1>
        <p>Suivez les montants emis, les echeances et le solde restant a regler.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Total factures</h3>
          <p>{loading ? "..." : invoices.length}</p>
        </div>
        <div className="stat-card">
          <h3>A suivre</h3>
          <p>{loading ? "..." : pendingInvoices.length}</p>
        </div>
      </div>

      <div className="main-section">
        {loading ? <p>Chargement des factures...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && invoices.length === 0 ? (
          <p>Aucune facture disponible pour le moment.</p>
        ) : null}

        {!loading && !error && invoices.length > 0 ? (
          <ul>
            {invoices.map((invoice) => (
              <li key={invoice.id} style={{ marginBottom: "1rem" }}>
                <strong>{invoice.invoice_number || "Facture sans numero"}</strong>
                <br />
                Statut : {invoice.status || "-"} | Total : {formatAmount(invoice.total_amount)} |
                Solde : {formatAmount(invoice.balance_amount)}
                <br />
                Echeance : {formatDate(invoice.due_date)} | Lignes : {invoice.invoice_items?.length ?? 0}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
