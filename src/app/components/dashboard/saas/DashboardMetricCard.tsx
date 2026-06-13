"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import DashboardStatusBadge, { type DashboardStatusTone } from "./DashboardStatusBadge";
import styles from "./dashboardSaas.module.scss";

interface DashboardMetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  statusLabel?: string;
  statusTone?: DashboardStatusTone;
  statusIcon?: ReactNode;
  statusIconOnly?: boolean;
  statusText?: string;
  href?: string;
}

export default function DashboardMetricCard({
  label,
  value,
  detail,
  icon,
  statusLabel,
  statusTone = "default",
  statusIcon,
  statusIconOnly = false,
  statusText,
  href,
}: DashboardMetricCardProps) {
  const accessibleLabel = [label, value, detail].filter(Boolean).join(" · ");
  const shouldShowValue = !/^0(?:\s*\/\s*0)?$/.test(value.trim());
  const cardContent = (
    <>
      {icon ? <span className={styles.metricIcon}>{icon}</span> : <span />}
      <div className={styles.metricMain}>
        <p className={styles.metricLabel}>{label}</p>
        {shouldShowValue ? <p className={styles.metricValue}>{value}</p> : null}
        {detail ? <p className={styles.metricDetail}>{detail}</p> : null}
        {statusText ? <p className={styles.metricStatusText}>{statusText}</p> : null}
      </div>
      {statusLabel ? (
        <span className={styles.metricStatus}>
          <DashboardStatusBadge
            label={statusLabel}
            tone={statusTone}
            icon={statusIcon}
            iconOnly={statusIconOnly || Boolean(statusLabel)}
          />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={styles.metricCard}
        data-status-tone={statusTone}
        aria-label={accessibleLabel}
        role="article"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article className={styles.metricCard} data-status-tone={statusTone} aria-label={accessibleLabel}>
      {cardContent}
    </article>
  );
}
