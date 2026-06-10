"use client";

import { useEffect, useMemo, useState } from "react";
import {
  averageBy,
  buildOwnerActivationCompletion,
  fetchJsonOrThrow,
  sumBy,
  takeFirst,
} from "../shared";

type OwnerHousingRow = {
  id: number;
  nom_logement: string | null;
  ville: string | null;
  statut: string | null;
  infos?: {
    equipements?: string[];
  } | null;
};

type OwnerMissionRow = {
  id: string;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority?: string | null;
  amount: number | null;
  currency?: string | null;
  scheduled_start: string | null;
  scheduled_end?: string | null;
  property_id?: string | number | null;
  concierge_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  workflow_status?: string | null;
  metadata?: Record<string, unknown> | null;
};

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
  mission_id?: string | null;
  service_request_id?: string | null;
  service_request_recipient_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  currency?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  total_amount?: number | null;
  balance_amount: number | null;
  due_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
};

type OwnerReviewRow = {
  id: string;
  rating: number | null;
  comment: string | null;
};

type OwnerConversationRow = {
  id: string;
  last_message_at: string | null;
  source?: string | null;
  source_reference?: string | null;
  counterpart_name: string | null;
  subject: string | null;
  status: string | null;
  last_message_preview: string | null;
  unread_count?: number;
};

type OwnerServiceRequestRow = {
  id: string;
};

function isActiveHousingStatus(status: string | null) {
  return status === "active" || status === "published";
}

function isOngoingMission(status: string | null) {
  return (
    status === "assigned" ||
    status === "accepted" ||
    status === "to_schedule" ||
    status === "date_requested" ||
    status === "date_proposed" ||
    status === "date_confirmed" ||
    status === "scheduled" ||
    status === "in_progress"
  );
}

export function getOwnerHousingStatusLabel(status: string | null) {
  switch (status) {
    case "active":
    case "published":
      return "Actif";
    case "deleted":
      return "Archive";
    default:
      return "Brouillon";
  }
}

type UseOwnerDashboardDataOptions = {
  missionLimit?: number;
};

export function useOwnerDashboardData(
  isAuthenticated: boolean,
  options: UseOwnerDashboardDataOptions = {},
) {
  const [properties, setProperties] = useState<OwnerHousingRow[]>([]);
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [reviews, setReviews] = useState<OwnerReviewRow[]>([]);
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchOwnerDashboard() {
      try {
        setLoading(true);
        setError(null);
        const missionLimit = options.missionLimit ?? 12;

        const [
          housingPayload,
          missionsPayload,
          quotesPayload,
          invoicesPayload,
          reviewsPayload,
          conversationsPayload,
          requestsPayload,
        ] =
          await Promise.all([
            fetchJsonOrThrow<OwnerHousingRow[]>("/api/housing", "Impossible de charger vos logements."),
            fetchJsonOrThrow<OwnerMissionRow[]>(
              `/api/missions?scope=owner&limit=${missionLimit}`,
              "Impossible de charger vos missions.",
            ),
            fetchJsonOrThrow<OwnerQuoteRow[]>("/api/quotes?limit=8", "Impossible de charger vos devis."),
            fetchJsonOrThrow<OwnerInvoiceRow[]>(
              "/api/invoices?limit=8",
              "Impossible de charger vos factures.",
            ),
            fetchJsonOrThrow<OwnerReviewRow[]>("/api/reviews?limit=6", "Impossible de charger vos avis."),
            fetchJsonOrThrow<{ items?: OwnerConversationRow[] }>(
              "/api/messages/conversations?role=owner&limit=20",
              "Impossible de charger vos messages.",
            ),
            fetchJsonOrThrow<{ items?: OwnerServiceRequestRow[] }>(
              "/api/service-requests?limit=1",
              "Impossible de charger vos demandes.",
            ),
          ]);

        setProperties(Array.isArray(housingPayload) ? housingPayload : []);
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
        setRequests(Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger votre espace propriétaire.",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchOwnerDashboard();
  }, [isAuthenticated, options.missionLimit]);

  const activeCount = useMemo(
    () => properties.filter((property) => isActiveHousingStatus(property.statut)).length,
    [properties],
  );
  const draftCount = properties.length - activeCount;
  const ongoingMissions = useMemo(
    () => missions.filter((mission) => isOngoingMission(mission.status)),
    [missions],
  );
  const completedMissions = useMemo(
    () => missions.filter((mission) => mission.status === "completed"),
    [missions],
  );
  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled"),
    [invoices],
  );
  const latestQuotes = useMemo(() => takeFirst(quotes, 3), [quotes]);
  const latestInvoices = useMemo(() => takeFirst(invoices, 3), [invoices]);
  const averageRating = useMemo(() => averageBy(reviews, (review) => review.rating), [reviews]);
  const unreadConversationCount = useMemo(
    () => sumBy(conversations, (conversation) => conversation.unread_count ?? 0),
    [conversations],
  );
  const ownerActivationProgress = useMemo(
    () =>
      buildOwnerActivationCompletion({
        hasAccountActivated: true,
        hasFirstRequest: requests.length > 0,
        hasFirstMission: missions.length > 0,
        hasFirstPayment: invoices.some((invoice) => invoice.status === "paid"),
      }),
    [invoices, missions.length, requests.length],
  );

  return {
    properties,
    missions,
    quotes,
    invoices,
    conversations,
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
    ownerActivationProgress,
  };
}
