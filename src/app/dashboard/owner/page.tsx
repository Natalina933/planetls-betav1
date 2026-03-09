"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "./_components/OwnerWorkspacePage";
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
  if (!value) return "A planifier";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(0)} EUR` : "Montant non defini";
}

export default function OwnerDashboardPage() {
  const [properties, setProperties] = useState<OwnerHousingRow[]>([]);
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [reviews, setReviews] = useState<OwnerReviewRow[]>([]);
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          err instanceof Error ? err.message : "Impossible de charger votre espace proprietaire.",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchOwnerDashboard();
  }, []);

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

  return (
    <OwnerWorkspacePage
      eyebrow="Pilotage proprietaire"
      title="Cabinet proprietaire"
      description={
        error ||
        "Une lecture resserree de votre parc, des operations en cours et des flux financiers a arbitrer sans dispersion."
      }
      chips={[
        `${activeCount} logement(s) actif(s)`,
        `${ongoingMissions.length} mission(s) ouverte(s)`,
        `${pendingInvoices.length} facture(s) a surveiller`,
        unreadConversationCount > 0
          ? `${unreadConversationCount} nouveau(x) message(s)`
          : averageRating
            ? `${averageRating.toFixed(1)} / 5 satisfaction`
            : "Reputation a consolider",
      ]}
      actions={[
        { label: "Ouvrir le parc", href: "/dashboard/owner/logements", variant: "primary" },
        { label: "Piloter les missions", href: "/dashboard/owner/planning", variant: "secondary" },
        { label: "Suivre la tresorerie", href: "/dashboard/owner/factures", variant: "secondary" },
        {
          label: "Voir les messages",
          href: "/dashboard/owner/messages",
          variant: "secondary",
          notificationCount: unreadConversationCount,
        },
      ]}
      metrics={[
        {
          label: "Logements actifs",
          value: `${activeCount}/${properties.length}`,
          hint: draftCount > 0 ? `${draftCount} fiche(s) a finaliser` : "Parc publie et operationnel",
        },
        {
          label: "Operations ouvertes",
          value: `${ongoingMissions.length}`,
          hint: `${completedMissions.length} intervention(s) deja terminee(s)`,
        },
        {
          label: "Factures a regler",
          value: `${pendingInvoices.length}`,
          hint: `${invoices.length} facture(s) suivie(s) au total`,
        },
        {
          label: "Qualite percue",
          value: averageRating ? `${averageRating.toFixed(1)} / 5` : "--",
          hint:
            unreadConversationCount > 0
              ? `${unreadConversationCount} nouveau(x) retour(s) a lire`
              : reviews.length > 0
                ? `${reviews.length} avis enregistres`
                : "Aucun avis consolide",
        },
      ]}
      cards={[
        {
          title: "Parc a finaliser",
          text:
            draftCount > 0
              ? `${draftCount} logement(s) restent en brouillon ou incomplets. Finalisez d abord les fiches les plus proches de la mise en ligne.`
              : "Votre parc est actif. Le sujet n est plus la mise en ligne mais la tenue du niveau de service et de rentabilite.",
          actions: [
            {
              label: draftCount > 0 ? "Finaliser les fiches" : "Voir le parc",
              href: "/dashboard/owner/logements",
              variant: "primary",
            },
          ],
        },
        {
          title: "Execution terrain",
          text:
            ongoingMissions.length > 0
              ? `${ongoingMissions.length} intervention(s) sont actuellement ouvertes et demandent un suivi simple, date par date, sans angle mort.`
              : "Aucune intervention en cours. Verifiez les demandes a venir et les missions a lancer avant qu elles ne glissent.",
          actions: [
            { label: "Ouvrir le planning", href: "/dashboard/owner/planning", variant: "secondary" },
          ],
        },
        {
          title: "Arbitrage financier",
          text:
            pendingInvoices.length > 0
              ? `${pendingInvoices.length} facture(s) demandent une verification ou un reglement. Gardez le flux devis factures sous la meme lecture.`
              : "Aucune facture en attente immediate. C est le bon moment pour reviser devis, marges et prochains engagements.",
          actions: [
            { label: "Voir les factures", href: "/dashboard/owner/factures", variant: "secondary" },
            { label: "Voir les devis", href: "/dashboard/owner/devis", variant: "secondary" },
          ],
        },
        {
          title: "Relation concierge",
          text:
            unreadConversationCount > 0
              ? `${unreadConversationCount} nouveau(x) retour(s) sont arrives. Traitez d abord les reponses qui debloquent une mission, un devis ou une recherche concierge.`
              : reviews.length === 0
                ? "Aucun avis recent sur votre conciergerie. Structurez les echanges et les retours pour objectiver la qualite de service."
                : "La relation concierge est documentee. Continuez a suivre les echanges, decisions et retours sans laisser de zones floues.",
          notificationCount: unreadConversationCount,
          actions: [
            {
              label: unreadConversationCount > 0 ? "Lire les retours" : reviews.length === 0 ? "Voir la conciergerie" : "Ouvrir les echanges",
              href:
                unreadConversationCount > 0
                  ? "/dashboard/owner/messages"
                  : reviews.length === 0
                    ? "/dashboard/owner/conciergerie"
                    : "/dashboard/owner/messages",
              variant: "secondary",
              notificationCount: unreadConversationCount,
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "Biens sous surveillance",
          description: "Commencez par les biens actifs, puis traitez les fiches qui retardent encore la mise en marche.",
          emptyText: loading ? "Chargement des logements..." : "Aucun logement a afficher pour le moment.",
          items: properties.slice(0, 4).map((property) => ({
            title: property.nom_logement || "Logement sans nom",
            meta: getStatusLabel(property.statut),
            description: `${property.ville || "Ville non renseignee"}${isActiveHousingStatus(property.statut) ? " · pret a etre pilote" : " · fiche a finaliser"}`,
            href: `/dashboard/owner/logements/${property.id}`,
            actionLabel: "Ouvrir",
            tone: isActiveHousingStatus(property.statut) ? "success" : "warning",
          })),
        },
        {
          title: "Operations et flux financiers",
          description: "Gardez les interventions ouvertes et les documents a impact direct dans le meme champ de lecture.",
          emptyText: loading ? "Chargement des missions et finances..." : "Aucun element critique a afficher pour le moment.",
          items: [
            ...ongoingMissions.slice(0, 2).map((mission) => ({
              title: mission.title || "Mission sans titre",
              meta: mission.status || "En cours",
              description: `${formatMissionDate(mission.scheduled_start)} · ${formatAmount(mission.amount)}`,
              href: "/dashboard/owner/planning",
              actionLabel: "Suivre",
            })),
            ...latestInvoices.slice(0, 1).map((invoice) => ({
              title: invoice.invoice_number || "Facture sans numero",
              meta: invoice.status || "A suivre",
              description: `Solde ${formatAmount(invoice.balance_amount)}`,
              href: `/dashboard/owner/factures?invoice=${invoice.id}`,
              actionLabel: "Verifier",
              tone: invoice.status === "paid" ? "success" : "warning",
            })),
            ...latestQuotes.slice(0, 1).map((quote) => ({
              title: quote.quote_number || "Devis sans numero",
              meta: quote.status || "Brouillon",
              description: `${formatAmount(quote.total_amount)}${quote.valid_until ? ` · valable jusqu au ${formatMissionDate(quote.valid_until)}` : ""}`,
              href: `/dashboard/owner/devis?quote=${quote.id}`,
              actionLabel: "Ouvrir",
            })),
          ].slice(0, 4),
        },
      ]}
    />
  );
}
