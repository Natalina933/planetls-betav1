"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
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

function formatMoney(value: number | null, suffix: string) {
  if (typeof value !== "number") return "Tarif sur demande";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

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
          throw new Error(payload?.error || "Impossible de charger les concierges recommandes.");
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
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Selection premium</span>
        <h2>Concierges recommandes</h2>
        <p>
          Une premiere vitrine de profils visibles publiquement, notes par leurs clients et prepares
          pour la mise en relation.
        </p>
      </div>

      {loading ? <p className={styles.info}>Chargement des recommandations...</p> : null}

      {!loading && items.length === 0 ? (
        <p className={styles.info}>
          Les recommandations apparaitront ici des que davantage de profils concierges publics
          seront completes.
        </p>
      ) : null}

      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h3>{item.display_name}</h3>
                <p>{item.city || item.service_area || "France"}</p>
              </div>
              <span className={item.is_pro ? styles.proBadge : styles.standardBadge}>
                {item.is_pro ? "PRO" : "Standard"}
              </span>
            </div>

            <div className={styles.meta}>
              <span>
                {typeof item.average_rating === "number"
                  ? `${item.average_rating.toFixed(1)} / 5`
                  : "Sans avis"}
              </span>
              <span>{item.reviews_count} avis</span>
              <span>
                {typeof item.years_experience === "number"
                  ? `${item.years_experience} an(s)`
                  : "Experience non renseignee"}
              </span>
            </div>

            <div className={styles.pricing}>
              <span>{formatMoney(item.hourly_rate, "/ h")}</span>
              <span>{formatMoney(item.monthly_rate, "/ mois")}</span>
            </div>

            <div className={styles.tags}>
              {item.services.length > 0 ? (
                item.services.slice(0, 4).map((service) => (
                  <span key={`${item.id}-${service}`} className={styles.tag}>
                    {service}
                  </span>
                ))
              ) : (
                <span className={styles.tagMuted}>Services non renseignes</span>
              )}
            </div>

            {item.latest_review_comment ? (
              <blockquote className={styles.quote}>
                “{item.latest_review_comment}”
              </blockquote>
            ) : null}

            <div className={styles.actions}>
              <Link href={`/concierges/${item.id}`} className={styles.primaryLink}>
                Voir le profil
              </Link>
              <Link href="/dashboard/owner/concierges" className={styles.secondaryLink}>
                Trouver un concierge
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
