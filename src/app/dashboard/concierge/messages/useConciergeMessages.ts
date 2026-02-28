"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConversationDetailResponse,
  ConversationItem,
  fetchConversationDetail,
  fetchConversations,
  sendConversationMessage,
} from "./messagesClient";
import {
  buildParticipantNameMap,
  canSendConversationMessage,
  resolveActiveConversationId,
} from "./messagesState";

interface UseConciergeMessagesOptions {
  enabled: boolean;
  queryConversationId: string;
}

export function useConciergeMessages({
  enabled,
  queryConversationId,
}: UseConciergeMessagesOptions) {
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [activeConversation, setActiveConversation] =
    useState<ConversationDetailResponse | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      setListLoading(true);
      setErrorMsg(null);
      setConversations(await fetchConversations());
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur chargement conversations");
    } finally {
      setListLoading(false);
      if (initial) setLoading(false);
    }
  }, []);

  const loadConversationDetail = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    try {
      setDetailLoading(true);
      setErrorMsg(null);
      setActiveConversation(await fetchConversationDetail(conversationId));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur chargement conversation");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadConversations(true);
  }, [enabled, loadConversations]);

  useEffect(() => {
    const nextActiveConversationId = resolveActiveConversationId(
      conversations,
      queryConversationId,
      activeConversationId,
    );

    if (!nextActiveConversationId) {
      setActiveConversationId("");
      setActiveConversation(null);
      return;
    }

    if (nextActiveConversationId !== activeConversationId) {
      setActiveConversationId(nextActiveConversationId);
    }
  }, [conversations, queryConversationId, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadConversationDetail(activeConversationId);
  }, [activeConversationId, loadConversationDetail]);

  const participantNameById = useMemo(() => {
    return buildParticipantNameMap(activeConversation);
  }, [activeConversation?.participants]);

  const sendMessage = useCallback(async () => {
    if (!canSendConversationMessage(activeConversationId, draftMessage)) return;
    try {
      setSending(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await sendConversationMessage(activeConversationId, draftMessage.trim());
      setDraftMessage("");
      await loadConversationDetail(activeConversationId);
      loadConversations(false);
      setSuccessMsg("Message envoyé.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur envoi message");
    } finally {
      setSending(false);
    }
  }, [activeConversationId, draftMessage, loadConversationDetail, loadConversations]);

  useEffect(() => {
    if (!successMsg) return;
    const timeout = window.setTimeout(() => setSuccessMsg(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [successMsg]);

  return {
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
    participantNameById,
    canSend: canSendConversationMessage(activeConversationId, draftMessage),
    setActiveConversationId,
    setDraftMessage,
    sendMessage,
  };
}
