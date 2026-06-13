"use client";

import type { ReactNode } from "react";
import { PublicIcon } from "@/components/ui/PublicIcon";
import styles from "./dashboardSaas.module.scss";

export type DashboardStatusTone = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface DashboardStatusBadgeProps {
  label: string;
  tone?: DashboardStatusTone;
  icon?: ReactNode;
  className?: string;
  iconOnly?: boolean;
}

const TONE_CLASS: Record<DashboardStatusTone, string> = {
  default: styles.statusDefault,
  primary: styles.statusPrimary,
  success: styles.statusSuccess,
  warning: styles.statusWarning,
  danger: styles.statusDanger,
  info: styles.statusInfo,
};

function getDefaultIcon(tone: DashboardStatusTone) {
  switch (tone) {
    case "primary":
      return <PublicIcon src="/icons/pentagram-svgrepo-com.svg" size={13} decorative />;
    case "success":
      return <PublicIcon src="/icons/check-1-svgrepo-com.svg" size={13} decorative />;
    case "warning":
      return <PublicIcon src="/icons/warning-triangle-svgrepo-com.svg" size={14} decorative />;
    case "danger":
      return <PublicIcon src="/icons/wrong-svgrepo-com.svg" size={14} decorative />;
    case "info":
      return <PublicIcon src="/icons/clock-svgrepo-com.svg" size={13} decorative />;
    default:
      return <PublicIcon src="/icons/points-1-svgrepo-com.svg" size={13} decorative />;
  }
}


function normalizeStatusLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function DashboardStatusBadge({
  label,
  tone = "default",
  icon,
  className,
  iconOnly = false,
}: DashboardStatusBadgeProps) {
  const badgeClassName = [styles.statusBadge, TONE_CLASS[tone], className].filter(Boolean).join(" ");
  const iconNode = icon ?? getDefaultIcon(tone);
  const isReviewWarning = tone === "warning" && normalizeStatusLabel(label) === "a revoir";
  const shouldHideLabel = iconOnly || isReviewWarning;

  return (
    <span className={badgeClassName} aria-label={shouldHideLabel ? label : undefined}>
      <span className={styles.statusIcon}>{iconNode}</span>
      {shouldHideLabel ? null : <span>{label}</span>}
    </span>
  );
}
