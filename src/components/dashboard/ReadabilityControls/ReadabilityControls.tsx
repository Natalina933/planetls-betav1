"use client";

import useReadabilityScale from "@/app/components/onboarding/useReadabilityScale";
import type { ReadabilityScale } from "@/app/components/onboarding/OnboardingStepHeader/OnboardingStepHeader";
import styles from "./ReadabilityControls.module.scss";

const OPTIONS: Array<{ label: string; value: ReadabilityScale; title: string }> = [
  { label: "A", value: "normal", title: "Taille normale" },
  { label: "A+", value: "large", title: "Texte plus grand" },
  { label: "A++", value: "xlarge", title: "Texte tres grand" },
];

export function ReadabilityControls() {
  const { readabilityScale, setReadabilityScale } = useReadabilityScale();

  return (
    <div className={styles.controls} role="group" aria-label="Taille du texte du dashboard">
      <span>Lisibilite</span>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={readabilityScale === option.value ? styles.active : styles.button}
          onClick={() => setReadabilityScale(option.value)}
          aria-pressed={readabilityScale === option.value}
          aria-label={option.title}
          title={option.title}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
