"use client";

import React, { useEffect, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type OwnerConversationRow = {
  id: string;
  counterpart_name: string | null;
  subject: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string | null;
};

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

  return (
    <OwnerWorkspacePage
      eyebrow="Contacts"
      title="Mes contacts"
      description={
        error
          ? error
          : "Les contacts affiches ici proviennent directement de votre messagerie interne avec les concierges."
      }
      chips={[`${conversations.length} contact(s)`]}
      actions={[
        { label: "Voir la messagerie", href: "/dashboard/owner/messages" },
        { label: "Voir la conciergerie", href: "/dashboard/owner/conciergerie" },
      ]}
      cards={
        conversations.length > 0
          ? conversations.slice(0, 6).map((conversation) => ({
              title: conversation.counterpart_name || "Contact",
              text: `${conversation.subject || "Sans sujet"} • ${conversation.last_message_preview || "Aucun apercu"} • ${conversation.status || "-"}`,
            }))
          : [
              {
                title: "Aucun contact",
                text: "Des que vous aurez des conversations actives, vos contacts remonteront automatiquement ici.",
              },
            ]
      }
    />
  );
}
