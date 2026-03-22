"use client";

import React from "react";
import Link from "next/link";
import { DashboardLayout, DashboardLoadingScreen, DashboardPanel } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { takeFirst } from "../shared";
import type { DashboardUserIdentity, ExperienceLevel } from "../shared";
import { formatDateValue } from "@/app/utils/formatters";
import { useConciergeDashboardData } from "./useConciergeDashboardData";
import {
  CONCIERGERIE_DASHBOARD_CONFIG,
  CONCIERGERIE_NAV_ITEMS,
  CONCIERGERIE_QUICK_ACTIONS,
  CONCIERGERIE_SHORTCUTS,
} from "@/features/conciergerie-dashboard";

interface ConciergeUser extends DashboardUserIdentity {
  experience_level?: ExperienceLevel | null;
  years_experience?: number | null;
}

export default function ConciergeDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser() as {
    user: ConciergeUser | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
  const { matches, matchesLoading, matchesError, kpis, averageRating, plannedNow } =
    useConciergeDashboardData(isAuthenticated);

  if (loading || !isAuthenticated) {
    return <DashboardLoadingScreen label="Chargement de votre espace conciergerie..." />;
  }

  const isPro = user?.role === "concierge_pro";

  return (
    <DashboardLayout
      persona="conciergerie"
      title={CONCIERGERIE_DASHBOARD_CONFIG.title}
      subtitle={CONCIERGERIE_DASHBOARD_CONFIG.subtitle}
      navTitle={CONCIERGERIE_DASHBOARD_CONFIG.navTitle}
      navItems={CONCIERGERIE_NAV_ITEMS}
      stats={[
        {
          label: "Missions en cours",
          value: `${kpis?.in_progress ?? 0}`,
          hint: `${kpis?.total_missions ?? 0} mission(s) total`,
        },
        {
          label: "Demandes compatibles",
          value: `${matches.length}`,
          hint: matchesLoading ? "Analyse en cours" : "Prospects propriétaires",
        },
        {
          label: "Temps de réponse",
          value:
            typeof kpis?.avg_response_minutes === "number"
              ? `${Math.round(kpis.avg_response_minutes)} min`
              : "--",
          hint: "Performance opérationnelle",
        },
        {
          label: "Satisfaction",
          value: averageRating ? `${averageRating.toFixed(1)} / 5` : "--",
          hint: `${kpis?.ratings_count ?? 0} avis`,
        },
      ]}
      actions={CONCIERGERIE_QUICK_ACTIONS}
      activity={plannedNow.map((event, index) => ({
        id: `event-${index}`,
        title: typeof event.title === "string" ? event.title : "Mission planifiée",
        description: formatDateValue(event.start, {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        href: "/dashboard/concierge/planning",
      }))}
      notifications={[
        {
          id: "c-n1",
          title:
            matchesError ||
            (matchesLoading
              ? "Recherche de propriétaires en cours..."
              : `${matches.length} propriétaire(s) compatible(s).`),
          level: matchesError ? "danger" : "info",
          href: "/dashboard/concierge/recherche",
        },
        {
          id: "c-n2",
          title: isPro
            ? "Fonctionnalités PRO actives."
            : "Passez en PRO pour le suivi financier avancé.",
          level: isPro ? "info" : "warning",
          href: isPro ? "/dashboard/concierge/profile?tab=devis" : "/abonnement/concierge-pro",
        },
      ]}
      shortcuts={CONCIERGERIE_SHORTCUTS}
      profile={{
        name: user?.firstName || user?.username || "Conciergerie",
        subtitle: isPro ? "Compte Concierge PRO" : "Compte Concierge Standard",
        badge: averageRating ? `${averageRating.toFixed(1)} / 5` : undefined,
      }}
    >
      <DashboardPanel title="Vue d’ensemble">
        <AsyncState
          loading={matchesLoading}
          error={matchesError}
          loadingLabel="Chargement de la synthèse opérationnelle..."
        >
          <p>
            {kpis?.in_progress ?? 0} mission(s) en cours, {plannedNow.length} passage(s) planifié(s) et{" "}
            {matches.length} opportunité(s) propriétaire(s) à suivre.
          </p>
          <p>
            {typeof kpis?.avg_response_minutes === "number"
              ? `Temps moyen de réponse estimé à ${Math.round(kpis.avg_response_minutes)} minutes.`
              : "Temps de réponse en cours de consolidation."}
          </p>
          <Link href="/dashboard/concierge/missions/overview">Ouvrir la vue synthèse des missions</Link>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Pilotage stratégique">
        <AsyncState
          loading={matchesLoading}
          error={matchesError}
          loadingLabel="Chargement des signaux de pilotage..."
        >
          <p>
            {matches.length > 0
              ? `${matches.length} propriétaire(s) compatible(s) sont identifiés pour nourrir la prospection.`
              : "La prospection est calme pour l’instant et mérite d’être relancée."}
          </p>
          <p>
            {averageRating
              ? `Satisfaction consolidée à ${averageRating.toFixed(1)} / 5 sur ${kpis?.ratings_count ?? 0} avis.`
              : "Aucun score de satisfaction consolidé pour le moment."}
          </p>
          <p>
            {isPro
              ? "Les outils PRO sont actifs pour structurer l’offre, les tarifs et la conversion."
              : "Recommandation: activer la couche PRO pour renforcer la tarification et le pilotage commercial."}
          </p>
        </AsyncState>
      </DashboardPanel>

      <DashboardPanel title="Reporting de gestion">
        <AsyncState
          loading={matchesLoading}
          error={matchesError}
          isEmpty={!matchesLoading && matches.length === 0}
          loadingLabel="Chargement des profils compatibles..."
          emptyLabel="Aucun profil compatible pour le moment."
        >
          {takeFirst(matches, 3).map((match) => (
            <p key={match.id}>
              {match.title} · {match.city || "Ville non renseignée"} · score {match.compatibility_score}%
            </p>
          ))}
          {plannedNow.length > 0 ? (
            <p>
              Prochain passage: {String(plannedNow[0].title || "Mission planifiée")} ·{" "}
              {formatDateValue(plannedNow[0].start, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              .
            </p>
          ) : (
            <p>Aucun passage planifié pour le moment.</p>
          )}
        </AsyncState>
      </DashboardPanel>
    </DashboardLayout>
  );
}
