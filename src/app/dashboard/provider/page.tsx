"use client";

import Link from "next/link";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { DashboardOnboardingSummary } from "@/features/onboarding-assistant";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import {
  ARTISAN_DASHBOARD_CONFIG,
  ARTISAN_NAV_ITEMS,
  ARTISAN_QUICK_ACTIONS,
  ARTISAN_SHORTCUTS,
} from "@/features/artisan-dashboard";
import { useProviderDashboardData } from "./useProviderDashboardData";

export default function ProviderDashboardPage() {
  const {
    workspace,
    error,
    isLoading,
    displayName,
    locationLabel,
    stats,
    highlightedInterventions,
    highlightedAlerts,
    highlightedClients,
  } = useProviderDashboardData();

  return (
    <DashboardLayout
      persona="artisan"
      title={ARTISAN_DASHBOARD_CONFIG.title}
      subtitle={error || `${ARTISAN_DASHBOARD_CONFIG.subtitle} pour ${displayName}.`}
      navTitle={ARTISAN_DASHBOARD_CONFIG.navTitle}
      navItems={ARTISAN_NAV_ITEMS}
      stats={[
        {
          label: "Interventions en cours",
          value: `${stats?.inProgress ?? 0}`,
          hint: `${stats?.interventions ?? 0} intervention(s) suivie(s)`,
          trend: (stats?.inProgress ?? 0) > 0 ? "Terrain" : "OK",
        },
        {
          label: "Alertes urgentes",
          value: `${stats?.urgentAlerts ?? 0}`,
          hint: `${stats?.alerts ?? 0} alerte(s) ouvertes`,
          trend: (stats?.urgentAlerts ?? 0) > 0 ? "Priorite" : "Stable",
        },
        {
          label: "Clients actifs",
          value: `${stats?.activeClients ?? 0}`,
          hint: `${stats?.clients ?? 0} client(s) total`,
          trend: "Portefeuille",
        },
        {
          label: "Conversations",
          value: `${stats?.conversations ?? 0}`,
          hint: "Suivi relationnel en continu",
          trend: "SLA",
        },
      ]}
      actions={ARTISAN_QUICK_ACTIONS}
      activity={[
        ...highlightedInterventions.map((item) => ({
          id: `intervention-${item.id}`,
          title: item.title || item.service_label || "Intervention",
          description: `${formatDateValue(item.scheduled_start)} · ${formatCurrencyAmount(item.budget_amount, {
            currency: item.currency || "EUR",
            emptyLabel: "Budget à confirmer",
          })}`,
          href: `/dashboard/provider/interventions?intervention=${item.id}`,
          statusLabel: "Intervention",
          actionLabel: "Accepter",
        })),
        ...highlightedClients.map((item) => ({
          id: `client-${item.id}`,
          title: item.client_name || item.company_name || "Client",
          description: item.city || "Ville non renseignée",
          href: `/dashboard/provider/clients?client=${item.id}`,
          statusLabel: "Client",
          actionLabel: "Voir",
        })),
      ]}
      notifications={[
        {
          id: "provider-n1",
          title:
            (stats?.urgentAlerts ?? 0) > 0
              ? `${stats?.urgentAlerts ?? 0} alerte(s) urgente(s) à traiter.`
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
      <DashboardOnboardingSummary
        role="provider"
        availabilityHours={workspace?.profile.availability_hours}
        serviceArea={workspace?.profile.service_area}
        serviceRadiusKm={workspace?.profile.service_radius_km}
      />

      <DashboardPanel title="Vue d’ensemble">
        <AsyncState
          loading={isLoading}
          error={error}
          loadingLabel="Chargement de la synthèse artisan..."
        >
          <p>
            {stats?.inProgress ?? 0} intervention(s) en cours, {stats?.urgentAlerts ?? 0} alerte(s)
            urgente(s) et {stats?.activeClients ?? 0} client(s) actif(s).
          </p>
          <p>
            {highlightedInterventions[0]
              ? `${highlightedInterventions[0].title || highlightedInterventions[0].service_label || "Intervention"} est le dossier terrain le plus exposé aujourd’hui.`
              : "Aucune intervention prioritaire remontée aujourd’hui."}
          </p>
          <Link href="/dashboard/provider/interventions/overview">Ouvrir la vue synthèse des interventions</Link>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Pilotage stratégique">
        <AsyncState
          loading={isLoading}
          error={error}
          loadingLabel="Chargement des signaux de pilotage..."
        >
          <p>
            {workspace?.summary.is_pro
              ? "Le compte PRO est actif pour valoriser l’offre et accélérer la relation client."
              : "Le compte est en mode standard. Une montée en gamme peut renforcer la visibilité et la conversion."}
          </p>
          <p>
            {(stats?.urgentAlerts ?? 0) > 0
              ? "La priorité stratégique est de réduire les alertes urgentes pour protéger la disponibilité opérationnelle."
              : "Les urgences sont contenues, la priorité peut basculer sur la fidélisation et la marge."}
          </p>
          <p>
            {highlightedClients[0]
              ? `Client à forte attention: ${highlightedClients[0].client_name || highlightedClients[0].company_name || "Client"}${highlightedClients[0].city ? `, ${highlightedClients[0].city}` : ""}.`
              : "Aucun client prioritaire signalé pour le moment."}
          </p>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Reporting de gestion">
        <AsyncState
          loading={isLoading}
          error={error}
          isEmpty={!isLoading && highlightedAlerts.length === 0}
          loadingLabel="Chargement des alertes critiques..."
          emptyLabel="Aucune alerte critique en cours."
        >
          {highlightedAlerts.map((alert) => (
            <p key={alert.id}>
              {alert.title || "Alerte"}: {alert.body || "À traiter rapidement."}
            </p>
          ))}
          {highlightedInterventions.slice(0, 2).map((item) => (
            <p key={`reporting-${item.id}`}>
              {item.title || item.service_label || "Intervention"} · {formatDateValue(item.scheduled_start)} ·{" "}
              {formatCurrencyAmount(item.budget_amount, {
                currency: item.currency || "EUR",
                emptyLabel: "Budget à confirmer",
              })}
            </p>
          ))}
        </AsyncState>
      </DashboardPanel>
    </DashboardLayout>
  );
}
