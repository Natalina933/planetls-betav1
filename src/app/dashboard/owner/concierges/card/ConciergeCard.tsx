"use client";

import { conciergeProfileHref } from "@/features/owner-concierges/lib/searchNavigation";
import { memo } from "react";
import { ConciergeServices } from "@/features/owner-concierges/components/ConciergeServices";
import { presentConciergeServices, countConciergeServiceMatches } from "@/features/owner-concierges/lib/servicePresentation";
import { Check, MapPin, Star } from "lucide-react";
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
  isConsulted?: boolean;
  profileReturnTo?: string;
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
  const matchedCount = countConciergeServiceMatches(filters.selectedServices, item.services);
  const serviceCount = presentConciergeServices(item.services).services.length;

  if (matchedCount > 0) {
    highlights.push(`${matchedCount} service${matchedCount > 1 ? "s" : ""} demandé${matchedCount > 1 ? "s" : ""}`);
  } else if (serviceCount > 0) {
    highlights.push(`${serviceCount} service${serviceCount > 1 ? "s" : ""} proposé${item.services.length > 1 ? "s" : ""}`);
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

function getProfessionalType(item: ConciergeSearchRow) {
  return item.professional_type === "provider" ? "Artisan ou prestataire" : "Concierge";
}

function ConciergeCardComponent({
  item,
  index,
  isSelected,
  isConsulted = false,
  profileReturnTo,
  filters,
  onToggle,
  mode = "standard",
  stayActionLabel = "Demander cette prestation",
}: ConciergeCardProps) {
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
      id={`concierge-result-${item.id}`}
      tabIndex={-1}
      role="article"
      aria-label={`Profil professionnel ${item.display_name}`}
      className={`${styles.stayCard} ${isSelected ? styles.stayCardSelected : ""}`}
      style={{ ["--card-index" as string]: String(index) }}
    >
      {isConsulted ? <p role="status">Profil consulté sur la carte</p> : null}
      <div className={styles.stayCardHead}>
        <ConciergeAvatar src={item.avatar_url} alt={item.display_name} width={64} height={64} className={styles.stayAvatar} />
        <div className={styles.stayIdentity}>
          <h3>{item.display_name}</h3>
          <span className={styles.typeBadge}>{getProfessionalType(item)}</span>
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
        <ConciergeServices values={item.services} compact />
        {item.is_available_now === true ? <p className={styles.availability}>Urgences acceptées selon les informations déclarées</p> : null}

        {(typeof item.hourly_rate === "number" || typeof item.monthly_rate === "number" ||
          (typeof item.average_rating === "number" && item.reviews_count > 0)) ? (
          <div className={styles.professionalFacts} aria-label="Tarifs et avis renseignés">
            {typeof item.hourly_rate === "number" ? <span>{item.hourly_rate.toLocaleString("fr-FR")} € / h</span> : null}
            {typeof item.monthly_rate === "number" ? <span>{item.monthly_rate.toLocaleString("fr-FR")} € / mois</span> : null}
            {typeof item.average_rating === "number" && item.reviews_count > 0 ? (
              <span><Star size={14} aria-hidden="true" />{item.average_rating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 5 · {item.reviews_count} avis</span>
            ) : null}
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
        {item.professional_type !== "provider" ? <ButtonLink href={conciergeProfileHref(item.id, profileReturnTo)} variant="secondary" size="sm">
          Voir le profil
        </ButtonLink> : <span>Fiche publique à venir</span>}
        {item.professional_type !== "provider" ? <Button
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
        </Button> : null}
      </div>
    </article>
  );
}

export const ConciergeCard = memo(ConciergeCardComponent);
