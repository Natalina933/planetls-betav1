"use client";

import { memo } from "react";
import { Badge, Button, ButtonLink, Tag } from "@/components/ui";
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
        <Badge className={styles.cardSelectionLabel}>{isSelected ? "Selectionne" : "Disponible"}</Badge>
      </div>

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
            <div className={styles.identityTopline}>
              <h2>{item.display_name}</h2>
              {typeof item.average_rating === "number" ? (
                <Badge className={styles.inlineRating}>{item.average_rating.toFixed(1)} / 5</Badge>
              ) : null}
            </div>
            <p>{getConciergeLocation(item)}</p>
            <div className={styles.identityMeta}>
              <Tag className={styles.metaPill}>{item.reviews_count} avis</Tag>
              <Tag className={styles.metaPill}>
                {typeof item.service_radius_km === "number"
                  ? `${item.service_radius_km} km autour`
                  : "Zone a preciser"}
              </Tag>
            </div>
          </div>
        </div>
        <div className={styles.badgesCol}>
          <Badge className={item.is_available_now ? styles.availableBadge : styles.standardBadge}>
            {getAvailabilityLabel(item)}
          </Badge>
          <Badge className={item.is_pro ? styles.proBadge : styles.standardBadge}>
            {item.is_pro ? "PRO" : "Standard"}
          </Badge>
          <Badge className={styles.ratingBadge}>
            {typeof item.average_rating === "number" ? "Avis verifies" : "Sans avis"}
          </Badge>
        </div>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Experience</span>
          <strong>
            {typeof item.years_experience === "number"
              ? `${item.years_experience} ans`
              : item.experience_level || "Non renseignée"}
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
        <div className={styles.tagGroup}>
          <p className={styles.tagGroupLabel}>Biens couverts</p>
          <div className={styles.tags}>
            {item.property_types.map((propertyType) => (
              <Tag key={`${item.id}-property-${propertyType}`} className={styles.propertyTag}>
                {propertyType}
              </Tag>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.tagGroup}>
        <div className={styles.tagGroupHead}>
          <p className={styles.tagGroupLabel}>Services cles</p>
          {hiddenServicesCount > 0 ? <span className={styles.tagGroupCount}>+{hiddenServicesCount}</span> : null}
        </div>
        <div className={styles.tags}>
          {item.services.length > 0 ? (
            visibleServices.map((serviceLabel) => (
              <Tag key={`${item.id}-${serviceLabel}`} className={styles.tag}>
                {serviceLabel}
              </Tag>
            ))
          ) : (
            <Tag className={styles.tagMuted}>Services non renseignes</Tag>
          )}
        </div>
      </div>

      {item.latest_review_comment ? (
        <div className={styles.reviewSnippet}>
          <strong>Avis recent</strong>
          <p>{item.latest_review_comment}</p>
          {item.latest_review_at ? <small>{formatReviewDate(item.latest_review_at)}</small> : null}
        </div>
      ) : null}

      <div className={styles.cardActions}>
        <ButtonLink href={`/concierges/${item.id}`} variant="secondary" className={styles.secondaryBtn}>
          Voir le profil
        </ButtonLink>
        <Button
          className={isSelected ? styles.destructiveBtn : styles.primaryBtn}
          aria-pressed={isSelected}
          aria-label={`${isSelected ? "Retirer" : "Selectionner"} ${item.display_name}`}
          onClick={() => onToggle(item.id)}
        >
          {getPrimaryActionLabel(isSelected, item.is_available_now)}
        </Button>
      </div>
    </article>
  );
}

export const ConciergeCard = memo(ConciergeCardComponent);
