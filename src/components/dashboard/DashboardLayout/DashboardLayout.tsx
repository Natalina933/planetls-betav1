import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Home,
  MessageSquareText,
  UserRound,
  Wrench,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatsWidget } from "../StatsWidget/StatsWidget";
import { QuickActions } from "../QuickActions/QuickActions";
import { ActivityFeed } from "../ActivityFeed/ActivityFeed";
import { ProfileSummary } from "../ProfileSummary/ProfileSummary";
import { ReadabilityControls } from "../ReadabilityControls";
import { Sidebar } from "../Sidebar/Sidebar";
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

function getNavIcon(item: DashboardShortcutItem, index: number) {
  const label = `${item.label} ${item.href}`.toLowerCase();
  if (label.includes("message")) return MessageSquareText;
  if (label.includes("profil") || label.includes("compte")) return UserRound;
  if (label.includes("alerte") || label.includes("notification")) return Bell;
  if (label.includes("logement") || label.includes("bien")) return Home;
  if (label.includes("mission") || label.includes("intervention")) return ClipboardList;
  return index === 0 ? BriefcaseBusiness : ClipboardList;
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
  const PersonaIcon = getPersonaIcon(persona);
  const bottomNavItems = shortcuts.slice(0, 4);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.avatar}>
            <PersonaIcon size={24} aria-hidden="true" />
          </span>
          <div>
            <h1>{title}</h1>
            <p>{profile.name}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <ReadabilityControls />
          <Link
            href={notifications[0]?.href ?? navItems[0]?.href ?? "#"}
            className={styles.iconButton}
            aria-label="Notifications"
          >
            <Bell size={22} aria-hidden="true" />
            {notifications.length > 0 ? <span className={styles.notificationBadge}>{notifications.length}</span> : null}
          </Link>
        </div>
      </header>

      <section className={styles.todaySection} aria-labelledby={`${persona}-today-title`}>
        <div className={styles.sectionHeader}>
          <div>
            <Badge variant="gold">{getPersonaLabel(persona)}</Badge>
            <h2 id={`${persona}-today-title`}>Vue rapide</h2>
          </div>
        </div>
        <StatsWidget items={stats} />
      </section>

      <div className={styles.grid}>
        <main className={styles.main}>
          <section className={styles.intro}>
            <div>
              <p className={styles.eyebrow}>{profile.badge ?? getPersonaLabel(persona)}</p>
              <h2>{profile.subtitle}</h2>
              <p>{subtitle}</p>
            </div>
          </section>

          {children ? <div className={styles.mainSections}>{children}</div> : null}

          <section className={styles.actionsSection} aria-labelledby={`${persona}-actions-title`}>
            <div className={styles.sectionHeader}>
              <div>
                <Badge variant="neutral">Actions rapides</Badge>
                <h2 id={`${persona}-actions-title`}>Faire maintenant</h2>
              </div>
            </div>
            <QuickActions actions={actions} showHeader={false} />
          </section>
        </main>

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

      {bottomNavItems.length > 0 ? (
        <nav
          className={styles.bottomNav}
          style={{ gridTemplateColumns: `repeat(${bottomNavItems.length}, minmax(0, 1fr))` }}
          aria-label={`Navigation ${getPersonaLabel(persona).toLowerCase()}`}
        >
          {bottomNavItems.map((item, index) => {
            const Icon = getNavIcon(item, index);
            return (
              <Link key={item.href} href={item.href} aria-current={index === 0 ? "page" : undefined}>
                <Icon size={22} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
