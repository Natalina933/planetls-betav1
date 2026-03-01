"use client";

import { useEffect, useMemo, useState } from "react";
import ProviderWorkspacePage from "./_components/ProviderWorkspacePage";
import {
  buildProviderDisplayName,
  fetchCurrentProviderProfile,
  type ProviderCurrentProfile,
  type ProviderWorkspacePayload,
} from "./_components/providerProfile";

export default function ProviderDashboardPage() {
  const [workspace, setWorkspace] = useState<ProviderWorkspacePayload | null>(null);
  const [stats, setStats] = useState<{
    clients: number;
    activeClients: number;
    interventions: number;
    inProgress: number;
    alerts: number;
    urgentAlerts: number;
    conversations: number;
  } | null>(null);
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
          setStats({
            clients: clients?.summary?.total ?? 0,
            activeClients: clients?.summary?.active ?? 0,
            interventions: interventions?.summary?.total ?? 0,
            inProgress: interventions?.summary?.in_progress ?? 0,
            alerts: alerts?.summary?.total ?? 0,
            urgentAlerts: alerts?.summary?.urgent ?? 0,
            conversations: messages?.summary?.total ?? 0,
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
  const locationLabel = useMemo(() => {
    return workspace?.summary.location || "Localisation a completer";
  }, [workspace]);
  const chartMetrics = useMemo(() => {
    const totalClients = Math.max(stats?.clients ?? 0, 1);
    const totalInterventions = Math.max(stats?.interventions ?? 0, 1);
    const totalAlerts = Math.max(stats?.alerts ?? 0, 1);

    return [
      {
        label: "Clients actifs",
        value: `${stats?.activeClients ?? 0}/${stats?.clients ?? 0}`,
        width: `${((stats?.activeClients ?? 0) / totalClients) * 100}%`,
      },
      {
        label: "Interventions en cours",
        value: `${stats?.inProgress ?? 0}/${stats?.interventions ?? 0}`,
        width: `${((stats?.inProgress ?? 0) / totalInterventions) * 100}%`,
      },
      {
        label: "Alertes urgentes",
        value: `${stats?.urgentAlerts ?? 0}/${stats?.alerts ?? 0}`,
        width: `${((stats?.urgentAlerts ?? 0) / totalAlerts) * 100}%`,
      },
    ];
  }, [stats]);

  return (
    <ProviderWorkspacePage
      eyebrow="Vue d'ensemble"
      title="Artisan"
      description={
        error ||
        `Pilotez l'activite de ${displayName}, vos interventions, vos devis et vos priorites quotidiennes depuis un espace unifie.`
      }
      chips={[
        profile?.company_name || "Activite artisanale",
        locationLabel,
        workspace?.summary.is_pro ? "Artisan PRO" : "Artisan standard",
        `${stats?.interventions ?? 0} interventions`,
      ]}
      actions={[
        { label: "Voir les interventions", href: "/dashboard/provider/interventions" },
        { label: "Voir les devis et factures", href: "/dashboard/provider/devis" },
        { label: "Voir les clients", href: "/dashboard/provider/clients" },
      ]}
      cards={[
        {
          title: "Profil actif",
          text: profile
            ? `${displayName}${profile.email ? ` - ${profile.email}` : ""}${profile.phone ? ` - ${profile.phone}` : ""}`
            : "Chargement du profil artisan en cours.",
          actions: [
            {
              label: "Ouvrir les parametres",
              href: "/dashboard/provider/settings",
              variant: "primary",
            },
          ],
        },
        {
          title: "Interventions a suivre",
          text: `${stats?.interventions ?? 0} interventions, dont ${stats?.inProgress ?? 0} en cours pour garder une execution claire.`,
          actions: [
            {
              label: "Ouvrir les interventions",
              href: "/dashboard/provider/interventions",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Pilotage commercial",
          text: `${stats?.clients ?? 0} clients, dont ${stats?.activeClients ?? 0} actifs, pour suivre votre activite commerciale.`,
          actions: [
            {
              label: "Voir les clients",
              href: "/dashboard/provider/clients",
              variant: "secondary",
            },
          ],
        },
        {
          title: "Organisation quotidienne",
          text: `${stats?.alerts ?? 0} alertes dont ${stats?.urgentAlerts ?? 0} urgentes, et ${stats?.conversations ?? 0} conversations ouvertes.`,
          actions: [
            {
              label: "Voir messages et alertes",
              href: "/dashboard/provider/messages",
              variant: "secondary",
            },
          ],
        },
      ]}
    >
      <section
        style={{
          display: "grid",
          gap: "1rem",
          padding: "1rem",
          borderRadius: "20px",
          border: "1px solid rgba(76, 97, 69, 0.18)",
          background: "rgba(249, 251, 247, 0.96)",
          boxShadow: "0 10px 24px rgba(30, 41, 25, 0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Indicateurs</h2>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <span style={{ padding: "0.35rem 0.7rem", borderRadius: 999, background: "rgba(76,97,69,0.08)", fontWeight: 700 }}>
              {stats?.conversations ?? 0} conversations
            </span>
            <span style={{ padding: "0.35rem 0.7rem", borderRadius: 999, background: "rgba(76,97,69,0.08)", fontWeight: 700 }}>
              {stats?.clients ?? 0} clients
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          {chartMetrics.map((metric) => (
            <div key={metric.label} style={{ display: "grid", gap: "0.35rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", fontWeight: 700, color: "#355236" }}>
                <span>{metric.label}</span>
                <span>{metric.value}</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "rgba(76,97,69,0.12)", overflow: "hidden" }}>
                <div
                  style={{
                    width: metric.width,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(135deg, #8aa16d, #c4d7a4)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </ProviderWorkspacePage>
  );
}
