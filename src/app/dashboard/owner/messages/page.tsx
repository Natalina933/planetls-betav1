"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type OwnerConversationRow = {
  id: string;
  subject: string | null;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Aucun message";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function OwnerMessagesPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/messages/conversations?role=owner&limit=40", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos conversations.");
        }

        setConversations(Array.isArray(payload) ? payload : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger vos conversations.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Messagerie</h1>
        <p>Retrouvez vos echanges avec les concierges et gardez un suivi centralise.</p>
      </header>

      <div className="main-section">
        {searchParams.get("created") ? (
          <p style={{ color: "#7b5b23", fontWeight: 700 }}>
            La conversation a bien ete creee. Vous pouvez maintenant continuer ici.
          </p>
        ) : null}

        {loading ? <p>Chargement des conversations...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error && conversations.length === 0 ? (
          <div>
            <p>Aucune conversation disponible pour le moment.</p>
            <Link href="/dashboard/owner/concierges">Trouver un concierge a contacter</Link>
          </div>
        ) : null}

        {!loading && !error && conversations.length > 0 ? (
          <ul>
            {conversations.map((conversation) => (
              <li key={conversation.id} style={{ marginBottom: "1rem" }}>
                <strong>{conversation.subject || conversation.counterpart_name || "Conversation"}</strong>
                <br />
                Contact : {conversation.counterpart_name || "Contact"} | Statut :{" "}
                {conversation.status || "-"}
                <br />
                Dernier message : {conversation.last_message_preview || "Aucun apercu"}
                <br />
                Activite : {formatDate(conversation.last_message_at)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
