"use client";

import { memo } from "react";
import { Check, MapPin } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { ConciergeAvatar } from "@/features/owner-concierges/components/ConciergeAvatar";
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
  const matchedServices = filters.selectedServices.filter((service) => serviceSet.has(normalizeMatchValue(service)));

  if (matchedServices.length > 0) {
    highlights.push(`${matchedServices.length} service${matchedServices.length > 1 ? "s" : ""} demandé${matchedServices.length > 1 ? "s" : ""}`);
  } else if (item.services.length > 0) {
    highlights.push(`${item.services.length} service${item.services.length > 1 ? "s" : ""} proposé${item.services.length > 1 ? "s" : ""}`);
  }

  if (
    filters.city.trim() &&
    [item.city, item.service_area, item.location].some((value) =>
      value ? normalizeMatchValue(value).includes(normalizeMatchValue(filters.city)) : false,
    )
  ) {
    highlights.push("Zone compatible");
  } else if (item.city || item.service_area || item.location) {
    highlights.push("Zone renseignée");
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
  return item.experience_level || "Concierge indépendante";
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
  const services = getPrimaryServices(item);
  const visibleServices = services.slice(0, 4);
  const hiddenServices = Math.max(services.length - visibleServices.length, 0);
  const location = getLocation(item);
  const highlights = mode === "standard" ? getMatchHighlights(item, filters).slice(0, 1) : [];
  const primaryLabel = mode === "stay" ? stayActionLabel : getPrimaryActionLabel(isSelected, item.is_available_now);
  const zoneLabel =
    typeof item.service_radius_km === "number" && item.service_radius_km > 0
      ? `Zone d'intervention : ${item.service_radius_km} km`
      : item.service_area
        ? `Zone : ${item.service_area}`
        : null;

  return (
    <article
      role="article"
      aria-label={`Profil professionnel ${item.display_name}`}
      className={`${styles.stayCard} ${isSelected ? styles.stayCardSelected : ""}`}
      style={{ ["--card-index" as string]: String(index) }}
    >
      <div className={styles.stayCardHead}>
        <ConciergeAvatar src={item.avatar_url} alt={item.display_name} width={112} height={112} className={styles.stayAvatar} />
        <div className={styles.stayIdentity}>
          <h3>{item.display_name}</h3>
          <p>{getProfessionalType(item)}</p>
          <div className={styles.stayMeta}>
            {location ? (
              <span>
                <MapPin size={14} aria-hidden="true" />
                {location}
              </span>
            ) : null}
            {zoneLabel ? <span>{zoneLabel}</span> : null}
          </div>
        </div>
      </div>

      <div className={styles.stayBody}>
        {visibleServices.length > 0 ? (
          <div className={styles.stayServices} aria-label="Services principaux">
            {visibleServices.map((service) => (
              <span key={`${item.id}-${service}`}>{service}</span>
            ))}
            {hiddenServices > 0 ? <span>+{hiddenServices} services</span> : null}
          </div>
        ) : null}

        {highlights.length > 0 ? (
          <div className={styles.matchHighlights} aria-label="Correspondances avec la recherche">
            {highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        ) : null}

        {typeof item.years_experience === "number" && item.years_experience > 0 ? (
          <p className={styles.stayStat}>
            {item.years_experience} an{item.years_experience > 1 ? "s" : ""} d'expérience renseignée
          </p>
        ) : null}
      </div>

      <div className={styles.stayActions}>
        <ButtonLink href={`/concierges/${item.id}`} variant="secondary" size="sm">
          Voir le profil
        </ButtonLink>
        <Button
          aria-pressed={isSelected}
          aria-label={`${isSelected ? "Retirer" : "Sélectionner"} ${item.display_name}`}
          onClick={() => onToggle(item.id)}
          className={isSelected ? styles.selectedAction : styles.primaryAction}
        >
          {isSelected ? (
            <>
              <Check size={16} aria-hidden="true" />
              Sélectionnée
            </>
          ) : (
            primaryLabel
          )}
        </Button>
      </div>
    </article>
  );
}

export const ConciergeCard = memo(ConciergeCardComponent);
