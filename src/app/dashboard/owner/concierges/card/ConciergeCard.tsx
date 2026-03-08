"use client";

import { memo } from "react";
import Link from "next/link";
import styles from "./ConciergeCard.module.scss";
import type { ConciergeSearchRow } from "../conciergeSearchTypes";
import {
  formatAmount,
  formatReviewDate,
  getAvailabilityLabel,
  getConciergeLocation,
  getPrimaryActionLabel,
} from "../conciergeSearchUtils";
import { ConciergeAvatar } from "../ConciergeAvatar";

type ConciergeCardProps = {
  item: ConciergeSearchRow;
  index: number;
  isSelected: boolean;
  onToggle: (itemId: string) => void;
};

function ConciergeCardComponent({ item, index, isSelected, onToggle }: ConciergeCardProps) {
  return (
    <article
      role="article"
      aria-label={`Profil concierge ${item.display_name}`}
      className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
      style={{ ["--card-index" as string]: String(index) }}
    >
      <div className={styles.cardHead}>
        <div className={styles.cardIdentityWrap}>
          <div className={styles.avatarFrame}>
            <ConciergeAvatar
              src={item.avatar_url}
              alt={
                item.avatar_url
                  ? `Avatar de ${item.display_name}`
                  : `Avatar par defaut de ${item.display_name}`
              }
              className={styles.avatarImage}
              width={88}
              height={88}
            />
          </div>
          <div className={styles.cardIdentity}>
            <h2>{item.display_name}</h2>
            <p>{getConciergeLocation(item)}</p>
          </div>
        </div>
        <div className={styles.badgesCol}>
          <span className={item.is_available_now ? styles.availableBadge : styles.standardBadge}>
            {getAvailabilityLabel(item)}
          </span>
          <span className={item.is_pro ? styles.proBadge : styles.standardBadge}>
            {item.is_pro ? "PRO" : "Standard"}
          </span>
          <span className={styles.ratingBadge}>
            {typeof item.average_rating === "number" ? `${item.average_rating.toFixed(1)} / 5` : "Sans avis"}
          </span>
        </div>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Experience</span>
          <strong>
            {typeof item.years_experience === "number"
              ? `${item.years_experience} ans`
              : item.experience_level || "Non renseignee"}
          </strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Rayon</span>
          <strong>
            {typeof item.service_radius_km === "number" ? `${item.service_radius_km} km` : "Non renseigne"}
          </strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Avis</span>
          <strong>{item.reviews_count}</strong>
        </div>
      </div>

      <div className={styles.pricing}>
        <div className={styles.priceCard}>
          <span className={styles.kpiLabel}>Tarif horaire</span>
          <strong>{formatAmount(item.hourly_rate, "/ h")}</strong>
        </div>
        <div className={styles.priceCard}>
          <span className={styles.kpiLabel}>Tarif mensuel</span>
          <strong>{formatAmount(item.monthly_rate, "/ mois")}</strong>
        </div>
      </div>

      {item.property_types && item.property_types.length > 0 ? (
        <div className={styles.tags}>
          {item.property_types.map((propertyType) => (
            <span key={`${item.id}-property-${propertyType}`} className={styles.propertyTag}>
              {propertyType}
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.tags}>
        {item.services.length > 0 ? (
          item.services.slice(0, 6).map((serviceLabel) => (
            <span key={`${item.id}-${serviceLabel}`} className={styles.tag}>
              {serviceLabel}
            </span>
          ))
        ) : (
          <span className={styles.tagMuted}>Services non renseignes</span>
        )}
      </div>

      {item.latest_review_comment ? (
        <div className={styles.reviewSnippet}>
          <strong>Avis recent</strong>
          <p>{item.latest_review_comment}</p>
          {item.latest_review_at ? <small>{formatReviewDate(item.latest_review_at)}</small> : null}
        </div>
      ) : null}

      <div className={styles.cardActions}>
        <Link href={`/concierges/${item.id}`} className={styles.secondaryBtn}>
          Voir le profil
        </Link>
        <button
          type="button"
          className={isSelected ? styles.destructiveBtn : styles.primaryBtn}
          aria-pressed={isSelected}
          aria-label={`${isSelected ? "Retirer" : "Selectionner"} ${item.display_name}`}
          onClick={() => onToggle(item.id)}
        >
          {getPrimaryActionLabel(isSelected, item.is_available_now)}
        </button>
      </div>
    </article>
  );
}

export const ConciergeCard = memo(ConciergeCardComponent);
