"use client";

import { Button, Card, CardBody, CardFooter, CardHeader } from "@/components/ui";
import { ONBOARDING_JOURNEYS, getPendingActions } from "../config";
import type { OnboardingPath } from "../types";
import { getOnboardingActionVisual, getOnboardingJourneyVisual } from "../visuals";
import { OnboardingIllustration } from "./OnboardingIllustration";
import styles from "./FirstLoginOnboardingPopup.module.scss";

interface FirstLoginOnboardingPopupProps {
  path: OnboardingPath;
  open: boolean;
  onClose: () => void;
}

export function FirstLoginOnboardingPopup({ path, open, onClose }: FirstLoginOnboardingPopupProps) {
  if (!open) return null;
  const config = ONBOARDING_JOURNEYS[path];
  const actions = getPendingActions(path, {});
  const heroVisual = getOnboardingJourneyVisual(path);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="first-login-title">
      <Card className={styles.popup}>
        <CardHeader className={styles.header}>
          <OnboardingIllustration visual={heroVisual} variant="hero" priority />
          <div>
            <p className={styles.subtitle}>{config.subtitle}</p>
            <h2 id="first-login-title">{config.title}</h2>
          </div>
        </CardHeader>
        <CardBody>
          <p className={styles.hook}>{config.hook}</p>
          <p>{config.body}</p>
          <div className={styles.actionsPreview} aria-label="Étapes proposées">
            {actions.map((action) => (
              <article key={action.id} className={styles.actionPreview}>
                <OnboardingIllustration visual={getOnboardingActionVisual(action.id, path)} variant="thumbnail" />
                <span>{action.label}</span>
              </article>
            ))}
          </div>
        </CardBody>
        <CardFooter className={styles.footer}>
          <Button onClick={onClose}>Continuer</Button>
          <Button variant="secondary" onClick={onClose}>
            {config.secondaryLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
