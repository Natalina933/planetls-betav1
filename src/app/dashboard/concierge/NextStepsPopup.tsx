"use client";

import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";
import {
  OnboardingIllustration,
  buildSmartDashboardPlan,
  getOnboardingActionVisual,
  getOnboardingJourneyVisual,
  normalizeOnboardingPath,
  parseOnboardingDetails,
} from "@/features/onboarding-assistant";
import styles from "./NextStepsPopup.module.scss";

export type NextStepAction = {
  id: string;
  title: string;
  detail: string;
  href: string;
  done?: boolean;
};

type NextStepsPopupProps = {
  open: boolean;
  availabilityHours?: string | null;
  profileComplete?: boolean;
  pricingReady?: boolean;
  servicesReady?: boolean;
  onClose: () => void;
};

const buildSteps = ({
  availabilityHours,
  profileComplete,
  pricingReady,
  servicesReady,
}: Pick<NextStepsPopupProps, "availabilityHours" | "profileComplete" | "pricingReady" | "servicesReady">) => {
  const onboarding = parseOnboardingDetails(availabilityHours);
  const plan = buildSmartDashboardPlan(onboarding);

  const isDone = (id: string) => {
    if (id === "complete-public-profile") return Boolean(profileComplete);
    if (id === "configure-zone" || id === "activate-services") return Boolean(servicesReady);
    if (id === "define-pricing") return Boolean(pricingReady);
    return false;
  };

  return plan.checklist
    .map<NextStepAction>((action) => ({
      ...action,
      detail: isDone(action.id) ? "Déjà prêt dans votre espace." : action.detail,
      done: isDone(action.id),
    }))
    .sort((a, b) => Number(a.done) - Number(b.done))
    .slice(0, 3);
};

export default function NextStepsPopup({
  open,
  availabilityHours,
  profileComplete = false,
  pricingReady = false,
  servicesReady = false,
  onClose,
}: NextStepsPopupProps) {
  if (!open) return null;

  const onboarding = parseOnboardingDetails(availabilityHours);
  const visualPath = normalizeOnboardingPath(onboarding.signupMode);
  const steps = buildSteps({ availabilityHours, profileComplete, pricingReady, servicesReady });

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="next-steps-title">
      <Card className={styles.modal} tone="elevated">
        <CardHeader className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Plan personnalisé</span>
            <h2 id="next-steps-title">Prochaines étapes</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
            <X size={22} aria-hidden="true" />
          </button>
        </CardHeader>
        <CardBody className={styles.body}>
          <OnboardingIllustration visual={getOnboardingJourneyVisual(visualPath)} variant="hero" />
          <div className={styles.steps}>
            {steps.map((step) => {
              return (
                <Link key={step.id} href={step.href} className={styles.step} onClick={onClose}>
                  <span className={styles.stepVisual}>
                    <OnboardingIllustration
                      visual={getOnboardingActionVisual(step.id, visualPath)}
                      variant="thumbnail"
                    />
                    {step.done ? (
                      <span className={styles.doneBadge}>
                        <CheckCircle2 size={18} strokeWidth={2.4} aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.detail}</small>
                  </span>
                </Link>
              );
            })}
          </div>
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Fermer
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
