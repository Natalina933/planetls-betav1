"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import {
  ConversationDetailResponse,
  ConversationItem,
} from "./messagesClient";
import { useConciergeMessages } from "./useConciergeMessages";
import styles from "./MessagesPage.module.scss";

interface MessagesHeaderProps {
  listLoading: boolean;
}

interface ConversationListSidebarProps {
  conversations: ConversationItem[];
  activeConversationId: string;
  listLoading: boolean;
  onSelect: (conversationId: string) => void;
}

interface ConversationThreadProps {
  activeConversationId: string;
  detailLoading: boolean;
  activeConversation: ConversationDetailResponse | null;
  participantNameById: Map<string, string>;
  draftMessage: string;
  sending: boolean;
  canSend: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
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

function getConversationTitle(subject?: string | null) {
  return subject || "Conversation proprietaire";
}

function MessagesHeader({ listLoading }: MessagesHeaderProps) {
  return (
    <header className={styles.header}>
      <h1>
        <FiMessageCircle size={18} />
        Messagerie concierge
      </h1>
      <p>Conversations proprietaires et suivi commercial.</p>
      {listLoading && <span>Synchronisation en cours...</span>}
    </header>
  );
}

function ConversationListSidebar({
  conversations,
  activeConversationId,
  listLoading,
  onSelect,
}: ConversationListSidebarProps) {
  return (
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
              onClick={() => onSelect(conversation.id)}
              className={`${styles.conversationItem} ${
                activeConversationId === conversation.id ? styles.conversationItemActive : ""
              }`}
            >
              <div className={styles.conversationHead}>
                <strong>{conversation.counterpart_name}</strong>
                <span>{formatDateTime(conversation.last_message_at)}</span>
              </div>
              <p>{getConversationTitle(conversation.subject)}</p>
              <small>{conversation.last_message_preview || "Aucun message"}</small>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function ConversationThread({
  activeConversationId,
  detailLoading,
  activeConversation,
  participantNameById,
  draftMessage,
  sending,
  canSend,
  onDraftChange,
  onSend,
}: ConversationThreadProps) {
  if (!activeConversationId) {
    return (
      <section className={styles.thread}>
        <p className={styles.emptyState}>Selectionnez une conversation.</p>
      </section>
    );
  }

  if (detailLoading) {
    return (
      <section className={styles.thread}>
        <p className={styles.emptyState}>Chargement de la conversation...</p>
      </section>
    );
  }

  if (!activeConversation) {
    return (
      <section className={styles.thread}>
        <p className={styles.emptyState}>Conversation indisponible.</p>
      </section>
    );
  }

  return (
    <section className={styles.thread}>
      <div className={styles.threadHeader}>
        <h2>{getConversationTitle(activeConversation.conversation.subject)}</h2>
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
                <strong>{participantNameById.get(message.sender_profile_id) || "Utilisateur"}</strong>
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
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Ecrire votre message..."
          aria-label="Ecrire votre message"
        />
        <button type="button" onClick={onSend} disabled={sending || !canSend}>
          <FiSend size={14} />
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </section>
  );
}

function ConciergeMessagesContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryConversationId = searchParams.get("conversation") ?? "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const {
    loading,
    listLoading,
    detailLoading,
    errorMsg,
    successMsg,
    conversations,
    activeConversationId,
    activeConversation,
    draftMessage,
    sending,
    canSend,
    participantNameById,
    setActiveConversationId,
    setDraftMessage,
    sendMessage,
  } = useConciergeMessages({
    enabled: status === "authenticated",
    queryConversationId,
  });

  if (loading) {
    return <div className={styles.page}>Chargement de la messagerie...</div>;
  }

  return (
    <div className={styles.page}>
      <MessagesHeader listLoading={listLoading} />

      {errorMsg && <p className={styles.errorBox}>{errorMsg}</p>}
      {successMsg && <p className={styles.successBox}>{successMsg}</p>}

      <div className={styles.layout}>
        <ConversationListSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          listLoading={listLoading}
          onSelect={setActiveConversationId}
        />
        <ConversationThread
          activeConversationId={activeConversationId}
          detailLoading={detailLoading}
          activeConversation={activeConversation}
          participantNameById={participantNameById}
          draftMessage={draftMessage}
          sending={sending}
          canSend={canSend}
          onDraftChange={setDraftMessage}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}

export default function ConciergeMessagesPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Chargement de la messagerie...</div>}>
      <ConciergeMessagesContent />
    </Suspense>
  );
}
