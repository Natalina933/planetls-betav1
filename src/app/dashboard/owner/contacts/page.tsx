"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type OwnerConversationRow = {
  id: string;
  counterpart_name: string | null;
  subject: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Aucune activite recente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function OwnerContactsPage() {
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        setError(null);

        const response = await fetch("/api/messages/conversations?role=owner&limit=12", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos contacts.");
        }

        setConversations(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos contacts.");
      }
    }

    loadContacts();
  }, []);

  const openCount = useMemo(
    () => conversations.filter((conversation) => (conversation.status ?? "open") === "open").length,
    [conversations],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Contacts"
      title="Contacts"
      description={
        error
          ? error
          : "Retrouvez les concierges avec lesquels vous avez deja echange et accedez rapidement aux fils actifs."
      }
      chips={[
        `${conversations.length} contact(s)`,
        `${openCount} fil(s) ouverts`,
        conversations[0]?.counterpart_name ? `Dernier contact: ${conversations[0].counterpart_name}` : "Aucun contact recent",
      ]}
      actions={[
        { label: "Voir les messages", href: "/dashboard/owner/messages" },
        { label: "Voir la conciergerie", href: "/dashboard/owner/conciergerie" },
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
      ]}
      cards={
        conversations.length > 0
          ? conversations.slice(0, 6).map((conversation) => ({
              title: conversation.counterpart_name || "Contact",
              text: `${conversation.subject || "Sans sujet"} - ${conversation.last_message_preview || "Aucun apercu"} - ${conversation.status || "ouvert"} - ${formatDate(conversation.last_message_at)}`,
              actions: [
                { label: "Ouvrir la conversation", href: "/dashboard/owner/messages", variant: "primary" },
              ],
            }))
          : [
              {
                title: "Aucun contact",
                text: "Des que vous aurez des conversations actives, vos contacts remonteront automatiquement ici.",
                actions: [
                  { label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "primary" },
                ],
              },
            ]
      }
    />
  );
}
