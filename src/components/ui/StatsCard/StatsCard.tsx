import { Card, CardBody } from "@/components/ui/Card";
import styles from "./StatsCard.module.scss";

type StatsCardTone = "default" | "soft" | "dark";

export interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  tone?: StatsCardTone;
}

export function StatsCard({ label, value, hint, trend, tone = "default" }: StatsCardProps) {
  return (
    <Card tone={tone === "dark" ? "dark" : tone === "soft" ? "soft" : "elevated"} className={[styles.statsCard, styles[tone]].join(" ")}>
      <CardBody>
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          {trend ? <span className={styles.trend}>{trend}</span> : null}
        </div>
        <strong className={styles.value}>{value}</strong>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </CardBody>
    </Card>
  );
}
