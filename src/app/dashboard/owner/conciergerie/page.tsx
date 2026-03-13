"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  getOwnerReplySignature,
  isOwnerReplyStatus,
  markOwnerReplySignaturesAsSeen,
} from "@/app/components/dashboard/notifications/serviceRequestNotifications";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import workspaceStyles from "../_components/OwnerWorkspace.module.scss";
import pageStyles from "../OwnerDashboardPages.module.scss";

type OwnerMissionRow = {
  id: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  concierge_profile_id: string | null;
};

type OwnerConversationRow = {
  id: string;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count?: number;
};

type ReviewRow = {
  id: string;
  mission_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  reviewed_profile_id: string | null;
};

type SpotlightConciergeProfile = {
  profile: {
    id: string;
    display_name: string;
    role: string | null;
  };
  stats: {
    average_rating: number | null;
    reviews_count: number;
  };
};

type OwnerServiceRequestRecipient = {
  id: string;
  status: string;
  concierge_name?: string;
  responded_at?: string | null;
  viewed_at?: string | null;
};

type OwnerServiceRequestRow = {
  id: string;
  title: string;
  description?: string | null;
  request_type: "ponctuel" | "renfort" | "durable";
  city?: string | null;
  postal_code?: string | null;
  desired_date?: string | null;
  urgency?: boolean;
  budget_max?: number | null;
  currency?: string | null;
  status: string;
  created_at?: string | null;
  selected_concierge_name?: string | null;
  recipients: OwnerServiceRequestRecipient[];
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date à définir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatBudget(value: number | null | undefined, currency: string | null | undefined) {
  if (typeof value !== "number") return "Budget non renseigné";
  return `${value.toFixed(0)} ${currency || "EUR"} max`;
}

function formatRequestType(value: OwnerServiceRequestRow["request_type"]) {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort / remplacement";
  return "Besoin ponctuel";
}

function formatRequestStatus(status: string) {
  switch (status) {
    case "sent":
      return "Envoyée";
    case "viewed":
      return "Consultée";
    case "in_review":
      return "En cours d'examen";
    case "interested":
      return "Intérêt reçu";
    case "quoted":
      return "Devis reçu";
    case "selected":
      return "Concierge retenu";
    case "closed":
      return "Clôturée";
    default:
      return status || "En cours";
  }
}

function getStatusTone(status: string, urgent?: boolean) {
  if (urgent) return pageStyles.statusUrgent;
  if (status === "selected" || status === "closed") return pageStyles.statusSuccess;
  if (status === "quoted" || status === "interested" || status === "in_review") {
    return pageStyles.statusInfo;
  }
  return pageStyles.statusPending;
}

function collectReplySignatures(rows: OwnerServiceRequestRow[]) {
  return rows
    .filter(
      (request) =>
        Array.isArray(request.recipients) &&
        request.recipients.some((recipient) => isOwnerReplyStatus(recipient.status)),
    )
    .map((request) => getOwnerReplySignature(request));
}

export default function OwnerConciergeriePage() {
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [requests, setRequests] = useState<OwnerServiceRequestRow[]>([]);
  const [spotlightProfile, setSpotlightProfile] = useState<SpotlightConciergeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);

        const [missionsRes, conversationsRes, reviewsRes, requestsRes] = await Promise.all([
          fetch("/api/missions?scope=owner&limit=8", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=owner&limit=8", { cache: "no-store" }),
          fetch("/api/reviews?limit=6", { cache: "no-store" }),
          fetch("/api/service-requests?limit=8", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsRes.json();
        const conversationsPayload = await conversationsRes.json();
        const reviewsPayload = await reviewsRes.json();
        const requestsPayload = await requestsRes.json();

        if (!missionsRes.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!conversationsRes.ok) {
          throw new Error(conversationsPayload?.error || "Impossible de charger les conversations.");
        }
        if (!reviewsRes.ok) {
          throw new Error(reviewsPayload?.error || "Impossible de charger les avis.");
        }
        if (!requestsRes.ok) {
          throw new Error(requestsPayload?.error || "Impossible de charger les demandes envoyées.");
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload?.items) ? conversationsPayload.items : []);
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
        const nextRequests = Array.isArray(requestsPayload?.items) ? requestsPayload.items : [];
        setRequests(nextRequests);
        markOwnerReplySignaturesAsSeen(collectReplySignatures(nextRequests));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger la conciergerie.");
      }
    }

    void loadData();
  }, []);

  const ongoingCount = useMemo(
    () =>
      missions.filter(
        (mission) => mission.status === "accepted" || mission.status === "in_progress",
      ).length,
    [missions],
  );

  const openRequestsCount = useMemo(
    () =>
      requests.filter((request) =>
        request.recipients.some((recipient) =>
          ["sent", "viewed", "interested", "quoted", "in_review"].includes(recipient.status),
        ),
      ).length,
    [requests],
  );

  const repliedRequestsCount = useMemo(
    () =>
      requests.filter((request) =>
        request.recipients.some((recipient) =>
          ["interested", "quoted", "selected", "in_review"].includes(recipient.status),
        ),
      ).length,
    [requests],
  );

  const selectedConciergeCount = useMemo(
    () => requests.filter((request) => Boolean(request.selected_concierge_name)).length,
    [requests],
  );

  const averageRating = useMemo(() => {
    const validRatings = reviews
      .map((review) => review.rating)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (validRatings.length === 0) return null;
    return (validRatings.reduce((sum, value) => sum + value, 0) / validRatings.length).toFixed(1);
  }, [reviews]);

  const reviewedMissionIds = useMemo(() => new Set(reviews.map((review) => review.mission_id)), [reviews]);

  const reviewableMissions = useMemo(
    () =>
      missions.filter(
        (mission) =>
          mission.status === "completed" &&
          !!mission.concierge_profile_id &&
          !reviewedMissionIds.has(mission.id),
      ),
    [missions, reviewedMissionIds],
  );

  useEffect(() => {
    if (!selectedMissionId && reviewableMissions.length > 0) {
      setSelectedMissionId(reviewableMissions[0].id);
    }
  }, [reviewableMissions, selectedMissionId]);

  const selectedMission = useMemo(
    () => reviewableMissions.find((mission) => mission.id === selectedMissionId) ?? null,
    [reviewableMissions, selectedMissionId],
  );

  const spotlightConciergeProfileId = useMemo(() => {
    const withConcierge = missions.find((mission) => !!mission.concierge_profile_id);
    return withConcierge?.concierge_profile_id ?? null;
  }, [missions]);

  useEffect(() => {
    if (!spotlightConciergeProfileId) {
      setSpotlightProfile(null);
      return;
    }

    let cancelled = false;

    async function loadSpotlightProfile() {
      try {
        const response = await fetch(`/api/profiles/public/${spotlightConciergeProfileId}`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || cancelled) return;
        setSpotlightProfile(payload);
      } catch {
        if (!cancelled) {
          setSpotlightProfile(null);
        }
      }
    }

    void loadSpotlightProfile();

    return () => {
      cancelled = true;
    };
  }, [spotlightConciergeProfileId]);

  async function handleSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMission?.concierge_profile_id) {
      setReviewError("Impossible d'identifier le concierge à évaluer.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);
      setReviewSuccess(null);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission_id: selectedMission.id,
          reviewed_profile_id: selectedMission.concierge_profile_id,
          rating: Number(rating),
          comment,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'enregistrer votre avis.");
      }

      setReviews((prev) => [payload, ...prev]);
      setReviewSuccess("Votre avis a bien été enregistré.");
      setComment("");
      setRating("5");
      setSelectedMissionId("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Impossible d'enregistrer votre avis.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="dashboard-grid">
      <OwnerWorkspacePage
        eyebrow="Conciergerie"
        title="Suivi de mes demandes concierge"
        description={
          error
            ? error
            : "Un espace de pilotage synthétique pour suivre vos demandes, vos échanges actifs et la qualité de la relation concierge."
        }
        chips={[
          `${requests.length} demande(s) envoyée(s)`,
          `${openRequestsCount} en attente`,
          `${repliedRequestsCount} réponse(s) reçue(s)`,
          `${ongoingCount} mission(s) en cours`,
          averageRating ? `${averageRating}/5 de satisfaction` : "Avis en cours de collecte",
          spotlightProfile?.profile.role === "concierge_pro" ? "Concierge PRO" : "Concierge standard",
        ]}
        actions={[
          { label: "Ouvrir les messages", href: "/dashboard/owner/messages" },
          { label: "Voir le planning", href: "/dashboard/owner/planning" },
          { label: "Trouver un concierge", href: "/dashboard/owner/concierges" },
          ...(spotlightConciergeProfileId
            ? [{ label: "Voir le profil concierge", href: `/concierges/${spotlightConciergeProfileId}` }]
            : []),
        ]}
        cards={[
          {
            title: "Vue opérationnelle",
            text:
              requests.length > 0
                ? `${openRequestsCount} demande(s) encore à qualifier, ${repliedRequestsCount} avec un retour exploitable et ${selectedConciergeCount} déjà transformée(s) en relation active.`
                : "Aucune demande envoyée pour le moment.",
          },
          {
            title: "Missions récentes",
            text:
              missions.length > 0
                ? missions
                    .slice(0, 3)
                    .map((mission) => `${mission.title || "Mission"} (${mission.status || "-"})`)
                    .join(" | ")
                : "Aucune mission chargée pour le moment.",
          },
          {
            title: "Contacts actifs",
            text:
              conversations.length > 0
                ? conversations
                    .slice(0, 3)
                    .map((conversation) => conversation.counterpart_name || "Contact")
                    .join(" | ")
                : "Aucun contact actif pour le moment.",
          },
          {
            title: "Avis et notation",
            text:
              reviews.length > 0
                ? `${averageRating || "-"} / 5 sur ${reviews.length} avis. Dernier retour : ${reviews[0]?.comment || "Évaluation recueillie sans commentaire."}`
                : "Les avis laissés après les missions terminées apparaîtront ici.",
          },
          {
            title: "Badge concierge",
            text: spotlightProfile
              ? `${spotlightProfile.profile.role === "concierge_pro" ? "Concierge PRO" : "Concierge standard"}${typeof spotlightProfile.stats.average_rating === "number" ? ` | ${spotlightProfile.stats.average_rating.toFixed(1)} / 5 sur ${spotlightProfile.stats.reviews_count} avis` : ""}`
              : "Le statut PRO et la note du concierge apparaîtront ici dès qu&apos;un profil sera associé.",
          },
        ]}
      />

      <section className={pageStyles.conciergeDashboardFlow}>
        <div className={pageStyles.conciergeKpiGrid}>
          <article className={pageStyles.conciergeKpiCard}>
            <span className={pageStyles.conciergeKpiLabel}>Demandes envoyées</span>
            <strong className={pageStyles.conciergeKpiValue}>{requests.length}</strong>
            <p className={pageStyles.conciergeKpiHint}>Briefs déjà partis vers vos concierges ciblés.</p>
          </article>
          <article className={pageStyles.conciergeKpiCard}>
            <span className={pageStyles.conciergeKpiLabel}>En attente</span>
            <strong className={pageStyles.conciergeKpiValue}>{openRequestsCount}</strong>
            <p className={pageStyles.conciergeKpiHint}>Demandes qui attendent encore une réponse exploitable.</p>
          </article>
          <article className={pageStyles.conciergeKpiCard}>
            <span className={pageStyles.conciergeKpiLabel}>Réponses reçues</span>
            <strong className={pageStyles.conciergeKpiValue}>{repliedRequestsCount}</strong>
            <p className={pageStyles.conciergeKpiHint}>Concierges ayant consulté, répondu ou proposé un devis.</p>
          </article>
          <article className={pageStyles.conciergeKpiCard}>
            <span className={pageStyles.conciergeKpiLabel}>Concierge retenu</span>
            <strong className={pageStyles.conciergeKpiValue}>{selectedConciergeCount}</strong>
            <p className={pageStyles.conciergeKpiHint}>Demandes déjà transformées en relation active.</p>
          </article>
        </div>

        <div className={pageStyles.conciergeLayout}>
          <section className={pageStyles.conciergeTimelinePanel}>
            <div className={pageStyles.conciergeSectionHeader}>
              <div>
                <p className={pageStyles.eyebrow}>Pilotage</p>
                <h2 className={pageStyles.conciergeSectionTitle}>Timeline des demandes</h2>
              </div>
              <Link href="/dashboard/owner/concierges" className={pageStyles.linkButton}>
                Trouver un concierge
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className={pageStyles.conciergeEmptyState}>
                <h3>Aucune demande envoyée pour le moment.</h3>
                <p>Commencez une recherche puis envoyez un brief à des concierges pour suivre ici les retours.</p>
              </div>
            ) : (
              <div className={pageStyles.conciergeTimeline}>
                {requests.map((request) => (
                  <article key={request.id} className={pageStyles.conciergeRequestCard}>
                    <div className={pageStyles.conciergeRequestTopline}>
                      <div className={pageStyles.conciergeRequestHeading}>
                        <span
                          className={`${pageStyles.conciergeStatusPill} ${getStatusTone(request.status, request.urgency)}`}
                        >
                          {formatRequestStatus(request.status)}
                        </span>
                        <h3>{request.title}</h3>
                        <p>
                          {formatRequestType(request.request_type)}
                          {request.urgency ? " · Urgent" : ""}
                        </p>
                      </div>
                      <div className={pageStyles.conciergeRequestMeta}>
                        <span>
                          {request.city || "Ville à confirmer"}
                          {request.postal_code ? ` ${request.postal_code}` : ""}
                        </span>
                        <span>Envoyée le {formatDateTime(request.created_at)}</span>
                      </div>
                    </div>

                    <div className={pageStyles.conciergeFactRow}>
                      <div className={pageStyles.conciergeFactCard}>
                        <span>Budget</span>
                        <strong>{formatBudget(request.budget_max, request.currency)}</strong>
                      </div>
                      <div className={pageStyles.conciergeFactCard}>
                        <span>Échéance</span>
                        <strong>{formatDateTime(request.desired_date)}</strong>
                      </div>
                      <div className={pageStyles.conciergeFactCard}>
                        <span>Concierges contactés</span>
                        <strong>{request.recipients.length}</strong>
                      </div>
                    </div>

                    {request.description ? (
                      <p className={pageStyles.conciergeRequestDescription}>{request.description}</p>
                    ) : null}

                    <div className={pageStyles.conciergeRecipients}>
                      {request.recipients.length > 0 ? (
                        request.recipients.slice(0, 4).map((recipient) => (
                          <span key={recipient.id} className={pageStyles.conciergeRecipientChip}>
                            {recipient.concierge_name || "Concierge"} · {formatRequestStatus(recipient.status)}
                          </span>
                        ))
                      ) : (
                        <span className={pageStyles.conciergeRecipientChip}>Aucun destinataire rattaché</span>
                      )}
                    </div>

                    <div className={pageStyles.inlineActions}>
                      <Link href="/dashboard/owner/messages" className={pageStyles.buttonSecondary}>
                        Voir les messages
                      </Link>
                      <Link href="/dashboard/owner/concierges" className={pageStyles.buttonPrimary}>
                        Relancer une recherche
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className={pageStyles.conciergeAside}>
            <section className={pageStyles.conciergeSpotlightCard}>
              <p className={pageStyles.eyebrow}>Actions rapides</p>
              <h2 className={pageStyles.conciergeSectionTitle}>Prochaines actions</h2>
              <div className={pageStyles.conciergeQuickActions}>
                <Link href="/dashboard/owner/concierges" className={pageStyles.buttonPrimary}>
                  Trouver un concierge
                </Link>
                <Link href="/dashboard/owner/messages" className={pageStyles.buttonSecondary}>
                  Ouvrir les messages
                </Link>
                <Link href="/dashboard/owner/planning" className={pageStyles.buttonSecondary}>
                  Voir le planning
                </Link>
              </div>
            </section>

            <section className={pageStyles.conciergeSpotlightCard}>
              <p className={pageStyles.eyebrow}>Relation</p>
              <h2 className={pageStyles.conciergeSectionTitle}>Vue d&apos;ensemble concierge</h2>
              <div className={pageStyles.conciergeSnapshotList}>
                <div className={pageStyles.conciergeSnapshotRow}>
                  <span>Badge</span>
                  <strong>
                    {spotlightProfile?.profile.role === "concierge_pro"
                      ? "Concierge PRO"
                      : "Concierge standard"}
                  </strong>
                </div>
                <div className={pageStyles.conciergeSnapshotRow}>
                  <span>Note moyenne</span>
                  <strong>{averageRating ? `${averageRating} / 5` : "À construire"}</strong>
                </div>
                <div className={pageStyles.conciergeSnapshotRow}>
                  <span>Conversations</span>
                  <strong>{conversations.length}</strong>
                </div>
                <div className={pageStyles.conciergeSnapshotRow}>
                  <span>Missions en cours</span>
                  <strong>{ongoingCount}</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className={`${workspaceStyles.card} ${pageStyles.reviewCard}`}>
        <div className={pageStyles.reviewCardHeader}>
          <div className={pageStyles.reviewCardCopy}>
            <p className={pageStyles.conciergeSectionEyebrow}>Confiance</p>
            <h2 className={workspaceStyles.cardTitle}>Laisser un avis</h2>
            <p className={workspaceStyles.cardText}>
              Notez votre concierge après une mission terminée pour renforcer la confiance sur la
              plateforme.
            </p>
          </div>
          <div className={pageStyles.reviewBadgeGroup}>
            <span className={pageStyles.reviewBadge}>Mission terminée</span>
            <span className={pageStyles.reviewBadgeMuted}>Avis propriétaire</span>
          </div>
        </div>

        {reviewSuccess ? (
          <p className={`${pageStyles.message} ${pageStyles.messageSuccess}`}>{reviewSuccess}</p>
        ) : null}
        {reviewError ? (
          <p className={`${pageStyles.message} ${pageStyles.messageError}`}>{reviewError}</p>
        ) : null}

        {reviewableMissions.length === 0 ? (
          <div className={pageStyles.reviewEmptyState}>
            <div className={pageStyles.reviewEmptyIcon} aria-hidden="true">
              5
            </div>
            <div className={pageStyles.reviewEmptyCopy}>
              <h3>Aucun avis en attente</h3>
              <p className={workspaceStyles.cardText}>
                Les missions terminées non encore notées apparaîtront ici.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className={pageStyles.formGrid}>
            <label className={pageStyles.label}>
              <span className={workspaceStyles.cardText}>Mission terminée</span>
              <select
                value={selectedMissionId}
                onChange={(event) => setSelectedMissionId(event.target.value)}
                className={pageStyles.select}
              >
                {reviewableMissions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title || "Mission"} ({mission.priority || "normale"})
                  </option>
                ))}
              </select>
            </label>

            <label className={pageStyles.label}>
              <span className={workspaceStyles.cardText}>Note</span>
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className={pageStyles.select}
              >
                <option value="5">5 / 5</option>
                <option value="4">4 / 5</option>
                <option value="3">3 / 5</option>
                <option value="2">2 / 5</option>
                <option value="1">1 / 5</option>
              </select>
            </label>

            <label className={pageStyles.label}>
              <span className={workspaceStyles.cardText}>Commentaire</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Votre retour sur la réactivité, la qualité d'exécution ou la communication."
                className={pageStyles.textarea}
              />
            </label>

            <div className={workspaceStyles.cardActions}>
              <button
                type="submit"
                disabled={submittingReview || !selectedMission}
                className={pageStyles.buttonPrimary}
              >
                {submittingReview ? "Enregistrement..." : "Publier mon avis"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
