"use client";

import React, { useEffect, useState } from "react";

type PublicReview = {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
};

type PublicProfilePayload = {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    company_name: string | null;
    city: string | null;
    country: string | null;
    service_area: string | null;
    service_radius_km: number | null;
    experience_level: string | null;
    years_experience: number | null;
    hourly_rate: number | null;
    monthly_rate: number | null;
    role: string | null;
  };
  reviews: PublicReview[];
  stats: {
    average_rating: number | null;
    reviews_count: number;
  };
};

function formatAmount(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Non renseigne";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

function formatDate(value: string | null) {
  if (!value) return "Date non renseignee";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function PublicConciergeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<PublicProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const resolvedParams = await params;
        const response = await fetch(`/api/profiles/public/${resolvedParams.id}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger le profil concierge.");
        }

        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger le profil concierge.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", background: "#f8f4eb" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gap: "1.5rem" }}>
        <section
          style={{
            display: "grid",
            gap: "0.85rem",
            padding: "2rem",
            borderRadius: 28,
            border: "1px solid rgba(184, 139, 74, 0.24)",
            background:
              "linear-gradient(145deg, rgba(255, 253, 246, 0.96), rgba(244, 233, 211, 0.92))",
            boxShadow: "0 18px 42px rgba(74, 53, 16, 0.08)",
          }}
        >
          <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a7a3b" }}>
            Profil concierge
          </span>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: 1, color: "#3f2f14" }}>
            {loading ? "Chargement..." : data?.profile.display_name || "Concierge"}
          </h1>
          <p style={{ margin: 0, color: "#5f5237", lineHeight: 1.6, maxWidth: "72ch" }}>
            {error
              ? error
              : "Découvrez le positionnement, la zone d’intervention et les avis laissés après mission."}
          </p>
        </section>

        {loading ? <p>Chargement du profil...</p> : null}

        {!loading && !error && data ? (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <article style={{ padding: "1.2rem", borderRadius: 20, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(184,139,74,0.18)" }}>
                <strong>Note moyenne</strong>
                <p style={{ margin: "0.55rem 0 0", fontSize: "1.35rem", color: "#3f2f14" }}>
                  {typeof data.stats.average_rating === "number"
                    ? `${data.stats.average_rating.toFixed(1)} / 5`
                    : "Pas encore de note"}
                </p>
              </article>
              <article style={{ padding: "1.2rem", borderRadius: 20, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(184,139,74,0.18)" }}>
                <strong>Avis clients</strong>
                <p style={{ margin: "0.55rem 0 0", fontSize: "1.35rem", color: "#3f2f14" }}>
                  {data.stats.reviews_count}
                </p>
              </article>
              <article style={{ padding: "1.2rem", borderRadius: 20, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(184,139,74,0.18)" }}>
                <strong>Zone</strong>
                <p style={{ margin: "0.55rem 0 0", color: "#3f2f14" }}>
                  {data.profile.service_area || data.profile.city || "Non renseignee"}
                </p>
              </article>
              <article style={{ padding: "1.2rem", borderRadius: 20, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(184,139,74,0.18)" }}>
                <strong>Experience</strong>
                <p style={{ margin: "0.55rem 0 0", color: "#3f2f14" }}>
                  {typeof data.profile.years_experience === "number"
                    ? `${data.profile.years_experience} an(s)`
                    : "Non renseignee"}
                </p>
              </article>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              <article style={{ padding: "1.3rem", borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(184,139,74,0.18)" }}>
                <h2 style={{ marginTop: 0, color: "#3f2f14" }}>Positionnement</h2>
                <p>Rôle : {data.profile.role === "concierge_pro" ? "Concierge PRO" : "Concierge"}</p>
                <p>Ville : {data.profile.city || "Non renseignee"}</p>
                <p>Pays : {data.profile.country || "France"}</p>
                <p>Rayon : {typeof data.profile.service_radius_km === "number" ? `${data.profile.service_radius_km} km` : "Non renseigne"}</p>
              </article>
              <article style={{ padding: "1.3rem", borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(184,139,74,0.18)" }}>
                <h2 style={{ marginTop: 0, color: "#3f2f14" }}>Repères tarifaires</h2>
                <p>Tarif horaire : {formatAmount(data.profile.hourly_rate, "/ h")}</p>
                <p>Forfait mensuel : {formatAmount(data.profile.monthly_rate, "/ mois")}</p>
                <p>Niveau : {data.profile.experience_level || "Non renseigne"}</p>
              </article>
            </section>

            <section style={{ display: "grid", gap: "1rem" }}>
              <h2 style={{ margin: 0, color: "#3f2f14" }}>Avis récents</h2>
              {data.reviews.length === 0 ? (
                <p>Aucun avis publié pour le moment.</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                  {data.reviews.map((review) => (
                    <article
                      key={review.id}
                      style={{
                        padding: "1.1rem",
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.94)",
                        border: "1px solid rgba(184,139,74,0.18)",
                      }}
                    >
                      <strong style={{ color: "#3f2f14" }}>
                        {typeof review.rating === "number" ? `${review.rating} / 5` : "Note non renseignee"}
                      </strong>
                      <p style={{ color: "#5f5237", lineHeight: 1.6 }}>
                        {review.comment || "Avis publié sans commentaire."}
                      </p>
                      <small style={{ color: "#7b5b23" }}>{formatDate(review.created_at)}</small>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
