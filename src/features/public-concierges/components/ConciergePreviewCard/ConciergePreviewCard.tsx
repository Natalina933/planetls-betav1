import type { ReactNode } from "react";
import { Badge, Card, CardBody, CardFooter, CardHeader, Tag } from "@/components/ui";
import styles from "./ConciergePreviewCard.module.scss";

type ConciergePreviewCardProps = {
  id: string;
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

export function ConciergePreviewCard({
  id,
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

  return (
    <Card key={id} variant="large" className={className} interactive>
      <CardHeader>
        <div>
          <h3>{displayName}</h3>
          <p>{city || serviceArea || "France"}</p>
        </div>
        <Badge variant={resolvedBadgeVariant}>{resolvedBadgeLabel}</Badge>
      </CardHeader>

      <CardBody>
        <div className={styles.meta}>
          <span>
            {typeof averageRating === "number" ? `${averageRating.toFixed(1)} / 5` : "Sans avis"}
          </span>
          <span>{reviewsCount} avis</span>
          <span>
            {typeof yearsExperience === "number"
              ? `${yearsExperience} an(s)`
              : "Expérience non renseignée"}
          </span>
        </div>

        <div className={styles.pricing}>
          <span>{formatMoney(hourlyRate, "/ h")}</span>
          <span>{formatMoney(monthlyRate, "/ mois")}</span>
        </div>

        <div className={styles.tags}>
          {services.length > 0 ? (
            services.slice(0, 4).map((service) => (
              <Tag key={`${id}-${service}`} tone="category">
                {service}
              </Tag>
            ))
          ) : (
            <Tag className={styles.tagMuted}>Services non renseignés</Tag>
          )}
        </div>

        {latestReviewComment ? <blockquote className={styles.quote}>"{latestReviewComment}"</blockquote> : null}
      </CardBody>

      {primaryAction || secondaryAction ? (
        <CardFooter>
          {primaryAction}
          {secondaryAction}
        </CardFooter>
      ) : null}
    </Card>
  );
}
