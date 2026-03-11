"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiSend } from "react-icons/fi";
import { DashboardSectionShell } from "@/components/dashboard";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { ConversationDetailResponse, ConversationItem } from "./messagesClient";
import { useConciergeMessages } from "./useConciergeMessages";
import styles from "./MessagesPage.module.scss";

interface ConversationListSidebarProps {
  conversations: ConversationItem[];
  activeConversationId: string;
  listLoading: boolean;
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
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
  return subject || "Conversation";
}

function ConversationListSidebar({
  conversations,
  activeConversationId,
  listLoading,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onSelect,
}: ConversationListSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Conversations prioritaires</h2>
        {listLoading && <span>MAJ...</span>}
      </div>

      <div className={styles.toolbar}>
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un propriÃ©taire ou un sujet"
          className={styles.searchField}
        />
        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tous statuts</option>
          <option value="open">Ouverts</option>
          <option value="closed">FermÃ©es</option>
        </select>
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
        <p className={styles.emptyState}>SÃ©lectionnez une conversation.</p>
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
          placeholder="Ã‰crire votre message..."
          aria-label="Ã‰crire votre message"
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesStatus = statusFilter === "all" || conversation.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        conversation.counterpart_name,
        conversation.subject,
        conversation.last_message_preview,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [conversations, searchTerm, statusFilter]);

  const openCount = useMemo(
    () => conversations.filter((conversation) => conversation.status === "open").length,
    [conversations],
  );

  if (loading) {
    return <div className={styles.page}>Chargement des messages...</div>;
  }

  return (
    <DashboardSectionShell
      persona="conciergerie"
      title="Messages proprietaires"
      subtitle="Centralisez vos echanges, relances et conversations actives dans une vue unique."
      stats={[
        { label: "Conversations", value: `${conversations.length}` },
        { label: "Ouvertes", value: `${openCount}` },
        { label: "Messages", value: `${activeConversation?.messages.length ?? 0}` },
      ]}
      actions={[
        { label: "Pilotage terrain", href: "/dashboard/concierge/planning" },
        { label: "Objectifs", href: "/dashboard/concierge/objectifs" },
      ]}
    >
    <ConciergeWorkspacePage
      eyebrow="Relation propriÃ©taires"
      title="Suivi des conversations"
      description="Centralisez vos Ã©changes propriÃ©taires, vos relances et vos fils actifs depuis une seule vue de pilotage."
      chips={[
        `${conversations.length} conversation(s)`,
        `${openCount} ouverte(s)`,
        activeConversation
          ? getConversationTitle(activeConversation.conversation.subject)
          : "Aucune conversation active",
      ]}
      metrics={[
        {
          label: "Conversations",
          value: `${conversations.length}`,
          hint: `${filteredConversations.length} visible(s) avec vos filtres`,
        },
        {
          label: "Ouvertes",
          value: `${openCount}`,
          hint: "Fils qui demandent encore un suivi",
        },
        {
          label: "Messages",
          value: `${activeConversation?.messages.length ?? 0}`,
          hint: "Dans la conversation active",
        },
      ]}
      actions={[
        { label: "Voir le pilotage terrain", href: "/dashboard/concierge/planning" },
        { label: "Voir les objectifs", href: "/dashboard/concierge/objectifs" },
      ]}
      cards={[
        {
          title: "Suivi relationnel",
          text:
            openCount > 0
              ? `${openCount} conversation(s) restent ouvertes avec vos propriÃ©taires. Priorisez celles qui font avancer signature, exÃ©cution ou satisfaction.`
              : "Aucune conversation ouverte pour le moment.",
        },
        {
          title: "Conversation active",
          text: activeConversation
            ? `${getConversationTitle(activeConversation.conversation.subject)} - ${activeConversation.messages.length} message(s)`
            : "SÃ©lectionnez un fil pour voir le dÃ©tail des Ã©changes.",
        },
      ]}
    >
      {errorMsg ? <p className={styles.errorBox}>{errorMsg}</p> : null}
      {successMsg ? <p className={styles.successBox}>{successMsg}</p> : null}

      <div className={styles.layout}>
        <ConversationListSidebar
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          listLoading={listLoading}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
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
    </ConciergeWorkspacePage>
    </DashboardSectionShell>
  );
}

export default function ConciergeMessagesPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Chargement des messages...</div>}>
      <ConciergeMessagesContent />
    </Suspense>
  );
}

