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
  const activeConversations = useMemo(
    () => items.filter((item) => item.status !== "closed").length,
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
    />
  );
}
