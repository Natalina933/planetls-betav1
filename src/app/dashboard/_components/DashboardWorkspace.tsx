"use client";

import Link from "next/link";
import React from "react";
import styles from "./DashboardWorkspace.module.scss";

export type DashboardTone =
  | "global"
  | "owner"
  | "concierge"
  | "artisan"
  | "merchant";

export type DashboardActionVariant = "primary" | "secondary" | "ghost";

export type DashboardDetailItemTone = "default" | "warning" | "success";

export interface DashboardWorkspaceAction {
  id?: string;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: DashboardActionVariant;
  notificationCount?: number;
  ariaLabel?: string;
}

export interface DashboardWorkspaceCard {
  id?: string;
  title: string;
  text: string;
  actions?: DashboardWorkspaceAction[];
  notificationCount?: number;
}

export interface DashboardWorkspaceMetric {
  id?: string;
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
  tone?: DashboardDetailItemTone;
  notificationCount?: number;
  href?: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  actions?: DashboardWorkspaceAction[];
}

export interface DashboardWorkspaceDetailSection {
  id?: string;
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
  tone?: DashboardTone;
  className?: string;
}

interface WorkspaceSectionIntroProps {
  label: string;
  title: string;
  description: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getToneClass(tone: DashboardTone) {
  switch (tone) {
    case "global":
      return styles.globalTheme;
    case "owner":
      return styles.ownerTheme;
    case "artisan":
      return styles.artisanTheme;
    case "merchant":
      return styles.merchantTheme;
    case "concierge":
    default:
      return styles.conciergeTheme;
  }
}

function getHeroActionClass(variant: DashboardActionVariant = "ghost") {
  switch (variant) {
    case "primary":
      return styles.actionLinkPrimary;
    case "secondary":
      return styles.actionLinkSecondary;
    case "ghost":
    default:
      return styles.actionLink;
  }
}

function getCardActionClass(variant: DashboardActionVariant = "secondary") {
  switch (variant) {
    case "primary":
      return styles.cardActionPrimary;
    case "ghost":
      return styles.cardActionGhost;
    case "secondary":
    default:
      return styles.cardActionSecondary;
  }
}

function getDetailBadgeClass(tone: DashboardDetailItemTone = "default") {
  switch (tone) {
    case "warning":
      return cx(styles.detailBadge, styles.warningBadge);
    case "success":
      return cx(styles.detailBadge, styles.successBadge);
    case "default":
    default:
      return styles.detailBadge;
  }
}

function hasNotifications(count?: number) {
  return typeof count === "number" && count > 0;
}

function NotificationBadge({ count }: { count?: number }) {
  if (!hasNotifications(count)) return null;

  return <span className={styles.notificationBadge}>{count}</span>;
}

function WorkspaceSectionIntro({
  label,
  title,
  description,
}: WorkspaceSectionIntroProps) {
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

function ActionRenderer({
  action,
  className,
}: {
  action: DashboardWorkspaceAction;
  className: string;
}) {
  const content = (
    <span className={styles.actionContent}>
      <span>{action.label}</span>
      <NotificationBadge count={action.notificationCount} />
    </span>
  );

  if (action.href) {
    return (
      <Link
        href={action.href}
        className={className}
        aria-label={action.ariaLabel || action.label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={action.onClick}
      aria-label={action.ariaLabel || action.label}
    >
      {content}
    </button>
  );
}

export default function DashboardWorkspace({
  eyebrow,
  title,
  description,
  cards,
  metrics = [],
  chips = [],
  actions = [],
  detailSections = [],
  children,
  tone = "concierge",
  className,
}: DashboardWorkspaceProps) {
  const hasHeroRail = chips.length > 0 || actions.length > 0;
  const hasMetrics = metrics.length > 0;
  const hasDetailSections = detailSections.length > 0;

  return (
    <section className="dashboard-grid">
      <div className={cx(styles.page, getToneClass(tone), className)}>
        <div className={styles.hero}>
          <div className={styles.heroMain}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <span className={styles.heroDivider} aria-hidden="true" />
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>

          {hasHeroRail ? (
            <aside className={styles.heroRail}>
              {chips.length > 0 ? (
                <div className={styles.heroBlock}>
                  <span className={styles.heroBlockLabel}>Repères</span>
                  <div className={styles.chips}>
                    {chips.map((chip, index) => (
                      <span key={`${chip}-${index}`} className={styles.chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {actions.length > 0 ? (
                <div className={styles.heroBlock}>
                  <span className={styles.heroBlockLabel}>Actions rapides</span>
                  <div className={styles.actions}>
                    {actions.map((action, index) => (
                      <ActionRenderer
                        key={action.id || `${action.label}-${index}`}
                        action={action}
                        className={getHeroActionClass(action.variant)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>

        {hasMetrics ? (
          <section className={styles.sectionBlock}>
            <WorkspaceSectionIntro
              label="Lecture rapide"
              title="Indicateurs clés"
              description="Les chiffres à lire avant de descendre dans le détail."
            />

            <div className={styles.metrics}>
              {metrics.map((metric, index) => (
                <article
                  key={metric.id || `${metric.label}-${index}`}
                  className={styles.metricCard}
                >
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <strong className={styles.metricValue}>{metric.value}</strong>
                  {metric.hint ? (
                    <p className={styles.metricHint}>{metric.hint}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.sectionBlock}>
          <WorkspaceSectionIntro
            label="Pilotage"
            title="Priorités du moment"
            description="Les zones à arbitrer ou à débloquer en premier."
          />

          <div className={styles.grid}>
            {cards.map((card, index) => (
              <article
                key={card.id || `${card.title}-${index}`}
                className={styles.card}
              >
                <div className={styles.cardTitleRow}>
                  <h2 className={styles.cardTitle}>{card.title}</h2>
                  <NotificationBadge count={card.notificationCount} />
                </div>

                <p className={styles.cardText}>{card.text}</p>

                {card.actions && card.actions.length > 0 ? (
                  <div className={styles.cardActions}>
                    {card.actions.map((action, actionIndex) => (
                      <ActionRenderer
                        key={action.id || `${action.label}-${actionIndex}`}
                        action={action}
                        className={getCardActionClass(action.variant)}
                      />
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {hasDetailSections ? (
          <section className={styles.sectionBlock}>
            <WorkspaceSectionIntro
              label="Surveillance"
              title="Éléments à garder proches"
              description="Une lecture plus fine des dossiers, biens, missions ou alertes en mouvement."
            />

            <div className={styles.detailSections}>
              {detailSections.map((section, sectionIndex) => (
                <section
                  key={section.id || `${section.title}-${sectionIndex}`}
                  className={styles.detailSection}
                >
                  <div className={styles.detailHeader}>
                    <h2 className={styles.detailTitle}>{section.title}</h2>
                    {section.description ? (
                      <p className={styles.detailDescription}>
                        {section.description}
                      </p>
                    ) : null}
                  </div>

                  {section.items.length > 0 ? (
                    <div className={styles.detailList}>
                      {section.items.map((item, itemIndex) => (
                        <article
                          key={item.id || `${item.title}-${itemIndex}`}
                          className={styles.detailItem}
                        >
                          <div className={styles.detailItemMain}>
                            <div className={styles.detailItemTopline}>
                              <div className={styles.detailItemHeading}>
                                <h3 className={styles.detailItemTitle}>
                                  {item.title}
                                </h3>
                                <NotificationBadge count={item.notificationCount} />
                              </div>

                              {item.meta ? (
                                <span className={getDetailBadgeClass(item.tone)}>
                                  {item.meta}
                                </span>
                              ) : null}
                            </div>

                            {item.description ? (
                              <p className={styles.detailItemDescription}>
                                {item.description}
                              </p>
                            ) : null}

                            {item.facts && item.facts.length > 0 ? (
                              <div className={styles.detailFacts}>
                                {item.facts.map((fact, factIndex) => (
                                  <span
                                    key={`${fact}-${factIndex}`}
                                    className={styles.detailFact}
                                  >
                                    {fact}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {item.actions && item.actions.length > 0 ? (
                            <div className={styles.detailItemActions}>
                              {item.actions.map((action, actionIndex) => (
                                <ActionRenderer
                                  key={action.id || `${action.label}-${actionIndex}`}
                                  action={action}
                                  className={getCardActionClass(action.variant)}
                                />
                              ))}
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.detailEmpty}>
                      {section.emptyText ||
                        "Aucun élément à afficher pour le moment."}
                    </p>
                  )}
                </section>
              ))}
            </div>
          </section>
        ) : null}

        {children ? <div className={styles.extraContent}>{children}</div> : null}
      </div>
    </section>
  );
}
