"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import { fetchJsonOrFallback, takeFirst } from "../shared";
import { fetchConciergeMatches, type ConciergeOwnerMatch } from "./dashboardClient";

type ConciergeKpis = {
  total_missions?: number | null;
  in_progress?: number | null;
  completed?: number | null;
  canceled?: number | null;
  acceptance_rate?: number | null;
  avg_response_minutes?: number | null;
  avg_rating?: number | null;
  ratings_count?: number | null;
};

type DashboardMissionRow = {
  id: string;
  title: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
};

export function useConciergeDashboardData(isAuthenticated: boolean) {
  const [matches, setMatches] = useState<ConciergeOwnerMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ConciergeKpis | null>(null);
  const [planningEvents, setPlanningEvents] = useState<DashboardEvent[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchMatchesData = async () => {
      try {
        setMatchesLoading(true);
        setMatchesError(null);
        if (!isMounted) return;
        setMatches(await fetchConciergeMatches(6));
      } catch (err) {
        if (!isMounted) return;
        setMatchesError(err instanceof Error ? err.message : "Erreur de chargement des matchs");
      } finally {
        if (isMounted) setMatchesLoading(false);
      }
    };

    void fetchMatchesData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchPlanning = async () => {
      try {
        const payload = await fetchJsonOrFallback<DashboardMissionRow[] | { error?: string }>(
          "/api/missions?scope=all&limit=20",
          [],
        );
        if (!Array.isArray(payload)) {
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
        const payload = await fetchJsonOrFallback<ConciergeKpis | null>("/api/missions/kpis", null);
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

  const averageRating = useMemo(
    () => (typeof kpis?.avg_rating === "number" ? kpis.avg_rating : null),
    [kpis?.avg_rating],
  );
  const plannedNow = useMemo(() => takeFirst(planningEvents, 4), [planningEvents]);

  return {
    matches,
    matchesLoading,
    matchesError,
    kpis,
    planningEvents,
    averageRating,
    plannedNow,
  };
}
