"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Euro,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { ConciergePreviewCard } from "@/features/public-concierges";
import styles from "./page.module.scss";

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
    image: string | null;
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

function formatAmount(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Sur demande";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

function formatDate(value: string | null) {
  if (!value) return "Date non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getRatingLabel(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(1)} / 5` : "Avis en attente";
}

function getExperienceLabel(value: number | null) {
  return typeof value === "number" ? `${value} an(s)` : "Non renseignée";
}

function formatExperienceLevelLabel(value: string | null) {
  const labels: Record<string, string> = {
    debutant: "Débutant",
    intermediaire: "Intermédiaire",
    experimente: "Expérimenté",
  };

  return value ? labels[value] ?? value : "Non renseigné";
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

  const profile = data?.profile;
  const services = useMemo(() => profile?.services.filter(Boolean) ?? [], [profile?.services]);
  const isPro = profile?.role === "concierge_pro";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link href="/home#concierges-recommandes" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden />
          Retour aux profils
        </Link>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Sparkles size={16} aria-hidden />
              Profil concierge
            </span>
            <h1>{loading ? "Chargement du profil" : profile?.display_name || "Concierge"}</h1>
            <p>
              Un aperçu clair de la zone couverte, des services disponibles, des repères
              tarifaires et des retours clients avant de prendre contact.
            </p>

            <div className={styles.heroActions}>
              <ButtonLink href="/login" variant="primary">
                Contacter
              </ButtonLink>
              <ButtonLink href="/home#concierges-recommandes" variant="secondary">
                Explorer les profils
              </ButtonLink>
            </div>
          </div>

          <aside className={styles.profileCard}>
            {profile ? (
              <ConciergePreviewCard
                id={profile.id}
                avatarUrl={profile.avatar_url}
                coverImageUrl={profile.image}
                displayName={profile.display_name}
                city={profile.city}
                serviceArea={profile.service_area}
                services={services}
                hourlyRate={profile.hourly_rate}
                monthlyRate={profile.monthly_rate}
                yearsExperience={profile.years_experience}
                isPro={isPro}
                averageRating={data.stats.average_rating}
                reviewsCount={data.stats.reviews_count}
                primaryAction={
                  <ButtonLink href="/login" variant="primary" size="sm">
                    Contacter
                  </ButtonLink>
                }
                secondaryAction={
                  <ButtonLink href="/home#concierges-recommandes" variant="secondary" size="sm">
                    Retour
                  </ButtonLink>
                }
              />
            ) : (
              <div className={styles.cardPlaceholder}>
                {loading ? "Chargement de la carte..." : error || "Profil indisponible."}
              </div>
            )}
          </aside>
        </section>

        {!loading && error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error && data && profile ? (
          <>
            <section className={styles.metrics} aria-label="Reperes du profil">
              <article>
                <Star size={18} aria-hidden />
                <span>Note moyenne</span>
                <strong>{getRatingLabel(data.stats.average_rating)}</strong>
              </article>
              <article>
                <MessageCircle size={18} aria-hidden />
                <span>Avis clients</span>
                <strong>{data.stats.reviews_count}</strong>
              </article>
              <article>
                <Navigation size={18} aria-hidden />
                <span>Rayon</span>
                <strong>
                  {typeof profile.service_radius_km === "number"
                    ? `${profile.service_radius_km} km`
                    : "À préciser"}
                </strong>
              </article>
              <article>
                <BadgeCheck size={18} aria-hidden />
                <span>Expérience</span>
                <strong>{getExperienceLabel(profile.years_experience)}</strong>
              </article>
            </section>

            <section className={styles.contentGrid}>
              <article className={styles.panel}>
                <div className={styles.sectionTitle}>
                  <ShieldCheck size={20} aria-hidden />
                  <h2>Positionnement</h2>
                </div>
                <dl className={styles.definitionList}>
                  <div>
                    <dt>Statut</dt>
                    <dd>{isPro ? "Concierge PRO" : "Concierge"}</dd>
                  </div>
                  <div>
                    <dt>Ville</dt>
                    <dd>{profile.city || "Non renseignée"}</dd>
                  </div>
                  <div>
                    <dt>Zone</dt>
                    <dd>{profile.service_area || profile.city || "Non renseignée"}</dd>
                  </div>
                  <div>
                    <dt>Pays</dt>
                    <dd>{profile.country || "France"}</dd>
                  </div>
                </dl>
              </article>

              <article className={styles.panel}>
                <div className={styles.sectionTitle}>
                  <Euro size={20} aria-hidden />
                  <h2>Repères tarifaires</h2>
                </div>
                <dl className={styles.definitionList}>
                  <div>
                    <dt>Horaire</dt>
                    <dd>{formatAmount(profile.hourly_rate, "/ h")}</dd>
                  </div>
                  <div>
                    <dt>Mensuel</dt>
                    <dd>{formatAmount(profile.monthly_rate, "/ mois")}</dd>
                  </div>
                  <div>
                    <dt>Niveau</dt>
                    <dd>{formatExperienceLevelLabel(profile.experience_level)}</dd>
                  </div>
                </dl>
              </article>
            </section>

            <section className={styles.servicesSection}>
              <div className={styles.sectionTitle}>
                <MapPin size={20} aria-hidden />
                <h2>Services proposés</h2>
              </div>
              {services.length > 0 ? (
                <div className={styles.serviceList}>
                  {services.map((service) => (
                    <span key={service}>{service}</span>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>Services non renseignés pour le moment.</p>
              )}
            </section>

            <section className={styles.reviewsSection}>
              <div className={styles.sectionTitle}>
                <Star size={20} aria-hidden />
                <h2>Avis récents</h2>
              </div>

              {data.reviews.length === 0 ? (
                <p className={styles.emptyState}>Aucun avis publié pour le moment.</p>
              ) : (
                <div className={styles.reviewGrid}>
                  {data.reviews.map((review) => (
                    <article key={review.id} className={styles.reviewCard}>
                      <strong>
                        {typeof review.rating === "number"
                          ? `${review.rating} / 5`
                          : "Note non renseignée"}
                      </strong>
                      <p>{review.comment || "Avis publié sans commentaire."}</p>
                      <small>{formatDate(review.created_at)}</small>
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
