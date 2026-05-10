import type { KeyboardEvent, ReactNode } from "react";
import { BriefcaseBusiness, CalendarClock, MessageSquareQuote, Sparkles, Tags } from "lucide-react";
import { Card, CardBody, CardHeader, Tag } from "@/components/ui";
import { RequestStatusBadge } from "@/components/ui";
import styles from "./OwnerRequestSummaryCard.module.scss";

type RequestFact = {
  label: ReactNode;
  value: ReactNode;
};

export type OwnerRequestSummaryCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  status?: string | null;
  workflowStatus?: string | null;
  missionStatus?: string | null;
  hasMission?: boolean;
  urgency?: boolean;
  primaryFacts: RequestFact[];
  secondaryFacts?: RequestFact[];
  services?: string[];
  emptyServicesLabel?: string;
  description?: string | null;
  helperTexts?: ReactNode[];
  actions?: ReactNode;
  className?: string;
  interactive?: boolean;
  onOpen?: () => void;
  children?: ReactNode;
};

export function OwnerRequestSummaryCard({
  eyebrow,
  title,
  subtitle,
  status,
  workflowStatus,
  missionStatus,
  hasMission = false,
  urgency = false,
  primaryFacts,
  secondaryFacts = [],
  services = [],
  emptyServicesLabel = "Services à préciser",
  description,
  helperTexts = [],
  actions,
  className = "",
  interactive = false,
  onOpen,
  children,
}: OwnerRequestSummaryCardProps) {
  const [metaText, ...responseTexts] = helperTexts;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || !onOpen) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  };

  return (
    <Card
      className={[styles.card, interactive ? styles.clickable : "", className].filter(Boolean).join(" ")}
      variant="large"
      tone="elevated"
      interactive={interactive}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? "link" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <CardHeader className={styles.header}>
        <div className={styles.heading}>
          <div className={styles.statusLine}>
            {(status || workflowStatus || hasMission) ? (
              <RequestStatusBadge
                workflowStatus={workflowStatus}
                serviceRequestStatus={status}
                missionStatus={missionStatus}
                hasMission={hasMission}
              />
            ) : null}
            {urgency ? (
              <Tag tone="gold" onClick={(event) => event.stopPropagation()}>
                Urgent
              </Tag>
            ) : null}
          </div>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon} aria-hidden="true">
              <BriefcaseBusiness size={18} />
            </span>
            <h3>{title}</h3>
          </div>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        {actions ? (
          <div
            className={styles.actions}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </CardHeader>

      <CardBody className={styles.body}>
        {primaryFacts.length > 0 ? (
          <div className={styles.primaryFacts}>
            {primaryFacts.map((fact, index) => (
              <div key={`primary-${index}`} className={styles.factCard}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {secondaryFacts.length > 0 ? (
          <div className={styles.secondaryFacts}>
            {secondaryFacts.map((fact, index) => (
              <div key={`secondary-${index}`} className={styles.secondaryFactCard}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.infoStack}>
          <div className={styles.servicesBlock}>
            <p className={styles.sectionLabel}>
              <Tags size={14} aria-hidden="true" />
              Services demandes
            </p>
            <div className={styles.services}>
              {services.length > 0 ? (
                services.map((service) => (
                  <Tag key={service} tone="status" onClick={(event) => event.stopPropagation()}>
                    {service}
                  </Tag>
                ))
              ) : (
                <Tag tone="neutral" onClick={(event) => event.stopPropagation()}>
                  {emptyServicesLabel}
                </Tag>
              )}
            </div>
          </div>

          {description ? <p className={styles.description}>{description}</p> : null}

          {metaText ? (
            <p className={styles.metaText}>
              <CalendarClock size={14} aria-hidden="true" />
              {metaText}
            </p>
          ) : null}

          {responseTexts.length > 0 ? (
            <div className={styles.responsesBlock}>
              <p className={styles.sectionLabel}>
                <MessageSquareQuote size={14} aria-hidden="true" />
                Reponses des concierges
              </p>
              <div className={styles.responseList}>
                {responseTexts.map((text, index) => (
                  <p key={index} className={styles.responseItem}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {children ? (
          <div className={styles.extraContent}>
            <p className={styles.sectionLabel}>
              <Sparkles size={14} aria-hidden="true" />
              Synthese rapide
            </p>
            {children}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
