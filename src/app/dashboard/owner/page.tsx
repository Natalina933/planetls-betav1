"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
  priority: string | null;
  amount: number | null;
  scheduled_start: string | null;
  property_id: string | null;
  created_at: string | null;
};

type OwnerQuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  total_amount: number | null;
  valid_until: string | null;
  created_at: string | null;
};

type OwnerInvoiceRow = {
  id: string;
  invoice_number: string | null;
  status: string | null;
  total_amount: number | null;
  balance_amount: number | null;
  due_date: string | null;
  created_at: string | null;
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
          err instanceof Error ? err.message : "Impossible de charger votre espace proprietaire.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOwnerDashboard();
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
  const recentMissions = useMemo(
    () =>
      [...missions]
        .sort((a, b) => {
          const aTime = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
          const bTime = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5),
    [missions],
  );
  const pendingInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) => invoice.status !== "paid" && invoice.status !== "canceled",
      ),
    [invoices],
  );
  const latestQuotes = useMemo(() => quotes.slice(0, 4), [quotes]);
  const latestInvoices = useMemo(() => invoices.slice(0, 4), [invoices]);
  const averageRating = useMemo(() => {
    const ratings = reviews
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating));

    if (ratings.length === 0) return null;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [reviews]);

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Tableau de bord proprietaire</h1>
        <p>Suivez vos logements, vos interventions et vos prochaines actions en un seul endroit.</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Biens geres</h3>
          <p>{loading ? "..." : properties.length}</p>
        </div>
        <div className="stat-card">
          <h3>Biens actifs</h3>
          <p>{loading ? "..." : activeCount}</p>
        </div>
        <div className="stat-card">
          <h3>Missions en cours</h3>
          <p>{loading ? "..." : ongoingMissions.length}</p>
        </div>
        <div className="stat-card">
          <h3>Interventions terminees</h3>
          <p>{loading ? "..." : completedMissions.length}</p>
        </div>
        <div className="stat-card">
          <h3>Factures a regler</h3>
          <p>{loading ? "..." : pendingInvoices.length}</p>
        </div>
      </div>

      <div className="main-section">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h2>Actions rapides</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/dashboard/concierge/logements/create">Ajouter un logement</Link>
            <Link href="/dashboard/owner/concierges">Trouver un concierge</Link>
          </div>
        </div>

        {loading ? <p>Chargement de votre espace proprietaire...</p> : null}
        {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

        {!loading && !error ? (
          <>
            <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              <div className="stat-card">
                <h3>Interventions en cours</h3>
                {ongoingMissions.length === 0 ? (
                  <p>Aucune intervention en cours pour le moment.</p>
                ) : (
                  <ul>
                    {ongoingMissions.slice(0, 4).map((mission) => (
                      <li key={mission.id}>
                        <strong>{mission.title || "Mission sans titre"}</strong>
                        <br />
                        {mission.status || "Statut non defini"} - {formatMissionDate(mission.scheduled_start)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="stat-card">
                <h3>Historique recent</h3>
                {recentMissions.length === 0 ? (
                  <p>Aucune mission historique disponible.</p>
                ) : (
                  <ul>
                    {recentMissions.map((mission) => (
                      <li key={mission.id}>
                        <strong>{mission.title || "Mission sans titre"}</strong>
                        <br />
                        {formatMissionDate(mission.scheduled_start)} - {formatAmount(mission.amount)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="stat-card">
                <h3>Satisfaction concierge</h3>
                {reviews.length === 0 ? (
                  <p>Aucun avis publie pour le moment.</p>
                ) : (
                  <div>
                    <p>
                      Note moyenne : <strong>{averageRating?.toFixed(1)} / 5</strong> sur {reviews.length} avis
                    </p>
                    <p>{reviews[0]?.comment || "Dernier retour enregistre sans commentaire."}</p>
                    <Link href="/dashboard/owner/conciergerie">Voir les avis et noter</Link>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <h2>Vos logements</h2>
              {properties.length === 0 ? (
                <div>
                  <p>Vous n'avez pas encore de logement visible sur votre compte.</p>
                  <p>
                    Si vous aviez des exemples de test avant la securisation, ils peuvent etre lies a
                    un autre identifiant. Creez-en un nouveau pour repartir sur des donnees propres.
                  </p>
                </div>
              ) : (
                <ul>
                  {properties.map((property) => (
                    <li key={property.id}>
                      <strong>{property.nom_logement || "Logement sans nom"}</strong> -{" "}
                      {property.ville || "Ville non renseignee"} ({getStatusLabel(property.statut)})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginTop: "2rem" }}>
              <h2>Devis et factures</h2>
              <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                <div className="stat-card">
                  <h3>Derniers devis</h3>
                  {latestQuotes.length === 0 ? (
                    <p>Aucun devis disponible pour le moment.</p>
                  ) : (
                    <ul>
                      {latestQuotes.map((quote) => (
                        <li key={quote.id}>
                          <strong>{quote.quote_number || "Devis sans numero"}</strong>
                          <br />
                          {quote.status || "Statut non defini"} - {formatAmount(quote.total_amount)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="stat-card">
                  <h3>Dernieres factures</h3>
                  {latestInvoices.length === 0 ? (
                    <p>Aucune facture disponible pour le moment.</p>
                  ) : (
                    <ul>
                      {latestInvoices.map((invoice) => (
                        <li key={invoice.id}>
                          <strong>{invoice.invoice_number || "Facture sans numero"}</strong>
                          <br />
                          {invoice.status || "Statut non defini"} - Solde {formatAmount(invoice.balance_amount)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <h2>Suivi de votre activite</h2>
              <ul>
                <li>{ongoingMissions.length} mission(s) demandent actuellement un suivi.</li>
                <li>{completedMissions.length} intervention(s) sont deja terminees.</li>
                <li>{draftCount} logement(s) restent a finaliser ou publier.</li>
                <li>{pendingInvoices.length} facture(s) restent a suivre ou regler.</li>
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
