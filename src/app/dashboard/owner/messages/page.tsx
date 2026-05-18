"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateValue } from "@/app/utils/formatters";
import { ConversationFilters, DashboardSectionShell } from "@/components/dashboard";
import { Button, ButtonLink, Textarea } from "@/components/ui";
import styles from "./OwnerMessagesPage.module.scss";
import { markOwnerConversationSeen } from "../messageActivity";
import { ownerApiError } from "../ownerFeedback";

type OwnerConversationRow = {
  id: string;
  subject: string | null;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string | null;
  source?: string | null;
  source_reference?: string | null;
  unread_count?: number;
};

type OwnerConversationsListPayload = {
  items: OwnerConversationRow[];
  summary: {
    total: number;
    unread: number;
  };
  note: string | null;
};

type ConversationDetailPayload = {
  conversation: {
    id: string;
    subject: string | null;
    source: string;
    status: string;
    last_message_at?: string | null;
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
  const preferredConversationId =
    searchParams.get("conversation") ?? searchParams.get("created") ?? "";

  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [detail, setDetail] = useState<ConversationDetailPayload | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, setSeenVersion] = useState(0);

  async function loadConversations(preferredId?: string) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/messages/conversations?role=owner&limit=40", {
        cache: "no-store",
      });
      const payload = (await response.json()) as OwnerConversationsListPayload & { error?: string };

      if (!response.ok) {
        throw new Error(ownerApiError("Impossible de charger vos conversations.", payload?.error));
      }

      const rows = Array.isArray(payload?.items) ? payload.items : [];
      setConversations(rows);

      const nextId =
        (preferredId && rows.some((item) => item.id === preferredId) && preferredId) ||
        (activeConversationId && rows.some((item) => item.id === activeConversationId)
          ? activeConversationId
          : rows[0]?.id || "");

      setActiveConversationId(nextId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : ownerApiError("Impossible de charger vos conversations."),
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
        throw new Error(ownerApiError("Impossible de charger cette conversation.", payload?.error));
      }

      setDetail(payload);
      markOwnerConversationSeen(conversationId, payload?.conversation?.last_message_at ?? null);
      setSeenVersion((current) => current + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : ownerApiError("Impossible de charger cette conversation."),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    void loadConversations(preferredConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      setDetail(null);
      return;
    }

    void loadConversationDetail(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!preferredConversationId) return;
    setSuccess("La conversation a bien été créée. Vous pouvez maintenant poursuivre ici.");
  }, [preferredConversationId]);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const canSend = useMemo(
    () => activeConversationId.trim().length > 0 && draftMessage.trim().length > 0,
    [activeConversationId, draftMessage],
  );

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesStatus =
        statusFilter === "all" || (conversation.status ?? "open") === statusFilter;
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
        throw new Error(ownerApiError("Impossible d'envoyer votre message.", payload?.error));
      }

      setDraftMessage("");
      await loadConversationDetail(activeConversationId);
      await loadConversations(activeConversationId);
      markOwnerConversationSeen(activeConversationId);
      setSeenVersion((current) => current + 1);
      setSuccess("Message envoyé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : ownerApiError("Impossible d'envoyer votre message."));
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardSectionShell
      persona="owner"
      title="Suivi des échanges"
      subtitle="Centralisez vos conversations prioritaires avec vos concierges et gardez une trace claire des décisions."
      stats={[
        { label: "Conversations", value: `${conversations.length}` },
        {
          label: "Filtrées",
          value: `${filteredConversations.length}`,
          hint: "Avec vos filtres actifs",
        },
        {
          label: "Non lues",
          value: `${conversations.filter((item) => (item.unread_count ?? 0) > 0).length}`,
        },
      ]}
      actions={[
        { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
        { label: "Voir le planning", href: "/dashboard/owner/planning" },
      ]}
    >
      <div className={styles.page}>
        {success ? <p className={styles.successBox} role="status">{success}</p> : null}
        {error ? <p className={styles.errorBox} role="alert">{error}</p> : null}

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Conversations prioritaires</h2>
              <span className={styles.headerBadge}>{loading ? "..." : `${filteredConversations.length} fil(s)`}</span>
            </div>

            <ConversationFilters
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Rechercher un échange"
              searchLabel="Rechercher une conversation propriétaire"
              statusValue={statusFilter}
              onStatusChange={setStatusFilter}
              statusLabel="Filtrer les conversations par statut"
              statusOptions={[
                { value: "all", label: "Tous statuts" },
                { value: "open", label: "Ouverts" },
                { value: "closed", label: "Fermés" },
              ]}
              containerClassName={styles.filtersRow}
              searchClassName={styles.filtersInput}
              selectClassName={styles.filtersSelect}
            />

            {loading ? <p className={styles.infoText}>Chargement des conversations...</p> : null}

            {!loading && filteredConversations.length === 0 ? (
              <div className={styles.messageList}>
                <p className={styles.emptyState}>Aucune conversation disponible pour le moment.</p>
                <ButtonLink href="/dashboard/owner/concierges" variant="secondary" className={styles.cta}>
                  Trouver un concierge
                </ButtonLink>
              </div>
            ) : null}

            {!loading && filteredConversations.length > 0 ? (
              <div className={styles.conversationList}>
                {filteredConversations.map((conversation) => {
                  const unread = (conversation.unread_count ?? 0) > 0;

                  return (
                    <Button
                      key={conversation.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`${styles.conversationItem} ${
                        activeConversationId === conversation.id ? styles.conversationItemActive : ""
                      }`}
                      onClick={() => setActiveConversationId(conversation.id)}
                    >
                      <div className={styles.conversationHead}>
                        <strong>{conversation.counterpart_name || "Concierge"}</strong>
                        <div className={styles.conversationMeta}>
                          {unread ? (
                            <span className={styles.unreadDot} aria-label="Nouveau message" />
                          ) : null}
                          <span>
                            {formatDateValue(conversation.last_message_at, {
                              emptyLabel: "Aucune activité",
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <p>{conversation.subject || "Conversation directe"}</p>
                      <small>{conversation.last_message_preview || "Aucun aperçu"}</small>
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <section className={styles.thread}>
            {!activeConversationId ? (
              <p className={styles.emptyState}>Sélectionnez une conversation pour lire et répondre.</p>
            ) : detailLoading ? (
              <p className={styles.emptyState}>Chargement de la conversation...</p>
            ) : !detail ? (
              <p className={styles.emptyState}>Conversation indisponible.</p>
            ) : (
              <>
                <div className={styles.threadHeader}>
                  <h2>{detail.conversation.subject || "Conversation"}</h2>
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
                            <span>
                              {formatDateValue(message.created_at, {
                                emptyLabel: "Aucune activité",
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p>{message.body}</p>
                        </article>
                      );
                    })
                  )}
                </div>

                <div className={styles.composer}>
                  <Textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Écrivez votre message au concierge..."
                    aria-label="Écrivez votre message au concierge"
                    title="Écrivez votre message au concierge"
                    className={styles.composerTextarea}
                  />
                  <Button type="button" variant="primary" onClick={handleSendMessage} disabled={sending || !canSend}>
                    {sending ? "Envoi..." : "Envoyer"}
                  </Button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardSectionShell>
  );
}

export default function OwnerMessagesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid">Chargement des messages...</section>}>
      <OwnerMessagesContent />
    </Suspense>
  );
}
