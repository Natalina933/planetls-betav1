"use client";

import type { ReactNode } from "react";
import DashboardStatusBadge, { type DashboardStatusTone } from "./DashboardStatusBadge";
import styles from "./dashboardSaas.module.scss";

interface DashboardMetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  statusLabel?: string;
  statusTone?: DashboardStatusTone;
}

export default function DashboardMetricCard({
  label,
  value,
  detail,
  icon,
  statusLabel,
  statusTone = "default",
}: DashboardMetricCardProps) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricTop}>
        {icon ? <span className={styles.metricIcon}>{icon}</span> : <span />}
        {statusLabel ? (
          <span className={styles.metricStatus}>
            <DashboardStatusBadge label={statusLabel} tone={statusTone} />
          </span>
        ) : null}
      </div>
      <div>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>{value}</p>
      </div>
      {detail ? <p className={styles.metricDetail}>{detail}</p> : null}
    </article>
  );
}
