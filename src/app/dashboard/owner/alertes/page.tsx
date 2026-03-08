"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import { loadOwnerConciergeSearchAlerts, type OwnerConciergeSearchAlert } from "../searchAlerts";

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

function buildSearchHref(alert: OwnerConciergeSearchAlert) {
  const params = new URLSearchParams();
  if (alert.city) params.set("city", alert.city);
  if (alert.postalCode) params.set("postalCode", alert.postalCode);
  if (alert.budgetMax) params.set("budgetMax", alert.budgetMax);
  if (alert.radiusKm) params.set("radiusKm", alert.radiusKm);
  return `/dashboard/owner/concierges?${params.toString()}`;
}

export default function OwnerAlertesPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [searchAlerts, setSearchAlerts] = useState<OwnerConciergeSearchAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchAlerts(loadOwnerConciergeSearchAlerts());
  }, []);

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

    void loadAlerts();
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
      title="Points d'attention"
      description={
        error
          ? error
          : "Concentrez ici les urgences d'exécution, les soldes à régler, les validations à trancher et les alertes de recherche concierge."
      }
      chips={[
        `${urgentMissions.length} mission(s) prioritaires`,
        `${pendingInvoices.length} facture(s) à suivre`,
        `${pendingQuotes.length} devis à valider`,
        `${searchAlerts.length} alerte(s) concierge`,
      ]}
      metrics={[
        {
          label: "Priorités exécution",
          value: String(urgentMissions.length),
          hint: "Interventions qui peuvent créer une friction immédiate",
        },
        {
          label: "Alertes finance",
          value: String(pendingInvoices.length),
          hint: "Factures qui demandent un suivi ou un règlement",
        },
        {
          label: "Décisions en attente",
          value: String(pendingQuotes.length),
          hint: "Devis à arbitrer rapidement",
        },
        {
          label: "Alertes concierge",
          value: String(searchAlerts.length),
          hint: "Zones sans concierge ou recherche à relancer",
        },
      ]}
      actions={[
        { label: "Voir le suivi des interventions", href: "/dashboard/owner/planning" },
        { label: "Ouvrir les factures", href: "/dashboard/owner/factures" },
        { label: "Ouvrir les devis", href: "/dashboard/owner/devis" },
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
      ]}
      cards={[
        {
          title: "1. Priorités exécution",
          text:
            urgentMissions.length > 0
              ? urgentMissions
                  .slice(0, 3)
                  .map(
                    (mission) =>
                      `${mission.title || "Mission"} - ${mission.status || "-"} - ${formatDate(mission.scheduled_start)}`,
                  )
                  .join(" | ")
              : "Aucune intervention prioritaire à signaler pour le moment.",
        },
        {
          title: "2. Suivi financier",
          text:
            pendingInvoices.length > 0
              ? pendingInvoices
                  .slice(0, 3)
                  .map(
                    (invoice) =>
                      `${invoice.invoice_number || "Facture"} - solde ${formatAmount(invoice.balance_amount)} - échéance ${formatDate(invoice.due_date)}`,
                  )
                  .join(" | ")
              : "Aucune facture en attente de règlement.",
        },
        {
          title: "3. Validations en attente",
          text:
            pendingQuotes.length > 0
              ? pendingQuotes
                  .slice(0, 3)
                  .map(
                    (quote) =>
                      `${quote.quote_number || "Devis"} - ${quote.status || "-"} - valide jusqu'au ${formatDate(quote.valid_until)}`,
                  )
                  .join(" | ")
              : "Aucun devis en attente de validation.",
        },
        {
          title: "4. Alertes concierge",
          text:
            searchAlerts.length > 0
              ? searchAlerts
                  .slice(0, 3)
                  .map((alert) => [alert.city, alert.postalCode].filter(Boolean).join(" ") || "Zone non définie")
                  .join(" | ")
              : "Aucune alerte de recherche concierge active.",
        },
      ]}
      detailSections={[
        {
          title: "Actions à lancer maintenant",
          description:
            "Les alertes utiles sont celles qui débloquent une décision ou évitent un retard. Commencez par ces leviers.",
          items: [
            {
              title: "Vérifier les interventions prioritaires",
              meta: `${urgentMissions.length} priorité(s)`,
              description: "Confirmer statut, date et niveau d'urgence sur les missions ouvertes.",
              href: "/dashboard/owner/planning",
              actionLabel: "Ouvrir le planning",
              tone: urgentMissions.length > 0 ? "warning" : "default",
            },
            {
              title: "Traiter les factures ouvertes",
              meta: `${pendingInvoices.length} facture(s)`,
              description: "Éviter les échéances ratées et garder une vision propre du solde en cours.",
              href: pendingInvoices[0] ? `/dashboard/owner/factures?invoice=${pendingInvoices[0].id}` : "/dashboard/owner/factures",
              actionLabel: "Voir les factures",
              tone: pendingInvoices.length > 0 ? "warning" : "default",
            },
            {
              title: "Arbitrer les devis en attente",
              meta: `${pendingQuotes.length} devis`,
              description: "Valider ou repousser les propositions qui influencent votre exécution et votre budget.",
              href: pendingQuotes[0] ? `/dashboard/owner/devis?quote=${pendingQuotes[0].id}` : "/dashboard/owner/devis",
              actionLabel: "Voir les devis",
            },
          ],
        },
        {
          title: "Alertes de recherche concierge",
          description:
            "Ces alertes sont créées quand aucune conciergerie n'est disponible dans la zone recherchée.",
          emptyText: "Aucune alerte concierge active.",
          items: searchAlerts.map((alert) => ({
            title: [alert.city, alert.postalCode].filter(Boolean).join(" ") || "Zone non définie",
            meta: "Alerte active",
            description: `Créée le ${formatDate(alert.createdAt)}.`,
            facts: [
              alert.budgetMax ? `Budget max : ${alert.budgetMax} EUR/h` : "Budget : sans limite",
              alert.radiusKm ? `Rayon : ${alert.radiusKm} km` : "Rayon : sans limite",
            ],
            href: buildSearchHref(alert),
            actionLabel: "Relancer la recherche",
          })),
        },
      ]}
    />
  );
}

