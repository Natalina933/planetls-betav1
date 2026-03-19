"use client";

import React from "react";
import styles from "./ProgressBar.module.scss"; // ✅ Corrigé si renommé

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
        data-progress={percent} // ✅ Utilisation correcte
      />
      <span className={styles.label}>
        Étape {step}/{total}
      </span>
    </div>
  );
}
