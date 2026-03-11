import { Card, CardBody } from "@/components/ui/Card";
import styles from "./StatsCard.module.scss";

export interface StatsCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}

export function StatsCard({ label, value, hint, trend }: StatsCardProps) {
  return (
    <Card className={styles.statsCard}>
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
