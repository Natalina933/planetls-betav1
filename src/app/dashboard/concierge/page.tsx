"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { AsyncState } from "@/components/ui";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { formatDateValue } from "@/app/utils/formatters";
import { useConciergeDashboardData } from "./useConciergeDashboardData";
import {
  CONCIERGERIE_DASHBOARD_CONFIG,
  CONCIERGERIE_NAV_ITEMS,
  CONCIERGERIE_QUICK_ACTIONS,
  CONCIERGERIE_SHORTCUTS,
} from "@/features/conciergerie-dashboard";

type ExperienceLevel = "debutant" | "intermediaire" | "experimente";

interface ConciergeUser {
  role?: string | null;
  firstName?: string | null;
  username?: string | null;
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
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "40vh", gap: "12px" }}>
        <Loader2 className="animate-spin text-primary" size={40} />
        <p>Chargement de votre espace conciergerie...</p>
      </div>
    );
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
      <DashboardPanel title="Prospection propriétaires">
        <AsyncState
          loading={matchesLoading}
          error={matchesError}
          isEmpty={!matchesLoading && matches.length === 0}
          loadingLabel="Chargement des profils compatibles..."
          emptyLabel="Aucun profil compatible pour le moment."
        >
          {matches.slice(0, 3).map((match) => (
            <p key={match.id}>
              {match.title} · {match.city || "Ville non renseignée"} · score {match.compatibility_score}%
            </p>
          ))}
        </AsyncState>
      </DashboardPanel>
    </DashboardLayout>
  );
}
