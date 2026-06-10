import type { CSSProperties, ReactNode } from "react";
import { Card, CardBody } from "@/components/ui";
import { RequestStatusBadge } from "@/components/ui";
import { WorkflowTimeline, type WorkflowTimelineStep } from "@/features/service-requests";
import styles from "./OwnerQuoteResponseCard.module.scss";

type QuoteFact = {
  label: string;
  value: ReactNode;
};

type QuoteItem = {
  id: string;
  label: string;
  meta: ReactNode;
  description?: string | null;
};

export type OwnerQuoteResponseCardProps = {
  conciergeName: string;
  status: string | null | undefined;
  workflowStatus?: string | null;
  hasMission?: boolean;
  badges?: ReactNode;
  workflowSteps?: WorkflowTimelineStep[];
  facts: QuoteFact[];
  items: QuoteItem[];
  notes?: string | null;
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function OwnerQuoteResponseCard({
  conciergeName,
  status,
  workflowStatus,
  hasMission = false,
  badges,
  workflowSteps,
  facts,
  items,
  notes,
  actions,
  className = "",
  style,
}: OwnerQuoteResponseCardProps) {
  return (
    <Card className={[styles.card, className].filter(Boolean).join(" ")} tone="elevated" style={style}>
      <CardBody className={styles.card}>
        <div className={styles.summary}>
          <strong>{conciergeName}</strong>
          <RequestStatusBadge
            workflowStatus={workflowStatus}
            quoteStatus={status}
            hasMission={hasMission}
          />
        </div>

        {badges ? <div className={styles.badges}>{badges}</div> : null}
        {workflowSteps?.length ? (
          <div className={styles.workflowTimeline}>
            <WorkflowTimeline title="Parcours métier" steps={workflowSteps} />
          </div>
        ) : null}

        <div className={styles.factRow}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.factCard}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>

        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <strong>{item.label}</strong>
                <span className={styles.itemMeta}>{item.meta}</span>
              </div>
              {item.description ? <p className={styles.itemMeta}>{item.description}</p> : null}
            </div>
          ))}
        </div>

        {notes ? <p className={styles.notes}>{notes}</p> : null}
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </CardBody>
    </Card>
  );
}
