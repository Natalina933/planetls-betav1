"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import { fetchJsonOrFallback, takeFirst } from "../shared";
import { fetchConciergeMatches, type ConciergeOwnerMatch } from "./dashboardClient";
import type { ConversationItem } from "./messages/messagesClient";

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

export type DashboardMissionRow = {
  id: string;
  title: string | null;
  priority: string | null;
  status?: string | null;
  property_id?: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
};

export type ConciergeDashboardRequest = {
  id: string;
  title: string;
  city: string | null;
  postal_code: string | null;
  property_name?: string | null;
  desired_date: string | null;
  budget_max?: number | null;
  currency?: string | null;
  urgency: boolean;
  recipient_id: string;
  recipient_status: string;
  quote_id?: string | null;
  quote_status?: string | null;
  quote_number?: string | null;
  mission_id?: string | null;
  owner_name?: string | null;
  conversation_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ConciergeHousingRow = {
  id: number;
  nom_logement: string;
  ville: string;
  statut: "pret" | "menage" | "arrivee" | "depart";
  infos?: {
    categorie?: string;
    capacite?: number;
    equipements?: string[];
  };
};

export type ConciergeOwnerProfile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  city?: string | null;
  role?: string | null;
  category?: string | null;
};

export type ConciergeQuoteRow = {
  id: string;
  quote_number?: string | null;
  status?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  valid_until?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ConciergeRequestsPayload = {
  items?: ConciergeDashboardRequest[];
  error?: string;
};

type ConciergeConversationsPayload = {
  items?: ConversationItem[];
  error?: string;
};

type ConciergeQuotesPayload = {
  items?: ConciergeQuoteRow[];
  error?: string;
};

function normalizeQuotesPayload(payload: ConciergeQuoteRow[] | ConciergeQuotesPayload | null) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export function useConciergeDashboardData(isAuthenticated: boolean) {
  const [matches, setMatches] = useState<ConciergeOwnerMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ConciergeKpis | null>(null);
  const [planningEvents, setPlanningEvents] = useState<DashboardEvent[]>([]);
  const [missionRows, setMissionRows] = useState<DashboardMissionRow[]>([]);
  const [requests, setRequests] = useState<ConciergeDashboardRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [housings, setHousings] = useState<ConciergeHousingRow[]>([]);
  const [quotes, setQuotes] = useState<ConciergeQuoteRow[]>([]);
  const [ownerProfiles, setOwnerProfiles] = useState<ConciergeOwnerProfile[]>([]);

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

    const fetchRequests = async () => {
      try {
        setRequestsLoading(true);
        setRequestsError(null);
        const payload = await fetchJsonOrFallback<ConciergeRequestsPayload>(
          "/api/service-requests?view=concierge&limit=10",
          { items: [] },
        );
        if (!isMounted) return;
        if (payload.error) {
          throw new Error(payload.error);
        }
        setRequests(Array.isArray(payload.items) ? payload.items : []);
      } catch (err) {
        if (!isMounted) return;
        setRequestsError(err instanceof Error ? err.message : "Erreur de chargement des demandes");
        setRequests([]);
      } finally {
        if (isMounted) setRequestsLoading(false);
      }
    };

    void fetchRequests();

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
          "/api/missions?scope=all&limit=40",
          [],
        );
        if (!Array.isArray(payload)) {
          if (isMounted) {
            setMissionRows([]);
            setPlanningEvents([]);
          }
          return;
        }

        const sortedMissions = payload.sort((a, b) => {
          const leftTime = a.scheduled_start ? new Date(a.scheduled_start).getTime() : Number.MAX_SAFE_INTEGER;
          const rightTime = b.scheduled_start ? new Date(b.scheduled_start).getTime() : Number.MAX_SAFE_INTEGER;
          return leftTime - rightTime;
        });

        const nextEvents = sortedMissions
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
          .filter((event) => !Number.isNaN(event.start.getTime()));

        if (isMounted) {
          setMissionRows(sortedMissions);
          setPlanningEvents(nextEvents);
        }
      } catch {
        if (isMounted) {
          setMissionRows([]);
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

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const loadSupportData = async () => {
      try {
        const [conversationPayload, housingPayload, quotesPayload, ownerProfilesPayload] = await Promise.all([
          fetchJsonOrFallback<ConciergeConversationsPayload>(
            "/api/messages/conversations?role=concierge&limit=20",
            { items: [] },
          ),
          fetchJsonOrFallback<ConciergeHousingRow[]>("/api/housing", []),
          fetchJsonOrFallback<ConciergeQuoteRow[] | ConciergeQuotesPayload | null>("/api/quotes?limit=20", []),
          fetchJsonOrFallback<ConciergeOwnerProfile[]>("/api/profiles/owners?limit=20", []),
        ]);

        if (!isMounted) return;

        setConversations(Array.isArray(conversationPayload.items) ? conversationPayload.items : []);
        setHousings(Array.isArray(housingPayload) ? housingPayload : []);
        setQuotes(normalizeQuotesPayload(quotesPayload));
        setOwnerProfiles(Array.isArray(ownerProfilesPayload) ? ownerProfilesPayload : []);
      } catch {
        if (!isMounted) return;
        setConversations([]);
        setHousings([]);
        setQuotes([]);
        setOwnerProfiles([]);
      }
    };

    void loadSupportData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const averageRating = useMemo(
    () => (typeof kpis?.avg_rating === "number" ? kpis.avg_rating : null),
    [kpis?.avg_rating],
  );
  const plannedNow = useMemo(() => takeFirst(planningEvents, 6), [planningEvents]);

  return {
    matches,
    matchesLoading,
    matchesError,
    requests,
    requestsLoading,
    requestsError,
    kpis,
    planningEvents,
    missionRows,
    conversations,
    housings,
    quotes,
    ownerProfiles,
    averageRating,
    plannedNow,
  };
}
