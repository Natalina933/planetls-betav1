"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  ARTISAN_DASHBOARD_CONFIG,
  ARTISAN_NAV_ITEMS,
  ARTISAN_QUICK_ACTIONS,
  ARTISAN_SHORTCUTS,
} from "@/features/artisan-dashboard";
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

function formatDate(value: string | null) {
  if (!value) return "A planifier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatBudget(amount: number | null, currency: string | null) {
  if (typeof amount !== "number") return "Budget a confirmer";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProviderDashboardPage() {
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
  const displayName = useMemo(() => buildProviderDisplayName(profile), [profile]);
  const locationLabel = useMemo(
    () => workspace?.summary.location || "Localisation a completer",
    [workspace],
  );
  const stats = dashboard?.summary;

  const highlightedInterventions = useMemo(
    () =>
      (dashboard?.interventions ?? [])
        .filter((item) => item.status === "in_progress" || item.status === "pending")
        .slice(0, 3),
    [dashboard?.interventions],
  );
  const highlightedAlerts = useMemo(
    () =>
      (dashboard?.alerts ?? [])
        .filter((item) => item.severity === "urgent" || item.severity === "high")
        .slice(0, 2),
    [dashboard?.alerts],
  );
  const highlightedClients = useMemo(() => (dashboard?.clients ?? []).slice(0, 2), [dashboard?.clients]);

  return (
    <DashboardLayout
      persona="artisan"
      title={ARTISAN_DASHBOARD_CONFIG.title}
      subtitle={
        error || `${ARTISAN_DASHBOARD_CONFIG.subtitle} pour ${displayName}.`
      }
      navTitle={ARTISAN_DASHBOARD_CONFIG.navTitle}
      navItems={ARTISAN_NAV_ITEMS}
      stats={[
        {
          label: "Interventions en cours",
          value: `${stats?.inProgress ?? 0}`,
          hint: `${stats?.interventions ?? 0} intervention(s) suivie(s)`,
        },
        {
          label: "Alertes urgentes",
          value: `${stats?.urgentAlerts ?? 0}`,
          hint: `${stats?.alerts ?? 0} alerte(s) ouvertes`,
        },
        {
          label: "Clients actifs",
          value: `${stats?.activeClients ?? 0}`,
          hint: `${stats?.clients ?? 0} client(s) total`,
        },
        {
          label: "Conversations",
          value: `${stats?.conversations ?? 0}`,
          hint: "Suivi relationnel en continu",
        },
      ]}
      actions={ARTISAN_QUICK_ACTIONS}
      activity={[
        ...highlightedInterventions.map((item) => ({
          id: `intervention-${item.id}`,
          title: item.title || item.service_label || "Intervention",
          description: `${formatDate(item.scheduled_start)} · ${formatBudget(item.budget_amount, item.currency)}`,
          href: `/dashboard/provider/interventions?intervention=${item.id}`,
        })),
        ...highlightedClients.map((item) => ({
          id: `client-${item.id}`,
          title: item.client_name || item.company_name || "Client",
          description: item.city || "Ville non renseignee",
          href: `/dashboard/provider/clients?client=${item.id}`,
        })),
      ]}
      notifications={[
        {
          id: "provider-n1",
          title:
            (stats?.urgentAlerts ?? 0) > 0
              ? `${stats?.urgentAlerts ?? 0} alerte(s) urgente(s) a traiter.`
              : "Aucune alerte urgente.",
          level: (stats?.urgentAlerts ?? 0) > 0 ? "danger" : "info",
          href: "/dashboard/provider/alertes",
        },
        {
          id: "provider-n2",
          title:
            (stats?.inProgress ?? 0) > 0
              ? `${stats?.inProgress ?? 0} intervention(s) en cours aujourd'hui.`
              : "Aucune intervention active.",
          level: (stats?.inProgress ?? 0) > 0 ? "warning" : "info",
          href: "/dashboard/provider/interventions",
        },
      ]}
      shortcuts={ARTISAN_SHORTCUTS}
      profile={{
        name: displayName,
        subtitle: locationLabel,
        badge: workspace?.summary.is_pro ? "Artisan PRO" : "Artisan Standard",
      }}
    >
      <Card>
        <CardHeader>
          <h2>Operations critiques</h2>
        </CardHeader>
        <CardBody>
          {highlightedAlerts.length === 0 ? (
            <p>Aucune alerte critique en cours.</p>
          ) : (
            highlightedAlerts.map((alert) => (
              <p key={alert.id}>
                {alert.title || "Alerte"}: {alert.body || "A traiter rapidement."}
              </p>
            ))
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}

