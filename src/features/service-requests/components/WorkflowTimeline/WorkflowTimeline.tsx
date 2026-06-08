"use client";

import { CheckCircle2, type LucideIcon } from "lucide-react";
import styles from "./WorkflowTimeline.module.scss";

export type WorkflowTimelineStepState = "done" | "active" | "todo";

export type WorkflowTimelineStep = {
  label: string;
  detail?: string;
  state: WorkflowTimelineStepState;
  Icon: LucideIcon;
};

type WorkflowTimelineProps = {
  title?: string;
  steps: WorkflowTimelineStep[];
};

export function WorkflowTimeline({ title = "Timeline workflow", steps }: WorkflowTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <section className={styles.timeline} aria-label={title}>
      <p className={styles.title}>{title}</p>
      <div className={styles.steps}>
        {steps.map((step) => (
          <div key={`${step.label}-${step.state}`} className={styles.step} data-state={step.state}>
            <span className={styles.icon}>
              {step.state === "done" ? <CheckCircle2 size={15} aria-hidden="true" /> : <step.Icon size={15} aria-hidden="true" />}
            </span>
            <span className={styles.body}>
              <strong>{step.label}</strong>
              {step.detail ? <small>{step.detail}</small> : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
