"use client";

import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
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
          description: `${formatDateValue(item.scheduled_start)} · ${formatCurrencyAmount(item.budget_amount, {
            currency: item.currency || "EUR",
            emptyLabel: "Budget à confirmer",
          })}`,
          href: `/dashboard/provider/interventions?intervention=${item.id}`,
        })),
        ...highlightedClients.map((item) => ({
          id: `client-${item.id}`,
          title: item.client_name || item.company_name || "Client",
          description: item.city || "Ville non renseignée",
          href: `/dashboard/provider/clients?client=${item.id}`,
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
      <DashboardPanel title="Opérations critiques">
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
        </AsyncState>
      </DashboardPanel>
    </DashboardLayout>
  );
}
