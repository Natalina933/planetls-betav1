"use client";

import { useEffect, useMemo, useState } from "react";

type OwnerHousingRow = {
  id: number;
  nom_logement: string | null;
  ville: string | null;
  statut: string | null;
};

type OwnerMissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  amount: number | null;
  scheduled_start: string | null;
};

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
};

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  balance_amount: number | null;
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

function isActiveHousingStatus(status: string | null) {
  return status === "active" || status === "published";
}

function isOngoingMission(status: string | null) {
  return status === "assigned" || status === "accepted" || status === "in_progress";
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

export function useOwnerDashboardData(isAuthenticated: boolean) {
  const [properties, setProperties] = useState<OwnerHousingRow[]>([]);
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [reviews, setReviews] = useState<OwnerReviewRow[]>([]);
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchOwnerDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [
          housingResponse,
          missionsResponse,
          quotesResponse,
          invoicesResponse,
          reviewsResponse,
          conversationsResponse,
        ] = await Promise.all([
          fetch("/api/housing", { cache: "no-store" }),
          fetch("/api/missions?scope=owner&limit=12", { cache: "no-store" }),
          fetch("/api/quotes?limit=8", { cache: "no-store" }),
          fetch("/api/invoices?limit=8", { cache: "no-store" }),
          fetch("/api/reviews?limit=6", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=owner&limit=20", { cache: "no-store" }),
        ]);

        const housingPayload = await housingResponse.json();
        const missionsPayload = await missionsResponse.json();
        const quotesPayload = await quotesResponse.json();
        const invoicesPayload = await invoicesResponse.json();
        const reviewsPayload = await reviewsResponse.json();
        const conversationsPayload = await conversationsResponse.json();

        if (!housingResponse.ok) {
          throw new Error(housingPayload?.error || "Impossible de charger vos logements.");
        }
        if (!missionsResponse.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger vos missions.");
        }
        if (!quotesResponse.ok) {
          throw new Error(quotesPayload?.error || "Impossible de charger vos devis.");
        }
        if (!invoicesResponse.ok) {
          throw new Error(invoicesPayload?.error || "Impossible de charger vos factures.");
        }
        if (!reviewsResponse.ok) {
          throw new Error(reviewsPayload?.error || "Impossible de charger vos avis.");
        }
        if (!conversationsResponse.ok) {
          throw new Error(conversationsPayload?.error || "Impossible de charger vos messages.");
        }

        setProperties(Array.isArray(housingPayload) ? housingPayload : []);
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger votre espace propriétaire.",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchOwnerDashboard();
  }, [isAuthenticated]);

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
  const latestQuotes = useMemo(() => quotes.slice(0, 3), [quotes]);
  const latestInvoices = useMemo(() => invoices.slice(0, 3), [invoices]);
  const averageRating = useMemo(() => {
    const ratings = reviews
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));

    if (ratings.length === 0) return null;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [reviews]);
  const unreadConversationCount = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unread_count ?? 0), 0),
    [conversations],
  );

  return {
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
  };
}
