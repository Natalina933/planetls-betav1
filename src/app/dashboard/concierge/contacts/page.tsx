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

function normalizeStatus(value: string | null) {
  return value ? value.replaceAll("_", " ") : "non renseigné";
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
        const response = await fetch(
          "/api/messages/conversations?role=concierge&limit=60",
          {
            cache: "no-store",
          },
        );
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

  const activeConversations = useMemo(
    () => items.filter((item) => item.status !== "closed"),
    [items],
  );
  const recentContacts = useMemo(() => activeConversations.slice(0, 4), [activeConversations]);
  const dormantConversations = useMemo(
    () =>
      activeConversations.filter((item) => olderThanDays(item.last_message_at, 5)).slice(0, 6),
    [activeConversations],
  );
  const freshOpportunities = useMemo(
    () =>
      activeConversations.filter((item) => !olderThanDays(item.last_message_at, 2)).slice(0, 6),
    [activeConversations],
  );
  const closedConversations = useMemo(
    () => items.filter((item) => item.status === "closed").length,
    [items],
  );

  const toConversationItem = (
    conversation: ContactConversation,
    meta: string,
    actionLabel: string,
    tone?: "default" | "warning" | "success",
  ) => ({
    title: conversation.counterpart_name || "Propriétaire",
    meta,
    description: `${conversation.subject || "Conversation directe"} - ${
      conversation.last_message_preview || "Aucun aperçu disponible."
    }`,
    href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
    actionLabel,
    tone,
  });

  return (
    <ConciergeWorkspacePage
      eyebrow="Relation propriétaires"
      title="Contacts concierge"
      description={
        loading
          ? "Chargement de vos propriétaires et opportunités en cours..."
          : error ||
            "Pilotez vos échanges commerciaux, vos relances et les conversations les plus chaudes sans perdre le fil."
      }
      chips={[
        `${items.length} contact(s)`,
        `${activeConversations.length} conversation(s) active(s)`,
        `${dormantConversations.length} relance(s) à faire`,
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Trouver de nouveaux propriétaires", href: "/dashboard/concierge/recherche" },
      ]}
      metrics={[
        {
          label: "Contacts suivis",
          value: loading ? "..." : String(items.length),
          hint: "Base relationnelle active",
        },
        {
          label: "Conversations chaudes",
          value: loading ? "..." : String(freshOpportunities.length),
          hint: "À traiter rapidement",
        },
        {
          label: "Relances à faire",
          value: loading ? "..." : String(dormantConversations.length),
          hint: "Plus de 5 jours sans réponse",
        },
        {
          label: "Clôturées",
          value: loading ? "..." : String(closedConversations),
          hint: "Fils déjà terminés",
        },
      ]}
      cards={
        recentContacts.length > 0
          ? recentContacts.map((conversation) => ({
              title: conversation.counterpart_name || "Propriétaire",
              text: `${conversation.subject || "Conversation directe"} - ${
                conversation.last_message_preview || "Aucun aperçu"
              } (${formatDate(conversation.last_message_at)})`,
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
          title: "Pipeline actif",
          description:
            "Toutes les conversations ouvertes qui méritent une prochaine étape commerciale ou opérationnelle.",
          emptyText:
            loading
              ? "Chargement des conversations en cours."
              : error || "Aucun contact actif à suivre pour le moment.",
          items: activeConversations.slice(0, 8).map((conversation) =>
            toConversationItem(
              conversation,
              normalizeStatus(conversation.status),
              "Reprendre l'échange",
            ),
          ),
        },
        {
          title: "Relances commerciales",
          description:
            "Conversations qui refroidissent et qui demandent une reprise de contact proactive.",
          emptyText:
            loading
              ? "Analyse des relances commerciales."
              : error || "Aucune relance prioritaire détectée.",
          items: dormantConversations.map((conversation) =>
            toConversationItem(
              conversation,
              `Dernier message ${formatDate(conversation.last_message_at)}`,
              "Relancer maintenant",
              "warning",
            ),
          ),
        },
        {
          title: "Opportunités récentes",
          description:
            "Conversations encore chaudes à traiter rapidement pour maximiser la conversion.",
          emptyText:
            loading
              ? "Chargement des conversations récentes."
              : error || "Aucune opportunité récente à traiter.",
          items: freshOpportunities.map((conversation) =>
            toConversationItem(
              conversation,
              `Actif au ${formatDate(conversation.last_message_at)}`,
              "Continuer l'échange",
              "success",
            ),
          ),
        },
      ]}
    />
  );
}
