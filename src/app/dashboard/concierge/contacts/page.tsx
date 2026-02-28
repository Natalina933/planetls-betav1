"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";

type ContactConversation = {
  id: string;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  subject: string | null;
  status: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Aucun message récent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function olderThanDays(value: string | null, days: number) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time > days * 24 * 60 * 60 * 1000;
}

export default function ConciergeContactsPage() {
  const [items, setItems] = useState<ContactConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/messages/conversations?role=concierge&limit=60", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos contacts.");
        }

        setItems(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos contacts.");
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  const recentContacts = useMemo(() => items.slice(0, 4), [items]);
  const followUps = useMemo(
    () =>
      items
        .filter((item) => item.status !== "closed")
        .slice(0, 6)
        .map((conversation) => ({
          title: conversation.counterpart_name || "Propriétaire",
          meta: formatDate(conversation.last_message_at),
          description:
            `${conversation.subject || "Conversation directe"} - ${conversation.last_message_preview || "Aucun aperçu disponible."}`,
          href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
          actionLabel: "Reprendre l'échange",
        })),
    [items],
  );
  const activeConversations = useMemo(
    () => items.filter((item) => item.status !== "closed").length,
    [items],
  );
  const dormantConversations = useMemo(
    () =>
      items
        .filter((item) => item.status !== "closed" && olderThanDays(item.last_message_at, 5))
        .slice(0, 5)
        .map((conversation) => ({
          title: conversation.counterpart_name || "Propriétaire",
          meta: "Relance à faire",
          description:
            `${conversation.subject || "Conversation directe"} - dernier message ${formatDate(conversation.last_message_at)}.`,
          href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
          actionLabel: "Relancer maintenant",
          tone: "warning" as const,
        })),
    [items],
  );
  const freshOpportunities = useMemo(
    () =>
      items
        .filter((item) => item.status !== "closed" && !olderThanDays(item.last_message_at, 2))
        .slice(0, 5)
        .map((conversation) => ({
          title: conversation.counterpart_name || "Propriétaire",
          meta: "Conversation chaude",
          description:
            `${conversation.subject || "Conversation directe"} - dernier échange ${formatDate(conversation.last_message_at)}.`,
          href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
          actionLabel: "Continuer l'échange",
          tone: "success" as const,
        })),
    [items],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Relation propriétaires"
      title="Contacts concierge"
      description={
        loading
          ? "Chargement de vos propriétaires et opportunités en cours..."
          : error ||
            "Retrouvez les propriétaires déjà engagés, les reprises de contact et vos échanges les plus récents."
      }
      chips={[
        `${items.length} contact(s)`,
        `${activeConversations} conversation(s) active(s)`,
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Trouver de nouveaux propriétaires", href: "/dashboard/concierge/recherche" },
      ]}
      metrics={[
        {
          label: "Contacts suivis",
          value: loading ? "..." : String(items.length),
          hint: "Base relationnelle concierge / propriétaires",
        },
        {
          label: "Conversations actives",
          value: loading ? "..." : String(activeConversations),
          hint: "Fils ouverts et en suivi",
        },
      ]}
      cards={
        recentContacts.length > 0
          ? recentContacts.map((conversation) => ({
              title: conversation.counterpart_name || "Propriétaire",
              text: `${conversation.subject || "Conversation directe"} - ${conversation.last_message_preview || "Aucun aperçu"} (${formatDate(conversation.last_message_at)})`,
              actions: [
                {
                  label: "Voir la conversation",
                  href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
                  variant: "primary",
                },
              ],
            }))
          : [
              {
                title: "Aucun contact pour le moment",
                text: loading
                  ? "Synchronisation des contacts en cours."
                  : error ||
                    "Lancez une prise de contact depuis la recherche propriétaires pour alimenter cette vue.",
                actions: [
                  {
                    label: "Explorer les annonces",
                    href: "/dashboard/concierge/recherche",
                    variant: "primary",
                  },
                ],
              },
            ]
      }
      detailSections={[
        {
          title: "Contacts à suivre",
          description:
            "Retrouvez les conversations ouvertes qui méritent une relance ou une prochaine étape commerciale.",
          emptyText:
            loading
              ? "Chargement des conversations en cours."
              : error || "Aucun contact actif à relancer pour le moment.",
          items: followUps,
        },
        {
          title: "Relances commerciales",
          description:
            "Conversations qui refroidissent et qui méritent une reprise de contact proactive.",
          emptyText:
            loading
              ? "Analyse des relances commerciales."
              : error || "Aucune relance prioritaire détectée.",
          items: dormantConversations,
        },
        {
          title: "Opportunités récentes",
          description:
            "Conversations encore chaudes à traiter rapidement pour maximiser la conversion.",
          emptyText:
            loading
              ? "Chargement des conversations récentes."
              : error || "Aucune opportunité récente à traiter.",
          items: freshOpportunities,
        },
      ]}
    />
  );
}
