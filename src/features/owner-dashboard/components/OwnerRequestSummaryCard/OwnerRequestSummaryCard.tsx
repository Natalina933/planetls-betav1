import type { KeyboardEvent, ReactNode } from "react";
import { Card, CardBody, CardHeader, Tag } from "@/components/ui";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import styles from "./OwnerRequestSummaryCard.module.scss";

type RequestFact = {
  label: string;
  value: ReactNode;
};

export type OwnerRequestSummaryCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  status?: string | null;
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
};

export function OwnerRequestSummaryCard({
  eyebrow = "Demande",
  title,
  subtitle,
  status,
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
}: OwnerRequestSummaryCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || !onOpen) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  };

  return (
    <Card
      className={[styles.card, interactive ? styles.clickable : "", className].filter(Boolean).join(" ")}
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
            {status ? <WorkflowStatusBadge value={status} /> : null}
            {urgency ? (
              <Tag tone="gold" onClick={(event) => event.stopPropagation()}>
                Urgent
              </Tag>
            ) : null}
          </div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
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

      <CardBody className={styles.card}>
        {primaryFacts.length > 0 ? (
          <div className={styles.facts}>
            {primaryFacts.map((fact) => (
              <div key={fact.label} className={styles.factCard}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {secondaryFacts.length > 0 ? (
          <div className={styles.facts}>
            {secondaryFacts.map((fact) => (
              <div key={fact.label} className={styles.factCard}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        ) : null}

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

        {description ? <p className={styles.description}>{description}</p> : null}

        {helperTexts.length > 0 ? (
          <div className={styles.helperStack}>
            {helperTexts.map((text, index) => (
              <p key={index} className={styles.helperText}>
                {text}
              </p>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
