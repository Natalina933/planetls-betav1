"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./OwnerDashboardPages.module.scss";
import ActionPanel from "@/app/components/dashboard/shared/ActionPanel";
import SectionHeader from "@/app/components/dashboard/shared/SectionHeader";

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

type DashboardHighlight = {
  title: string;
  value: string;
  detail: string;
  href: string;
  action: string;
};

type DashboardPriority = {
  title: string;
  detail: string;
  href: string;
  action: string;
  tone?: "default" | "warning";
};

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
    () => invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "canceled"),
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
  const ownerMetrics = useMemo(() => {
    const totalProperties = Math.max(properties.length, 1);
    const totalMissions = Math.max(missions.length, 1);
    const totalInvoices = Math.max(invoices.length, 1);
    return [
      {
        label: "Biens actifs",
        value: `${activeCount}/${properties.length}`,
        width: `${(activeCount / totalProperties) * 100}%`,
      },
      {
        label: "Missions en cours",
        value: `${ongoingMissions.length}/${missions.length}`,
        width: `${(ongoingMissions.length / totalMissions) * 100}%`,
      },
      {
        label: "Factures a regler",
        value: `${pendingInvoices.length}/${invoices.length}`,
        width: `${(pendingInvoices.length / totalInvoices) * 100}%`,
      },
    ];
  }, [
    activeCount,
    ongoingMissions.length,
    pendingInvoices.length,
    properties.length,
    missions.length,
    invoices.length,
  ]);
  const objectiveCards = useMemo<DashboardHighlight[]>(
    () => [
      {
        title: "Garder des logements operationnels",
        value: `${activeCount}/${properties.length || 0}`,
        detail:
          activeCount === 0
            ? "Aucun logement actif pour le moment."
            : `${draftCount} logement(s) restent a completer ou publier.`,
        href: "/dashboard/owner/logements",
        action: activeCount === 0 ? "Activer mes logements" : "Voir mes logements",
      },
      {
        title: "Maitriser les interventions en cours",
        value: `${ongoingMissions.length}`,
        detail:
          ongoingMissions.length === 0
            ? "Aucune intervention active a surveiller."
            : `${completedMissions.length} intervention(s) deja terminee(s).`,
        href: "/dashboard/owner/planning",
        action: "Suivre les missions",
      },
      {
        title: "Securiser le suivi financier",
        value: `${pendingInvoices.length}`,
        detail:
          pendingInvoices.length === 0
            ? "Aucune facture en attente de reglement."
            : `${latestQuotes.length} devis recent(s) a verifier en priorite.`,
        href: "/dashboard/owner/factures",
        action: "Ouvrir le suivi financier",
      },
    ],
    [
      activeCount,
      properties.length,
      draftCount,
      ongoingMissions.length,
      completedMissions.length,
      pendingInvoices.length,
      latestQuotes.length,
    ],
  );
  const priorityItems = useMemo<DashboardPriority[]>(() => {
    const items: DashboardPriority[] = [];

    if (draftCount > 0) {
      items.push({
        title: "Logements a finaliser",
        detail: `${draftCount} logement(s) ne sont pas encore actifs ou publies.`,
        href: "/dashboard/owner/logements",
        action: "Completer les fiches",
        tone: "warning",
      });
    }

    if (pendingInvoices.length > 0) {
      items.push({
        title: "Reglements a suivre",
        detail: `${pendingInvoices.length} facture(s) demandent une verification ou un reglement.`,
        href: "/dashboard/owner/factures",
        action: "Voir les factures",
        tone: "warning",
      });
    }

    if (ongoingMissions.length > 0) {
      items.push({
        title: "Missions en cours",
        detail: `${ongoingMissions.length} intervention(s) sont actuellement ouvertes.`,
        href: "/dashboard/owner/planning",
        action: "Verifier le planning",
      });
    }

    if (reviews.length === 0) {
      items.push({
        title: "Relation concierge a documenter",
        detail: "Aucun avis enregistre pour l'instant sur votre conciergerie.",
        href: "/dashboard/owner/conciergerie",
        action: "Partager un retour",
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Espace sous controle",
        detail: "Aucune alerte immediate. Vous pouvez optimiser vos arbitrages ou developper votre parc.",
        href: "/dashboard/owner/objectifs",
        action: "Definir mes objectifs",
      });
    }

    return items.slice(0, 4);
  }, [draftCount, ongoingMissions.length, pendingInvoices.length, reviews.length]);
  const actionItems = useMemo<DashboardPriority[]>(
    () => [
      {
        title: "Ajouter un logement",
        detail: "Creer une nouvelle fiche pour elargir votre parc et demarrer un suivi propre.",
        href: "/dashboard/owner/logements",
        action: "Gerer mes logements",
      },
      {
        title: "Trouver une conciergerie",
        detail: "Comparer les profils standards et PRO adaptes a votre ville et a vos besoins.",
        href: "/dashboard/owner/concierges",
        action: "Explorer les concierges",
      },
      {
        title: "Arbitrer mes objectifs",
        detail: "Prioriser revenus, occupation et qualite de service depuis un espace dedie.",
        href: "/dashboard/owner/objectifs",
        action: "Ouvrir mes objectifs",
      },
    ],
    [],
  );

  return (
    <section className="dashboard-grid">
      <header>
        <h1>Tableau de bord proprietaire</h1>
        <p>Organisez votre pilotage par objectif, surveillez l&apos;essentiel et traitez les actions prioritaires sans dispersion.</p>
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
        <div className={styles.dashboardFlow}>
          <ActionPanel
            eyebrow="Vue priorisee"
            title="Vos priorites du moment"
            description="Ce tableau de bord met en avant les objectifs de gestion, les informations a forte valeur et les prochaines decisions a prendre."
            actions={[
              { label: "Gerer mes logements", href: "/dashboard/owner/logements", primary: true },
              { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
              { label: "Verifier mes factures", href: "/dashboard/owner/factures" },
            ]}
          />

          {loading ? <p>Chargement de votre espace proprietaire...</p> : null}
          {!loading && error ? <p style={{ color: "#991b1b", fontWeight: 600 }}>{error}</p> : null}

          {!loading && !error ? (
            <>
              <section className={styles.flowSection}>
                <SectionHeader
                  eyebrow="1. Objectifs"
                  title="Organisation par objectif"
                  actionLabel="Ouvrir mes objectifs"
                  actionHref="/dashboard/owner/objectifs"
                />
                <div className={styles.priorityGrid}>
                  {objectiveCards.map((item) => (
                    <article key={item.title} className={styles.priorityCard}>
                      <p className={styles.cardLabel}>{item.title}</p>
                      <strong className={styles.cardValue}>{item.value}</strong>
                      <p className={styles.meta}>{item.detail}</p>
                      <Link href={item.href} className={styles.cardAction}>
                        {item.action}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.flowSection}>
                <SectionHeader eyebrow="2. Informations prioritaires" title="Ce qui demande votre attention" />
                <div className={styles.priorityGrid}>
                  {priorityItems.map((item) => (
                    <article
                      key={item.title}
                      className={`${styles.priorityCard} ${item.tone === "warning" ? styles.priorityWarning : ""}`}
                    >
                      <p className={styles.cardLabel}>{item.title}</p>
                      <p className={styles.meta}>{item.detail}</p>
                      <Link href={item.href} className={styles.cardAction}>
                        {item.action}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.flowSection}>
                <SectionHeader eyebrow="3. Actions a mener" title="Raccourcis vers les prochaines decisions" />
                <div className={styles.priorityGrid}>
                  {actionItems.map((item) => (
                    <article key={item.title} className={styles.priorityCard}>
                      <p className={styles.cardLabel}>{item.title}</p>
                      <p className={styles.meta}>{item.detail}</p>
                      <Link href={item.href} className={styles.cardAction}>
                        {item.action}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>

              <div className={styles.sectionGrid}>
                <div className={styles.panel}>
                  <h3>Interventions en cours</h3>
                  {ongoingMissions.length === 0 ? (
                    <p>Aucune intervention en cours pour le moment.</p>
                  ) : (
                    <ul className={styles.list}>
                      {ongoingMissions.slice(0, 4).map((mission) => (
                        <li key={mission.id} className={styles.listItem}>
                          <strong>{mission.title || "Mission sans titre"}</strong>
                          <p className={styles.meta}>
                            {mission.status || "Statut non defini"} - {formatMissionDate(mission.scheduled_start)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.panel}>
                  <h3>Historique recent</h3>
                  {recentMissions.length === 0 ? (
                    <p>Aucune mission historique disponible.</p>
                  ) : (
                    <ul className={styles.list}>
                      {recentMissions.map((mission) => (
                        <li key={mission.id} className={styles.listItem}>
                          <strong>{mission.title || "Mission sans titre"}</strong>
                          <p className={styles.meta}>
                            {formatMissionDate(mission.scheduled_start)} - {formatAmount(mission.amount)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.panel}>
                  <h3>Satisfaction concierge</h3>
                  {reviews.length === 0 ? (
                    <p>Aucun avis publie pour le moment.</p>
                  ) : (
                    <div>
                      <p>
                        Note moyenne : <strong>{averageRating?.toFixed(1)} / 5</strong> sur {reviews.length} avis
                      </p>
                      <p className={styles.meta}>
                        {reviews[0]?.comment || "Dernier retour enregistre sans commentaire."}
                      </p>
                      <Link href="/dashboard/owner/conciergerie" className={styles.cardAction}>
                        Voir les avis et noter
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.sectionGrid}>
                <div className={styles.panel}>
                  <h3>Vos logements</h3>
                  {properties.length === 0 ? (
                    <div>
                      <p>Vous n&apos;avez pas encore de logement visible sur votre compte.</p>
                      <p className={styles.meta}>
                        Creez un nouveau bien pour repartir sur des donnees propres et lancer votre suivi.
                      </p>
                    </div>
                  ) : (
                    <ul className={styles.list}>
                      {properties.slice(0, 5).map((property) => (
                        <li key={property.id} className={styles.listItem}>
                          <strong>{property.nom_logement || "Logement sans nom"}</strong>
                          <p className={styles.meta}>
                            {property.ville || "Ville non renseignee"} ({getStatusLabel(property.statut)})
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.panel}>
                  <h3>Devis et factures</h3>
                  <div className={styles.sectionStack}>
                    <div>
                      <h4>Derniers devis</h4>
                      {latestQuotes.length === 0 ? (
                        <p>Aucun devis disponible pour le moment.</p>
                      ) : (
                        <ul className={styles.list}>
                          {latestQuotes.map((quote) => (
                            <li key={quote.id} className={styles.listItem}>
                              <strong>{quote.quote_number || "Devis sans numero"}</strong>
                              <p className={styles.meta}>
                                {quote.status || "Statut non defini"} - {formatAmount(quote.total_amount)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4>Dernieres factures</h4>
                      {latestInvoices.length === 0 ? (
                        <p>Aucune facture disponible pour le moment.</p>
                      ) : (
                        <ul className={styles.list}>
                          {latestInvoices.map((invoice) => (
                            <li key={invoice.id} className={styles.listItem}>
                              <strong>{invoice.invoice_number || "Facture sans numero"}</strong>
                              <p className={styles.meta}>
                                {invoice.status || "Statut non defini"} - Solde {formatAmount(invoice.balance_amount)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sectionGrid}>
                <div className={styles.panel}>
                  <h3>Suivi de votre activite</h3>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>{ongoingMissions.length} mission(s) demandent actuellement un suivi.</li>
                    <li className={styles.listItem}>{completedMissions.length} intervention(s) sont deja terminees.</li>
                    <li className={styles.listItem}>{draftCount} logement(s) restent a finaliser ou publier.</li>
                    <li className={styles.listItem}>{pendingInvoices.length} facture(s) restent a suivre ou regler.</li>
                  </ul>
                </div>

                <div className={styles.panel}>
                  <h3>Indicateurs cles</h3>
                  <div className={styles.statsList}>
                    {ownerMetrics.map((metric) => (
                      <div key={metric.label} className={styles.metricRow}>
                        <div className={styles.metricLabel}>
                          <span>{metric.label}</span>
                          <span>{metric.value}</span>
                        </div>
                        <div className={styles.metricTrack}>
                          <div className={styles.metricBar} style={{ width: metric.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
