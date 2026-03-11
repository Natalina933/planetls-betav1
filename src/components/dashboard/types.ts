export type DashboardPersona = "owner" | "conciergerie" | "artisan";

export interface DashboardNavItem {
  label: string;
  href: string;
}

export interface DashboardStatItem {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}

export interface DashboardQuickAction {
  label: string;
  href: string;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  dateLabel?: string;
}

export interface DashboardNotificationItem {
  id: string;
  title: string;
  level?: "info" | "warning" | "danger";
  href?: string;
}

export interface DashboardShortcutItem {
  label: string;
  href: string;
}
