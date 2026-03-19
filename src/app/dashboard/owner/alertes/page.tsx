"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import { takeFirst } from "../../shared/collections.ts";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import {
  deleteOwnerConciergeSearchAlert,
  loadOwnerConciergeSearchAlerts,
  type OwnerConciergeSearchAlert,
} from "../searchAlerts";
import {
  formatWorkflowNotificationDate,
  getWorkflowNotificationHref,
  getWorkflowNotificationMeta,
  getWorkflowNotificationTone,
  type WorkflowNotificationItem,
} from "@/app/dashboard/notifications/workflowNotificationPresentation";

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
  counterpart_name: string | null;
  subject: string | null;
  last_message_preview: string | null;
  unread_count?: number;
};

function formatDate(value: string | null) {
  return formatDateValue(value, {
    emptyLabel: "Date non renseignee",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value: number | null) {
  return formatCurrencyAmount(value, {
    emptyLabel: "-",
    maximumFractionDigits: 2,
  });
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
  const [notifications, setNotifications] = useState<WorkflowNotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchAlerts(loadOwnerConciergeSearchAlerts());
  }, []);

  function handleDeleteSearchAlert(alertId: string) {
    setSearchAlerts(deleteOwnerConciergeSearchAlert(alertId));
  }

  async function handleMarkAllNotificationsRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    );
  }

  useEffect(() => {
    async function loadAlerts() {
      try {
        setError(null);
        const [missionsRes, invoicesRes, quotesRes, conversationsRes, notificationsRes] =
          await Promise.all([
            fetch("/api/missions?scope=owner&limit=20", { cache: "no-store" }),
            fetch("/api/invoices?limit=20", { cache: "no-store" }),
            fetch("/api/quotes?limit=20", { cache: "no-store" }),
            fetch("/api/messages/conversations?role=owner&limit=40", { cache: "no-store" }),
            fetch("/api/notifications?limit=30", { cache: "no-store" }),
          ]);

        const missionsPayload = await missionsRes.json();
        const invoicesPayload = await invoicesRes.json();
        const quotesPayload = await quotesRes.json();
        const conversationsPayload = await conversationsRes.json();
        const notificationsPayload = await notificationsRes.json();

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
        if (!notificationsRes.ok) {
          throw new Error(
            notificationsPayload?.error || "Impossible de charger les notifications.",
          );
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
        setNotifications(Array.isArray(notificationsPayload?.items) ? notificationsPayload.items : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos alertes.");
      }
    }

    void loadAlerts();
  }, []);

  const urgentMissions = useMemo(
    () => missions.filter((mission) => mission.priority === "high" || mission.status === "in_progress"),
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
    () => takeFirst(conversations.filter((conversation) => (conversation.unread_count ?? 0) > 0), 3),
    [conversations],
  );
  const unreadWorkflowNotifications = useMemo(
    () => notifications.filter((item) => !item.read_at),
    [notifications],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Alertes"
      title="Points d'attention"
      description={
        error
          ? error
          : "Concentrez ici les urgences d'execution, les validations a trancher, les retours recus et les notifications persistantes."
      }
      chips={[
        `${urgentMissions.length} mission(s) prioritaires`,
        `${pendingInvoices.length} facture(s) a suivre`,
        `${pendingQuotes.length} devis a valider`,
        `${unreadWorkflowNotifications.length} notification(s) persistante(s)`,
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
          hint: "Factures qui demandent un suivi ou un reglement",
        },
        {
          label: "Decisions en attente",
          value: String(pendingQuotes.length),
          hint: "Devis a arbitrer rapidement",
        },
        {
          label: "Notifications",
          value: String(unreadWorkflowNotifications.length),
          hint: "Evenements produit persistants",
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
          title: "Notifications persistantes",
          text:
            unreadWorkflowNotifications.length > 0
              ? takeFirst(unreadWorkflowNotifications, 3)
                  .map(
                    (item) =>
                      `${item.title || "Notification"} - ${formatWorkflowNotificationDate(item.created_at)}`,
                  )
                  .join(" | ")
              : "Aucune notification persistante non lue pour le moment.",
          notificationCount: unreadWorkflowNotifications.length,
        },
        {
          title: "Priorites execution",
          text:
            urgentMissions.length > 0
              ? takeFirst(urgentMissions, 3)
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
              ? takeFirst(pendingInvoices, 3)
                  .map(
                    (invoice) =>
                      `${invoice.invoice_number || "Facture"} - solde ${formatAmount(invoice.balance_amount)} - echeance ${formatDate(invoice.due_date)}`,
                  )
                  .join(" | ")
              : "Aucune facture en attente de reglement.",
        },
        {
          title: "Retours et reponses",
          text:
            unreadConversationCount > 0
              ? `${unreadConversationCount} nouveau(x) retour(s) sont arrives dans vos echanges.`
              : "Aucun nouveau message a traiter pour le moment.",
          notificationCount: unreadConversationCount,
        },
      ]}
      detailSections={[
        {
          title: "Notifications produit",
          description:
            "Historique persistant des evenements importants: devis recus, missions creees, confirmations et changements de statut.",
          emptyText: "Aucune notification persistante pour le moment.",
          items: notifications.map((item) => ({
            id: item.id,
            title: item.title || "Notification",
            meta: `${getWorkflowNotificationMeta(item)} - ${formatWorkflowNotificationDate(item.created_at)}`,
            description: item.body || "Aucun detail supplementaire.",
            href: getWorkflowNotificationHref(item, "/dashboard/owner/alertes"),
            actionLabel: "Ouvrir",
            secondaryActionLabel:
              unreadWorkflowNotifications.length > 0 ? "Tout marquer comme lu" : undefined,
            onSecondaryAction:
              unreadWorkflowNotifications.length > 0
                ? () => {
                    void handleMarkAllNotificationsRead();
                  }
                : undefined,
            tone: getWorkflowNotificationTone(item.notification_type, item.entity_type),
            notificationCount: item.read_at ? undefined : 1,
          })),
        },
        {
          title: "Actions a lancer maintenant",
          description:
            "Les alertes utiles sont celles qui debloquent une decision ou evitent un retard. Commencez par ces leviers.",
          items: [
            {
              title: "Verifier les interventions prioritaires",
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
              description: "Eviter les echeances ratees et garder une vision propre du solde en cours.",
              href: pendingInvoices[0]
                ? `/dashboard/owner/factures?invoice=${pendingInvoices[0].id}`
                : "/dashboard/owner/factures",
              actionLabel: "Voir les factures",
              tone: pendingInvoices.length > 0 ? "warning" : "default",
            },
            {
              title: "Arbitrer les devis en attente",
              meta: `${pendingQuotes.length} devis`,
              description: "Valider ou repousser les propositions qui influencent votre execution et votre budget.",
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
                  ? "Des reponses sont arrivees sur vos demandes, devis ou recherches."
                  : "Aucune nouvelle reponse en attente dans votre messagerie.",
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
            "Ces alertes sont creees quand aucune conciergerie n'est disponible dans la zone recherchee.",
          emptyText: "Aucune alerte concierge active.",
          items: searchAlerts.map((alert) => ({
            id: alert.id,
            title: [alert.city, alert.postalCode].filter(Boolean).join(" ") || "Zone non definie",
            meta: "Alerte active",
            description: `Creee le ${formatDate(alert.createdAt)}.`,
            facts: [
              alert.budgetMax ? `Budget max : ${alert.budgetMax} EUR/h` : "Budget : sans limite",
              alert.radiusKm ? `Rayon : ${alert.radiusKm} km` : "Rayon : sans limite",
              unreadSearchReplies > 0 ? `${unreadSearchReplies} reponse(s) nouvelle(s)` : "Aucune reponse nouvelle",
              unreadManualReplies > 0 ? `${unreadManualReplies} echange(s) direct(s) nouveau(x)` : "Aucun echange direct nouveau",
            ],
            href: `${buildSearchHref(alert)}&alertId=${encodeURIComponent(alert.id)}`,
            actionLabel: "Modifier l'alerte",
            secondaryActionLabel: "Supprimer",
            onSecondaryAction: () => handleDeleteSearchAlert(alert.id),
            notificationCount: unreadSearchReplies || undefined,
          })),
        },
      ]}
    />
  );
}
