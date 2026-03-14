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

type ProviderInterventionItem = {
  id: string;
  title: string | null;
  service_label: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  budget_amount: number | null;
  currency: string | null;
  location_label: string | null;
};

type ProviderAlertItem = {
  id: string;
  title: string | null;
  body: string | null;
  severity: string | null;
  status: string | null;
};

type ProviderConversationItem = {
  id: string;
  subject: string | null;
  status: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  counterpart_name: string | null;
};

type ProviderDashboardState = {
  summary: {
    clients: number;
    activeClients: number;
    interventions: number;
    inProgress: number;
    alerts: number;
    urgentAlerts: number;
    conversations: number;
  };
  clients: ProviderClientItem[];
  interventions: ProviderInterventionItem[];
  alerts: ProviderAlertItem[];
  conversations: ProviderConversationItem[];
};

export function useProviderDashboardData() {
  const [workspace, setWorkspace] = useState<ProviderWorkspacePayload | null>(null);
  const [dashboard, setDashboard] = useState<ProviderDashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const [nextWorkspace, clientsRes, interventionsRes, alertsRes, messagesRes] = await Promise.all([
          fetchCurrentProviderProfile(),
          fetch("/api/provider/clients", { cache: "no-store" }),
          fetch("/api/provider/interventions", { cache: "no-store" }),
          fetch("/api/provider/alerts", { cache: "no-store" }),
          fetch("/api/provider/messages", { cache: "no-store" }),
        ]);
        const clients = await clientsRes.json();
        const interventions = await interventionsRes.json();
        const alerts = await alertsRes.json();
        const messages = await messagesRes.json();

        if (!cancelled) {
          setWorkspace(nextWorkspace);
          setDashboard({
            summary: {
              clients: clients?.summary?.total ?? 0,
              activeClients: clients?.summary?.active ?? 0,
              interventions: interventions?.summary?.total ?? 0,
              inProgress: interventions?.summary?.in_progress ?? 0,
              alerts: alerts?.summary?.total ?? 0,
              urgentAlerts: alerts?.summary?.urgent ?? 0,
              conversations: messages?.summary?.total ?? 0,
            },
            clients: Array.isArray(clients?.items) ? clients.items : [],
            interventions: Array.isArray(interventions?.items) ? interventions.items : [],
            alerts: Array.isArray(alerts?.items) ? alerts.items : [],
            conversations: Array.isArray(messages?.items) ? messages.items : [],
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger le profil artisan.");
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const profile: ProviderCurrentProfile | null = workspace?.profile ?? null;
  const isLoading = !dashboard && !error;
  const displayName = useMemo(() => buildProviderDisplayName(profile), [profile]);
  const locationLabel = useMemo(
    () => workspace?.summary.location || "Localisation à compléter",
    [workspace],
  );
  const stats = dashboard?.summary;
  const highlightedInterventions = useMemo(
    () =>
      takeFirst(
        (dashboard?.interventions ?? []).filter(
          (item) => item.status === "in_progress" || item.status === "pending",
        ),
        3,
      ),
    [dashboard?.interventions],
  );
  const highlightedAlerts = useMemo(
    () =>
      takeFirst(
        (dashboard?.alerts ?? []).filter(
          (item) => item.severity === "urgent" || item.severity === "high",
        ),
        2,
      ),
    [dashboard?.alerts],
  );
  const highlightedClients = useMemo(() => takeFirst(dashboard?.clients ?? [], 2), [dashboard?.clients]);

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
