"use client";

import { memo } from "react";
import { Button, ButtonLink } from "@/components/ui";
import { ConciergeAvatar } from "@/features/owner-concierges/components/ConciergeAvatar";
import { ConciergePreviewCard } from "@/features/public-concierges";
import type { ConciergeSearchRow } from "../conciergeSearchTypes";
import { getPrimaryActionLabel } from "../conciergeSearchUtils";
import type { OwnerConciergeSearchFilters } from "../searchHelpers";
import styles from "./ConciergeCard.module.scss";

type ConciergeCardProps = {
  item: ConciergeSearchRow;
  index: number;
  isSelected: boolean;
  filters: OwnerConciergeSearchFilters;
  onToggle: (itemId: string) => void;
  mode?: "standard" | "stay";
  stayActionLabel?: string;
};

const normalizeMatchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function getMatchHighlights(item: ConciergeSearchRow, filters: OwnerConciergeSearchFilters) {
  const highlights: string[] = [];
  const serviceSet = new Set(item.services.map(normalizeMatchValue));
  const matchedServices = filters.selectedServices.filter((service) =>
    serviceSet.has(normalizeMatchValue(service)),
  );

  if (matchedServices.length > 0) {
    highlights.push(
      `${matchedServices.length} service${matchedServices.length > 1 ? "s" : ""} demandé${
        matchedServices.length > 1 ? "s" : ""
      }`,
    );
  } else if (item.services.length > 0) {
    highlights.push(`${item.services.length} service${item.services.length > 1 ? "s" : ""} proposé${item.services.length > 1 ? "s" : ""}`);
  }

  if (filters.city.trim() && [item.city, item.service_area, item.location].some((value) =>
    value ? normalizeMatchValue(value).includes(normalizeMatchValue(filters.city)) : false,
  )) {
    highlights.push("Zone compatible");
  } else if (item.city || item.service_area || item.location) {
    highlights.push("Zone renseignée");
  }

  if (item.is_available_now) {
    highlights.push("Disponible maintenant");
  } else if (item.is_pro) {
    highlights.push("Profil PRO");
  }

  if (typeof item.average_rating === "number" && item.reviews_count > 0) {
    highlights.push(`${item.average_rating.toFixed(1)} / 5`);
  } else if (typeof item.hourly_rate === "number" || typeof item.monthly_rate === "number") {
    highlights.push("Tarif visible");
  }

  return highlights;
}

function getLocation(item: ConciergeSearchRow) {
  return [item.city, item.service_area, item.location].find((value) => typeof value === "string" && value.trim()) ?? null;
}

function getPrimaryServices(item: ConciergeSearchRow) {
  return item.services
    .flatMap((service) => service.split(/[;,|\n\r]+/g))
    .map((service) => service.replace(/[[\]"]/g, "").replace(/[()]/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function getProfessionalType(item: ConciergeSearchRow) {
  return item.experience_level || item.services[0] || "Professionnel PlanetLS";
}

function ConciergeCardComponent({
  item,
  index,
  isSelected,
  filters,
  onToggle,
  mode = "standard",
  stayActionLabel = "Demander cette prestation",
}: ConciergeCardProps) {
  if (mode === "stay") {
    const services = getPrimaryServices(item);
    const visibleServices = services.slice(0, 3);
    const hiddenServices = Math.max(services.length - visibleServices.length, 0);
    const location = getLocation(item);

    return (
      <article
        role="article"
        aria-label={`Profil professionnel ${item.display_name}`}
        className={`${styles.stayCard} ${isSelected ? styles.stayCardSelected : ""}`}
        style={{ ["--card-index" as string]: String(index) }}
      >
        <div className={styles.stayCardHead}>
          <ConciergeAvatar
            src={item.avatar_url}
            alt={item.display_name}
            width={54}
            height={54}
            className={styles.stayAvatar}
          />
          <div className={styles.stayIdentity}>
            <h3>{item.display_name}</h3>
            <p>{getProfessionalType(item)}</p>
            {location ? <span>{location}</span> : null}
          </div>
        </div>

        {visibleServices.length > 0 ? (
          <div className={styles.stayServices} aria-label="Services principaux">
            {visibleServices.map((service) => (
              <span key={`${item.id}-${service}`}>{service}</span>
            ))}
            {hiddenServices > 0 ? <span>+{hiddenServices}</span> : null}
          </div>
        ) : null}

        <div className={styles.stayActions}>
          <ButtonLink href={`/concierges/${item.id}`} variant="secondary" size="sm">
            Voir le profil
          </ButtonLink>
          <Button
            aria-pressed={isSelected}
            aria-label={`${isSelected ? "Retirer" : "Sélectionner"} ${item.display_name}`}
            onClick={() => onToggle(item.id)}
          >
            {isSelected ? "Sélectionné" : stayActionLabel}
          </Button>
        </div>
      </article>
    );
  }

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
        matchHighlights={getMatchHighlights(item, filters)}
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
