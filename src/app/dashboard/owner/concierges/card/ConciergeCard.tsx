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
  const visibleServices = item.services.slice(0, 5);
  const hiddenServicesCount = Math.max(item.services.length - visibleServices.length, 0);

  return (
    <article
      role="article"
      aria-label={`Profil concierge ${item.display_name}`}
      className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
      style={{ ["--card-index" as string]: String(index) }}
    >
      <div className={styles.cardSelectionRail}>
        <span className={styles.cardSelectionLabel}>{isSelected ? "Sélectionné" : "Disponible"}</span>
      </div>

      <div className={styles.cardHead}>
        <div className={styles.cardIdentityWrap}>
          <div className={styles.avatarFrame}>
            <ConciergeAvatar
              src={item.avatar_url}
              alt={
                item.avatar_url
                  ? `Avatar de ${item.display_name}`
                  : `Avatar par défaut de ${item.display_name}`
              }
              className={styles.avatarImage}
              width={88}
              height={88}
            />
          </div>
          <div className={styles.cardIdentity}>
            <div className={styles.identityTopline}>
              <h2>{item.display_name}</h2>
              {typeof item.average_rating === "number" ? (
                <span className={styles.inlineRating}>{item.average_rating.toFixed(1)} / 5</span>
              ) : null}
            </div>
            <p>{getConciergeLocation(item)}</p>
            <div className={styles.identityMeta}>
              <span className={styles.metaPill}>{item.reviews_count} avis</span>
              <span className={styles.metaPill}>
                {typeof item.service_radius_km === "number"
                  ? `${item.service_radius_km} km autour`
                  : "Zone à préciser"}
              </span>
            </div>
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
            {typeof item.average_rating === "number" ? "Avis vérifiés" : "Sans avis"}
          </span>
        </div>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Expérience</span>
          <strong>
            {typeof item.years_experience === "number"
              ? `${item.years_experience} ans`
              : item.experience_level || "Non renseignée"}
          </strong>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Rayon</span>
          <strong>
            {typeof item.service_radius_km === "number" ? `${item.service_radius_km} km` : "Non renseigné"}
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
        <div className={styles.tagGroup}>
          <p className={styles.tagGroupLabel}>Biens couverts</p>
          <div className={styles.tags}>
            {item.property_types.map((propertyType) => (
              <span key={`${item.id}-property-${propertyType}`} className={styles.propertyTag}>
                {propertyType}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.tagGroup}>
        <div className={styles.tagGroupHead}>
          <p className={styles.tagGroupLabel}>Services clés</p>
          {hiddenServicesCount > 0 ? <span className={styles.tagGroupCount}>+{hiddenServicesCount}</span> : null}
        </div>
        <div className={styles.tags}>
          {item.services.length > 0 ? (
            visibleServices.map((serviceLabel) => (
              <span key={`${item.id}-${serviceLabel}`} className={styles.tag}>
                {serviceLabel}
              </span>
            ))
          ) : (
            <span className={styles.tagMuted}>Services non renseignés</span>
          )}
        </div>
      </div>

      {item.latest_review_comment ? (
        <div className={styles.reviewSnippet}>
          <strong>Avis récent</strong>
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
          aria-label={`${isSelected ? "Retirer" : "Sélectionner"} ${item.display_name}`}
          onClick={() => onToggle(item.id)}
        >
          {getPrimaryActionLabel(isSelected, item.is_available_now)}
        </button>
      </div>
    </article>
  );
}

export const ConciergeCard = memo(ConciergeCardComponent);
