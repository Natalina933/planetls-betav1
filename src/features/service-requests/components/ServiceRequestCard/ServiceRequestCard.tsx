"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import Image from "next/image";
import { ArrowRight, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { WorkflowTimeline } from "../WorkflowTimeline";
import styles from "./ServiceRequestCard.module.scss";

export type ServiceRequestCardTone =
  | "draft"
  | "sent"
  | "viewed"
  | "discussion"
  | "accepted"
  | "declined"
  | "expired";

export type ServiceRequestStepState =
  | "done"
  | "active"
  | "todo";

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
  compact?: boolean;
  compactStatus?: ReactNode;
  compactFacts?: ServiceRequestFact[];
  compactDetails?: string[];
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
  const words = value
    .split(/\s+/)
    .filter(Boolean);

  return (
    words
      .slice(0, 2)
      .map((word) =>
        word[0]?.toUpperCase(),
      )
      .join("") || "P"
  );
}

export function ServiceRequestCard({
  compact = false,
  compactStatus,
  compactFacts = [],
  compactDetails = [],
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
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const toneClass =
    styles[`tone${statusTone}`] ?? "";

  if (compact) {
    return (
      <article id={id} className={`${styles.compactCard} ${focused ? styles.compactFocused : ""}`}>
        <div className={styles.compactImage}>
          <Image src={headerImage} alt={`Illustration de la prestation : ${typeLabel}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 128px, 160px" />
        </div>
        <div className={styles.compactContent}>
          <div className={styles.compactHeader}>
            <div className={styles.compactIdentity}>
              <h3>{title}</h3>
              {actorDetail ? <p>{actorDetail}</p> : null}
            </div>
            <div className={styles.compactBadges}>
              {compactStatus ?? <Badge variant={statusTone === "accepted" ? "success" : statusTone === "declined" || statusTone === "expired" ? "danger" : statusTone === "discussion" ? "warning" : "neutral"}>{statusLabel}</Badge>}
              {urgent ? <Badge variant="danger">Urgent</Badge> : null}
            </div>
          </div>
          <div className={styles.compactMeta}>
            {compactFacts.map(({ label, value, Icon }) => <span key={label}><Icon size={14} aria-hidden="true" /><span>{label} : {value}</span></span>)}
            {actorName ? <span><UserRound size={14} aria-hidden="true" />{actorName}</span> : null}
          </div>
          {summary ? <p className={styles.compactSummary}>{summary}</p> : null}
          <div className={styles.compactFooter}>
            <div className={styles.compactDetails}>{[typeLabel, ...compactDetails].map((detail, index) => <span key={`${detail}-${index}`}>{detail}</span>)}</div>
            <Button variant="ghost" size="compact" className={styles.compactAction} aria-expanded={expanded} aria-controls={detailId} onClick={() => setExpanded(!expanded)}>
              {expanded ? "Masquer la demande" : "Voir la demande"}<ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div id={detailId} hidden={!expanded} className={styles.compactExpanded}>
          {expanded ? <ServiceRequestCard title={title} eyebrow={eyebrow} actorName={actorName} actorDetail={actorDetail} statusLabel={statusLabel} statusTone={statusTone} typeLabel={typeLabel} urgent={urgent} summary={summary} currentStepLabel={currentStepLabel} currentStepDetail={currentStepDetail} guidance={guidance} headerImage={headerImage} facts={facts} milestones={milestones} chips={chips} actions={actions} /> : null}
        </div>
      </article>
    );
  }

  return (
    <article
      id={id}
      className={`${styles.card} ${
        focused ? styles.cardFocused : ""
      }`}
    >
      <div
        className={styles.header}
        style={{
          backgroundImage: `url("${headerImage}")`,
        }}
      >
        <div className={styles.headerOverlay}>
          <span>{typeLabel}</span>

          {urgent ? <strong>Urgent</strong> : null}
        </div>
      </div>

      <div className={styles.cardTop}>
        <div className={styles.identity}>
          <div
            className={styles.avatar}
            aria-hidden="true"
          >
            {getInitials(actorName)}
          </div>

          <div>
            {eyebrow ? (
              <p className={styles.eyebrow}>
                {eyebrow}
              </p>
            ) : null}

            <h3>
              <Sparkles
                size={17}
                aria-hidden="true"
              />
              {title}
            </h3>

            {actorDetail ? (
              <p>{actorDetail}</p>
            ) : (
              <p>{actorName}</p>
            )}
          </div>
        </div>

        <span
          className={`${styles.statusBubble} ${toneClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {summary ? (
        <p className={styles.summary}>
          {summary}
        </p>
      ) : null}

      <div className={styles.nextStepPanel}>
        <span>{currentStepLabel}</span>
        <strong>{currentStepDetail}</strong>
        <p>{guidance}</p>
      </div>

      {facts.length > 0 ? (
        <div className={styles.facts}>
          {facts.map((fact) => {
            const FactIcon = fact.Icon;

            return (
              <div
                key={`${fact.label}-${fact.value}`}
                className={styles.fact}
              >
                <span
                  className={styles.factIcon}
                >
                  <FactIcon
                    size={15}
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>

                  {fact.hint ? (
                    <small>{fact.hint}</small>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={styles.workflowTimeline}>
        <WorkflowTimeline
          title="Parcours métier"
          steps={milestones}
        />
      </div>

      <div className={styles.footer}>
        {chips ? (
          <div className={styles.chips}>
            {chips}
          </div>
        ) : null}

        <div className={styles.actions}>
          {actions}
        </div>
      </div>
    </article>
  );
}
