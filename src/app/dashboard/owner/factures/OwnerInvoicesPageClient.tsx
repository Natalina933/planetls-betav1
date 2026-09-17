"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import OwnerInvoicesOverview from "./OwnerInvoicesOverview";
import { ownerApiError } from "../ownerFeedback";

export type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  total_amount: number | null;
  paid_amount?: number | null;
  balance_amount: number | null;
  currency?: string | null;
  due_date: string | null;
  created_at: string | null;
  issue_date?: string | null;
  metadata?: Record<string, unknown> | null;
  invoice_items?: Array<{
    id: string;
    label: string;
    quantity: number;
    line_total: number;
  }>;
};

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

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (targetInvoiceId && invoice.id !== targetInvoiceId) return false;

      const matchesStatus = statusFilter === "all" || (invoice.status ?? "open") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [invoice.invoice_number, invoice.status, ...["client_name", "traveler_name", "property_label", "housing_name"].map(key => typeof invoice.metadata?.[key] === "string" ? invoice.metadata[key] : "")].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [invoices, searchTerm, statusFilter, targetInvoiceId]);
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

  function exportInvoicesCsv(exportRows: OwnerInvoiceRow[] = filteredInvoices) {
    const rows = [
      ["Numero", "Statut", "Total", "Solde", "Echeance", "Cree le"],
      ...exportRows.map((invoice) => [
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

  return <OwnerInvoicesOverview invoices={invoices} filteredInvoices={filteredInvoices}
    searchTerm={searchTerm} onSearch={setSearchTerm} statusFilter={statusFilter} onStatus={setStatusFilter}
    loading={loading} error={error} feedback={feedback} targetedInvoice={targetedInvoice}
    targetInvoiceId={targetInvoiceId} payingInvoiceId={payingInvoiceId}
    onPay={handlePayInvoice} onExport={exportInvoicesCsv} onRetry={() => window.location.reload()} />;
}
