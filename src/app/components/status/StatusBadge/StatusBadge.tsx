// src/app/components/status/StatusBadge.tsx
"use client";

import { CheckCircle2, Clock, Umbrella, Power, Briefcase } from "lucide-react";
import styles from "./StatusBadge.module.scss";
import type { UserStatus } from "../userStatusTypes";
import { USER_STATUS_LABELS } from "../userStatusTypes";

interface StatusBadgeProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
}

const STATUS_ICONS: Record<UserStatus, React.ReactNode> = {
  active: <CheckCircle2 size={14} aria-hidden="true" />,
  busy: <Briefcase size={14} aria-hidden="true" />,
  away: <Clock size={14} aria-hidden="true" />,
  vacation: <Umbrella size={14} aria-hidden="true" />,
  offline: <Power size={14} aria-hidden="true" />,
};


export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const label = USER_STATUS_LABELS[status];
  const icon = STATUS_ICONS[status];

  return (
    <span className={`${styles.badge} ${styles[status]} ${styles[size]}`}>
      {icon}
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default StatusBadge;
