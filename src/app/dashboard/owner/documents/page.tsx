"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerDocumentsOverview from "./OwnerDocumentsOverview";


export type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  valid_until?: string | null;
};

export type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  due_date?: string | null;
};

export default function OwnerDocumentsPage() {
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setError(null);

        const [quotesRes, invoicesRes] = await Promise.all([
          fetch("/api/quotes?limit=10", { cache: "no-store" }),
          fetch("/api/invoices?limit=10", { cache: "no-store" }),
        ]);

        const quotesPayload = await quotesRes.json();
        const invoicesPayload = await invoicesRes.json();

        if (!quotesRes.ok) {
          throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
        }
        if (!invoicesRes.ok) {
          throw new Error(invoicesPayload?.error || "Impossible de charger les factures.");
        }

        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos documents.");
      } finally {
        setLoading(false);
      }
    }

    void loadDocuments();
  }, []);

  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length,
    [quotes],
  );
  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled").length,
    [invoices],
  );

  return <OwnerDocumentsOverview quotes={quotes} invoices={invoices} pendingQuotes={pendingQuotes} pendingInvoices={pendingInvoices} loading={loading} error={error} />;
}
