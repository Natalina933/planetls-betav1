"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateValue } from "@/app/utils/formatters";
import { ConversationFilters } from "@/components/dashboard";
import { Badge, Button, ButtonLink, Select, Textarea } from "@/components/ui";
import { MessagesHeader, MessagesContext, MessagesFooter } from "./OwnerMessagesPanels";
import styles from "./OwnerMessagesPage.module.scss";
import { markOwnerConversationSeen } from "../messageActivity";
import { ownerApiError } from "../ownerFeedback";

export type OwnerConversationRow = {
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

export type ConversationDetailPayload = {
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

function getConversationContextLabel(source?: string | null, status?: string | null) {
  switch ((source ?? "").trim().toLowerCase()) {
    case "mission":
      return "Mission";
    case "quote":
      return "Devis";
    case "search":
      return "Recherche concierge";
    case "service_request":
    case "request":
      return "Demande";
    case "manual":
    case "direct":
      return "Conversation directe";
    default:
      return status || source || "Conversation";
  }
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
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sort, setSort] = useState("recent");
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

  const visibleConversations = [...filteredConversations]
    .filter(item => !unreadOnly || (item.unread_count ?? 0) > 0)
    .sort((a, b) => {
      const delta = (Date.parse(b.last_message_at ?? "") || 0) - (Date.parse(a.last_message_at ?? "") || 0);
      return sort === "oldest" ? -delta : delta;
    });

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

  async function retryMessages() {
    setSuccess(null);
    await loadConversations(activeConversationId || preferredConversationId);
    if (activeConversationId) {
      await loadConversationDetail(activeConversationId);
    }
  }

  return (
      <div className={styles.page} aria-busy={loading || detailLoading}>
        <MessagesHeader conversations={conversations} loading={loading} onUnread={() => { setUnreadOnly(true); setSearchTerm(""); setStatusFilter("all"); document.getElementById("owner-conversations")?.scrollIntoView({ block: "start" }); }} />
        {success ? <div className={styles.successBox} role="status">{success}</div> : null}
        {error ? (
          <div className={styles.errorBox} role="alert">
            <span>{error}</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => void retryMessages()}>
              Réessayer
            </Button>
          </div>
        ) : null}

        <div className={styles.layout}>
          <aside id="owner-conversations" className={styles.sidebar} aria-label="Liste des conversations">
            <div className={styles.sidebarHeader}>
              <h2>Conversations</h2>
              <span className={styles.headerBadge}>{loading ? "..." : `${visibleConversations.length} fil(s)`}</span>
            </div>

            <ButtonLink href="/dashboard/owner/concierges" variant="secondary" size="sm">Nouveau message</ButtonLink>
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

            <div className={styles.listControls}>
              <div className={styles.tabs} role="group" aria-label="Vue des conversations">
                <Button size="sm" variant={!unreadOnly ? "primary" : "ghost"} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>Toutes</Button>
                <Button size="sm" variant={unreadOnly ? "primary" : "ghost"} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Non lues</Button>
              </div>
              <Select aria-label="Trier les conversations" value={sort} onChange={event => setSort(event.target.value)}>
                <option value="recent">Plus récentes</option><option value="oldest">Plus anciennes</option>
              </Select>
            </div>
            {loading ? <p className={styles.infoText}>Chargement des conversations...</p> : null}

            {!loading && !error && visibleConversations.length === 0 ? (
              <div className={styles.messageList}>
                <p className={styles.emptyState}>Aucune conversation ne correspond à cette vue.</p>
                <ButtonLink href="/dashboard/owner/concierges" variant="secondary" className={styles.cta}>
                  Trouver un concierge
                </ButtonLink>
              </div>
            ) : null}

            {!loading && visibleConversations.length > 0 ? (
              <div className={styles.conversationList}>
                {visibleConversations.map((conversation) => {
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
                      aria-pressed={activeConversationId === conversation.id}
                      onClick={() => { setActiveConversationId(conversation.id); document.getElementById("owner-message-thread")?.focus(); }}
                    >
                      <span className={styles.avatar} aria-hidden="true">{(conversation.counterpart_name || "C").slice(0,1)}</span>
                      <div className={styles.conversationHead}>
                        <strong>{conversation.counterpart_name || "Concierge"}</strong>
                        <div className={styles.conversationMeta}>
                          {unread ? (
                            <Badge variant="success">Non lu</Badge>
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
                      <p>{conversation.subject || "Conversation directe"}</p>
                      <small>{conversation.last_message_preview || "Aucun aperçu"}</small>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </aside>

          <section id="owner-message-thread" tabIndex={-1} className={styles.thread} aria-label="Échange actif">
            {!activeConversationId ? (
              <p className={styles.emptyState}>Sélectionnez une conversation pour lire et répondre.</p>
            ) : detailLoading ? (
              <p className={styles.emptyState}>Chargement de la conversation...</p>
            ) : !detail || detail.conversation.id !== activeConversationId ? (
              <p className={styles.emptyState}>Conversation indisponible.</p>
            ) : (
              <>
                <div className={styles.threadHeader}>
                  <span className={styles.avatar} aria-hidden="true">{(conversations.find(item => item.id === activeConversationId)?.counterpart_name || "C").slice(0,1)}</span>
                  <div><h2>{conversations.find(item => item.id === activeConversationId)?.counterpart_name || "Conversation"}</h2><p>{detail.conversation.subject || "Conversation directe"}</p></div>
                  <span>
                    {getConversationContextLabel(detail.conversation.source, detail.conversation.status)}
                  </span>
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

                {detail.messages.length >= 400 ? <p className={styles.infoText}>Les 400 premiers messages de cet échange sont affichés.</p> : null}
                <div className={styles.composer}>
                  <Textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Écrivez votre message..."
                    aria-label="Écrivez votre message"
                    title="Écrivez votre message"
                    className={styles.composerTextarea}
                  />
                  <Button type="button" variant="primary" onClick={handleSendMessage} disabled={sending || !canSend}>
                    {sending ? "Envoi..." : "Envoyer"}
                  </Button>
                </div>
              </>
            )}
          </section>
          <MessagesContext
            detail={detail?.conversation.id === activeConversationId && !detailLoading ? detail : null}
            row={conversations.find(item => item.id === activeConversationId)}
            loading={detailLoading}
          />
        </div>
        {conversations.length >= 40 ? <p className={styles.infoText}>Vue limitée aux 40 conversations les plus récentes.</p> : null}
        <MessagesFooter conversations={conversations} onSelect={id => { setActiveConversationId(id); document.getElementById("owner-message-thread")?.focus(); }} />
      </div>

  );
}

export default function OwnerMessagesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid">Chargement des messages...</section>}>
      <OwnerMessagesContent />
    </Suspense>
  );
}
