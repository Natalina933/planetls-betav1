"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import { ownerApiError } from "../ownerFeedback";
import styles from "../OwnerDashboardPages.module.scss";

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

export default function OwnerInvoicesPageClient() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const targetInvoiceId = searchParams.get("invoice");

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const invoiceId = searchParams.get("invoice");
    const sessionId = searchParams.get("session_id");

    if (paymentStatus === "cancel") {
      setFeedback("Paiement annulé. Vous pouvez reprendre plus tard.");
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
          throw new Error(ownerApiError("Impossible de synchroniser la facture payée.", payload?.error));
        }

        if (!cancelled) {
          setFeedback("Paiement confirmé et facture synchronisée comme réglée.");
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
            err instanceof Error ? err.message : ownerApiError("Impossible de synchroniser la facture payée."),
          );
        }
      }
    }

    void syncPaidInvoice();

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
          throw new Error(ownerApiError("Impossible de charger vos factures.", payload?.error));
        }

        setInvoices(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : ownerApiError("Impossible de charger vos factures."));
      } finally {
        setLoading(false);
      }
    }

    void loadInvoices();
  }, []);

  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled"),
    [invoices],
  );
  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (targetInvoiceId && invoice.id !== targetInvoiceId) return false;

      const matchesStatus = statusFilter === "all" || (invoice.status ?? "open") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [invoice.invoice_number, invoice.status].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [invoices, searchTerm, statusFilter, targetInvoiceId]);
  const filteredBalance = useMemo(
    () => filteredInvoices.reduce((sum, invoice) => sum + (invoice.balance_amount ?? 0), 0),
    [filteredInvoices],
  );
  const targetedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === targetInvoiceId) ?? null,
    [invoices, targetInvoiceId],
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
        throw new Error(ownerApiError("Impossible de lancer le paiement.", payload?.error));
      }

      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("URL Stripe manquante.");
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible de lancer le paiement."));
    } finally {
      setPayingInvoiceId(null);
    }
  }

  function exportInvoicesCsv() {
    const rows = [
      ["Numero", "Statut", "Total", "Solde", "Echeance", "Cree le"],
      ...filteredInvoices.map((invoice) => [
        invoice.invoice_number ?? "",
        invoice.status ?? "",
        invoice.total_amount?.toString() ?? "",
        invoice.balance_amount?.toString() ?? "",
        invoice.due_date ?? "",
        invoice.created_at ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "owner-factures.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Suivi des factures</h1>
        <p>Suivez les montants émis, les échéances et les règlements à prioriser sur votre parc.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Factures suivies</h3>
          <p>{loading ? "..." : invoices.length}</p>
        </div>
        <div className="stat-card">
          <h3>À régler</h3>
          <p>{loading ? "..." : pendingInvoices.length}</p>
        </div>
        <div className="stat-card">
          <h3>Solde visible</h3>
          <p>{loading ? "..." : formatAmount(filteredBalance)}</p>
        </div>
      </div>

      <div className="main-section">
        <div className={styles.toolbar}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Rechercher une facture ou un statut"
            className={styles.field}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.select}
          >
            <option value="all">Tous statuts</option>
            <option value="open">Ouvertes</option>
            <option value="paid">Réglées</option>
            <option value="canceled">Annulées</option>
          </select>
          <button
            type="button"
            onClick={exportInvoicesCsv}
            disabled={filteredInvoices.length === 0}
            className={styles.buttonSecondary}
          >
            Export CSV
          </button>
        </div>

        {feedback ? <p style={{ color: "#7b5b23", fontWeight: 600 }}>{feedback}</p> : null}
        {targetedInvoice ? (
          <p style={{ color: "#7b5b23", fontWeight: 600 }}>
            Focus sur {targetedInvoice.invoice_number || "la facture sélectionnée"}.
          </p>
        ) : null}
        {loading ? <p>Chargement des factures...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && filteredInvoices.length === 0 ? (
          <p>Aucune facture disponible pour le moment.</p>
        ) : null}

        {!loading && !error && filteredInvoices.length > 0 ? (
          <ul>
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id} className={styles.listItem}>
                <div
                  style={
                    invoice.id === targetInvoiceId
                      ? {
                          border: "1px solid rgba(123, 91, 35, 0.35)",
                          background: "rgba(123, 91, 35, 0.06)",
                          borderRadius: "18px",
                          padding: "0.75rem",
                        }
                      : undefined
                  }
                >
                  <strong>{invoice.invoice_number || "Facture sans numero"}</strong>
                  <br />
                  <span className={styles.inlineActions}>
                    <span>Statut :</span>
                    <WorkflowStatusBadge value={invoice.status || "-"} />
                  </span>{" "}
                  | Total : {formatAmount(invoice.total_amount)} | Solde :{" "}
                  {formatAmount(invoice.balance_amount)}
                  <br />
                  Echeance : {formatDate(invoice.due_date)} | Lignes : {invoice.invoice_items?.length ?? 0}
                  <br />
                  <span className={styles.inlineActions}>
                    <a
                      href={`/api/invoices/${invoice.id}/document`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.linkButton}
                    >
                      Apercu PDF
                    </a>
                    {invoice.status !== "paid" && invoice.status !== "canceled" ? (
                      <button
                        type="button"
                        onClick={() => handlePayInvoice(invoice.id)}
                        disabled={payingInvoiceId === invoice.id}
                        className={styles.buttonPrimary}
                      >
                        {payingInvoiceId === invoice.id ? "Redirection..." : "Regler"}
                      </button>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
