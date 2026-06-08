import { Card, CardBody } from "@/components/ui/Card";
import styles from "./StatsCard.module.scss";

type StatsCardTone = "default" | "soft" | "dark";

export interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  tone?: StatsCardTone;
  progress?: number;
}

export function StatsCard({ label, value, hint, trend, tone = "default", progress }: StatsCardProps) {
  const normalizedProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.min(100, Math.max(0, progress))
      : null;

  return (
    <Card tone={tone === "dark" ? "dark" : tone === "soft" ? "soft" : "elevated"} className={[styles.statsCard, styles[tone]].join(" ")}>
      <CardBody>
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          {trend ? <span className={styles.trend}>{trend}</span> : null}
        </div>
        <strong className={styles.value}>{value}</strong>
        {normalizedProgress !== null ? (
          <span
            className={styles.progressTrack}
            aria-label={`Progression ${Math.round(normalizedProgress)}%`}
          >
            <span className={styles.progressBar} style={{ width: `${normalizedProgress}%` }} />
          </span>
        ) : null}
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </CardBody>
    </Card>
  );
}
