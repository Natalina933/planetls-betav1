"use client";

import React from "react";
import Link from "next/link";
import { AsyncState } from "@/components/ui";
import { DashboardLayout, DashboardLoadingScreen, DashboardPanel } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { takeFirst } from "../shared";
import type { DashboardUserIdentity } from "../shared";
import { formatDateValue, formatEuroAmountLabel } from "@/app/utils/formatters";
import { getOwnerHousingStatusLabel, useOwnerDashboardData } from "./useOwnerDashboardData";
import {
  OWNER_DASHBOARD_CONFIG,
  OWNER_NAV_ITEMS,
  OWNER_QUICK_ACTIONS,
  OWNER_SHORTCUTS,
} from "@/features/owner-dashboard";

export default function OwnerDashboardPage() {
  const { user, loading: userLoading, isAuthenticated } = useCurrentUser() as {
    user: DashboardUserIdentity | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
  const {
    properties,
    loading,
    error,
    activeCount,
    draftCount,
    ongoingMissions,
    completedMissions,
    pendingInvoices,
    latestQuotes,
    latestInvoices,
    averageRating,
    unreadConversationCount,
  } = useOwnerDashboardData(isAuthenticated);

  const activityItems = [
    ...takeFirst(properties, 2).map((property) => ({
      id: `property-${property.id}`,
      title: property.nom_logement || "Logement sans nom",
      description: `${property.ville || "Ville non renseignée"} · ${getOwnerHousingStatusLabel(property.statut)}`,
      href: `/dashboard/owner/logements/${property.id}`,
    })),
    ...takeFirst(ongoingMissions, 2).map((mission) => ({
      id: `mission-${mission.id}`,
      title: mission.title || "Mission sans titre",
      description: `${formatDateValue(mission.scheduled_start, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} · ${formatEuroAmountLabel(mission.amount)}`,
      href: "/dashboard/owner/planning",
    })),
  ];

  if (userLoading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace propriétaire..." />;
  }

  return (
    <DashboardLayout
      persona="owner"
      title={OWNER_DASHBOARD_CONFIG.title}
      subtitle={error || OWNER_DASHBOARD_CONFIG.defaultSubtitle}
      navTitle={OWNER_DASHBOARD_CONFIG.navTitle}
      navItems={OWNER_NAV_ITEMS}
      stats={[
        {
          label: "Logements actifs",
          value: `${activeCount}/${properties.length}`,
          hint: draftCount > 0 ? `${draftCount} fiche(s) à finaliser` : "Parc opérationnel",
        },
        {
          label: "Opérations ouvertes",
          value: `${ongoingMissions.length}`,
          hint: `${completedMissions.length} intervention(s) terminée(s)`,
        },
        {
          label: "Factures à régler",
          value: `${pendingInvoices.length}`,
          hint: `${latestInvoices.length} facture(s) récente(s)`,
        },
        {
          label: "Satisfaction",
          value: averageRating ? `${averageRating.toFixed(1)} / 5` : "--",
          hint: `${unreadConversationCount} message(s) non lu(s)`,
        },
      ]}
      actions={OWNER_QUICK_ACTIONS}
      activity={activityItems}
      notifications={[
        {
          id: "n1",
          title:
            pendingInvoices.length > 0
              ? `${pendingInvoices.length} facture(s) en attente de vérification.`
              : "Aucune facture urgente.",
          level: pendingInvoices.length > 0 ? "warning" : "info",
          href: "/dashboard/owner/factures",
        },
        {
          id: "n2",
          title:
            unreadConversationCount > 0
              ? `${unreadConversationCount} nouveau(x) message(s) conciergerie.`
              : "Aucun nouveau message prioritaire.",
          level: unreadConversationCount > 0 ? "danger" : "info",
          href: "/dashboard/owner/messages",
        },
      ]}
      shortcuts={OWNER_SHORTCUTS}
      profile={{
        name: user?.firstName || user?.username || OWNER_DASHBOARD_CONFIG.profileName,
        subtitle: loading ? "Chargement..." : `${properties.length} bien(s) suivi(s)`,
        badge: averageRating ? `${averageRating.toFixed(1)} / 5` : "Profil actif",
      }}
    >
      <DashboardPanel title="Pilotage propriétaire">
        <AsyncState loading={loading} error={error}>
          {latestInvoices.length > 0 ? (
            <p>
              Dernière facture: {latestInvoices[0].invoice_number || "sans numéro"} · solde{" "}
              {formatEuroAmountLabel(latestInvoices[0].balance_amount)}.
            </p>
          ) : (
            <p>Aucune facture récente.</p>
          )}
          {latestQuotes.length > 0 ? (
            <p>
              Dernier devis: {latestQuotes[0].quote_number || "sans numéro"} ·{" "}
              {formatEuroAmountLabel(latestQuotes[0].total_amount)}.
            </p>
          ) : (
            <p>Aucun devis récent.</p>
          )}
          {ongoingMissions.length > 0 ? (
            <p>
              Intervention prioritaire: {ongoingMissions[0].title || "Mission sans titre"} ·{" "}
              {formatDateValue(ongoingMissions[0].scheduled_start, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}.
            </p>
          ) : (
            <p>Aucune intervention ouverte pour le moment.</p>
          )}
          <Link href="/dashboard/owner/factures">Ouvrir le suivi financier</Link>
        </AsyncState>
      </DashboardPanel>
    </DashboardLayout>
  );
}
