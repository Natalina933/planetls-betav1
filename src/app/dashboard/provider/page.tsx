"use client";

import { useEffect, useMemo, useState } from "react";
import ProviderWorkspacePage from "./_components/ProviderWorkspacePage";
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
  if (!value) return "À planifier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatBudget(amount: number | null, currency: string | null) {
  if (typeof amount !== "number") return "Budget à confirmer";

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInterventionBadge(status: string | null) {
  switch (status) {
    case "in_progress":
      return "En cours";
    case "pending":
      return "À confirmer";
    case "completed":
      return "Terminée";
    default:
      return "À suivre";
  }
}

function getClientBadge(status: string | null) {
  return status === "active" ? "Actif" : "À relancer";
}

function getAlertBadge(severity: string | null) {
  switch (severity) {
    case "urgent":
      return "Urgente";
    case "high":
      return "Élevée";
    default:
      return "Standard";
  }
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
    () => workspace?.summary.location || "Localisation à compléter",
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
  const highlightedConversations = useMemo(
    () => (dashboard?.conversations ?? []).slice(0, 2),
    [dashboard?.conversations],
  );

  return (
    <ProviderWorkspacePage
      eyebrow="Tableau de bord"
      title="Tableau de bord"
      description={
        error ||
        `Vue rapide de ${displayName}, de vos interventions, alertes, clients et conversations prioritaires.`
      }
      chips={[
        profile?.company_name || "Activité artisanale",
        locationLabel,
        workspace?.summary.is_pro ? "Artisan PRO" : "Artisan Standard",
        `${stats?.inProgress ?? 0} intervention(s) en cours`,
      ]}
      actions={[
        {
          label: "Voir les interventions",
          href: "/dashboard/provider/interventions",
          variant: "primary",
        },
        { label: "Voir les clients", href: "/dashboard/provider/clients", variant: "secondary" },
        {
          label: "Voir les devis & factures",
          href: "/dashboard/provider/devis",
          variant: "secondary",
        },
      ]}
      metrics={[
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
          hint: `${stats?.clients ?? 0} client(s) au total`,
        },
        {
          label: "Conversations",
          value: `${stats?.conversations ?? 0}`,
          hint: "Échanges en cours",
        },
      ]}
      cards={[
        {
          title: "Priorité du jour : interventions",
          text: `${stats?.inProgress ?? 0} intervention(s) sont en cours. Gardez une exécution claire avant d'ouvrir de nouveaux chantiers.`,
          actions: [
            {
              label: "Ouvrir les interventions",
              href: "/dashboard/provider/interventions",
              variant: "primary",
            },
          ],
        },
        {
          title: "Priorité du jour : alertes",
          text: `${stats?.alerts ?? 0} alerte(s), dont ${stats?.urgentAlerts ?? 0} urgente(s), peuvent bloquer votre exécution terrain.`,
          actions: [
            {
              label: "Traiter les alertes",
              href: "/dashboard/provider/alertes",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Priorité du jour : clients",
          text: `${stats?.activeClients ?? 0} client(s) actif(s) à entretenir pour garder un flux commercial propre.`,
          actions: [
            {
              label: "Voir les clients",
              href: "/dashboard/provider/clients",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Priorité du jour : profil et revenus",
          text: profile
            ? `${displayName}${profile.email ? ` · ${profile.email}` : ""}${profile.phone ? ` · ${profile.phone}` : ""}`
            : "Complétez votre profil et votre pilotage financier pour gagner en clarté.",
          actions: [
            {
              label: "Ouvrir les paramètres",
              href: "/dashboard/provider/settings",
              variant: "secondary",
            },
            {
              label: "Voir devis & factures",
              href: "/dashboard/provider/devis",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "Interventions à suivre",
          description: "Commencez par les missions ouvertes, celles qui ont une date proche ou un budget à confirmer.",
          emptyText: "Aucune intervention prioritaire à afficher pour le moment.",
          items: highlightedInterventions.map((item) => ({
            title: item.title || item.service_label || "Intervention sans titre",
            meta: getInterventionBadge(item.status),
            description: `${formatDate(item.scheduled_start)} · ${item.location_label || "Lieu à confirmer"} · ${formatBudget(item.budget_amount, item.currency)}`,
            href: `/dashboard/provider/interventions?intervention=${item.id}`,
            actionLabel: "Suivre",
            tone: item.status === "in_progress" ? "success" : "warning",
          })),
        },
        {
          title: "Alertes et clients à relancer",
          description: "Gardez visibles les frictions terrain et les relations client à réactiver.",
          emptyText: "Aucune alerte ni aucun client prioritaire pour le moment.",
          items: [
            ...highlightedAlerts.map((item) => ({
              title: item.title || "Alerte sans titre",
              meta: getAlertBadge(item.severity),
              description: item.body || `Statut : ${item.status || "ouvert"}`,
              href: `/dashboard/provider/alertes?alert=${item.id}`,
              actionLabel: "Traiter",
              tone: item.severity === "urgent" || item.severity === "high" ? "warning" : "default",
            })),
            ...highlightedClients.map((item) => ({
              title: item.client_name || item.company_name || "Client sans nom",
              meta: getClientBadge(item.status),
              description: item.city || "Ville non renseignée",
              href: `/dashboard/provider/clients?client=${item.id}`,
              actionLabel: "Ouvrir",
              tone: item.status === "active" ? "success" : "default",
            })),
            ...highlightedConversations.map((item) => ({
              title: item.counterpart_name || item.subject || "Conversation",
              meta: item.status === "open" ? "Ouverte" : "Archivée",
              description: item.last_message_preview || `Dernier échange : ${formatDate(item.last_message_at)}`,
              href: `/dashboard/provider/messages?conversation=${item.id}`,
              actionLabel: "Répondre",
            })),
          ].slice(0, 4),
        },
      ]}
    />
  );
}
