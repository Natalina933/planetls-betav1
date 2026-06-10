"use client";

import { useEffect, useMemo, useState } from "react";
import { takeFirst } from "../shared";
import {
  buildProviderDisplayName,
  fetchCurrentProviderProfile,
  type ProviderCurrentProfile,
  type ProviderWorkspacePayload,
} from "./_components/providerProfile";

type ProviderClientItem = {
  id: string;
  client_name: string | null;
  company_name: string | null;
  city: string | null;
  status: string | null;
};

export type ProviderInterventionItem = {
  id: string;
  client_id: string | null;
  title: string | null;
  description: string | null;
  service_label: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  budget_amount: number | null;
  currency: string | null;
  location_label: string | null;
  created_at: string | null;
};

type ProviderAlertItem = {
  id: string;
  title: string | null;
  body: string | null;
  severity: string | null;
  status: string | null;
};

export type ProviderConversationItem = {
  id: string;
  subject: string | null;
  status: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  counterpart_name: string | null;
};

export type ProviderQuoteItem = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  currency?: string | null;
  valid_until?: string | null;
  sent_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string | null;
  owner?: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  } | null;
  quote_items?: Array<{
    id: string;
    label: string;
    quantity: number;
    line_total: number;
  }>;
};

type ProviderBillingHistory = {
  events?: Array<Record<string, unknown>>;
  subscription?: Record<string, unknown> | null;
} | null;

type ProviderDashboardState = {
  summary: {
    clients: number;
    activeClients: number;
    interventions: number;
    inProgress: number;
    pendingInterventions: number;
    alerts: number;
    urgentAlerts: number;
    conversations: number;
    unreadConversations: number;
    quotes: number;
    pendingQuotes: number;
    acceptedQuotes: number;
  };
  clients: ProviderClientItem[];
  interventions: ProviderInterventionItem[];
  alerts: ProviderAlertItem[];
  conversations: ProviderConversationItem[];
  quotes: ProviderQuoteItem[];
  billing: ProviderBillingHistory;
};

type ProviderClientsResponse = {
  items?: ProviderClientItem[];
  summary?: {
    total?: number;
    active?: number;
  };
};

type ProviderInterventionsResponse = {
  items?: ProviderInterventionItem[];
  summary?: {
    total?: number;
    in_progress?: number;
    pending?: number;
    completed?: number;
  };
};

type ProviderAlertsResponse = {
  items?: ProviderAlertItem[];
  summary?: {
    total?: number;
    urgent?: number;
  };
};

type ProviderMessagesResponse = {
  items?: ProviderConversationItem[];
  summary?: {
    total?: number;
    unread?: number;
  };
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || `Impossible de charger ${url}.`);
  }

  return payload as T;
}

function isAcceptedQuoteStatus(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase() === "accepted";
}

function isPendingQuoteStatus(status: string | null | undefined) {
  return ["draft", "sent"].includes((status ?? "").trim().toLowerCase());
}

export function useProviderDashboardData() {
  const [workspace, setWorkspace] = useState<ProviderWorkspacePayload | null>(null);
  const [dashboard, setDashboard] = useState<ProviderDashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const results = await Promise.allSettled([
        fetchCurrentProviderProfile(),
        fetchJson<ProviderClientsResponse>("/api/provider/clients"),
        fetchJson<ProviderInterventionsResponse>("/api/provider/interventions"),
        fetchJson<ProviderAlertsResponse>("/api/provider/alerts"),
        fetchJson<ProviderMessagesResponse>("/api/provider/messages"),
        fetchJson<ProviderQuoteItem[] | { items?: ProviderQuoteItem[] }>("/api/quotes?limit=30"),
        fetchJson<ProviderBillingHistory>("/api/billing/history"),
      ]);

      if (cancelled) return;

      const [
        workspaceResult,
        clientsResult,
        interventionsResult,
        alertsResult,
        messagesResult,
        quotesResult,
        billingResult,
      ] = results;

      const firstFailure = results.find((result) => result.status === "rejected");
      if (firstFailure?.status === "rejected") {
        setError(firstFailure.reason instanceof Error ? firstFailure.reason.message : "Chargement partiel du cockpit provider.");
      } else {
        setError(null);
      }

      const nextWorkspace =
        workspaceResult.status === "fulfilled" ? workspaceResult.value : null;
      const clientsPayload =
        clientsResult.status === "fulfilled" ? clientsResult.value : null;
      const interventionsPayload =
        interventionsResult.status === "fulfilled" ? interventionsResult.value : null;
      const alertsPayload =
        alertsResult.status === "fulfilled" ? alertsResult.value : null;
      const messagesPayload =
        messagesResult.status === "fulfilled" ? messagesResult.value : null;
      const quotesPayload =
        quotesResult.status === "fulfilled" ? quotesResult.value : null;
      const billingPayload =
        billingResult.status === "fulfilled" ? billingResult.value : null;

      const clients = Array.isArray(clientsPayload?.items) ? clientsPayload.items : [];
      const interventions = Array.isArray(interventionsPayload?.items) ? interventionsPayload.items : [];
      const alerts = Array.isArray(alertsPayload?.items) ? alertsPayload.items : [];
      const conversations = Array.isArray(messagesPayload?.items) ? messagesPayload.items : [];
      const quotes = Array.isArray(quotesPayload)
        ? quotesPayload
        : Array.isArray(quotesPayload?.items)
          ? quotesPayload.items
          : [];

      setWorkspace(nextWorkspace);
      setDashboard({
        summary: {
          clients: clientsPayload?.summary?.total ?? clients.length,
          activeClients: clientsPayload?.summary?.active ?? clients.filter((item) => item.status === "active").length,
          interventions: interventionsPayload?.summary?.total ?? interventions.length,
          inProgress: interventionsPayload?.summary?.in_progress ?? interventions.filter((item) => item.status === "in_progress").length,
          pendingInterventions:
            interventionsPayload?.summary?.pending ?? interventions.filter((item) => item.status === "pending").length,
          alerts: alertsPayload?.summary?.total ?? alerts.length,
          urgentAlerts:
            alertsPayload?.summary?.urgent ??
            alerts.filter((item) => item.severity === "urgent" || item.severity === "high").length,
          conversations: messagesPayload?.summary?.total ?? conversations.length,
          unreadConversations: messagesPayload?.summary?.unread ?? 0,
          quotes: quotes.length,
          pendingQuotes: quotes.filter((item) => isPendingQuoteStatus(item.status)).length,
          acceptedQuotes: quotes.filter((item) => isAcceptedQuoteStatus(item.status)).length,
        },
        clients,
        interventions,
        alerts,
        conversations,
        quotes,
        billing: billingPayload,
      });
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const profile: ProviderCurrentProfile | null = workspace?.profile ?? null;
  const isLoading = !dashboard && !workspace && !error;
  const displayName = useMemo(() => buildProviderDisplayName(profile), [profile]);
  const locationLabel = useMemo(
    () => workspace?.summary.location || "Localisation a completer",
    [workspace],
  );
  const stats = dashboard?.summary;
  const highlightedInterventions = useMemo(
    () =>
      takeFirst(
        (dashboard?.interventions ?? []).filter(
          (item) => item.status === "in_progress" || item.status === "pending" || item.status === "accepted",
        ),
        6,
      ),
    [dashboard?.interventions],
  );
  const highlightedAlerts = useMemo(
    () =>
      takeFirst(
        (dashboard?.alerts ?? []).filter(
          (item) => item.severity === "urgent" || item.severity === "high",
        ),
        3,
      ),
    [dashboard?.alerts],
  );
  const highlightedClients = useMemo(() => takeFirst(dashboard?.clients ?? [], 3), [dashboard?.clients]);

  return {
    workspace,
    dashboard,
    error,
    isLoading,
    displayName,
    locationLabel,
    stats,
    highlightedInterventions,
    highlightedAlerts,
    highlightedClients,
  };
}
