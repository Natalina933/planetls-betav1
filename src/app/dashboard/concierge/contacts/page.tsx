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
  if (!value) return "Aucun message recent";
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
          title: conversation.counterpart_name || "Proprietaire",
          meta: formatDate(conversation.last_message_at),
          description:
            `${conversation.subject || "Conversation directe"} - ${conversation.last_message_preview || "Aucun apercu disponible."}`,
          href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
          actionLabel: "Reprendre l'echange",
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
          title: conversation.counterpart_name || "Proprietaire",
          meta: "Relance a faire",
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
          title: conversation.counterpart_name || "Proprietaire",
          meta: "Conversation chaude",
          description:
            `${conversation.subject || "Conversation directe"} - dernier echange ${formatDate(conversation.last_message_at)}.`,
          href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
          actionLabel: "Continuer l'echange",
          tone: "success" as const,
        })),
    [items],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Relation proprietaires"
      title="Contacts concierge"
      description={
        loading
          ? "Chargement de vos proprietaires et opportunites en cours..."
          : error ||
            "Retrouvez les proprietaires deja engages, les reprises de contact et vos echanges les plus recents."
      }
      chips={[
        `${items.length} contact(s)`,
        `${activeConversations} conversation(s) active(s)`,
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Trouver de nouveaux proprietaires", href: "/dashboard/concierge/recherche" },
      ]}
      metrics={[
        {
          label: "Contacts suivis",
          value: loading ? "..." : String(items.length),
          hint: "Base relationnelle concierge / proprietaires",
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
              title: conversation.counterpart_name || "Proprietaire",
              text: `${conversation.subject || "Conversation directe"} - ${conversation.last_message_preview || "Aucun apercu"} (${formatDate(conversation.last_message_at)})`,
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
                    "Lancez une prise de contact depuis la recherche proprietaires pour alimenter cette vue.",
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
          title: "Contacts a suivre",
          description:
            "Retrouvez les conversations ouvertes qui meritent une relance ou une prochaine etape commerciale.",
          emptyText:
            loading
              ? "Chargement des conversations en cours."
              : error || "Aucun contact actif a relancer pour le moment.",
          items: followUps,
        },
        {
          title: "Relances commerciales",
          description:
            "Conversations qui refroidissent et qui meritent une reprise de contact proactive.",
          emptyText:
            loading
              ? "Analyse des relances commerciales."
              : error || "Aucune relance prioritaire detectee.",
          items: dormantConversations,
        },
        {
          title: "Opportunites recentes",
          description:
            "Conversations encore chaudes a traiter rapidement pour maximiser la conversion.",
          emptyText:
            loading
              ? "Chargement des conversations recentes."
              : error || "Aucune opportunite recente a traiter.",
          items: freshOpportunities,
        },
      ]}
    />
  );
}
