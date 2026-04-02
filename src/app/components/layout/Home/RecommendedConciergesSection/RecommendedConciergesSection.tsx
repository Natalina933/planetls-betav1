"use client";

import React, { useEffect, useState } from "react";
import { ButtonLink, SectionIntro } from "@/components/ui";
import { ConciergePreviewCard } from "@/features/public-concierges";
import styles from "./RecommendedConciergesSection.module.scss";

type RecommendedConcierge = {
  id: string;
  display_name: string;
  city: string | null;
  service_area: string | null;
  services: string[];
  hourly_rate: number | null;
  monthly_rate: number | null;
  years_experience: number | null;
  is_pro: boolean;
  average_rating: number | null;
  reviews_count: number;
  latest_review_comment: string | null;
};

export default function RecommendedConciergesSection() {
  const [items, setItems] = useState<RecommendedConcierge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      try {
        setLoading(true);
        const response = await fetch("/api/profiles/public-concierges", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger les concierges recommandés.");
        }

        if (!cancelled) {
          setItems(Array.isArray(payload?.items) ? payload.items : []);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="concierges-recommandes" className={styles.section}>
      <div className={styles.header}>
        <SectionIntro
          eyebrow="Profils visibles"
          title="Conciergeries à découvrir"
          description="Une première sélection de profils visibles publiquement pour aider les propriétaires à identifier les bons partenaires."
        />
      </div>

      {loading ? <p className={styles.info}>Chargement des recommandations...</p> : null}

      {!loading && items.length === 0 ? (
        <p className={styles.info}>
          Les profils visibles apparaîtront ici dès que davantage de fiches publiques seront
          complétées.
        </p>
      ) : null}

      <div className={styles.grid}>
        {items.map((item) => (
          <ConciergePreviewCard
            key={item.id}
            id={item.id}
            displayName={item.display_name}
            city={item.city}
            serviceArea={item.service_area}
            services={item.services}
            hourlyRate={item.hourly_rate}
            monthlyRate={item.monthly_rate}
            yearsExperience={item.years_experience}
            isPro={item.is_pro}
            averageRating={item.average_rating}
            reviewsCount={item.reviews_count}
            latestReviewComment={item.latest_review_comment}
            className={styles.card}
            primaryAction={
              <ButtonLink href={`/concierges/${item.id}`} variant="primary" size="sm">
                Voir le profil
              </ButtonLink>
            }
            secondaryAction={
              <ButtonLink href="/dashboard/owner/concierges" variant="secondary" size="sm">
                Voir plus de profils
              </ButtonLink>
            }
          />
        ))}
      </div>
    </section>
  );
}
