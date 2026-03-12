"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import { fetchConciergeMatches, type ConciergeOwnerMatch } from "./dashboardClient";
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

interface ConciergeKpis {
  total_missions?: number | null;
  in_progress?: number | null;
  completed?: number | null;
  canceled?: number | null;
  acceptance_rate?: number | null;
  avg_response_minutes?: number | null;
  avg_rating?: number | null;
  ratings_count?: number | null;
}

type DashboardMissionRow = {
  id: string;
  title: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
};

function formatEventDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default function ConciergeDashboardPage() {
  const { user, loading, isAuthenticated } = useCurrentUser() as {
    user: ConciergeUser | null;
    loading: boolean;
    isAuthenticated: boolean;
  };

  const [matches, setMatches] = useState<ConciergeOwnerMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ConciergeKpis | null>(null);
  const [planningEvents, setPlanningEvents] = useState<DashboardEvent[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchMatches = async () => {
      try {
        setMatchesLoading(true);
        setMatchesError(null);
        if (!isMounted) return;
        setMatches(await fetchConciergeMatches(6));
      } catch (err) {
        if (!isMounted) return;
        setMatchesError(
          err instanceof Error ? err.message : "Erreur de chargement des matchs",
        );
      } finally {
        if (isMounted) setMatchesLoading(false);
      }
    };

    void fetchMatches();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchPlanning = async () => {
      try {
        const response = await fetch("/api/missions?scope=all&limit=20", { cache: "no-store" });
        const payload = (await response.json()) as DashboardMissionRow[] | { error?: string };
        if (!response.ok || !Array.isArray(payload)) {
          if (isMounted) setPlanningEvents([]);
          return;
        }

        const nextEvents = payload
          .filter((mission) => typeof mission.scheduled_start === "string" && mission.scheduled_start)
          .map((mission) => {
            const start = new Date(mission.scheduled_start as string);
            const fallbackEnd = new Date(start.getTime() + 90 * 60 * 1000);
            const end =
              typeof mission.scheduled_end === "string" && mission.scheduled_end
                ? new Date(mission.scheduled_end)
                : fallbackEnd;

            return {
              title: mission.title || "Mission sans titre",
              start,
              end: Number.isNaN(end.getTime()) ? fallbackEnd : end,
              bookingId: mission.id,
              type: mission.priority === "urgent" ? "reminder" : "mission",
            } satisfies DashboardEvent;
          })
          .filter((event) => !Number.isNaN(event.start.getTime()))
          .sort((a, b) => a.start.getTime() - b.start.getTime());

        if (isMounted) {
          setPlanningEvents(nextEvents);
        }
      } catch {
        if (isMounted) {
          setPlanningEvents([]);
        }
      }
    };

    void fetchPlanning();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchKpis = async () => {
      try {
        const response = await fetch("/api/missions/kpis", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) return;
        if (isMounted) {
          setKpis(payload);
        }
      } catch {
        if (isMounted) {
          setKpis(null);
        }
      }
    };

    void fetchKpis();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "40vh", gap: "12px" }}>
        <Loader2 className="animate-spin text-primary" size={40} />
        <p>Chargement de votre espace conciergerie...</p>
      </div>
    );
  }

  const isPro = user?.role === "concierge_pro";
  const averageRating = typeof kpis?.avg_rating === "number" ? kpis.avg_rating : null;
  const plannedNow = planningEvents.slice(0, 4);

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
          label: "Temps de reponse",
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
        description: formatEventDate(event.start),
        href: "/dashboard/concierge/planning",
      }))}
      notifications={[
        {
          id: "c-n1",
          title: matchesError || (matchesLoading ? "Recherche de propriétaires en cours..." : `${matches.length} propriétaire(s) compatible(s).`),
          level: matchesError ? "danger" : "info",
          href: "/dashboard/concierge/recherche",
        },
        {
          id: "c-n2",
          title: isPro ? "Fonctionnalités PRO actives." : "Passez en PRO pour le suivi financier avancé.",
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
      <Card>
        <CardHeader>
          <h2>Prospection propriétaires</h2>
        </CardHeader>
        <CardBody>
          {matchesLoading ? <p>Chargement des profils compatibles...</p> : null}
          {!matchesLoading && matches.length === 0 ? <p>Aucun profil compatible pour le moment.</p> : null}
          {!matchesLoading && matches.slice(0, 3).map((match) => (
            <p key={match.id}>
              {match.title} · {match.city || "Ville non renseignée"} · score {match.compatibility_score}%
            </p>
          ))}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}

