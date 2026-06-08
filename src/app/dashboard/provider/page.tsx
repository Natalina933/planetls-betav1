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
import styles from "./ProviderDashboard.module.scss";

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
          progress:
            (stats?.interventions ?? 0) > 0
              ? Math.round(((stats?.inProgress ?? 0) / (stats?.interventions ?? 1)) * 100)
              : 0,
        },
        {
          label: "Alertes urgentes",
          value: `${stats?.urgentAlerts ?? 0}`,
          hint: `${stats?.alerts ?? 0} alerte(s) ouvertes`,
          trend: (stats?.urgentAlerts ?? 0) > 0 ? "Priorité" : "Stable",
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
          hint: "Suivi relationnel",
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

      <section className={styles.scanSection} aria-labelledby="provider-first-title">
        <div className={styles.scanHeader}>
          <span>Terrain</span>
          <h2 id="provider-first-title">Premières interventions</h2>
        </div>
        <div className={styles.scanGrid}>
          {highlightedInterventions.length > 0 ? (
            highlightedInterventions.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/dashboard/provider/interventions?intervention=${item.id}`} className={styles.scanCard}>
                <span className={styles.scanBadge}>{item.status || "À traiter"}</span>
                <strong>{item.title || item.service_label || "Intervention"}</strong>
                <dl>
                  <div>
                    <dt>Date</dt>
                    <dd>{formatDateValue(item.scheduled_start)}</dd>
                  </div>
                  <div>
                    <dt>Montant</dt>
                    <dd>
                      {formatCurrencyAmount(item.budget_amount, {
                        currency: item.currency || "EUR",
                        emptyLabel: "À confirmer",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>Lieu</dt>
                    <dd>{item.location_label || "À préciser"}</dd>
                  </div>
                </dl>
              </Link>
            ))
          ) : (
            <Link href="/dashboard/provider/interventions" className={styles.scanEmpty}>
              <strong>Aucune intervention prioritaire</strong>
              <span>Ouvrir les demandes terrain</span>
            </Link>
          )}
        </div>
      </section>

      <DashboardPanel title="Vue d'ensemble">
        <AsyncState loading={isLoading} error={error} loadingLabel="Chargement de la synthèse artisan...">
          <div className={styles.miniKpiGrid}>
            <span>
              {stats?.inProgress ?? 0}
              <small>en cours</small>
            </span>
            <span>
              {stats?.urgentAlerts ?? 0}
              <small>urgentes</small>
            </span>
            <span>
              {stats?.activeClients ?? 0}
              <small>clients</small>
            </span>
          </div>
          <Link href="/dashboard/provider/interventions/overview">Ouvrir la synthèse des interventions</Link>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Pilotage stratégique">
        <AsyncState loading={isLoading} error={error} loadingLabel="Chargement des signaux de pilotage...">
          <div className={styles.signalList}>
            <span>{workspace?.summary.is_pro ? "Compte PRO actif" : "Compte standard"}</span>
            <span>{(stats?.urgentAlerts ?? 0) > 0 ? "Urgences à réduire" : "Urgences contenues"}</span>
            <span>
              {highlightedClients[0]
                ? highlightedClients[0].client_name || highlightedClients[0].company_name || "Client prioritaire"
                : "Aucun client prioritaire"}
            </span>
          </div>
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
