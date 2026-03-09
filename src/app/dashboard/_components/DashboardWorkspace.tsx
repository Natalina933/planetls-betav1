"use client";

import Link from "next/link";
import React from "react";
import styles from "./DashboardWorkspace.module.scss";

export interface DashboardWorkspaceAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
  notificationCount?: number;
}

export interface DashboardWorkspaceCard {
  title: string;
  text: string;
  actions?: DashboardWorkspaceAction[];
  notificationCount?: number;
}

export interface DashboardWorkspaceMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface DashboardWorkspaceDetailItem {
  id?: string;
  title: string;
  meta?: string;
  description?: string;
  facts?: string[];
  href?: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tone?: "default" | "warning" | "success";
  notificationCount?: number;
}

export interface DashboardWorkspaceDetailSection {
  title: string;
  description?: string;
  emptyText?: string;
  items: DashboardWorkspaceDetailItem[];
}

export interface DashboardWorkspaceProps {
  eyebrow: string;
  title: string;
  description: string;
  cards: DashboardWorkspaceCard[];
  metrics?: DashboardWorkspaceMetric[];
  chips?: string[];
  actions?: DashboardWorkspaceAction[];
  detailSections?: DashboardWorkspaceDetailSection[];
  children?: React.ReactNode;
  tone?: "owner" | "concierge" | "provider";
}

interface WorkspaceSectionIntroProps {
  label: string;
  title: string;
  description: string;
}

function getToneClass(tone: DashboardWorkspaceProps["tone"]) {
  if (tone === "owner") return styles.ownerTheme;
  if (tone === "provider") return styles.providerTheme;
  return styles.conciergeTheme;
}

function getHeroActionClass(variant: DashboardWorkspaceAction["variant"]) {
  if (variant === "primary") return styles.actionLinkPrimary;
  if (variant === "secondary") return styles.actionLinkSecondary;
  return styles.actionLink;
}

function getCardActionClass(variant: DashboardWorkspaceAction["variant"]) {
  return variant === "primary" ? styles.cardActionPrimary : styles.cardActionSecondary;
}

function getDetailBadgeClass(tone: DashboardWorkspaceDetailItem["tone"]) {
  if (tone === "warning") return `${styles.detailBadge} ${styles.warningBadge}`;
  if (tone === "success") return `${styles.detailBadge} ${styles.successBadge}`;
  return styles.detailBadge;
}

function renderActionLink(
  action: DashboardWorkspaceAction,
  className: string,
  key: string,
) {
  return (
    <Link key={key} href={action.href} className={className}>
      <span className={styles.actionContent}>
        <span>{action.label}</span>
        {action.notificationCount && action.notificationCount > 0 ? (
          <span className={styles.notificationBadge}>{action.notificationCount}</span>
        ) : null}
      </span>
    </Link>
  );
}

function WorkspaceSectionIntro({ label, title, description }: WorkspaceSectionIntroProps) {
  return (
    <div className={styles.sectionIntro}>
      <span className={styles.sectionLabel}>{label}</span>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.sectionDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function DashboardWorkspace({
  eyebrow,
  title,
  description,
  cards,
  metrics,
  chips,
  actions,
  detailSections,
  children,
  tone = "concierge",
}: DashboardWorkspaceProps) {
  const hasHeroRail = Boolean((chips && chips.length > 0) || (actions && actions.length > 0));

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

          {hasHeroRail ? (
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
                    {actions.map((action) =>
                      renderActionLink(
                        action,
                        getHeroActionClass(action.variant),
                        `${action.href}-${action.label}`,
                      ),
                    )}
                  </div>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>

        {metrics && metrics.length > 0 ? (
          <section className={styles.sectionBlock}>
            <WorkspaceSectionIntro
              label="Lecture rapide"
              title="Indicateurs clefs"
              description="Les chiffres a lire avant de descendre dans le detail."
            />
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

        <section className={styles.sectionBlock}>
          <WorkspaceSectionIntro
            label="Pilotage"
            title="Priorites du moment"
            description="Les zones a arbitrer ou a debloquer en premier."
          />
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
                    {card.actions.map((action) =>
                      renderActionLink(
                        action,
                        getCardActionClass(action.variant),
                        `${card.title}-${action.href}-${action.label}`,
                      ),
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {detailSections && detailSections.length > 0 ? (
          <section className={styles.sectionBlock}>
            <WorkspaceSectionIntro
              label="Surveillance"
              title="Elements a garder proches"
              description="Une lecture plus fine des dossiers, biens, missions ou alertes en mouvement."
            />
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
                                  <span className={styles.notificationBadge}>
                                    {item.notificationCount}
                                  </span>
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
                              {item.onSecondaryAction && item.secondaryActionLabel ? (
                                <button
                                  type="button"
                                  className={styles.detailItemActionSecondary}
                                  onClick={item.onSecondaryAction}
                                >
                                  {item.secondaryActionLabel}
                                </button>
                              ) : null}
                            </div>
                          ) : item.onSecondaryAction && item.secondaryActionLabel ? (
                            <div className={styles.detailItemActions}>
                              <button
                                type="button"
                                className={styles.detailItemActionSecondary}
                                onClick={item.onSecondaryAction}
                              >
                                {item.secondaryActionLabel}
                              </button>
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

        {children}
      </div>
    </section>
  );
}
