// app/components/ui/ProgressBar.tsx
import React from "react";
import styles from "./ProgessBar.module.scss";

interface Props {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: Props) {
  const percent = Math.round((step / total) * 100);
  return (
    <div className={styles.barContainer}>
      <div
        className={styles.progress}
        data-progress-width={percent}
      />
      <span className={styles.label}>
        Étape {step}/{total}
      </span>
    </div>
  );
}
