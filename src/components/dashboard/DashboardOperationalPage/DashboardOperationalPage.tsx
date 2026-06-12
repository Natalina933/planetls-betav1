"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import styles from "./DashboardOperationalPage.module.scss";

export type OperationalTone = "concierge" | "owner" | "provider";
export type OperationalRiskTone = "danger" | "warning" | "info" | "success";

export type OperationalAction = {
  label: string;
  href: string;
};

export type OperationalMetric = {
  label: string;
  value: string;
  hint: string;
  detailSectionId?: string;
  href?: string;
};

export type OperationalRisk = {
  label: string;
  value: string | number;
  hint: string;
  icon: unknown;
  tone: OperationalRiskTone;
  detailSectionId?: string;
  href?: string;
};

export type OperationalFocus = {
  title: string;
  status: string;
  statusVariant?: "neutral" | "gold" | "success" | "warning" | "danger" | "info";
  icon: ReactNode;
  heading: string;
  description: string;
  action?: OperationalAction;
};

export type OperationalCadenceItem = {
  label: string;
  text: string;
  icon: unknown;
};

export type OperationalDetailItem = {
  title: string;
  meta: string;
  description: string;
  action?: OperationalAction;
};

export type OperationalDetailSection = {
  id: string;
  title: string;
  description: string;
  emptyText: string;
  items: OperationalDetailItem[];
};

export type DashboardOperationalPageProps = {
  tone?: OperationalTone;
  badge: string;
  title: string;
  description: string;
  primaryActions?: OperationalAction[];
  metrics: OperationalMetric[];
  focus: OperationalFocus;
  risks: OperationalRisk[];
  cadenceTitle: string;
  cadence: OperationalCadenceItem[];
  detailsBadge: string;
  detailsTitle: string;
  detailsDescription: string;
  detailSections: OperationalDetailSection[];
  showDetails?: boolean;
  children?: ReactNode;
  illustration?: {
    mainIcon?: ComponentType<{ size?: number; strokeWidth?: number }>;
    topRightIcon?: ComponentType<{ size?: number; strokeWidth?: number }>;
    topLeftIcon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  };
};

export function DashboardOperationalPage({
  tone = "concierge",
  badge,
  title,
  description,
  primaryActions = [],
  children,
}: DashboardOperationalPageProps) {
  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <section className={styles.simpleHeader}>
        <div className={styles.simpleCopy}>
          <span className={styles.simpleBadge}>{badge}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {primaryActions.length > 0 ? (
          <div className={styles.simpleActions}>
            {primaryActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={index === 0 ? styles.simpleActionPrimary : styles.simpleActionSecondary}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {children ? <section className={styles.extraContent}>{children}</section> : null}
    </main>
  );
}
