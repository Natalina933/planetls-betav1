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

function getStatusLabel(status: string | null) {
  switch (status) {
    case "active":
    case "published":
      return "Actif";
    case "deleted":
      return "Archivé";
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
  const [properties, setProperties] = useState<OwnerHousingRow[]>([]);
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [quotes, setQuotes] = useState<OwnerQuoteRow[]>([]);
  const [invoices, setInvoices] = useState<OwnerInvoiceRow[]>([]);
  const [reviews, setReviews] = useState<OwnerReviewRow[]>([]);
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
        ] = await Promise.all([
          fetch("/api/housing", { cache: "no-store" }),
          fetch("/api/missions?scope=owner&limit=12", { cache: "no-store" }),
          fetch("/api/quotes?limit=8", { cache: "no-store" }),
          fetch("/api/invoices?limit=8", { cache: "no-store" }),
          fetch("/api/reviews?limit=6", { cache: "no-store" }),
        ]);

        const housingPayload = await housingResponse.json();
        const missionsPayload = await missionsResponse.json();
        const quotesPayload = await quotesResponse.json();
        const invoicesPayload = await invoicesResponse.json();
        const reviewsPayload = await reviewsResponse.json();

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

        setProperties(Array.isArray(housingPayload) ? housingPayload : []);
        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setQuotes(Array.isArray(quotesPayload) ? quotesPayload : []);
        setInvoices(Array.isArray(invoicesPayload) ? invoicesPayload : []);
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de charger votre espace propriétaire.",
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

  return (
    <OwnerWorkspacePage
      eyebrow="Tableau de bord"
      title="Tableau de bord"
      description={
        error ||
        "Vue rapide de vos logements, missions, conciergerie et finances pour arbitrer sans dispersion."
      }
      chips={[
        `${activeCount} logement(s) actif(s)`,
        `${ongoingMissions.length} mission(s) en cours`,
        `${pendingInvoices.length} facture(s) à suivre`,
        averageRating ? `${averageRating.toFixed(1)} / 5 de satisfaction` : "Avis à consolider",
      ]}
      actions={[
        { label: "Voir mes logements", href: "/dashboard/owner/logements" },
        { label: "Suivre mes missions", href: "/dashboard/owner/planning" },
        { label: "Voir mes finances", href: "/dashboard/owner/factures" },
      ]}
      metrics={[
        {
          label: "Logements actifs",
          value: `${activeCount}/${properties.length}`,
          hint: draftCount > 0 ? `${draftCount} fiche(s) à finaliser` : "Parc publié et opérationnel",
        },
        {
          label: "Missions en cours",
          value: `${ongoingMissions.length}`,
          hint: `${completedMissions.length} intervention(s) déjà terminée(s)`,
        },
        {
          label: "Factures à régler",
          value: `${pendingInvoices.length}`,
          hint: `${invoices.length} facture(s) suivie(s) au total`,
        },
        {
          label: "Satisfaction",
          value: averageRating ? `${averageRating.toFixed(1)} / 5` : "--",
          hint: reviews.length > 0 ? `${reviews.length} avis enregistrés` : "Aucun avis consolidé",
        },
      ]}
      cards={[
        {
          title: "Priorité du jour : logements",
          text:
            draftCount > 0
              ? `${draftCount} logement(s) restent en brouillon ou incomplets. Finalisez d'abord vos fiches les plus proches de la publication.`
              : "Votre parc est actif. Vous pouvez maintenant vous concentrer sur l'exécution et la rentabilité.",
          actions: [
            {
              label: draftCount > 0 ? "Compléter mes fiches" : "Voir mes logements",
              href: "/dashboard/owner/logements",
              variant: "primary",
            },
          ],
        },
        {
          title: "Priorité du jour : missions",
          text:
            ongoingMissions.length > 0
              ? `${ongoingMissions.length} intervention(s) sont actuellement ouvertes et demandent un suivi clair.`
              : "Aucune intervention en cours. Vérifiez les prochaines demandes ou missions planifiées.",
          actions: [
            { label: "Ouvrir le planning", href: "/dashboard/owner/planning", variant: "secondary" },
          ],
        },
        {
          title: "Priorité du jour : finances",
          text:
            pendingInvoices.length > 0
              ? `${pendingInvoices.length} facture(s) demandent une vérification ou un règlement.`
              : "Aucune facture en attente immédiate. Vous pouvez revoir devis et arbitrages financiers.",
          actions: [
            { label: "Voir mes factures", href: "/dashboard/owner/factures", variant: "secondary" },
            { label: "Voir mes devis", href: "/dashboard/owner/devis", variant: "secondary" },
          ],
        },
        {
          title: "Priorité du jour : conciergerie",
          text:
            reviews.length === 0
              ? "Aucun avis récent sur votre conciergerie. Documentez la relation pour garder une lecture claire de la qualité de service."
              : "Votre relation concierge est documentée. Continuez à suivre les échanges et les retours.",
          actions: [
            {
              label: reviews.length === 0 ? "Voir ma conciergerie" : "Ouvrir les échanges",
              href: reviews.length === 0 ? "/dashboard/owner/conciergerie" : "/dashboard/owner/messages",
              variant: "secondary",
            },
          ],
        },
      ]}
      detailSections={[
        {
          title: "Logements à surveiller",
          description: "Concentrez-vous d'abord sur les biens actifs, puis sur ceux qui bloquent encore la mise en marche.",
          emptyText: loading ? "Chargement des logements..." : "Aucun logement à afficher pour le moment.",
          items: properties.slice(0, 4).map((property) => ({
            title: property.nom_logement || "Logement sans nom",
            meta: getStatusLabel(property.statut),
            description: `${property.ville || "Ville non renseignée"}${isActiveHousingStatus(property.statut) ? " · prêt à être piloté" : " · fiche à finaliser"}`,
            href: `/dashboard/owner/logements/${property.id}`,
            actionLabel: "Ouvrir",
            tone: isActiveHousingStatus(property.statut) ? "success" : "warning",
          })),
        },
        {
          title: "Missions et finances",
          description: "Gardez les interventions ouvertes et les documents à impact direct dans votre champ proche.",
          emptyText: loading ? "Chargement des missions et finances..." : "Aucun élément critique à afficher pour le moment.",
          items: [
            ...ongoingMissions.slice(0, 2).map((mission) => ({
              title: mission.title || "Mission sans titre",
              meta: mission.status || "En cours",
              description: `${formatMissionDate(mission.scheduled_start)} · ${formatAmount(mission.amount)}`,
              href: "/dashboard/owner/planning",
              actionLabel: "Suivre",
            })),
            ...latestInvoices.slice(0, 1).map((invoice) => ({
              title: invoice.invoice_number || "Facture sans numéro",
              meta: invoice.status || "À suivre",
              description: `Solde ${formatAmount(invoice.balance_amount)}`,
              href: `/dashboard/owner/factures?invoice=${invoice.id}`,
              actionLabel: "Vérifier",
              tone: invoice.status === "paid" ? "success" : "warning",
            })),
            ...latestQuotes.slice(0, 1).map((quote) => ({
              title: quote.quote_number || "Devis sans numéro",
              meta: quote.status || "Brouillon",
              description: `${formatAmount(quote.total_amount)}${quote.valid_until ? ` · valable jusqu'au ${formatMissionDate(quote.valid_until)}` : ""}`,
              href: `/dashboard/owner/devis?quote=${quote.id}`,
              actionLabel: "Ouvrir",
            })),
          ].slice(0, 4),
        },
      ]}
    />
  );
}
