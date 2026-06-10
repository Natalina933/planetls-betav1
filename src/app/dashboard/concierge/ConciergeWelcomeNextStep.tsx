"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard";
import {
  OnboardingIllustration,
  buildSmartDashboardPlan,
  getOnboardingActionVisual,
  getOnboardingJourneyVisual,
  normalizeOnboardingPath,
  parseOnboardingDetails,
} from "@/features/onboarding-assistant";
import styles from "./ConciergeWelcomeNextStep.module.scss";

const STORAGE_KEY = "planetls-concierge-welcome-dismissed";

interface ConciergeWelcomeNextStepProps {
  availabilityHours?: string | null;
}

export default function ConciergeWelcomeNextStep({ availabilityHours }: ConciergeWelcomeNextStepProps) {
  const onboarding = useMemo(() => parseOnboardingDetails(availabilityHours), [availabilityHours]);
  const content = useMemo(() => buildSmartDashboardPlan(onboarding), [onboarding]);
  const visualPath = normalizeOnboardingPath(onboarding.signupMode);
  const storageKey = `${onboarding.signupMode}:${onboarding.onboardingGoal ?? "none"}:${onboarding.supportNeed ?? "none"}`;
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(window.localStorage.getItem(STORAGE_KEY) === storageKey);
  }, [storageKey]);

  if (isDismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, storageKey);
    setIsDismissed(true);
  };

  return (
    <DashboardPanel
      title="Orientation intelligente"
      className={styles.welcomePanel}
      bodyClassName={styles.welcomeBody}
      action={
        <button type="button" className={styles.dismissButton} onClick={dismiss}>
          Masquer
        </button>
      }
    >
      <div className={styles.heroRow}>
        <OnboardingIllustration visual={getOnboardingJourneyVisual(visualPath)} variant="card" />
        <div className={styles.headline}>
          <span className={styles.modeBadge}>{content.badge}</span>
          <h3>{content.title}</h3>
          <p>{content.description}</p>
        </div>
      </div>
      <div className={styles.actionGrid}>
        {content.actions.map((action) => {
          return (
            <Link key={action.id} href={action.href} className={styles.actionCard}>
              <OnboardingIllustration visual={getOnboardingActionVisual(action.id, visualPath)} variant="thumbnail" />
              <strong>{action.title}</strong>
              <span className={styles.actionDetail}>{action.detail}</span>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
