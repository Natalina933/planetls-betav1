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
    services: string[];
  };
  reviews: PublicReview[];
  stats: {
    average_rating: number | null;
    reviews_count: number;
  };
};

const conciergeTheme = {
  accent: "#c6a66b",
  accentText: "#7b5b23",
  accentSoft: "#f3ead8",
  title: "#3f2f14",
  body: "#5f5237",
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

function pillStyle() {
  return {
    padding: "0.42rem 0.75rem",
    borderRadius: 999,
    background: "rgba(198,166,107,0.14)",
    color: conciergeTheme.accentText,
    fontWeight: 600,
  } as const;
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
            border: "1px solid rgba(198, 166, 107, 0.26)",
            background:
              "linear-gradient(145deg, rgba(255, 253, 246, 0.96), rgba(243, 234, 216, 0.94))",
            boxShadow: "0 18px 42px rgba(74, 53, 16, 0.08)",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: conciergeTheme.accentText,
            }}
          >
            Profil concierge
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              lineHeight: 1,
              color: conciergeTheme.title,
            }}
          >
            {loading ? "Chargement..." : data?.profile.display_name || "Concierge"}
          </h1>
          <p style={{ margin: 0, color: conciergeTheme.body, lineHeight: 1.6, maxWidth: "72ch" }}>
            {error
              ? error
              : "Decouvrez le positionnement, la zone d'intervention, les services proposes et les avis laisses apres mission."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 42,
                padding: "0.55rem 0.9rem",
                borderRadius: 999,
                background:
                  data?.profile.role === "concierge_pro"
                    ? "linear-gradient(135deg, rgba(198,166,107,0.24), rgba(243,234,216,0.92))"
                    : "rgba(74,53,16,0.08)",
                color: conciergeTheme.accentText,
                fontWeight: 800,
              }}
            >
              {data?.profile.role === "concierge_pro" ? "Badge PRO" : "Badge Standard"}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 42,
                padding: "0.55rem 0.9rem",
                borderRadius: 999,
                background: "rgba(198,166,107,0.14)",
                color: conciergeTheme.accentText,
                fontWeight: 700,
              }}
            >
              {typeof data?.stats.average_rating === "number"
                ? `${data.stats.average_rating.toFixed(1)} / 5 sur ${data.stats.reviews_count} avis`
                : "Avis en cours de collecte"}
            </span>
            <a
              href="/dashboard/owner/concierges"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: "0.75rem 1rem",
                borderRadius: 999,
                background: "linear-gradient(135deg, #c6a66b, #a98a56)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Contacter ce concierge
            </a>
            <a
              href="/dashboard/owner/messages"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                padding: "0.75rem 1rem",
                borderRadius: 999,
                border: "1px solid rgba(198, 166, 107, 0.35)",
                background: "rgba(255,255,255,0.78)",
                color: conciergeTheme.accentText,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Ouvrir ma messagerie
            </a>
          </div>
        </section>

        {loading ? <p>Chargement du profil...</p> : null}

        {!loading && !error && data ? (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              <article
                style={{
                  padding: "1.2rem",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(198,166,107,0.18)",
                }}
              >
                <strong>Note moyenne</strong>
                <p style={{ margin: "0.55rem 0 0", fontSize: "1.35rem", color: conciergeTheme.title }}>
                  {typeof data.stats.average_rating === "number"
                    ? `${data.stats.average_rating.toFixed(1)} / 5`
                    : "Pas encore de note"}
                </p>
              </article>
              <article
                style={{
                  padding: "1.2rem",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(198,166,107,0.18)",
                }}
              >
                <strong>Avis clients</strong>
                <p style={{ margin: "0.55rem 0 0", fontSize: "1.35rem", color: conciergeTheme.title }}>
                  {data.stats.reviews_count}
                </p>
              </article>
              <article
                style={{
                  padding: "1.2rem",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(198,166,107,0.18)",
                }}
              >
                <strong>Zone</strong>
                <p style={{ margin: "0.55rem 0 0", color: conciergeTheme.title }}>
                  {data.profile.service_area || data.profile.city || "Non renseignee"}
                </p>
              </article>
              <article
                style={{
                  padding: "1.2rem",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(198,166,107,0.18)",
                }}
              >
                <strong>Experience</strong>
                <p style={{ margin: "0.55rem 0 0", color: conciergeTheme.title }}>
                  {typeof data.profile.years_experience === "number"
                    ? `${data.profile.years_experience} an(s)`
                    : "Non renseignee"}
                </p>
              </article>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1rem",
              }}
            >
              <article
                style={{
                  padding: "1.3rem",
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(198,166,107,0.18)",
                }}
              >
                <h2 style={{ marginTop: 0, color: conciergeTheme.title }}>Positionnement</h2>
                <p>Role : {data.profile.role === "concierge_pro" ? "Concierge PRO" : "Concierge"}</p>
                <p>Ville : {data.profile.city || "Non renseignee"}</p>
                <p>Pays : {data.profile.country || "France"}</p>
                <p>
                  Rayon :{" "}
                  {typeof data.profile.service_radius_km === "number"
                    ? `${data.profile.service_radius_km} km`
                    : "Non renseigne"}
                </p>
              </article>
              <article
                style={{
                  padding: "1.3rem",
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(198,166,107,0.18)",
                }}
              >
                <h2 style={{ marginTop: 0, color: conciergeTheme.title }}>Repères tarifaires</h2>
                <p>Tarif horaire : {formatAmount(data.profile.hourly_rate, "/ h")}</p>
                <p>Forfait mensuel : {formatAmount(data.profile.monthly_rate, "/ mois")}</p>
                <p>Niveau : {data.profile.experience_level || "Non renseigne"}</p>
              </article>
            </section>

            <section style={{ display: "grid", gap: "0.85rem" }}>
              <h2 style={{ margin: 0, color: conciergeTheme.title }}>Services proposés</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {data.profile.services.length > 0 ? (
                  data.profile.services.map((service) => (
                    <span key={service} style={pillStyle()}>
                      {service}
                    </span>
                  ))
                ) : (
                  <span style={{ color: conciergeTheme.body }}>Services non renseignés pour le moment.</span>
                )}
              </div>
            </section>

            <section style={{ display: "grid", gap: "1rem" }}>
              <h2 style={{ margin: 0, color: conciergeTheme.title }}>Avis récents</h2>
              {data.reviews.length === 0 ? (
                <p>Aucun avis publie pour le moment.</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "1rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  }}
                >
                  {data.reviews.map((review) => (
                    <article
                      key={review.id}
                      style={{
                        padding: "1.1rem",
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.94)",
                        border: "1px solid rgba(198,166,107,0.18)",
                      }}
                    >
                      <strong style={{ color: conciergeTheme.title }}>
                        {typeof review.rating === "number"
                          ? `${review.rating} / 5`
                          : "Note non renseignee"}
                      </strong>
                      <p style={{ color: conciergeTheme.body, lineHeight: 1.6 }}>
                        {review.comment || "Avis publie sans commentaire."}
                      </p>
                      <small style={{ color: conciergeTheme.accentText }}>{formatDate(review.created_at)}</small>
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
