"use client";

import Link from "next/link";
import React from "react";
import { CompletionStatusCard } from "@/components/dashboard";
import type {
  DashboardWorkspaceAction,
  DashboardWorkspaceCard,
  DashboardWorkspaceDetailSection,
  DashboardWorkspaceMetric,
} from "./DashboardWorkspace";
import styles from "./DashboardWorkspace.module.scss";

type SimpleOverviewTone = "owner" | "concierge" | "provider";

type SimpleOverviewWorkspaceProps = {
  tone: SimpleOverviewTone;
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  actions?: DashboardWorkspaceAction[];
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
  metrics?: DashboardWorkspaceMetric[];
  cards?: DashboardWorkspaceCard[];
  detailSections?: DashboardWorkspaceDetailSection[];
};

function getToneClass(tone: SimpleOverviewTone) {
  if (tone === "owner") return styles.ownerTheme;
  if (tone === "provider") return styles.providerTheme;
  return styles.conciergeTheme;
}

function getActionClass(variant?: DashboardWorkspaceAction["variant"]) {
  if (variant === "primary") return styles.actionLinkPrimary;
  if (variant === "secondary") return styles.actionLinkSecondary;
  return styles.actionLink;
}

function getCardActionClass(variant?: DashboardWorkspaceAction["variant"]) {
  if (variant === "primary") return styles.cardActionPrimary;
  if (variant === "ghost") return styles.cardActionGhost;
  return styles.cardActionSecondary;
}

function getDetailBadgeClass(tone?: "default" | "warning" | "success") {
  if (tone === "warning") return `${styles.detailBadge} ${styles.warningBadge}`;
  if (tone === "success") return `${styles.detailBadge} ${styles.successBadge}`;
  return styles.detailBadge;
}

export default function SimpleOverviewWorkspace({
  tone,
  eyebrow,
  title,
  description,
  chips,
  actions,
  completion,
  metrics,
  cards,
  detailSections,
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
                    {actions
                      .filter((action): action is DashboardWorkspaceAction & { href: string } => Boolean(action.href))
                      .map((action) => (
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

        {metrics && metrics.length > 0 ? (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionIntro}>
              <span className={styles.sectionLabel}>Lecture rapide</span>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Indicateurs clefs</h2>
                <p className={styles.sectionDescription}>
                  Les chiffres a lire avant de descendre dans le detail.
                </p>
              </div>
            </div>
            <div className={styles.metrics}>
              {metrics.map((metric) => (
                <article key={metric.label} className={styles.metricCard}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <strong className={styles.metricValue}>{metric.value}</strong>
                  {metric.hint ? <p className={styles.metricHint}>{metric.hint}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {cards && cards.length > 0 ? (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionIntro}>
              <span className={styles.sectionLabel}>A finaliser</span>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Missions a finaliser</h2>
                <p className={styles.sectionDescription}>
                  Cette section met en avant les missions necessitant encore une action ou une validation.
                </p>
              </div>
            </div>
            <div className={styles.grid}>
              {cards.map((card) => (
                <article key={card.title} className={styles.card}>
                  <div className={styles.cardTitleRow}>
                    <h2 className={styles.cardTitle}>{card.title}</h2>
                    {card.notificationCount && card.notificationCount > 0 ? (
                      <span className={styles.notificationBadge}>{card.notificationCount}</span>
                    ) : null}
                  </div>
                  <p className={styles.cardText}>{card.text}</p>
                  {card.actions && card.actions.length > 0 ? (
                    <div className={styles.cardActions}>
                      {card.actions
                        .filter((action): action is DashboardWorkspaceAction & { href: string } => Boolean(action.href))
                        .map((action) => (
                        <Link
                          key={`${card.title}-${action.href}-${action.label}`}
                          href={action.href}
                          className={getCardActionClass(action.variant)}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {detailSections && detailSections.length > 0 ? (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionIntro}>
              <span className={styles.sectionLabel}>Points en attente</span>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Points en attente</h2>
                <p className={styles.sectionDescription}>
                  Une lecture plus fine des dossiers qui demandent encore un suivi, une validation ou une reprise.
                </p>
              </div>
            </div>
            <div className={styles.detailSections}>
              {detailSections.map((section) => (
                <section key={section.title} className={styles.detailSection}>
                  <div className={styles.detailHeader}>
                    <h2 className={styles.detailTitle}>{section.title}</h2>
                    {section.description ? (
                      <p className={styles.detailDescription}>{section.description}</p>
                    ) : null}
                  </div>

                  {section.items.length > 0 ? (
                    <div className={styles.detailList}>
                      {section.items.map((item) => (
                        <article
                          key={item.id || `${section.title}-${item.title}-${item.meta || ""}`}
                          className={styles.detailItem}
                        >
                          <div className={styles.detailItemMain}>
                            <div className={styles.detailItemTopline}>
                              <div className={styles.detailItemHeading}>
                                <h3 className={styles.detailItemTitle}>{item.title}</h3>
                                {item.notificationCount && item.notificationCount > 0 ? (
                                  <span className={styles.notificationBadge}>{item.notificationCount}</span>
                                ) : null}
                              </div>
                              {item.meta ? (
                                <span className={getDetailBadgeClass(item.tone)}>{item.meta}</span>
                              ) : null}
                            </div>
                            {item.description ? (
                              <p className={styles.detailItemDescription}>{item.description}</p>
                            ) : null}
                            {item.facts && item.facts.length > 0 ? (
                              <div className={styles.detailFacts}>
                                {item.facts.map((fact) => (
                                  <span
                                    key={`${section.title}-${item.title}-${fact}`}
                                    className={styles.detailFact}
                                  >
                                    {fact}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {item.href && item.actionLabel ? (
                            <div className={styles.detailItemActions}>
                              <Link href={item.href} className={styles.detailItemAction}>
                                {item.actionLabel}
                              </Link>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.detailEmpty}>
                      {section.emptyText || "Aucun element a afficher pour le moment."}
                    </p>
                  )}
                </section>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
