import React from "react";
import styles from "./OffersShared.module.scss";

interface OfferMetricCardProps {
  label: string;
  value: string;
  hint: string;
}

export default function OfferMetricCard({ label, value, hint }: OfferMetricCardProps) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={styles.metricValue}>{value}</strong>
      <span className={styles.metricHint}>{hint}</span>
    </article>
  );
}
