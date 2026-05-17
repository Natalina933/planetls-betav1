"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Home,
  KeyRound,
  MessageSquareWarning,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, CardBody } from "@/components/ui";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
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
  icon: LucideIcon;
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
  icon: LucideIcon;
};

export type OperationalDetailItem = {
  title: string;
  meta: string;
  description: string;
  action: OperationalAction;
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
  metrics,
  focus,
  risks,
  cadenceTitle,
  cadence,
  detailsBadge,
  detailsTitle,
  detailsDescription,
  detailSections,
  showDetails = true,
  children,
  illustration,
}: DashboardOperationalPageProps) {
  const MainIcon = illustration?.mainIcon ?? Home;
  const TopRightIcon = illustration?.topRightIcon ?? KeyRound;
  const TopLeftIcon = illustration?.topLeftIcon ?? MessageSquareWarning;
  const [currentHref, setCurrentHref] = useState<string>("");
  const [activeDetailId, setActiveDetailId] = useState<string>("all");
  const activeSection = useMemo(
    () => detailSections.find((section) => section.id === activeDetailId) ?? null,
    [activeDetailId, detailSections],
  );
  const visibleDetailSections = activeSection ? [activeSection] : detailSections;

  const selectDetailSection = (detailSectionId?: string, href?: string) => {
    if (href) {
      window.location.href = href;
      return;
    }
    if (!detailSectionId) return;
    setActiveDetailId(detailSectionId);
  };
  useEffect(() => {
    setCurrentHref(`${window.location.pathname}${window.location.search}`);
  }, []);

  const isActionActive = (href: string) => {
    if (!currentHref) return false;
    const [targetPath, targetQuery = ""] = href.split("?");
    const [currentPath, currentQuery = ""] = currentHref.split("?");
    const currentTab = new URLSearchParams(currentQuery).get("tab");
    const targetTab = new URLSearchParams(targetQuery).get("tab");

    if (targetPath !== currentPath) return false;
    if (targetTab) return currentTab === targetTab;
    return currentHref === href || !currentTab;
  };

  return (
    <main className={`${styles.page} ${styles[tone]}`}>
      <section className={styles.visualBrief} aria-label={`${badge} - ${title}`}>
        <div className={styles.visualScene} aria-hidden="true">
          <div className={styles.sceneSky} />
          <div className={styles.sceneHouse}>
            <MainIcon size={66} strokeWidth={1.8} />
          </div>
          <div className={styles.sceneKey}>
            <TopRightIcon size={34} strokeWidth={2} />
          </div>
          <div className={styles.sceneBubble}>
            <TopLeftIcon size={28} strokeWidth={2} />
          </div>
        </div>

        <div className={styles.visualCopy}>
          <Badge variant="info">{badge}</Badge>
          <h1>{title}</h1>
          <p>{description}</p>
          {primaryActions.length > 0 ? (
            <div className={styles.heroActions}>
              {primaryActions.map((action) => {
                const active = isActionActive(action.href);
                return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={active ? styles.activeAction : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {action.label}
                </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.metricsGrid} aria-label="Indicateurs">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className={`${styles.metricCard} ${
              metric.detailSectionId && metric.detailSectionId === activeDetailId ? styles.activeCard : ""
            }`}
            tone="soft"
            role={metric.detailSectionId || metric.href ? "button" : undefined}
            tabIndex={metric.detailSectionId || metric.href ? 0 : undefined}
            onClick={() => selectDetailSection(metric.detailSectionId, metric.href)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") selectDetailSection(metric.detailSectionId, metric.href);
            }}
            aria-pressed={metric.detailSectionId && !metric.href ? metric.detailSectionId === activeDetailId : undefined}
          >
            <CardBody className={styles.metricBody}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.hint}</p>
            </CardBody>
          </Card>
        ))}
      </section>

      <div className={styles.attentionGrid}>
        <DashboardPanel
          title={focus.title}
          action={<Badge variant={focus.statusVariant ?? "gold"}>{focus.status}</Badge>}
          className={styles.focusPanel}
        >
          <div className={styles.focusBody}>
            <span className={styles.focusIcon} aria-hidden="true">
              {focus.icon}
            </span>
            <div>
              <strong>{focus.heading}</strong>
              <p>{focus.description}</p>
              {focus.action ? (
                <Link href={focus.action.href} className={styles.focusLink}>
                  {focus.action.label}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
        </DashboardPanel>

        <div className={styles.riskRail} aria-label="Synthèse des risques">
          {risks.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className={`${styles.riskCard} ${styles[item.tone]} ${
                  item.detailSectionId && item.detailSectionId === activeDetailId ? styles.activeCard : ""
                }`}
                tone="soft"
                role={item.detailSectionId || item.href ? "button" : undefined}
                tabIndex={item.detailSectionId || item.href ? 0 : undefined}
                onClick={() => selectDetailSection(item.detailSectionId, item.href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") selectDetailSection(item.detailSectionId, item.href);
                }}
                aria-pressed={item.detailSectionId && !item.href ? item.detailSectionId === activeDetailId : undefined}
              >
                <CardBody className={styles.riskBody}>
                  <span className={styles.riskIcon}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <p>{item.hint}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <DashboardPanel title={cadenceTitle} className={styles.cadencePanel}>
        <div className={styles.cadenceList}>
          {cadence.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </DashboardPanel>

      {showDetails ? (
        <section className={styles.detailsBlock} aria-label={detailsTitle}>
          <div className={styles.detailsIntro}>
            <Badge variant="gold">{detailsBadge}</Badge>
            <h2>{detailsTitle}</h2>
            <p>{activeSection ? activeSection.description : detailsDescription}</p>
            {activeSection ? (
              <button type="button" className={styles.resetFilter} onClick={() => setActiveDetailId("all")}>
                Tout voir
              </button>
            ) : null}
          </div>

          <div className={`${styles.detailSections} ${activeSection ? styles.detailSectionsFiltered : ""}`}>
            {visibleDetailSections.map((section) => (
              <DashboardPanel key={section.id} title={section.title} className={styles.detailPanel}>
                <p className={styles.detailDescription}>{section.description}</p>
                {section.items.length > 0 ? (
                  <div className={styles.detailList}>
                    {section.items.map((item) => (
                      <article key={`${section.title}-${item.title}`} className={styles.detailItem}>
                        <div>
                          <div className={styles.detailTopline}>
                            <strong>{item.title}</strong>
                            <span>{item.meta}</span>
                          </div>
                          <p>{item.description}</p>
                        </div>
                        <Link href={item.action.href} className={styles.detailAction}>
                          {item.action.label}
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyText}>{section.emptyText}</p>
                )}
              </DashboardPanel>
            ))}
          </div>
        </section>
      ) : null}

      {children ? <section className={styles.extraContent}>{children}</section> : null}
    </main>
  );
}
