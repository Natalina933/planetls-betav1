"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Sparkles, type LucideIcon } from "lucide-react";
import styles from "./ServiceRequestCard.module.scss";

export type ServiceRequestCardTone = "draft" | "sent" | "viewed" | "discussion" | "accepted" | "declined" | "expired";
export type ServiceRequestStepState = "done" | "active" | "todo";

export type ServiceRequestFact = {
  label: string;
  value: string;
  hint?: string;
  Icon: LucideIcon;
};

export type ServiceRequestMilestone = {
  label: string;
  detail: string;
  state: ServiceRequestStepState;
  Icon: LucideIcon;
};

type ServiceRequestCardProps = {
  id?: string;
  title: string;
  eyebrow?: string;
  actorName: string;
  actorDetail?: string;
  statusLabel: string;
  statusTone: ServiceRequestCardTone;
  typeLabel: string;
  urgent?: boolean;
  summary?: string;
  currentStepLabel?: string;
  currentStepDetail: string;
  guidance: string;
  headerImage: string;
  facts: ServiceRequestFact[];
  milestones: ServiceRequestMilestone[];
  chips?: ReactNode;
  actions: ReactNode;
  focused?: boolean;
};

function getInitials(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "P";
}

export function ServiceRequestCard({
  id,
  title,
  eyebrow,
  actorName,
  actorDetail,
  statusLabel,
  statusTone,
  typeLabel,
  urgent,
  summary,
  currentStepLabel = "Étape actuelle",
  currentStepDetail,
  guidance,
  headerImage,
  facts,
  milestones,
  chips,
  actions,
  focused,
}: ServiceRequestCardProps) {
  return (
    <article id={id} className={`${styles.card} ${focused ? styles.cardFocused : ""}`}>
      <div className={styles.header} style={{ backgroundImage: `url("${headerImage}")` }}>
        <div className={styles.headerOverlay}>
          <span>{typeLabel}</span>
          {urgent ? <strong>Urgent</strong> : null}
        </div>
      </div>

      <div className={styles.cardTop}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(actorName)}</div>
          <div>
            {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
            <h3>
              <Sparkles size={17} aria-hidden="true" />
              {title}
            </h3>
            {actorDetail ? <p>{actorDetail}</p> : <p>{actorName}</p>}
          </div>
        </div>
        <span className={`${styles.statusBubble} ${styles[`tone${statusTone}`]}`}>{statusLabel}</span>
      </div>

      {summary ? <p className={styles.summary}>{summary}</p> : null}

      <div className={styles.nextStepPanel}>
        <span>{currentStepLabel}</span>
        <strong>{currentStepDetail}</strong>
        <p>{guidance}</p>
      </div>

      {facts.length > 0 ? (
        <div className={styles.facts}>
          {facts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className={styles.fact}>
              <span className={styles.factIcon}>
                <fact.Icon size={15} aria-hidden="true" />
              </span>
              <div>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
                {fact.hint ? <small>{fact.hint}</small> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.milestones}>
        {milestones.map((step) => (
          <div key={step.label} className={styles.milestone} data-state={step.state}>
            <span>
              {step.state === "done" ? <CheckCircle2 size={15} aria-hidden="true" /> : <step.Icon size={15} aria-hidden="true" />}
            </span>
            <small>{step.label}</small>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        {chips ? <div className={styles.chips}>{chips}</div> : null}
        <div className={styles.actions}>{actions}</div>
      </div>
    </article>
  );
}
