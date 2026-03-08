"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import FilterSliders from "@/app/components/ui/FilterSliders";
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
  if (!value) return "Date a definir";
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
  if (typeof value !== "number") return "Budget non renseigne";
  return `${value.toFixed(0)} ${currency || "EUR"} max`;
}

function formatRequestType(value: OwnerServiceRequestRow["request_type"]) {
  if (value === "durable") return "Besoin durable";
  if (value === "renfort") return "Renfort / remplacement";
  return "Besoin ponctuel";
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
  const [cityPreference, setCityPreference] = useState("");
  const [radiusPreference, setRadiusPreference] = useState(25);
  const [budgetPreference, setBudgetPreference] = useState(90);

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
        setConversations(Array.isArray(conversationsPayload) ? conversationsPayload : []);
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
        setRequests(Array.isArray(requestsPayload?.items) ? requestsPayload.items : []);
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
          ["sent", "viewed", "interested", "quoted"].includes(recipient.status),
        ),
      ).length,
    [requests],
  );

  const requestDetailSection = useMemo(
    () => ({
      title: "Demandes envoyées aux concierges",
      description:
        "Suivez ici les briefs envoyés depuis la recherche concierge, leur statut et les destinataires.",
      emptyText: "Aucune demande envoyée pour le moment. Vos prochaines demandes apparaîtront ici.",
      items: requests.map((request) => ({
        title: request.title,
        meta: request.status,
        tone: request.urgency ? ("warning" as const) : ("default" as const),
        description: [
          `${formatRequestType(request.request_type)}${request.urgency ? " | Urgent" : ""}`,
          `${request.city || "Ville a confirmer"}${request.postal_code ? ` (${request.postal_code})` : ""}`,
          `Envoi le ${formatDateTime(request.created_at)}`,
          request.description || "",
        ]
          .filter(Boolean)
          .join(" | "),
        facts: [
          formatBudget(request.budget_max, request.currency),
          `Echeance: ${formatDateTime(request.desired_date)}`,
          request.recipients.length > 0
            ? `Destinataires: ${request.recipients
                .map((recipient) => `${recipient.concierge_name || "Concierge"} (${recipient.status})`)
                .join(" | ")}`
            : "Aucun concierge rattaché",
          request.selected_concierge_name
            ? `Concierge retenu : ${request.selected_concierge_name}`
            : "",
        ].filter(Boolean),
      })),
    }),
    [requests],
  );

  const searchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (cityPreference.trim()) params.set("city", cityPreference.trim());
    if (budgetPreference > 0) params.set("budgetMax", String(budgetPreference));
    if (radiusPreference > 0) params.set("radiusKm", String(radiusPreference));
    const query = params.toString();
    return query ? `/dashboard/owner/concierges?${query}` : "/dashboard/owner/concierges";
  }, [budgetPreference, cityPreference, radiusPreference]);

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
            : "Retrouvez vos demandes envoyées, vos échanges récents, le niveau d'activité de votre concierge et les retours collectés après mission."
        }
        chips={[
          `${missions.length} mission(s)`,
          `${requests.length} demande(s) envoyée(s)`,
          `${ongoingCount} en cours`,
          `${conversations.length} conversation(s)`,
          averageRating ? `${averageRating}/5 de satisfaction` : "Avis en cours de collecte",
          spotlightProfile?.profile.role === "concierge_pro" ? "Concierge PRO" : "Concierge Standard",
        ]}
        actions={[
          { label: "Ouvrir les messages", href: "/dashboard/owner/messages" },
          { label: "Voir le planning", href: "/dashboard/owner/planning" },
          { label: "Trouver un concierge", href: searchHref },
          ...(spotlightConciergeProfileId
            ? [{ label: "Voir le profil concierge", href: `/concierges/${spotlightConciergeProfileId}` }]
            : []),
        ]}
        cards={[
          {
            title: "Demandes envoyées",
            text:
              requests.length > 0
                ? requests
                    .slice(0, 3)
                    .map((request) => `${request.title} (${request.status})`)
                    .join(" | ")
                : "Aucune demande envoyée pour le moment.",
          },
          {
            title: "1. Missions recentes",
            text:
              missions.length > 0
                ? missions
                    .slice(0, 3)
                    .map((mission) => `${mission.title || "Mission"} (${mission.status || "-"})`)
                    .join(" | ")
                : "Aucune mission chargée pour le moment.",
          },
          {
            title: "2. Contacts actifs",
            text:
              conversations.length > 0
                ? conversations
                    .slice(0, 3)
                    .map((conversation) => conversation.counterpart_name || "Contact")
                    .join(" | ")
                : "Aucun contact actif pour le moment.",
          },
          {
            title: "3. Suivi operationnel",
            text:
              openRequestsCount > 0
                ? `${openRequestsCount} demande(s) attendent encore un retour ou une qualification concierge.`
                : "Aucune demande envoyée n'attend actuellement de retour.",
          },
          {
            title: "Avis et notation",
            text:
              reviews.length > 0
                ? `${averageRating || "-"} / 5 sur ${reviews.length} avis. Dernier retour : ${reviews[0]?.comment || "Evaluation recueillie sans commentaire."}`
                : "Les avis laissés après les missions terminées apparaîtront ici.",
          },
          {
            title: "Badge concierge",
            text: spotlightProfile
              ? `${spotlightProfile.profile.role === "concierge_pro" ? "Concierge PRO" : "Concierge Standard"}${typeof spotlightProfile.stats.average_rating === "number" ? ` | ${spotlightProfile.stats.average_rating.toFixed(1)} / 5 sur ${spotlightProfile.stats.reviews_count} avis` : ""}`
              : "Le statut PRO et la note du concierge apparaîtront ici dès qu'un profil sera associé.",
          },
        ]}
        detailSections={[requestDetailSection]}
      />

      <section className={workspaceStyles.card}>
        <h2 className={workspaceStyles.cardTitle}>Budget et rayon</h2>
        <p className={workspaceStyles.cardText}>
          Ajustez rapidement vos préférences avant de relancer une recherche de concierges.
        </p>
        <label className={pageStyles.label}>
          <span className={workspaceStyles.cardText}>Ville</span>
          <input
            value={cityPreference}
            onChange={(event) => setCityPreference(event.target.value)}
            placeholder="Paris, Lyon, Bordeaux..."
            className={pageStyles.field}
          />
        </label>
        <FilterSliders
          title="Préférences de recherche"
          budget={{
            label: "Budget max par heure",
            value: budgetPreference,
            min: 0,
            max: 300,
            step: 10,
            helperText: "0 = sans limite",
            formatValue: (value) => (value === 0 ? "Sans limite" : `${value} EUR/h`),
            onChange: setBudgetPreference,
          }}
          radius={{
            label: "Rayon max",
            value: radiusPreference,
            min: 0,
            max: 100,
            step: 5,
            unit: "km",
            helperText: "0 = sans limite",
            formatValue: (value) => (value === 0 ? "Sans limite" : `${value} km`),
            onChange: setRadiusPreference,
          }}
        />
        <div className={workspaceStyles.cardActions}>
          <Link href={searchHref} className={pageStyles.buttonPrimary}>
            Relancer ma recherche concierge
          </Link>
        </div>
      </section>

      <section className={workspaceStyles.card}>
        <h2 className={workspaceStyles.cardTitle}>Laisser un avis</h2>
        <p className={workspaceStyles.cardText}>
          Notez votre concierge après une mission terminée pour renforcer la confiance sur la
          plateforme.
        </p>

        {reviewSuccess ? (
          <p className={`${pageStyles.message} ${pageStyles.messageSuccess}`}>{reviewSuccess}</p>
        ) : null}
        {reviewError ? (
          <p className={`${pageStyles.message} ${pageStyles.messageError}`}>{reviewError}</p>
        ) : null}

        {reviewableMissions.length === 0 ? (
          <p className={workspaceStyles.cardText}>
            Aucun avis en attente. Les missions terminées non encore notées apparaîtront ici.
          </p>
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
