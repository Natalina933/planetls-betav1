"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./OwnerMessagesPage.module.scss";

type OwnerConversationRow = {
  id: string;
  subject: string | null;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string | null;
};

type ConversationDetailPayload = {
  conversation: {
    id: string;
    subject: string | null;
    source: string;
    status: string;
  };
  messages: Array<{
    id: string;
    sender_profile_id: string;
    body: string;
    created_at: string;
  }>;
  participants: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    company_name: string | null;
  }>;
  current_user_id: string;
};

function formatDate(value: string | null, withTime = true) {
  if (!value) return "Aucune activité";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: withTime ? undefined : "numeric",
    hour: withTime ? "2-digit" : undefined,
    minute: withTime ? "2-digit" : undefined,
  }).format(date);
}

function getParticipantName(
  participants: ConversationDetailPayload["participants"],
  participantId: string,
) {
  const match = participants.find((participant) => participant.id === participantId);
  if (!match) return "Utilisateur";
  return (
    `${match.first_name ?? ""} ${match.last_name ?? ""}`.trim() ||
    match.company_name ||
    match.username ||
    "Utilisateur"
  );
}

function OwnerMessagesContent() {
  const searchParams = useSearchParams();
  const createdConversationId = searchParams.get("created") ?? "";

  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [detail, setDetail] = useState<ConversationDetailPayload | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadConversations(preferredId?: string) {
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

      const rows = Array.isArray(payload) ? payload : [];
      setConversations(rows);

      const nextId =
        (preferredId && rows.some((item) => item.id === preferredId) && preferredId) ||
        (activeConversationId && rows.some((item) => item.id === activeConversationId)
          ? activeConversationId
          : rows[0]?.id || "");

      setActiveConversationId(nextId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger vos conversations.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadConversationDetail(conversationId: string) {
    if (!conversationId) {
      setDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      setError(null);

      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger cette conversation.");
      }

      setDetail(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger cette conversation.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadConversations(createdConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      setDetail(null);
      return;
    }
    loadConversationDetail(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!createdConversationId) return;
    setSuccess("La conversation a bien été créée. Vous pouvez maintenant poursuivre ici.");
  }, [createdConversationId]);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const canSend = useMemo(
    () => activeConversationId.trim().length > 0 && draftMessage.trim().length > 0,
    [activeConversationId, draftMessage],
  );

  async function handleSendMessage() {
    if (!canSend) return;

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/messages/conversations/${activeConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draftMessage.trim() }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer votre message.");
      }

      setDraftMessage("");
      await loadConversationDetail(activeConversationId);
      await loadConversations(activeConversationId);
      setSuccess("Message envoyé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer votre message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Messagerie propriétaire</h1>
          <p>
            Retrouvez vos echanges avec les concierges et poursuivez vos conversations sans quitter
            le dashboard.
          </p>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Conversations</h2>
              <span>{loading ? "..." : `${conversations.length} fil(s)`}</span>
            </div>

            {loading ? <p>Chargement des conversations...</p> : null}

            {!loading && conversations.length === 0 ? (
              <div className={styles.messageList}>
                <p className={styles.emptyState}>Aucune conversation disponible pour le moment.</p>
                <Link href="/dashboard/owner/concierges" className={styles.cta}>
                  Trouver un concierge
                </Link>
              </div>
            ) : null}

            {!loading && conversations.length > 0 ? (
              <div className={styles.conversationList}>
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`${styles.conversationItem} ${
                      activeConversationId === conversation.id ? styles.conversationItemActive : ""
                    }`}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className={styles.conversationHead}>
                      <strong>{conversation.counterpart_name || "Concierge"}</strong>
                      <span>{formatDate(conversation.last_message_at)}</span>
                    </div>
                    <p>{conversation.subject || "Conversation directe"}</p>
                    <small>{conversation.last_message_preview || "Aucun apercu"}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </aside>

          <section className={styles.thread}>
            {!activeConversationId ? (
              <p className={styles.emptyState}>
                Selectionnez une conversation pour lire et repondre.
              </p>
            ) : detailLoading ? (
              <p className={styles.emptyState}>Chargement de la conversation...</p>
            ) : !detail ? (
              <p className={styles.emptyState}>Conversation indisponible.</p>
            ) : (
              <>
                <div className={styles.threadHeader}>
                  <h2>{detail.conversation.subject || "Conversation propriétaire"}</h2>
                  <span>{detail.conversation.status || detail.conversation.source}</span>
                </div>

                <div className={styles.messageList}>
                  {detail.messages.length === 0 ? (
                    <p className={styles.emptyState}>Aucun message pour le moment.</p>
                  ) : (
                    detail.messages.map((message) => {
                      const mine = message.sender_profile_id === detail.current_user_id;
                      return (
                        <article
                          key={message.id}
                          className={`${styles.message} ${
                            mine ? styles.messageMine : styles.messageOther
                          }`}
                        >
                          <div className={styles.messageMeta}>
                            <strong>
                              {getParticipantName(detail.participants, message.sender_profile_id)}
                            </strong>
                            <span>{formatDate(message.created_at)}</span>
                          </div>
                          <p>{message.body}</p>
                        </article>
                      );
                    })
                  )}
                </div>

                <div className={styles.composer}>
                  <textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Ecrivez votre message au concierge..."
                    aria-label="Ecrivez votre message au concierge"
                  />
                  <button type="button" onClick={handleSendMessage} disabled={sending || !canSend}>
                    {sending ? "Envoi..." : "Envoyer"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

export default function OwnerMessagesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid">Chargement de la messagerie...</section>}>
      <OwnerMessagesContent />
    </Suspense>
  );
}
