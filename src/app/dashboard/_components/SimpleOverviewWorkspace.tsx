"use client";

import Link from "next/link";
import React from "react";
import { CompletionStatusCard } from "@/components/dashboard";
import styles from "./DashboardWorkspace.module.scss";

type SimpleOverviewTone = "owner" | "concierge" | "provider";

type SimpleOverviewWorkspaceProps = {
  tone: SimpleOverviewTone;
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  actions?: Array<{
    label: string;
    href: string;
    variant?: "primary" | "secondary";
  }>;
  completion: {
    title: string;
    description: string;
    percentage: number;
    completedCount: number;
    totalCount: number;
    missingItems: string[];
    actionLabel?: string;
    actionHref?: string;
  };
};

function getToneClass(tone: SimpleOverviewTone) {
  if (tone === "owner") return styles.ownerTheme;
  if (tone === "provider") return styles.providerTheme;
  return styles.conciergeTheme;
}

function getActionClass(variant?: "primary" | "secondary") {
  if (variant === "primary") return styles.actionLinkPrimary;
  if (variant === "secondary") return styles.actionLinkSecondary;
  return styles.actionLinkSecondary;
}

export default function SimpleOverviewWorkspace({
  tone,
  eyebrow,
  title,
  description,
  chips,
  actions,
  completion,
}: SimpleOverviewWorkspaceProps) {
  return (
    <section className="dashboard-grid">
      <div className={`${styles.page} ${getToneClass(tone)}`}>
        <div className={styles.hero}>
          <div className={styles.heroMain}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <span className={styles.heroDivider} aria-hidden="true" />
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>

          {(chips && chips.length > 0) || (actions && actions.length > 0) ? (
            <aside className={styles.heroRail}>
              {chips && chips.length > 0 ? (
                <div className={styles.heroBlock}>
                  <span className={styles.heroBlockLabel}>Reperes</span>
                  <div className={styles.chips}>
                    {chips.map((chip) => (
                      <span key={chip} className={styles.chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {actions && actions.length > 0 ? (
                <div className={styles.heroBlock}>
                  <span className={styles.heroBlockLabel}>Actions rapides</span>
                  <div className={styles.actions}>
                    {actions.map((action) => (
                      <Link
                        key={`${action.href}-${action.label}`}
                        href={action.href}
                        className={getActionClass(action.variant)}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>

        <CompletionStatusCard
          title={completion.title}
          description={completion.description}
          percentage={completion.percentage}
          completedCount={completion.completedCount}
          totalCount={completion.totalCount}
          missingItems={completion.missingItems}
          actionLabel={completion.actionLabel}
          actionHref={completion.actionHref}
        />
      </div>
    </section>
  );
}
