"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./ProviderMessagesPage.module.scss";

type ProviderConversationRow = {
  id: string;
  subject: string | null;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  status: string | null;
};

type ProviderConversationDetail = {
  conversation: {
    id: string;
    subject: string | null;
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
  client: {
    id: string;
    client_name: string;
    company_name: string | null;
    city: string | null;
  } | null;
  current_user_id: string;
};

type ProviderMessagesListPayload = {
  items: ProviderConversationRow[];
  summary: {
    total: number;
    unread: number;
  };
  note: string | null;
};

type ProviderClientOption = {
  id: string;
  client_name: string;
  company_name: string | null;
  city: string | null;
};

type ProviderClientsPayload = {
  items: ProviderClientOption[];
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
  participants: ProviderConversationDetail["participants"],
  participantId: string,
) {
  const match = participants.find((participant) => participant.id === participantId);
  if (!match) return "Artisan";

  return (
    `${match.first_name ?? ""} ${match.last_name ?? ""}`.trim() ||
    match.company_name ||
    match.username ||
    "Artisan"
  );
}

function ProviderMessagesContent() {
  const searchParams = useSearchParams();
  const targetConversationId = searchParams.get("conversation");
  const targetClientId = searchParams.get("client");
  const [list, setList] = useState<ProviderMessagesListPayload | null>(null);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [detail, setDetail] = useState<ProviderConversationDetail | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<ProviderClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadConversations(preferredId?: string) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/provider/messages", { cache: "no-store" });
      const payload = (await response.json()) as ProviderMessagesListPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger vos conversations.");
      }

      setList(payload);
      const rows = Array.isArray(payload.items) ? payload.items : [];
      const nextId =
        (preferredId && rows.some((item) => item.id === preferredId) && preferredId) ||
        (targetConversationId &&
          rows.some((item) => item.id === targetConversationId) &&
          targetConversationId) ||
        (activeConversationId &&
        rows.some((item) => item.id === activeConversationId)
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

      const response = await fetch(`/api/provider/messages/${conversationId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ProviderConversationDetail & { error?: string };

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
    void loadConversations(targetConversationId || undefined);
  }, [targetConversationId]);

  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const response = await fetch("/api/provider/clients", { cache: "no-store" });
        const payload = (await response.json()) as ProviderClientsPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les clients.");
        }
        if (!cancelled) {
          const nextClients = Array.isArray(payload.items) ? payload.items : [];
          setClients(nextClients);
          setSelectedClientId((current) => current || targetClientId || nextClients[0]?.id || "");
        }
      } catch {
        if (!cancelled) {
          setClients([]);
        }
      }
    }

    void loadClients();
    return () => {
      cancelled = true;
    };
  }, [targetClientId]);

  useEffect(() => {
    void loadConversationDetail(activeConversationId);
  }, [activeConversationId]);

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
    const conversations = list?.items ?? [];
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
  }, [list?.items, searchTerm, statusFilter]);

  const canCreateConversation = useMemo(
    () => selectedClientId.trim().length > 0 && newMessage.trim().length > 0,
    [selectedClientId, newMessage],
  );

  async function handleSendMessage() {
    if (!canSend) return;

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/provider/messages/${activeConversationId}`, {
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

  async function handleCreateConversation() {
    if (!canCreateConversation) return;

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/provider/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClientId,
          subject: newSubject.trim() || null,
          body: newMessage.trim(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de créer la conversation.");
      }

      const createdConversationId =
        typeof payload?.conversation?.id === "string" ? payload.conversation.id : "";

      setNewSubject("");
      setNewMessage("");
      await loadConversations(createdConversationId);
      if (createdConversationId) {
        await loadConversationDetail(createdConversationId);
      }
      setSuccess("Conversation créée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la conversation.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Messages</h1>
          <p>
            Suivez vos échanges clients depuis l&apos;espace artisan, avec un fil unique par
            dossier.
          </p>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {!error && list?.note ? <p className={styles.infoBox}>{list.note}</p> : null}
        {targetClientId ? <p className={styles.infoBox}>Focus sur le client sélectionné.</p> : null}

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.createBox}>
              <h2>Nouveau fil</h2>
              {clients.length === 0 ? (
                <p className={styles.emptyState}>
                  Ajoutez d&apos;abord un client pour démarrer une conversation.
                </p>
              ) : (
                <>
                  <select
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.client_name}
                        {client.city ? ` - ${client.city}` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(event) => setNewSubject(event.target.value)}
                    placeholder="Objet de la conversation"
                  />
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Premier message..."
                  />
                  <button
                    type="button"
                    disabled={!canCreateConversation || creating}
                    onClick={handleCreateConversation}
                  >
                    {creating ? "Création..." : "Créer le fil"}
                  </button>
                </>
              )}
            </div>

            <div className={styles.sidebarHeader}>
              <h2>Conversations</h2>
              <span>{loading ? "..." : `${filteredConversations.length} fil(s)`}</span>
            </div>

            <div className={styles.toolbar}>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un fil"
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous statuts</option>
                <option value="open">Ouverts</option>
                <option value="archived">Archives</option>
                <option value="closed">Fermés</option>
              </select>
              <span className={styles.counter}>
                {filteredConversations.filter((item) => (item.status ?? "open") === "open").length} ouverts
              </span>
            </div>

            {loading ? <p>Chargement des conversations...</p> : null}

            {!loading && filteredConversations.length === 0 ? (
              <div className={styles.messageList}>
                <p className={styles.emptyState}>Aucune conversation disponible pour le moment.</p>
                <Link href="/dashboard/provider/clients" className={styles.cta}>
                  Voir les clients
                </Link>
              </div>
            ) : null}

            {!loading && filteredConversations.length > 0 ? (
              <div className={styles.conversationList}>
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`${styles.conversationItem} ${
                      activeConversationId === conversation.id ? styles.conversationItemActive : ""
                    }`}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className={styles.conversationHead}>
                      <strong>{conversation.counterpart_name || "Client"}</strong>
                      <span>{formatDate(conversation.last_message_at)}</span>
                    </div>
                    <p>{conversation.subject || "Conversation client"}</p>
                    <small>{conversation.last_message_preview || "Aucun message pour le moment."}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </aside>

          <section className={styles.thread}>
            {!activeConversationId ? (
              <p className={styles.emptyState}>
                Sélectionnez une conversation pour lire et répondre.
              </p>
            ) : detailLoading ? (
              <p className={styles.emptyState}>Chargement de la conversation...</p>
            ) : !detail ? (
              <p className={styles.emptyState}>Conversation indisponible.</p>
            ) : (
              <>
                <div className={styles.threadHeader}>
                  <div className={styles.threadHeaderText}>
                    <h2>{detail.conversation.subject || "Conversation client"}</h2>
                    <p>
                      {detail.client?.client_name || "Client"}
                      {detail.client?.city ? `, ${detail.client.city}` : ""}
                    </p>
                  </div>
                  <span>{detail.conversation.status || "open"}</span>
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
                    placeholder="Écrivez votre message client..."
                  />
                  <button type="button" disabled={!canSend || sending} onClick={handleSendMessage}>
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

export default function ProviderMessagesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid"><p>Chargement des messages...</p></section>}>
      <ProviderMessagesContent />
    </Suspense>
  );
}
