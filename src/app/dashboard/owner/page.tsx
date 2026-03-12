"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DashboardLayout } from "@/components/dashboard";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import {
  OWNER_DASHBOARD_CONFIG,
  OWNER_NAV_ITEMS,
  OWNER_QUICK_ACTIONS,
  OWNER_SHORTCUTS,
} from "@/features/owner-dashboard";

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

interface OwnerUser {
  firstName?: string | null;
  username?: string | null;
}

function getStatusLabel(status: string | null) {
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

function isActiveHousingStatus(status: string | null) {
  return status === "active" || status === "published";
}

function isOngoingMission(status: string | null) {
  return status === "assigned" || status === "accepted" || status === "in_progress";
}

function formatMissionDate(value: string | null) {
  if (!value) return "À planifier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(0)} EUR` : "Montant non défini";
}

export default function OwnerDashboardPage() {
  const { user, loading: userLoading, isAuthenticated } = useCurrentUser() as {
    user: OwnerUser | null;
    loading: boolean;
    isAuthenticated: boolean;
  };
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

  const activityItems = [
      ...properties.slice(0, 2).map((property) => ({
        id: `property-${property.id}`,
        title: property.nom_logement || "Logement sans nom",
        description: `${property.ville || "Ville non renseignée"} · ${getStatusLabel(property.statut)}`,
        href: `/dashboard/owner/logements/${property.id}`,
      })),
    ...ongoingMissions.slice(0, 2).map((mission) => ({
      id: `mission-${mission.id}`,
      title: mission.title || "Mission sans titre",
      description: `${formatMissionDate(mission.scheduled_start)} · ${formatAmount(mission.amount)}`,
      href: "/dashboard/owner/planning",
    })),
  ];

  if (userLoading || !isAuthenticated) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "40vh", gap: "12px" }}>
        <Loader2 className="animate-spin text-primary" size={40} />
        <p>Chargement de votre espace propriétaire...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      persona="owner"
      title={OWNER_DASHBOARD_CONFIG.title}
      subtitle={
        error || OWNER_DASHBOARD_CONFIG.defaultSubtitle
      }
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
          hint: `${invoices.length} facture(s) suivie(s)`,
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
      <Card>
        <CardHeader>
          <h2>Pilotage propriétaire</h2>
        </CardHeader>
        <CardBody>
          {loading ? <p>Chargement des indicateurs...</p> : null}
          {latestInvoices.length > 0 ? (
            <p>
              Dernière facture: {latestInvoices[0].invoice_number || "sans numéro"} · solde{" "}
              {formatAmount(latestInvoices[0].balance_amount)}.
            </p>
          ) : (
            <p>Aucune facture récente.</p>
          )}
          {latestQuotes.length > 0 ? (
            <p>
              Dernier devis: {latestQuotes[0].quote_number || "sans numéro"} ·{" "}
              {formatAmount(latestQuotes[0].total_amount)}.
            </p>
          ) : (
            <p>Aucun devis récent.</p>
          )}
          {ongoingMissions.length > 0 ? (
            <p>
              Intervention prioritaire: {ongoingMissions[0].title || "Mission sans titre"} ·{" "}
              {formatMissionDate(ongoingMissions[0].scheduled_start)}.
            </p>
          ) : (
            <p>Aucune intervention ouverte pour le moment.</p>
          )}
          <Link href="/dashboard/owner/factures">Ouvrir le suivi financier</Link>
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}

