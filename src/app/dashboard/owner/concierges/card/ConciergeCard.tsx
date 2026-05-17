"use client";

import { memo } from "react";
import { Button, ButtonLink } from "@/components/ui";
import { ConciergePreviewCard } from "@/features/public-concierges";
import type { ConciergeSearchRow } from "../conciergeSearchTypes";
import { getPrimaryActionLabel } from "../conciergeSearchUtils";
import styles from "./ConciergeCard.module.scss";

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
      className={`${styles.sharedCardShell} ${isSelected ? styles.sharedCardSelected : ""}`}
      style={{ ["--card-index" as string]: String(index) }}
    >
      <ConciergePreviewCard
        id={item.id}
        avatarUrl={item.avatar_url}
        coverImageUrl={item.image}
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
        badgeLabel={item.is_available_now ? "Disponible" : "Standard"}
        badgeVariant={item.is_available_now ? "success" : item.is_pro ? "warning" : "neutral"}
        className={styles.sharedCard}
        primaryAction={
          <ButtonLink href={`/concierges/${item.id}`} variant="secondary" size="sm">
            Voir le profil
          </ButtonLink>
        }
        secondaryAction={
          <Button
            aria-pressed={isSelected}
            aria-label={`${isSelected ? "Retirer" : "Sélectionner"} ${item.display_name}`}
            onClick={() => onToggle(item.id)}
          >
            {getPrimaryActionLabel(isSelected, item.is_available_now)}
          </Button>
        }
      />
    </article>
  );
}

export const ConciergeCard = memo(ConciergeCardComponent);
