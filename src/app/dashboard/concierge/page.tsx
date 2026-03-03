"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.scss";
import {
  Loader2,
} from "lucide-react";

import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import { fetchConciergeMatches, type ConciergeOwnerMatch } from "./dashboardClient";
import {
  ConciergeObjectivesSection,
  DashboardHeader,
  DashboardMetricsGrid,
  DashboardPlanningSection,
  MatchesSection,
} from "./dashboardSections";

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

const eventsDemo: DashboardEvent[] = [
  {
    title: "Reservation J-1",
    start: new Date(Date.now() - 86400000),
    end: new Date(Date.now() - 79200000),
    bookingId: "D1",
    type: "booking",
  },
  {
    title: "Check-in Propriete A",
    start: new Date(),
    end: new Date(Date.now() + 3600000),
    bookingId: "C1",
    type: "booking",
  },
  {
    title: "Rappel Nettoyage",
    start: new Date(Date.now() + 172800000),
    end: new Date(Date.now() + 172800000 + 3600000),
    bookingId: "R1",
    type: "reminder",
  },
];

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

    fetchMatches();

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

    fetchKpis();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) {
    return (
      <div className={styles.dashboardLoadingContainer}>
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="mt-4 text-lg text-gray-600">
          Chargement de votre espace concierge...
        </p>
      </div>
    );
  }

  const isPro = user?.role === "concierge_pro";
  const experienceLevel = user?.experience_level ?? null;
  const yearsExperience = user?.years_experience ?? null;
  const averageRating = typeof kpis?.avg_rating === "number" ? kpis.avg_rating : null;

  return (
    <div className={styles.conciergeDashboardPage}>
      <DashboardHeader
        isPro={isPro}
        experienceLevel={experienceLevel}
        yearsExperience={yearsExperience}
        averageRating={averageRating}
        ratingsCount={typeof kpis?.ratings_count === "number" ? kpis.ratings_count : 0}
      />
      <ConciergeObjectivesSection
        isPro={isPro}
        matchCount={matches.length}
        averageRating={averageRating}
        eventsCount={eventsDemo.length}
      />
      <DashboardMetricsGrid
        isPro={isPro}
        matchCount={matches.length}
        eventsCount={eventsDemo.length}
        inProgressCount={typeof kpis?.in_progress === "number" ? kpis.in_progress : null}
        totalMissions={typeof kpis?.total_missions === "number" ? kpis.total_missions : null}
        avgResponseMinutes={typeof kpis?.avg_response_minutes === "number" ? kpis.avg_response_minutes : null}
      />
      <MatchesSection
        matches={matches}
        matchesLoading={matchesLoading}
        matchesError={matchesError}
      />
      <DashboardPlanningSection events={eventsDemo} />
    </div>
  );
}
