"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Home, MapPinned, PackageCheck, SlidersHorizontal, UserPlus } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard";
import { buildSmartDashboardPlan, parseOnboardingDetails } from "@/features/onboarding-assistant";
import styles from "./ConciergeWelcomeNextStep.module.scss";

type WelcomeIcon = typeof Home;

const STORAGE_KEY = "planetls-concierge-welcome-dismissed";

const ICON_BY_ACTION: Record<string, WelcomeIcon> = {
  "reply-request": FileText,
  "configure-zone": MapPinned,
  "activate-services": PackageCheck,
  "create-packs": PackageCheck,
  "define-pricing": SlidersHorizontal,
  "add-tools": FileText,
  "invite-owner": UserPlus,
  "create-offer": PackageCheck,
  "complete-public-profile": FileText,
};

interface ConciergeWelcomeNextStepProps {
  availabilityHours?: string | null;
}

export default function ConciergeWelcomeNextStep({ availabilityHours }: ConciergeWelcomeNextStepProps) {
  const onboarding = useMemo(() => parseOnboardingDetails(availabilityHours), [availabilityHours]);
  const content = useMemo(() => buildSmartDashboardPlan(onboarding), [onboarding]);
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
      <div className={styles.headline}>
        <span className={styles.modeBadge}>{content.badge}</span>
        <h3>{content.title}</h3>
        <p>{content.description}</p>
      </div>
      <div className={styles.actionGrid}>
        {content.actions.map((action) => {
          const Icon = ICON_BY_ACTION[action.id] ?? Home;
          return (
            <Link key={action.id} href={action.href} className={styles.actionCard}>
              <span className={styles.actionIcon}>
                <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <strong>{action.title}</strong>
              <span>{action.detail}</span>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
