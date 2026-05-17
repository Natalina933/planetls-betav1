"use client";

import ReadabilityControls, {
  type ReadabilityScale,
} from "@/app/components/onboarding/ReadabilityControls/ReadabilityControls";
import styles from "./OnboardingStepHeader.module.scss";

export type { ReadabilityScale };

interface OnboardingStepHeaderProps {
  title: string;
  step: number;
  totalSteps?: number;
  readabilityScale: ReadabilityScale;
  onReadabilityChange: (scale: ReadabilityScale) => void;
  progressPercent?: number;
  isFinalStep?: boolean;
}

export default function OnboardingStepHeader({
  title,
  step,
  totalSteps = 5,
  readabilityScale,
  onReadabilityChange,
  progressPercent,
  isFinalStep = false,
}: OnboardingStepHeaderProps) {
  const computedProgress = progressPercent ?? Math.max(0, Math.min(100, (step / totalSteps) * 100));
  const trackClassName = isFinalStep ? `${styles.stepperTrack} ${styles.stepperTrackFinal}` : styles.stepperTrack;
  const fillClassName = isFinalStep ? `${styles.stepperFill} ${styles.stepperFillFinal}` : styles.stepperFill;

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.stepBlock}>
          <p className={styles.stepIndicator}>{title}</p>
          <div
            className={trackClassName}
            role="progressbar"
            aria-label="Progression de l'inscription"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step}
          >
            <span className={fillClassName} style={{ width: `${computedProgress}%` }} />
          </div>
        </div>

        <ReadabilityControls
          value={readabilityScale}
          onChange={onReadabilityChange}
          className={styles.readabilityControls}
        />
      </div>
    </div>
  );
}
