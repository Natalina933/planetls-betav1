"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BriefcaseBusiness, Home, Wrench } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatsWidget } from "../StatsWidget/StatsWidget";
import { QuickActions } from "../QuickActions/QuickActions";
import { ActivityFeed } from "../ActivityFeed/ActivityFeed";
import { ProfileSummary } from "../ProfileSummary/ProfileSummary";
import { Sidebar } from "../Sidebar/Sidebar";
import { DashboardBottomNav } from "./DashboardBottomNav";
import type {
  DashboardActivityItem,
  DashboardNavItem,
  DashboardNotificationItem,
  DashboardPersona,
  DashboardQuickAction,
  DashboardShortcutItem,
  DashboardStatItem,
} from "../types";
import styles from "./DashboardLayout.module.scss";

interface DashboardLayoutProps {
  persona: DashboardPersona;
  title: string;
  subtitle: string;
  navTitle: string;
  navItems: DashboardNavItem[];
  stats: DashboardStatItem[];
  actions: DashboardQuickAction[];
  activity: DashboardActivityItem[];
  notifications: DashboardNotificationItem[];
  shortcuts: DashboardShortcutItem[];
  profile: {
    name: string;
    subtitle: string;
    badge?: string;
    avatarSrc?: string;
  };
  hideHeader?: boolean;
  hideTodaySection?: boolean;
  hideQuickActions?: boolean;
  hideProfileSummary?: boolean;
  hideActivityFeed?: boolean;
  hideNotifications?: boolean;
  hideShortcuts?: boolean;
  showBottomNav?: boolean;
  children?: ReactNode;
}

function getLevelVariant(level: DashboardNotificationItem["level"]) {
  if (level === "danger") return "danger";
  if (level === "warning") return "warning";
  return "info";
}

function getPersonaLabel(persona: DashboardPersona) {
  if (persona === "owner") return "Propriétaire";
  if (persona === "artisan") return "Artisan";
  if (persona === "conciergerie") return "Conciergerie";
  return "Admin";
}

function getPersonaIcon(persona: DashboardPersona) {
  if (persona === "owner") return Home;
  if (persona === "artisan") return Wrench;
  return BriefcaseBusiness;
}

function formatCount(count: number) {
  if (count > 99) return "99+";
  return `${count}`;
}

export function DashboardLayout({
  persona,
  title,
  subtitle,
  navTitle,
  navItems,
  stats,
  actions,
  activity,
  notifications,
  shortcuts,
  profile,
  hideHeader = false,
  hideTodaySection = false,
  hideQuickActions = false,
  hideProfileSummary = false,
  hideActivityFeed = false,
  hideNotifications = false,
  hideShortcuts = false,
  showBottomNav = true,
  children,
}: DashboardLayoutProps) {
  const PersonaIcon = getPersonaIcon(persona);
  const shouldShowBottomNav = showBottomNav && persona !== "admin";

  return (
    <div className={styles.page}>
      {!hideHeader ? (
        <header className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.avatar}>
              <PersonaIcon size={24} aria-hidden="true" />
            </span>
            <div className={styles.identityCopy}>
              <p className={styles.identityEyebrow}>{getPersonaLabel(persona)}</p>
              <h1>{title}</h1>
              <p>{profile.name}</p>
            </div>
          </div>
          <div className={styles.headerSummary}>
            <span className={styles.headerPill}>{profile.badge ?? getPersonaLabel(persona)}</span>
            <span className={styles.headerSummaryText}>{subtitle}</span>
          </div>
        </header>
      ) : null}

      {!hideTodaySection ? (
        <section className={styles.todaySection} aria-labelledby={`${persona}-today-title`}>
          <div className={styles.sectionHeader}>
            <div>
              <Badge variant="gold">{getPersonaLabel(persona)}</Badge>
              <h2 id={`${persona}-today-title`}>Vue rapide</h2>
            </div>
          </div>
          <StatsWidget items={stats} />
        </section>
      ) : null}

      <div className={styles.grid}>
        <main className={styles.main}>
          {children ? <div className={styles.mainSections}>{children}</div> : null}

          {!hideQuickActions ? (
            <section className={styles.actionsSection} aria-labelledby={`${persona}-actions-title`}>
              <div className={styles.sectionHeader}>
                <div>
                  <Badge variant="neutral">Actions rapides</Badge>
                  <h2 id={`${persona}-actions-title`}>Faire maintenant</h2>
                </div>
              </div>
              <QuickActions actions={actions} showHeader={false} />
            </section>
          ) : null}
        </main>

        <aside className={styles.aside}>
          <Sidebar title={navTitle} items={navItems} />
          {!hideProfileSummary ? <ProfileSummary {...profile} /> : null}
          {!hideActivityFeed ? <ActivityFeed items={activity} /> : null}
          {!hideNotifications ? (
            <Card className={styles.panel}>
              <CardHeader className={styles.panelHeader}>
                <h2>Notifications</h2>
              </CardHeader>
              <CardBody className={styles.panelBody}>
                {notifications.length === 0 ? (
                  <p className={styles.empty}>Aucune notification critique.</p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className={styles.notificationItem}>
                      <Badge variant={getLevelVariant(item.level)}>{item.level || "info"}</Badge>
                      <p>{item.title}</p>
                      {item.href ? <Link href={item.href}>Traiter</Link> : null}
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          ) : null}
          {!hideShortcuts ? (
            <Card className={styles.panel}>
              <CardHeader className={styles.panelHeader}>
                <h2>Accès rapides</h2>
              </CardHeader>
              <CardBody className={styles.shortcutBody}>
                {shortcuts.map((item) => (
                  <Link key={item.href} href={item.href} className={styles.shortcut}>
                    <span>{item.label}</span>
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className={styles.shortcutBadge}>{formatCount(item.badgeCount)}</span>
                    ) : null}
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>

      {shouldShowBottomNav ? (
        <DashboardBottomNav
          items={shortcuts}
          ariaLabel={`Navigation ${getPersonaLabel(persona).toLowerCase()}`}
        />
      ) : null}
    </div>
  );
}
