"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import {
  deleteOwnerConciergeSearchAlert,
  loadOwnerConciergeSearchAlerts,
  type OwnerConciergeSearchAlert,
} from "../searchAlerts";

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

type OwnerConversationRow = {
  id: string;
  last_message_at: string | null;
  source?: string | null;
  source_reference?: string | null;
  counterpart_name: string | null;
  subject: string | null;
  status: string | null;
  last_message_preview: string | null;
  unread_count?: number;
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
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchAlerts(loadOwnerConciergeSearchAlerts());
  }, []);

  function handleDeleteSearchAlert(alertId: string) {
    setSearchAlerts(deleteOwnerConciergeSearchAlert(alertId));
  }

  useEffect(() => {
    async function loadAlerts() {
      try {
        setError(null);
        const [missionsRes, invoicesRes, quotesRes, conversationsRes] = await Promise.all([
          fetch("/api/missions?scope=owner&limit=20", { cache: "no-store" }),
          fetch("/api/invoices?limit=20", { cache: "no-store" }),
          fetch("/api/quotes?limit=20", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=owner&limit=40", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsRes.json();
        const invoicesPayload = await invoicesRes.json();
        const quotesPayload = await quotesRes.json();
        const conversationsPayload = await conversationsRes.json();

        if (!missionsRes.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!invoicesRes.ok) {
          throw new Error(invoicesPayload?.error || "Impossible de charger les factures.");
        }
        if (!quotesRes.ok) {
          throw new Error(quotesPayload?.error || "Impossible de charger les devis.");
        }
        if (!conversationsRes.ok) {
          throw new Error(conversationsPayload?.error || "Impossible de charger les messages.");
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
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

  const unreadConversationCount = useMemo(
    () => conversations.reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [conversations],
  );
  const unreadMissionReplies = useMemo(
    () =>
      conversations
        .filter((item) => item.source === "mission")
        .reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [conversations],
  );
  const unreadQuoteReplies = useMemo(
    () =>
      conversations
        .filter((item) => item.source === "quote")
        .reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [conversations],
  );
  const unreadSearchReplies = useMemo(
    () =>
      conversations
        .filter((item) => item.source === "search")
        .reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [conversations],
  );
  const unreadManualReplies = useMemo(
    () =>
      conversations
        .filter((item) => !item.source || item.source === "manual")
        .reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [conversations],
  );
  const latestUnreadConversations = useMemo(
    () =>
      conversations
        .filter((conversation) => (conversation.unread_count ?? 0) > 0)
        .slice(0, 3),
    [conversations],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Alertes"
      title="Points d'attention"
      description={
        error
          ? error
          : "Concentrez ici les urgences d'exécution, les soldes à régler, les validations à trancher et les nouveaux retours reçus."
      }
      chips={[
        `${urgentMissions.length} mission(s) prioritaires`,
        `${pendingInvoices.length} facture(s) à suivre`,
        `${pendingQuotes.length} devis à valider`,
        `${unreadConversationCount} nouveau(x) retour(s)`,
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
          label: "Decisions en attente",
          value: String(pendingQuotes.length),
          hint: "Devis a arbitrer rapidement",
        },
        {
          label: "Nouveaux retours",
          value: String(unreadConversationCount),
          hint: "Messages et réponses reçues à ouvrir",
        },
      ]}
      actions={[
        { label: "Voir le suivi des interventions", href: "/dashboard/owner/planning" },
        { label: "Ouvrir les factures", href: "/dashboard/owner/factures" },
        { label: "Ouvrir les devis", href: "/dashboard/owner/devis" },
        {
          label: "Ouvrir la messagerie",
          href: "/dashboard/owner/messages",
          notificationCount: unreadConversationCount,
        },
      ]}
      cards={[
        {
          title: "Priorités exécution",
          text:
            urgentMissions.length > 0
              ? urgentMissions
                  .slice(0, 3)
                  .map(
                    (mission) =>
                      `${mission.title || "Mission"} - ${mission.status || "-"} - ${formatDate(mission.scheduled_start)}`,
                  )
                  .join(" | ")
              : "Aucune intervention prioritaire a signaler pour le moment.",
          notificationCount: unreadMissionReplies,
        },
        {
          title: "Suivi financier",
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
          title: "Validations en attente",
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
          notificationCount: unreadQuoteReplies,
        },
        {
          title: "Retours et reponses",
          text:
            unreadConversationCount > 0
              ? `${unreadConversationCount} nouveau(x) retour(s) sont arrivés dans vos échanges. Ouvrez d'abord les fils qui débloquent une mission, un devis ou une recherche concierge.`
              : "Aucun nouveau message à traiter pour le moment.",
          notificationCount: unreadConversationCount,
          actions: [
            {
              label: "Ouvrir la messagerie",
              href: "/dashboard/owner/messages",
              variant: "secondary",
              notificationCount: unreadConversationCount,
            },
          ],
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
              meta: `${urgentMissions.length} priorite(s)`,
              description: "Confirmer statut, date et niveau d'urgence sur les missions ouvertes.",
              href: "/dashboard/owner/planning",
              actionLabel: "Ouvrir le planning",
              tone: urgentMissions.length > 0 ? "warning" : "default",
              notificationCount: unreadMissionReplies,
            },
            {
              title: "Traiter les factures ouvertes",
              meta: `${pendingInvoices.length} facture(s)`,
              description: "Éviter les échéances ratées et garder une vision propre du solde en cours.",
              href: pendingInvoices[0]
                ? `/dashboard/owner/factures?invoice=${pendingInvoices[0].id}`
                : "/dashboard/owner/factures",
              actionLabel: "Voir les factures",
              tone: pendingInvoices.length > 0 ? "warning" : "default",
            },
            {
              title: "Arbitrer les devis en attente",
              meta: `${pendingQuotes.length} devis`,
              description: "Valider ou repousser les propositions qui influencent votre exécution et votre budget.",
              href: pendingQuotes[0]
                ? `/dashboard/owner/devis?quote=${pendingQuotes[0].id}`
                : "/dashboard/owner/devis",
              actionLabel: "Voir les devis",
              notificationCount: unreadQuoteReplies,
            },
            {
              title: "Lire les nouveaux retours",
              meta: `${unreadConversationCount} nouveau(x) message(s)`,
              description:
                unreadConversationCount > 0
                  ? "Des réponses sont arrivées sur vos demandes, devis ou recherches. Ouvrez les plus récentes d'abord."
                  : "Aucune nouvelle réponse en attente dans votre messagerie.",
              href: latestUnreadConversations[0]
                ? `/dashboard/owner/messages?conversation=${latestUnreadConversations[0].id}`
                : "/dashboard/owner/messages",
              actionLabel: "Ouvrir la messagerie",
              tone: unreadConversationCount > 0 ? "success" : "default",
              notificationCount: unreadConversationCount,
            },
          ],
        },
        {
          title: "Alertes de recherche concierge",
          description:
            "Ces alertes sont créées quand aucune conciergerie n'est disponible dans la zone recherchée.",
          emptyText: "Aucune alerte concierge active.",
          items: searchAlerts.map((alert) => ({
            id: alert.id,
            title: [alert.city, alert.postalCode].filter(Boolean).join(" ") || "Zone non définie",
            meta: "Alerte active",
            description: `Créée le ${formatDate(alert.createdAt)}.`,
            facts: [
              alert.budgetMax ? `Budget max : ${alert.budgetMax} EUR/h` : "Budget : sans limite",
              alert.radiusKm ? `Rayon : ${alert.radiusKm} km` : "Rayon : sans limite",
              unreadSearchReplies > 0 ? `${unreadSearchReplies} réponse(s) nouvelle(s)` : "Aucune réponse nouvelle",
              unreadManualReplies > 0 ? `${unreadManualReplies} échange(s) direct(s) nouveau(x)` : "Aucun échange direct nouveau",
            ],
            href: `${buildSearchHref(alert)}&alertId=${encodeURIComponent(alert.id)}`,
            actionLabel: "Modifier l'alerte",
            secondaryActionLabel: "Supprimer",
            onSecondaryAction: () => handleDeleteSearchAlert(alert.id),
            notificationCount: unreadSearchReplies,
          })),
        },
      ]}
    />
  );
}
