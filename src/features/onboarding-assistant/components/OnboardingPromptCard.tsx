"use client";

import Link from "next/link";
import { Button, Card, CardBody, CardFooter, CardHeader } from "@/components/ui";
import { ONBOARDING_JOURNEYS, getPendingActions } from "../config";
import type { OnboardingActionStatus, OnboardingPath } from "../types";
import { getOnboardingActionVisual, getOnboardingJourneyVisual } from "../visuals";
import { OnboardingIllustration } from "./OnboardingIllustration";
import styles from "./OnboardingPromptCard.module.scss";

interface OnboardingPromptCardProps {
  path: OnboardingPath;
  actionStatus: Record<string, OnboardingActionStatus>;
  onDismiss: () => void;
}

export function OnboardingPromptCard({ path, actionStatus, onDismiss }: OnboardingPromptCardProps) {
  const config = ONBOARDING_JOURNEYS[path];
  const pendingActions = getPendingActions(path, actionStatus);

  return (
    <Card tone="outlined" className={styles.card}>
      <CardHeader className={styles.header}>
        <OnboardingIllustration visual={getOnboardingJourneyVisual(path)} variant="card" />
        <div>
          <p className={styles.subtitle}>{config.subtitle}</p>
          <h3>{config.title}</h3>
        </div>
      </CardHeader>
      <CardBody>
        <p className={styles.hook}>{config.hook}</p>
        <p>{config.body}</p>
        <ul className={styles.actionsList}>
          {pendingActions.map((action) => (
            <li key={action.id}>
              <Link href={action.href}>
                <OnboardingIllustration visual={getOnboardingActionVisual(action.id, path)} variant="thumbnail" />
                <span>{action.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
      <CardFooter className={styles.footer}>
        <Button variant="ghost" onClick={onDismiss}>
          {config.secondaryLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
