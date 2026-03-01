"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  valid_until?: string | null;
};

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  due_date?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Date non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

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

  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length,
    [quotes],
  );
  const pendingInvoices = useMemo(
    () =>
      invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled")
        .length,
    [invoices],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Documents"
      title="Documents"
      description={
        error
          ? error
          : "Centralisez ici vos devis et factures avec un acces direct aux apercus PDF et aux espaces de suivi."
      }
      chips={[
        `${quotes.length} devis`,
        `${invoices.length} factures`,
        `${pendingInvoices} facture(s) a suivre`,
      ]}
      metrics={[
        {
          label: "Devis",
          value: `${quotes.length}`,
          hint: `${pendingQuotes} en attente de validation`,
        },
        {
          label: "Factures",
          value: `${invoices.length}`,
          hint: `${pendingInvoices} a regler ou suivre`,
        },
      ]}
      actions={[
        { label: "Voir les devis", href: "/dashboard/owner/devis" },
        { label: "Voir les factures", href: "/dashboard/owner/factures" },
      ]}
      cards={[
        {
          title: "Acces rapide",
          text: "Retrouvez les documents les plus recents et accedez directement a leur PDF ou a leur suivi complet.",
        },
        {
          title: "Suivi administratif",
          text: "Cette vue vous aide a distinguer les documents a valider, a payer ou simplement a archiver.",
        },
      ]}
      detailSections={[
        {
          title: "Derniers devis",
          description: "Les devis les plus recents envoyes pour vos biens.",
          emptyText: "Aucun devis disponible pour le moment.",
          items: quotes.slice(0, 5).map((quote) => ({
            title: quote.quote_number || "Devis",
            meta: quote.status || "brouillon",
            description: `Valide jusqu'au ${formatDate(quote.valid_until)}`,
            href: `/api/quotes/${quote.id}/document`,
            actionLabel: "PDF",
            tone:
              quote.status === "accepted"
                ? "success"
                : quote.status === "rejected"
                  ? "warning"
                  : "default",
          })),
        },
        {
          title: "Dernieres factures",
          description: "Vos factures disponibles avec acces direct au document.",
          emptyText: "Aucune facture disponible pour le moment.",
          items: invoices.slice(0, 5).map((invoice) => ({
            title: invoice.invoice_number || "Facture",
            meta: invoice.status || "ouverte",
            description: `Echeance ${formatDate(invoice.due_date)}`,
            href: `/api/invoices/${invoice.id}/document`,
            actionLabel: "PDF",
            tone:
              invoice.status === "paid"
                ? "success"
                : invoice.status === "open"
                  ? "warning"
                  : "default",
          })),
        },
      ]}
    />
  );
}
