"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type MissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  balance_amount: number | null;
  due_date: string | null;
};

type QuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  valid_until: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Date non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(2)} EUR` : "-";
}

export default function OwnerAlertesPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setError(null);
        const [missionsRes, invoicesRes, quotesRes] = await Promise.all([
          fetch("/api/missions?scope=owner&limit=20", { cache: "no-store" }),
          fetch("/api/invoices?limit=20", { cache: "no-store" }),
          fetch("/api/quotes?limit=20", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsRes.json();
        const invoicesPayload = await invoicesRes.json();
        const quotesPayload = await quotesRes.json();

        if (!missionsRes.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!invoicesRes.ok) {
          throw new Error(invoicesPayload?.error || "Impossible de charger les factures.");
        }
        if (!quotesRes.ok) {
          throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos alertes.");
      }
    }

    loadAlerts();
  }, []);

  const urgentMissions = useMemo(
    () =>
      missions.filter(
        (mission) => mission.priority === "high" || mission.status === "in_progress",
      ),
    [missions],
  );
  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled"),
    [invoices],
  );
  const pendingQuotes = useMemo(
    () => quotes.filter((quote) => quote.status === "draft" || quote.status === "sent"),
    [quotes],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Alertes"
      title="Alertes"
      description={
        error
          ? error
          : "Concentrez ici les urgences de planning, les soldes a regler et les devis en attente de validation."
      }
      chips={[
        `${urgentMissions.length} mission(s) prioritaires`,
        `${pendingInvoices.length} facture(s) a suivre`,
        `${pendingQuotes.length} devis a valider`,
      ]}
      actions={[
        { label: "Voir le planning", href: "/dashboard/owner/planning" },
        { label: "Voir les factures", href: "/dashboard/owner/factures" },
        { label: "Voir les devis", href: "/dashboard/owner/devis" },
      ]}
      cards={[
        {
          title: "Priorites planning",
          text:
            urgentMissions.length > 0
              ? urgentMissions
                  .slice(0, 3)
                  .map((mission) => `${mission.title || "Mission"} - ${mission.status || "-"} - ${formatDate(mission.scheduled_start)}`)
                  .join(" | ")
              : "Aucune mission prioritaire a signaler pour le moment.",
        },
        {
          title: "Suivi financier",
          text:
            pendingInvoices.length > 0
              ? pendingInvoices
                  .slice(0, 3)
                  .map((invoice) => `${invoice.invoice_number || "Facture"} - solde ${formatAmount(invoice.balance_amount)} - echeance ${formatDate(invoice.due_date)}`)
                  .join(" | ")
              : "Aucune facture en attente de reglement.",
        },
        {
          title: "Validation de devis",
          text:
            pendingQuotes.length > 0
              ? pendingQuotes
                  .slice(0, 3)
                  .map((quote) => `${quote.quote_number || "Devis"} - ${quote.status || "-"} - valide jusqu'au ${formatDate(quote.valid_until)}`)
                  .join(" | ")
              : "Aucun devis en attente de validation.",
        },
      ]}
    />
  );
}
