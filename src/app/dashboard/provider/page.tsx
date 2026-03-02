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
  const locationLabel = useMemo(
    () => workspace?.summary.location || "Localisation a completer",
    [workspace],
  );

  return (
    <ProviderWorkspacePage
      eyebrow="Vue prioritaire"
      title="Pilotage artisan"
      description={
        error ||
        `Pilotez l'activite de ${displayName}, vos interventions, vos devis et vos priorites quotidiennes depuis une vue prioritaire.`
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
      metrics={[
        {
          label: "Clients actifs",
          value: `${stats?.activeClients ?? 0}/${stats?.clients ?? 0}`,
          hint: `${stats?.clients ?? 0} clients au total`,
        },
        {
          label: "Interventions en cours",
          value: `${stats?.inProgress ?? 0}/${stats?.interventions ?? 0}`,
          hint: "Charge active du jour",
        },
        {
          label: "Alertes urgentes",
          value: `${stats?.urgentAlerts ?? 0}/${stats?.alerts ?? 0}`,
          hint: "Points a traiter en priorite",
        },
        {
          label: "Conversations",
          value: `${stats?.conversations ?? 0}`,
          hint: "Echanges ouverts",
        },
      ]}
      cards={[
        {
          title: "1. Profil actif",
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
          title: "2. Interventions a suivre",
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
          title: "3. Pilotage commercial",
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
          title: "4. Organisation quotidienne",
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
      detailSections={[
        {
          title: "Synthese operationnelle",
          description: "Vue rapide pour equilibrer relation client, execution et priorites terrain.",
          items: [
            {
              title: "Base clients",
              meta: `${stats?.clients ?? 0} comptes`,
              description: `${stats?.activeClients ?? 0} clients actifs a entretenir.`,
              href: "/dashboard/provider/clients",
              actionLabel: "Ouvrir",
            },
            {
              title: "Flux interventions",
              meta: `${stats?.interventions ?? 0} missions`,
              description: `${stats?.inProgress ?? 0} interventions sont en cours de traitement.`,
              href: "/dashboard/provider/interventions",
              actionLabel: "Suivre",
            },
            {
              title: "Alertes",
              meta: `${stats?.urgentAlerts ?? 0} urgentes`,
              description: `${stats?.alerts ?? 0} alertes au total sur l'espace artisan.`,
              href: "/dashboard/provider/alertes",
              actionLabel: "Traiter",
              tone: (stats?.urgentAlerts ?? 0) > 0 ? "warning" : "default",
            },
          ],
        },
      ]}
    />
  );
}
