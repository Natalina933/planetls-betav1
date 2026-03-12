import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sidebar } from "../Sidebar/Sidebar";
import { Topbar } from "../Topbar/Topbar";
import { StatsWidget } from "../StatsWidget/StatsWidget";
import { QuickActions } from "../QuickActions/QuickActions";
import { ActivityFeed } from "../ActivityFeed/ActivityFeed";
import { ProfileSummary } from "../ProfileSummary/ProfileSummary";
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
  children?: ReactNode;
}

function getLevelVariant(level: DashboardNotificationItem["level"]) {
  if (level === "danger") return "danger";
  if (level === "warning") return "warning";
  return "info";
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
  children,
}: DashboardLayoutProps) {
  return (
    <div className={styles.page}>
      <Topbar persona={persona} title={title} subtitle={subtitle} />

      <div className={styles.grid}>
        <div className={styles.main}>
          <StatsWidget items={stats} />
          <QuickActions actions={actions} />
          {children ? (
            <Card className={styles.mainContentCard}>
              <CardBody className={styles.mainContentBody}>{children}</CardBody>
            </Card>
          ) : null}
        </div>

        <aside className={styles.aside}>
          <Sidebar title={navTitle} items={navItems} />
          <ProfileSummary {...profile} />
          <ActivityFeed items={activity} />
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
          <Card className={styles.panel}>
            <CardHeader className={styles.panelHeader}>
              <h2>Accès rapides</h2>
            </CardHeader>
            <CardBody className={styles.shortcutBody}>
              {shortcuts.map((item) => (
                <Link key={item.href} href={item.href} className={styles.shortcut}>
                  {item.label}
                </Link>
              ))}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
