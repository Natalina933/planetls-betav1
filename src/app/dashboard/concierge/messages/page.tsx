"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import styles from "./MessagesPage.module.scss";

interface ConversationItem {
  id: string;
  subject: string | null;
  source: string;
  status: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  counterpart_profile_id: string | null;
  counterpart_name: string;
}

interface ConversationMessage {
  id: string;
  sender_profile_id: string;
  body: string;
  created_at: string;
  message_type: string;
}

interface ConversationDetailResponse {
  conversation: {
    id: string;
    subject: string | null;
    source: string;
    status: string;
    concierge_profile_id: string;
    owner_profile_id: string;
  };
  messages: ConversationMessage[];
  participants: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    company_name: string | null;
  }>;
  current_user_id: string;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getResponseError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body?.error === "string" && body.error.trim()) return body.error;
    return fallback;
  } catch {
    return fallback;
  }
};

export default function ConciergeMessagesPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryConversationId = searchParams.get("conversation") ?? "";

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [activeConversation, setActiveConversation] =
    useState<ConversationDetailResponse | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const loadConversations = useCallback(
    async (initial = false) => {
      try {
        if (initial) setLoading(true);
        setListLoading(true);
        setErrorMsg(null);

        const res = await fetch("/api/messages/conversations?role=concierge&limit=80", {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(await getResponseError(res, "Erreur chargement conversations"));
        }

        const rows = (await res.json()) as ConversationItem[];
        setConversations(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur chargement conversations");
      } finally {
        setListLoading(false);
        if (initial) setLoading(false);
      }
    },
    [router],
  );

  const loadConversationDetail = useCallback(
    async (conversationId: string) => {
      if (!conversationId) return;
      try {
        setDetailLoading(true);
        setErrorMsg(null);

        const res = await fetch(`/api/messages/conversations/${conversationId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(await getResponseError(res, "Erreur chargement conversation"));
        }

        const detail = (await res.json()) as ConversationDetailResponse;
        setActiveConversation(detail);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur chargement conversation");
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    loadConversations(true);
  }, [status, loadConversations]);

  useEffect(() => {
    if (conversations.length === 0) {
      setActiveConversationId("");
      setActiveConversation(null);
      return;
    }

    if (queryConversationId) {
      const exists = conversations.some((conversation) => conversation.id === queryConversationId);
      if (exists) {
        setActiveConversationId(queryConversationId);
        return;
      }
    }

    if (!activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, queryConversationId, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadConversationDetail(activeConversationId);
  }, [activeConversationId, loadConversationDetail]);

  const participantNameById = useMemo(() => {
    const map = new Map<string, string>();
    (activeConversation?.participants ?? []).forEach((participant) => {
      const fullName = `${participant.first_name ?? ""} ${participant.last_name ?? ""}`.trim();
      map.set(
        participant.id,
        fullName || participant.company_name || participant.username || "Contact",
      );
    });
    return map;
  }, [activeConversation?.participants]);

  const sendMessage = async () => {
    if (!activeConversationId || !draftMessage.trim()) return;
    try {
      setSending(true);
      setErrorMsg(null);

      const res = await fetch(`/api/messages/conversations/${activeConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draftMessage.trim() }),
      });
      if (!res.ok) {
        throw new Error(await getResponseError(res, "Erreur envoi message"));
      }

      setDraftMessage("");
      await loadConversationDetail(activeConversationId);
      loadConversations(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur envoi message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className={styles.page}>Chargement de la messagerie...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>
          <FiMessageCircle size={18} />
          Messagerie concierge
        </h1>
        <p>Conversations propriétaires et suivi commercial.</p>
      </header>

      {errorMsg && <p className={styles.errorBox}>{errorMsg}</p>}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Conversations</h2>
            {listLoading && <span>MAJ...</span>}
          </div>

          {conversations.length === 0 ? (
            <p className={styles.emptyState}>Aucune conversation pour le moment.</p>
          ) : (
            <div className={styles.conversationList}>
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`${styles.conversationItem} ${
                    activeConversationId === conversation.id ? styles.conversationItemActive : ""
                  }`}
                >
                  <div className={styles.conversationHead}>
                    <strong>{conversation.counterpart_name}</strong>
                    <span>{formatDateTime(conversation.last_message_at)}</span>
                  </div>
                  <p>{conversation.subject || "Conversation proprietaire"}</p>
                  <small>{conversation.last_message_preview || "Aucun message"}</small>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className={styles.thread}>
          {!activeConversationId ? (
            <p className={styles.emptyState}>Selectionnez une conversation.</p>
          ) : detailLoading ? (
            <p className={styles.emptyState}>Chargement de la conversation...</p>
          ) : !activeConversation ? (
            <p className={styles.emptyState}>Conversation indisponible.</p>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <h2>{activeConversation.conversation.subject || "Conversation proprietaire"}</h2>
                <span>{activeConversation.conversation.source}</span>
              </div>

              <div className={styles.messageList}>
                {activeConversation.messages.length === 0 && (
                  <p className={styles.emptyState}>Aucun message.</p>
                )}
                {activeConversation.messages.map((message) => {
                  const isMe = message.sender_profile_id === activeConversation.current_user_id;
                  return (
                    <article
                      key={message.id}
                      className={`${styles.message} ${isMe ? styles.messageMine : styles.messageOther}`}
                    >
                      <div className={styles.messageMeta}>
                        <strong>
                          {participantNameById.get(message.sender_profile_id) || "Utilisateur"}
                        </strong>
                        <span>{formatDateTime(message.created_at)}</span>
                      </div>
                      <p>{message.body}</p>
                    </article>
                  );
                })}
              </div>

              <div className={styles.composer}>
                <textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Ecrire votre message..."
                />
                <button type="button" onClick={sendMessage} disabled={sending || !draftMessage.trim()}>
                  <FiSend size={14} />
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
