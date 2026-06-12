"use client";

import type { ReactNode } from "react";
import styles from "./dashboardSaas.module.scss";

export type DashboardStatusTone = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface DashboardStatusBadgeProps {
  label: string;
  tone?: DashboardStatusTone;
  icon?: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<DashboardStatusTone, string> = {
  default: styles.statusDefault,
  primary: styles.statusPrimary,
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  danger: styles.statusDanger,
  info: styles.statusInfo,
};

export default function DashboardStatusBadge({
  label,
  tone = "default",
  icon,
  className,
}: DashboardStatusBadgeProps) {
  const badgeClassName = [styles.statusBadge, TONE_CLASS[tone], className].filter(Boolean).join(" ");

  return (
    <span className={badgeClassName}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
