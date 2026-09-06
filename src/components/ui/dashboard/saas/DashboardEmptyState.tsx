"use client";

import type { ReactNode } from "react";
import styles from "./dashboardSaas.module.scss";

interface DashboardEmptyStateProps {
  title: string;
  copy: string;
  icon?: ReactNode;
}

export default function DashboardEmptyState({ title, copy, icon }: DashboardEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon}
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyCopy}>{copy}</p>
    </div>
  );
}
