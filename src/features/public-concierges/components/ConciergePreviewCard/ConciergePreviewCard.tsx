"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge, Card, CardBody, CardFooter, Tag } from "@/components/ui";
import { CONCIERGE_CARD_COVER_OPTIONS, CONCIERGE_CARD_COVER_URLS } from "../../coverImages";
import styles from "./ConciergePreviewCard.module.scss";

export type ConciergePreviewCardProps = {
  id: string;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  displayName: string;
  city?: string | null;
  serviceArea?: string | null;
  services: string[];
  hourlyRate?: number | null;
  monthlyRate?: number | null;
  yearsExperience?: number | null;
  isPro?: boolean;
  averageRating?: number | null;
  reviewsCount?: number;
  latestReviewComment?: string | null;
  badgeLabel?: string;
  badgeVariant?: "neutral" | "gold" | "dark" | "success" | "warning" | "danger" | "info";
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

function formatMoney(value: number | null | undefined, suffix: string) {
  if (typeof value !== "number") return "Tarif sur demande";
  return `${value.toFixed(0)} EUR ${suffix}`;
}

function getLocationLabel(city?: string | null, serviceArea?: string | null) {
  return city || serviceArea || "France";
}

function cleanServiceLabel(value: string) {
  return value
    .replace(/[[\]"]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCleanServices(services: string[]) {
  return services
    .flatMap((service) => service.split(/[;,|\n\r]+/g))
    .map(cleanServiceLabel)
    .filter((service) => service.length > 0 && service.length <= 34);
}

function getFallbackVisual(id: string) {
  const visuals = [
    ...CONCIERGE_CARD_COVER_URLS,
  ];
  const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % visuals.length;

  return visuals[index];
}

function pickVisual(id: string, visuals: string[]) {
  const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % visuals.length;

  return visuals[index];
}

function getServiceVisual(id: string, services: string[]) {
  const proposition = services.join(" ").toLowerCase();

  if (
    proposition.includes("accueil") ||
    proposition.includes("check-in") ||
    proposition.includes("check-out")
  ) {
    return pickVisual(id, [
      CONCIERGE_CARD_COVER_OPTIONS[0].url,
      CONCIERGE_CARD_COVER_OPTIONS[5].url,
    ]);
  }
  if (
    proposition.includes("ménage") ||
    proposition.includes("menage") ||
    proposition.includes("clean")
  ) {
    return pickVisual(id, [
      CONCIERGE_CARD_COVER_OPTIONS[1].url,
      CONCIERGE_CARD_COVER_OPTIONS[2].url,
    ]);
  }
  if (proposition.includes("linge") || proposition.includes("blanch")) {
    return pickVisual(id, [
      CONCIERGE_CARD_COVER_OPTIONS[2].url,
      CONCIERGE_CARD_COVER_OPTIONS[1].url,
    ]);
  }
  if (
    proposition.includes("maintenance") ||
    proposition.includes("répar") ||
    proposition.includes("repar")
  ) {
    return pickVisual(id, [
      CONCIERGE_CARD_COVER_OPTIONS[3].url,
      CONCIERGE_CARD_COVER_OPTIONS[4].url,
    ]);
  }
  if (proposition.includes("jardin") || proposition.includes("piscin")) {
    return CONCIERGE_CARD_COVER_OPTIONS[4].url;
  }
  if (proposition.includes("photo")) {
    return CONCIERGE_CARD_COVER_OPTIONS[5].url;
  }
  if (proposition.includes("décor") || proposition.includes("decor")) {
    return CONCIERGE_CARD_COVER_OPTIONS[5].url;
  }
  if (proposition.includes("électric") || proposition.includes("electric")) {
    return CONCIERGE_CARD_COVER_OPTIONS[3].url;
  }
  if (proposition.includes("plomb")) {
    return CONCIERGE_CARD_COVER_OPTIONS[3].url;
  }
  return getFallbackVisual(id);
}

function getNameClassName(displayName: string) {
  if (displayName.length > 30) return styles.nameVeryLong;
  if (displayName.length > 22) return styles.nameLong;

  return "";
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

function ConciergeAvatar({ src, name }: { src?: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <div className={styles.avatar} aria-label={`Avatar de ${name}`}>
      {src && !hasError ? (
        <Image src={src} alt="" width={72} height={72} unoptimized onError={() => setHasError(true)} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function ConciergePreviewCard({
  id,
  avatarUrl,
  coverImageUrl,
  displayName,
  city,
  serviceArea,
  services,
  hourlyRate,
  monthlyRate,
  yearsExperience,
  isPro = false,
  averageRating,
  reviewsCount = 0,
  latestReviewComment,
  badgeLabel,
  badgeVariant,
  primaryAction,
  secondaryAction,
  className = "",
}: ConciergePreviewCardProps) {
  const resolvedBadgeLabel = badgeLabel ?? (isPro ? "PRO" : "Standard");
  const resolvedBadgeVariant = badgeVariant ?? (isPro ? "warning" : "neutral");
  const location = getLocationLabel(city, serviceArea);
  const ratingLabel =
    typeof averageRating === "number" ? `${averageRating.toFixed(1)} / 5` : "Sans avis";
  const experienceLabel =
    typeof yearsExperience === "number" ? `${yearsExperience} an(s)` : "Expérience non renseignée";
  const cleanServices = getCleanServices(services);
  const serviceVisual = coverImageUrl || getServiceVisual(id, cleanServices);
  const coverLabel = cleanServices.find((service) => service.length <= 26);

  return (
    <Card
      key={id}
      variant="large"
      className={[styles.card, className].filter(Boolean).join(" ")}
      interactive
    >
      <div className={styles.cover}>
        <Image src={serviceVisual} alt="" fill sizes="(max-width: 768px) 100vw, 380px" loading="eager" />
        {coverLabel ? <span>{coverLabel}</span> : null}
      </div>

      <div className={styles.header}>
        <div className={styles.identity}>
          <ConciergeAvatar src={avatarUrl} name={displayName} />
          <div>
            <h3 className={getNameClassName(displayName)}>{displayName}</h3>
            <p>{location}</p>
          </div>
        </div>
        <Badge variant={resolvedBadgeVariant}>{resolvedBadgeLabel}</Badge>
      </div>

      <CardBody>
        <div className={styles.meta}>
          <span>{ratingLabel}</span>
          <span>{reviewsCount} avis</span>
          <span>{experienceLabel}</span>
        </div>

        <div className={styles.pricing}>
          <span>{formatMoney(hourlyRate, "/ h")}</span>
          <span>{formatMoney(monthlyRate, "/ mois")}</span>
        </div>

        <div className={styles.tags}>
          {cleanServices.length > 0 ? (
            cleanServices.slice(0, 4).map((service) => (
              <Tag key={`${id}-${service}`} tone="category">
                {service}
              </Tag>
            ))
          ) : (
            <Tag className={styles.tagMuted}>Services non renseignés</Tag>
          )}
        </div>

        {latestReviewComment ? (
          <blockquote className={styles.quote}>&ldquo;{latestReviewComment}&rdquo;</blockquote>
        ) : null}
      </CardBody>

      {primaryAction || secondaryAction ? (
        <CardFooter className={styles.footer}>
          {primaryAction}
          {secondaryAction}
        </CardFooter>
      ) : null}
    </Card>
  );
}
