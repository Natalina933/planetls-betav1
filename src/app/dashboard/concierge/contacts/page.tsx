"use client";

import React, { useEffect, useMemo, useState } from "react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  formatContactDate,
  isOlderThanDays,
  normalizeContactStatus,
  toConversationItem,
} from "./contactsHelpers";

type ContactConversation = {
  id: string;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  subject: string | null;
  status: string | null;
};

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

    void loadContacts();
  }, []);

  const activeConversations = useMemo(
    () => items.filter((item) => item.status !== "closed"),
    [items],
  );
  const recentContacts = useMemo(() => activeConversations.slice(0, 4), [activeConversations]);
  const dormantConversations = useMemo(
    () => activeConversations.filter((item) => isOlderThanDays(item.last_message_at, 5)).slice(0, 6),
    [activeConversations],
  );
  const freshOpportunities = useMemo(
    () => activeConversations.filter((item) => !isOlderThanDays(item.last_message_at, 2)).slice(0, 6),
    [activeConversations],
  );
  const closedConversations = useMemo(
    () => items.filter((item) => item.status === "closed").length,
    [items],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Relation propriétaires"
      title="Contacts et relation"
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
              } (${formatContactDate(conversation.last_message_at)})`,
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
              normalizeContactStatus(conversation.status),
              "Reprendre l'echange",
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
              `Dernier message ${formatContactDate(conversation.last_message_at)}`,
              "Relancer maintenant",
              "warning",
            ),
          ),
        },
        {
          title: "Opportunites recentes",
          description:
            "Conversations encore chaudes à traiter rapidement pour maximiser la conversion.",
          emptyText:
            loading
              ? "Chargement des conversations recentes."
              : error || "Aucune opportunité récente à traiter.",
          items: freshOpportunities.map((conversation) =>
            toConversationItem(
              conversation,
              `Actif au ${formatContactDate(conversation.last_message_at)}`,
              "Continuer l'echange",
              "success",
            ),
          ),
        },
      ]}
    />
  );
}
