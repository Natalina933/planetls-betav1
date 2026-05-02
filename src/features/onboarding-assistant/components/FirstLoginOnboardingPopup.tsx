"use client";

import { Button, Card, CardBody, CardFooter, CardHeader } from "@/components/ui";
import { ONBOARDING_JOURNEYS } from "../config";
import type { OnboardingPath } from "../types";
import styles from "./FirstLoginOnboardingPopup.module.scss";

interface FirstLoginOnboardingPopupProps {
  path: OnboardingPath;
  open: boolean;
  onClose: () => void;
}

export function FirstLoginOnboardingPopup({ path, open, onClose }: FirstLoginOnboardingPopupProps) {
  if (!open) return null;
  const config = ONBOARDING_JOURNEYS[path];

  return (
    <div className={styles.overlay} role="presentation">
      <Card className={styles.popup}>
        <CardHeader>
          <p className={styles.subtitle}>{config.subtitle}</p>
          <h2>{config.title}</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.hook}>{config.hook}</p>
          <p>{config.body}</p>
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
