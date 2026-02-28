"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const invoiceId = searchParams.get("invoice");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus === "cancel") {
      setFeedback("Paiement annule. Vous pouvez reprendre plus tard.");
      return;
    }

    if (paymentStatus !== "success" || !invoiceId || !sessionId) return;

    let cancelled = false;

    async function syncPaidInvoice() {
      try {
        const response = await fetch(`/api/billing/invoices/${invoiceId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de synchroniser la facture payee.");
        }

        if (!cancelled) {
          setFeedback("Paiement confirme et facture synchronisee comme reglee.");
          setError(null);
          setInvoices((prev) =>
            prev.map((invoice) =>
              invoice.id === invoiceId
                ? {
                    ...invoice,
                    status: "paid",
                    balance_amount: 0,
                    paid_amount: invoice.total_amount,
                  }
                : invoice,
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de synchroniser la facture payee.",
          );
        }
      }
    }

    syncPaidInvoice();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

  async function handlePayInvoice(invoiceId: string) {
    try {
      setPayingInvoiceId(invoiceId);
      setError(null);
      setFeedback(null);

      const response = await fetch(`/api/billing/invoices/${invoiceId}/checkout`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de lancer le paiement.");
      }

      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("URL Stripe manquante.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de lancer le paiement.");
    } finally {
      setPayingInvoiceId(null);
    }
  }

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Mes factures</h1>
        <p>Suivez les montants émis, les échéances et le solde restant à régler.</p>
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
        {feedback ? <p style={{ color: "#7b5b23", fontWeight: 600 }}>{feedback}</p> : null}
        {loading ? <p>Chargement des factures...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && invoices.length === 0 ? (
          <p>Aucune facture disponible pour le moment.</p>
        ) : null}

        {!loading && !error && invoices.length > 0 ? (
          <ul>
            {invoices.map((invoice) => (
              <li key={invoice.id} style={{ marginBottom: "1rem" }}>
                <strong>{invoice.invoice_number || "Facture sans numéro"}</strong>
                <br />
                Statut : {invoice.status || "-"} | Total : {formatAmount(invoice.total_amount)} |
                Solde : {formatAmount(invoice.balance_amount)}
                <br />
                Echeance : {formatDate(invoice.due_date)} | Lignes : {invoice.invoice_items?.length ?? 0}
                <br />
                <span style={{ display: "inline-flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
                  <a
                    href={`/api/invoices/${invoice.id}/document`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(184, 139, 74, 0.35)",
                      background: "linear-gradient(135deg, #fff8ea, #f2e0c0)",
                      color: "#7b5b23",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Apercu PDF
                  </a>
                  {(invoice.status !== "paid" && invoice.status !== "canceled") ? (
                    <button
                      type="button"
                      onClick={() => handlePayInvoice(invoice.id)}
                      disabled={payingInvoiceId === invoice.id}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "999px",
                        border: "none",
                        background: "linear-gradient(135deg, #b88b4a, #d4af37)",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: payingInvoiceId === invoice.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {payingInvoiceId === invoice.id ? "Redirection..." : "Regler"}
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
