"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Home,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import type { DashboardShortcutItem } from "../types";
import styles from "./DashboardLayout.module.scss";

type DashboardBottomNavProps = {
  items: DashboardShortcutItem[];
  ariaLabel: string;
};

function getNavIcon(item: DashboardShortcutItem, index: number) {
  const label = `${item.label} ${item.href}`.toLowerCase();
  if (label.includes("message")) return MessageSquareText;
  if (label.includes("profil") || label.includes("compte")) return UserRound;
  if (label.includes("alerte") || label.includes("notification")) return Bell;
  if (label.includes("logement") || label.includes("bien") || label.includes("annonce")) return Home;
  if (label.includes("mission") || label.includes("intervention") || label.includes("planning")) return ClipboardList;
  return index === 0 ? BriefcaseBusiness : ClipboardList;
}

function formatCount(count: number) {
  if (count > 99) return "99+";
  return `${count}`;
}

function isShortcutCurrent(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/") return pathname === href;
  return pathname.startsWith(`${href}/`);
}

export function DashboardBottomNav({ items, ariaLabel }: DashboardBottomNavProps) {
  const pathname = usePathname();
  const bottomNavItems = items.slice(0, 4);

  if (bottomNavItems.length === 0) return null;

  return (
    <nav
      className={styles.bottomNav}
      style={{ gridTemplateColumns: `repeat(${bottomNavItems.length}, minmax(0, 1fr))` }}
      aria-label={ariaLabel}
    >
      {bottomNavItems.map((item, index) => {
        const Icon = getNavIcon(item, index);
        const isCurrent = isShortcutCurrent(pathname, item.href);

        return (
          <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
            <span className={styles.bottomNavIconWrap}>
              <Icon size={22} aria-hidden="true" />
              {item.badgeCount && item.badgeCount > 0 ? (
                <span className={styles.bottomNavBadge}>{formatCount(item.badgeCount)}</span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
