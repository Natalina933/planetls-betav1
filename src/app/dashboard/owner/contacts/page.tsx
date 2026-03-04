"use client";

import { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";

type ContactConversation = {
  id: string;
  counterpart_name?: string | null;
  subject?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  status?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Date non renseignée";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OwnerContactsPage() {
  const [conversations, setConversations] = useState<ContactConversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      try {
        const response = await fetch("/api/messages/conversations?scope=owner", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Impossible de charger les conversations.");
        }

        const payload = (await response.json()) as { items?: ContactConversation[] };
        if (!cancelled) {
          setConversations(Array.isArray(payload.items) ? payload.items : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger les conversations.");
        }
      }
    }

    void loadContacts();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCount = useMemo(
    () => conversations.filter((conversation) => (conversation.status ?? "open") === "open").length,
    [conversations],
  );

  return (
    <OwnerWorkspacePage
      eyebrow="Relation concierge"
      title="Contacts et échanges"
      description={
        error
          ? error
          : "Retrouvez les concierges avec lesquels vous avez déjà échangé et priorisez les fils qui demandent un prochain pas."
      }
      chips={[
        `${conversations.length} contact(s)`,
        `${openCount} fil(s) ouverts`,
        conversations[0]?.counterpart_name
          ? `Dernier contact : ${conversations[0].counterpart_name}`
          : "Aucun contact récent",
      ]}
      actions={[
        { label: "Ouvrir les messages", href: "/dashboard/owner/messages" },
        { label: "Voir la conciergerie", href: "/dashboard/owner/conciergerie" },
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
      ]}
      metrics={[
        {
          label: "Contacts suivis",
          value: String(conversations.length),
          hint: "Concierges avec lesquels un échange existe déjà",
        },
        {
          label: "Fils ouverts",
          value: String(openCount),
          hint: "Discussions qui demandent encore un suivi",
        },
        {
          label: "Dernier contact",
          value: conversations[0]?.counterpart_name || "-",
          hint: "Dernier interlocuteur remonté dans votre espace",
        },
      ]}
      cards={
        conversations.length > 0
          ? conversations.slice(0, 6).map((conversation) => ({
              title: conversation.counterpart_name || "Contact",
              text: `${conversation.subject || "Sans sujet"} - ${conversation.last_message_preview || "Aucun aperçu"} - ${conversation.status || "ouvert"} - ${formatDate(conversation.last_message_at)}`,
              actions: [
                { label: "Ouvrir la conversation", href: "/dashboard/owner/messages", variant: "primary" as const },
              ],
            }))
          : [
              {
                title: "Aucun contact",
                text: "Dès que vous aurez des conversations actives, vos contacts remonteront automatiquement ici.",
                actions: [
                  { label: "Trouver un concierge", href: "/dashboard/owner/concierges", variant: "primary" as const },
                ],
              },
            ]
      }
    />
  );
}
