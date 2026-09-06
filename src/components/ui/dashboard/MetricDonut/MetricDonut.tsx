import type { CSSProperties } from "react";
import styles from "./MetricDonut.module.scss";

type DonutStyle = CSSProperties & {
  "--value": string;
};

export type MetricDonutProps = {
  label: string;
  value: string;
  percent: number;
  detail?: string;
  className?: string;
  compact?: boolean;
};

function clampPercent(percent: number) {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function MetricDonut({
  label,
  value,
  percent,
  detail,
  className = "",
  compact = false,
}: MetricDonutProps) {
  const safePercent = clampPercent(percent);
  const cardClassName = [styles.card, compact ? styles.compact : "", className].filter(Boolean).join(" ");

  return (
    <article className={cardClassName}>
      <div
        className={styles.donut}
        style={{ "--value": `${safePercent}%` } as DonutStyle}
        role="img"
        aria-label={`${label}: ${safePercent}%`}
      >
        <span className={styles.value}>{safePercent}%</span>
      </div>
      <div className={styles.copy}>
        <span className={styles.label}>{label}</span>
        <strong className={styles.headline}>{value}</strong>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
      </div>
    </article>
  );
}
