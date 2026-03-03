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
  if (!value) return "Date non renseignée";
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
      eyebrow="Points d'attention"
      title="Points d'attention"
      description={
        error
          ? error
          : "Concentrez ici les urgences d'execution, les soldes a regler et les validations qui demandent une decision rapide."
      }
      chips={[
        `${urgentMissions.length} mission(s) prioritaires`,
        `${pendingInvoices.length} facture(s) a suivre`,
        `${pendingQuotes.length} devis a valider`,
      ]}
      metrics={[
        {
          label: "Priorites execution",
          value: String(urgentMissions.length),
          hint: "Interventions qui peuvent creer une friction immediate",
        },
        {
          label: "Alertes finance",
          value: String(pendingInvoices.length),
          hint: "Factures qui demandent un suivi ou un règlement",
        },
        {
          label: "Decisions en attente",
          value: String(pendingQuotes.length),
          hint: "Devis a arbitrer rapidement",
        },
      ]}
      actions={[
        { label: "Voir le suivi des interventions", href: "/dashboard/owner/planning" },
        { label: "Ouvrir les factures", href: "/dashboard/owner/factures" },
        { label: "Ouvrir les devis", href: "/dashboard/owner/devis" },
      ]}
      cards={[
        {
          title: "1. Priorites execution",
          text:
            urgentMissions.length > 0
              ? urgentMissions
                  .slice(0, 3)
                  .map((mission) => `${mission.title || "Mission"} - ${mission.status || "-"} - ${formatDate(mission.scheduled_start)}`)
                  .join(" | ")
              : "Aucune intervention prioritaire a signaler pour le moment.",
        },
        {
          title: "2. Suivi financier",
          text:
            pendingInvoices.length > 0
              ? pendingInvoices
                  .slice(0, 3)
                  .map((invoice) => `${invoice.invoice_number || "Facture"} - solde ${formatAmount(invoice.balance_amount)} - echeance ${formatDate(invoice.due_date)}`)
                  .join(" | ")
              : "Aucune facture en attente de règlement.",
        },
        {
          title: "3. Validations en attente",
          text:
            pendingQuotes.length > 0
              ? pendingQuotes
                  .slice(0, 3)
                  .map((quote) => `${quote.quote_number || "Devis"} - ${quote.status || "-"} - valide jusqu'au ${formatDate(quote.valid_until)}`)
                  .join(" | ")
              : "Aucun devis en attente de validation.",
        },
      ]}
      detailSections={[
        {
          title: "Actions a lancer maintenant",
          description:
            "Les alertes utiles sont celles qui debloquent une decision ou evitent un retard. Commencez par ces trois leviers.",
          items: [
            {
              title: "Verifier les interventions prioritaires",
              meta: `${urgentMissions.length} priorite(s)`,
              description: "Confirmer statut, date et niveau d'urgence sur les missions ouvertes.",
              href: "/dashboard/owner/planning",
              actionLabel: "Ouvrir le planning",
              tone: urgentMissions.length > 0 ? "warning" : "default",
            },
            {
              title: "Traiter les factures ouvertes",
              meta: `${pendingInvoices.length} facture(s)`,
              description: "Eviter les echeances ratees et garder une vision propre du solde en cours.",
              href: "/dashboard/owner/factures",
              actionLabel: "Voir les factures",
              tone: pendingInvoices.length > 0 ? "warning" : "default",
            },
            {
              title: "Arbitrer les devis en attente",
              meta: `${pendingQuotes.length} devis`,
              description: "Valider ou repousser les propositions qui influencent votre execution et votre budget.",
              href: "/dashboard/owner/devis",
              actionLabel: "Voir les devis",
            },
          ],
        },
      ]}
    />
  );
}
