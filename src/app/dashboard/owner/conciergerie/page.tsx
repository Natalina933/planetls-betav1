"use client";

import React, { useEffect, useMemo, useState } from "react";
import OwnerWorkspacePage from "../_components/OwnerWorkspacePage";
import workspaceStyles from "../_components/OwnerWorkspace.module.scss";

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

export default function OwnerConciergeriePage() {
  const [missions, setMissions] = useState<OwnerMissionRow[]>([]);
  const [conversations, setConversations] = useState<OwnerConversationRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
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

        const [missionsRes, conversationsRes, reviewsRes] = await Promise.all([
          fetch("/api/missions?scope=owner&limit=8", { cache: "no-store" }),
          fetch("/api/messages/conversations?role=owner&limit=8", { cache: "no-store" }),
          fetch("/api/reviews?limit=6", { cache: "no-store" }),
        ]);

        const missionsPayload = await missionsRes.json();
        const conversationsPayload = await conversationsRes.json();
        const reviewsPayload = await reviewsRes.json();

        if (!missionsRes.ok) {
          throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
        }
        if (!conversationsRes.ok) {
          throw new Error(
            conversationsPayload?.error || "Impossible de charger les conversations.",
          );
        }
        if (!reviewsRes.ok) {
          throw new Error(reviewsPayload?.error || "Impossible de charger les avis.");
        }

        setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
        setConversations(Array.isArray(conversationsPayload) ? conversationsPayload : []);
        setReviews(Array.isArray(reviewsPayload) ? reviewsPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger la conciergerie.");
      }
    }

    loadData();
  }, []);

  const ongoingCount = useMemo(
    () =>
      missions.filter(
        (mission) => mission.status === "accepted" || mission.status === "in_progress",
      ).length,
    [missions],
  );

  const averageRating = useMemo(() => {
    const validRatings = reviews
      .map((review) => review.rating)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    if (validRatings.length === 0) {
      return null;
    }

    const total = validRatings.reduce((sum, value) => sum + value, 0);
    return (total / validRatings.length).toFixed(1);
  }, [reviews]);

  const reviewedMissionIds = useMemo(
    () => new Set(reviews.map((review) => review.mission_id)),
    [reviews],
  );

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

  async function handleSubmitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMission?.concierge_profile_id) {
      setReviewError("Impossible d'identifier le concierge a evaluer.");
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
      setReviewSuccess("Votre avis a bien ete enregistre.");
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
        eyebrow="Relation concierge"
        title="Ma conciergerie"
        description={
          error
            ? error
            : "Retrouvez vos echanges recents, le niveau d'activite de votre concierge et les premiers retours collectes apres mission."
        }
        chips={[
          `${missions.length} mission(s)`,
          `${ongoingCount} en cours`,
          `${conversations.length} conversation(s)`,
          averageRating ? `${averageRating}/5 de satisfaction` : "Avis en cours de collecte",
        ]}
        actions={[
          { label: "Voir mes messages", href: "/dashboard/owner/messages" },
          { label: "Voir mon planning", href: "/dashboard/owner/planning" },
          ...(spotlightConciergeProfileId
            ? [{ label: "Voir le profil concierge", href: `/concierges/${spotlightConciergeProfileId}` }]
            : []),
        ]}
        cards={[
          {
            title: "Missions recentes",
            text:
              missions.length > 0
                ? missions
                    .slice(0, 3)
                    .map((mission) => `${mission.title || "Mission"} (${mission.status || "-"})`)
                    .join(" • ")
                : "Aucune mission chargee pour le moment.",
          },
          {
            title: "Contacts actifs",
            text:
              conversations.length > 0
                ? conversations
                    .slice(0, 3)
                    .map((conversation) => conversation.counterpart_name || "Contact")
                    .join(" • ")
                : "Aucun contact actif pour le moment.",
          },
          {
            title: "Pilotage",
            text:
              ongoingCount > 0
                ? `${ongoingCount} intervention(s) demandent actuellement un suivi proprietaire.`
                : "Aucune intervention en cours a suivre actuellement.",
          },
          {
            title: "Avis et notation",
            text:
              reviews.length > 0
                ? `${averageRating || "-"} / 5 sur ${reviews.length} avis. Dernier retour : ${reviews[0]?.comment || "Evaluation recueillie sans commentaire."}`
                : "Les avis laisses apres les missions terminees apparaitront ici.",
          },
        ]}
      />

      <section className={workspaceStyles.card}>
        <h2 className={workspaceStyles.cardTitle}>Laisser un avis</h2>
        <p className={workspaceStyles.cardText}>
          Notez votre concierge apres une mission terminee pour renforcer la confiance sur la
          plateforme.
        </p>

        {reviewSuccess ? (
          <p className={workspaceStyles.cardText} style={{ color: "#7b5b23", fontWeight: 700 }}>
            {reviewSuccess}
          </p>
        ) : null}
        {reviewError ? (
          <p className={workspaceStyles.cardText} style={{ color: "#991b1b", fontWeight: 700 }}>
            {reviewError}
          </p>
        ) : null}

        {reviewableMissions.length === 0 ? (
          <p className={workspaceStyles.cardText}>
            Aucun avis en attente. Les missions terminees non encore notees apparaitront ici.
          </p>
        ) : (
          <form onSubmit={handleSubmitReview} style={{ display: "grid", gap: "0.85rem" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span className={workspaceStyles.cardText}>Mission terminee</span>
              <select
                value={selectedMissionId}
                onChange={(event) => setSelectedMissionId(event.target.value)}
                style={{ minHeight: 42, borderRadius: 12, padding: "0.65rem 0.8rem" }}
              >
                {reviewableMissions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title || "Mission"} ({mission.priority || "normal"})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span className={workspaceStyles.cardText}>Note</span>
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                style={{ minHeight: 42, borderRadius: 12, padding: "0.65rem 0.8rem" }}
              >
                <option value="5">5 / 5</option>
                <option value="4">4 / 5</option>
                <option value="3">3 / 5</option>
                <option value="2">2 / 5</option>
                <option value="1">1 / 5</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span className={workspaceStyles.cardText}>Commentaire</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Votre retour sur la reactivite, la qualite d'execution ou la communication."
                style={{ borderRadius: 12, padding: "0.75rem 0.8rem", resize: "vertical" }}
              />
            </label>

            <div className={workspaceStyles.cardActions}>
              <button
                type="submit"
                disabled={submittingReview || !selectedMission}
                className={workspaceStyles.cardActionPrimary}
                style={{ cursor: submittingReview ? "not-allowed" : "pointer" }}
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
