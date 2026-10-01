"use client";

import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button/ButtonLink";
import styles from "./DashboardConfigurationCard.module.scss";

export type ConfigurationStep = {
  key: string;
  label: string;
};

export type ConfigurationStatus = {
  completed: number;
  total: number;
  isComplete: boolean;
  onResume?: () => void;
};

type DashboardConfigurationCardProps = {
  steps: ConfigurationStep[];
  configurationStatus: ConfigurationStatus;
  expanded?: boolean;
};

export default function DashboardConfigurationCard({
  steps,
  configurationStatus,
  expanded = false,
}: DashboardConfigurationCardProps) {
  const configurationTotal = configurationStatus.total;
  const configurationCompleted = Math.max(0, Math.min(configurationStatus.completed ?? 0, configurationTotal));
  const isComplete = configurationStatus.isComplete;

  // Determine title based on completion status
  let title: string;
  let actionLabel: string;
  
  if (isComplete) {
    title = "Votre espace est configuré";
    actionLabel = "Voir mes préférences";
  } else if (configurationCompleted === 0) {
    title = "Finalisez votre espace";
    actionLabel = "Configurer mes préférences";
  } else {
    title = "Finalisez votre espace";
    actionLabel = "Continuer la configuration";
  }

  const configurationCountLabel = `${configurationCompleted} sur ${configurationTotal} complété${configurationCompleted > 1 ? "s" : ""}`;
  const configurationShortCountLabel = `${configurationCompleted}/${configurationTotal}`;

  return (
    <section
      className={`${styles.configurationCard} ${expanded ? styles.configurationCardExpanded : ""}`}
      aria-label="Configuration de votre espace"
    >
      <div className={styles.configurationHeading}>
        <h2>{title}</h2>
        <span className={styles.configurationCount}>{configurationShortCountLabel}</span>
      </div>
      <div className={styles.configurationFlow}>
        <ol
          className={styles.configurationProgress}
          aria-label={configurationCountLabel}
        >
          {steps.map((step, index) => {
            const isDone = index < configurationCompleted;
            const isCurrent =
              !isDone &&
              index === configurationCompleted &&
              configurationCompleted < steps.length;
            return (
              <li
                key={step.key}
                className={
                  isDone
                    ? styles.configurationStepDone
                    : isCurrent
                    ? styles.configurationStepCurrent
                    : undefined
                }
              >
                <span className={styles.configurationBubble} aria-hidden="true" />
                <span className={styles.configurationStepLabel}>
                  {isDone ? (
                    <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                  ) : null}
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
        <div className={styles.configurationFooter}>
          <ButtonLink
            className={styles.configurationAction}
            href={configurationStatus.onResume ? "#" : "/dashboard/owner/objectifs"}
            onClick={(e) => {
              if (configurationStatus.onResume) {
                e.preventDefault();
                configurationStatus.onResume();
              }
            }}
          >
            {actionLabel}
            <span aria-hidden="true">→</span>
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
