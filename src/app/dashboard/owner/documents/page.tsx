"use client";

import React, { useEffect, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
};

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
};

export default function OwnerDocumentsPage() {
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
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
      }
    }

    loadDocuments();
  }, []);

  const cards = [
    ...quotes.slice(0, 4).map((quote) => ({
      title: quote.quote_number || "Devis",
      text: `Statut : ${quote.status || "-"} • Apercu : /api/quotes/${quote.id}/document`,
    })),
    ...invoices.slice(0, 4).map((invoice) => ({
      title: invoice.invoice_number || "Facture",
      text: `Statut : ${invoice.status || "-"} • Apercu : /api/invoices/${invoice.id}/document`,
    })),
  ];

  return (
    <OwnerWorkspacePage
      eyebrow="Documents"
      title="Mes documents"
      description={
        error
          ? error
          : "Cette vue centralise deja vos devis et factures, avec les routes d'aperçu PDF prêtes a etre ouvertes."
      }
      chips={[`${quotes.length} devis`, `${invoices.length} factures`]}
      actions={[
        { label: "Mes devis", href: "/dashboard/owner/devis" },
        { label: "Mes factures", href: "/dashboard/owner/factures" },
      ]}
      cards={
        cards.length > 0
          ? cards
          : [
              {
                title: "Aucun document",
                text: "Vos devis et factures apparaitront ici des qu'ils seront generes.",
              },
            ]
      }
    />
  );
}
