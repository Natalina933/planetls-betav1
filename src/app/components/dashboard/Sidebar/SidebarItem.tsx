"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { SidebarItem as SidebarItemType } from "./sidebarconfig";
import styles from "./Sidebar.module.scss";

interface Props {
  item: SidebarItemType;
  toggleSidebar: () => void;
  notificationCounts?: Record<string, number>;
  ownerNavigation?: { activePath?: string; open: boolean; onToggle: () => void };
}

const SidebarItem: React.FC<Props> = ({ item, toggleSidebar, notificationCounts = {}, ownerNavigation }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [localOpen, setIsOpen] = useState(false);
  const isOpen = ownerNavigation ? ownerNavigation.open : localOpen;
  const groupId = `sidebar-group-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const query = searchParams.toString();
  const currentPath = `${pathname}${query ? `?${query}` : ""}`;
  const hasActiveChild = Boolean(
    item.children?.some((child) => child.path === currentPath || child.path === pathname),
  );
  const isActive = ownerNavigation
    ? item.path === ownerNavigation.activePath || Boolean(item.children?.some(child => child.path === ownerNavigation.activePath))
    : item.path === currentPath || item.path === pathname || hasActiveChild;
  const currentItemCount = item.notificationKey ? notificationCounts[item.notificationKey] ?? 0 : 0;
  const childCount =
    item.children?.reduce((sum, child) => {
      if (!child.notificationKey) return sum;
      return sum + (notificationCounts[child.notificationKey] ?? 0);
    }, 0) ?? 0;
  const badgeCount = currentItemCount || childCount;
  const badgeLabel = badgeCount > 9 ? "9+" : String(badgeCount);

  useEffect(() => {
    if (ownerNavigation) return;
    const saved = localStorage.getItem(`sidebar-${item.label}`);
    if (saved === "true") setIsOpen(true);
  }, [item.label, ownerNavigation]);

  useEffect(() => {
    if (ownerNavigation) return;
    localStorage.setItem(`sidebar-${item.label}`, String(isOpen));
  }, [isOpen, item.label, ownerNavigation]);

  useEffect(() => {
    if (!ownerNavigation && hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild, ownerNavigation]);

  const handleParentClick = () => {
    if (item.children) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className={styles.menuGroup}>
      {ownerNavigation && item.children?.length ? (
        <div className={styles.parentRow}>
          <Link href={item.path} className={`${styles.link} ${isActive ? styles.active : ""}`} onClick={toggleSidebar}
            aria-current={ownerNavigation.activePath === item.path && !item.children.some(child => child.path === item.path) ? "page" : undefined}>
            {item.icon && <item.icon className={styles.icon} />}
            <span>{item.label}</span>
            {badgeCount > 0 ? <span className={styles.itemBadge} aria-label={`${badgeCount} notification(s)`}>{badgeLabel}</span> : null}
          </Link>
          <button type="button" className={styles.groupToggle} onClick={ownerNavigation.onToggle}
            aria-label={`${isOpen ? "Replier" : "Déplier"} ${item.label}`} aria-expanded={isOpen} aria-controls={groupId}>
            <FiChevronDown className={isOpen ? styles.rotate : ""} aria-hidden="true" />
          </button>
        </div>
      ) : item.children ? (
        <button
          type="button"
          className={`${styles.link} ${isActive ? styles.active : ""}`}
          onClick={handleParentClick}
          aria-expanded={isOpen}
          aria-controls={groupId}
        >
          {item.icon && <item.icon className={styles.icon} />}
          <span>{item.label}</span>
          {badgeCount > 0 ? (
            <span className={styles.itemBadge} aria-label={`${badgeCount} notification(s)`}>
              {badgeLabel}
            </span>
          ) : null}
          <FiChevronDown className={`${styles.chevron} ${isOpen ? styles.rotate : ""}`} />
        </button>
      ) : (
        <Link
          href={item.path}
          className={`${styles.link} ${isActive ? styles.active : ""}`}
          onClick={toggleSidebar}
          aria-current={ownerNavigation && isActive ? "page" : undefined}
        >
          {item.icon && <item.icon className={styles.icon} />}
          <span>{item.label}</span>
          {badgeCount > 0 ? (
            <span className={styles.itemBadge} aria-label={`${badgeCount} notification(s)`}>
              {badgeLabel}
            </span>
          ) : null}
        </Link>
      )}

      {item.children && (
        <div
          id={groupId}
          inert={ownerNavigation && !isOpen ? true : undefined}
          hidden={ownerNavigation && !isOpen ? true : undefined}
          className={`${styles.submenu} ${isOpen ? styles.expanded : styles.collapsed}`}
        >
          {item.children.map((child) => {
            const isChildActive = ownerNavigation ? child.path === ownerNavigation.activePath : child.path === currentPath || child.path === pathname;
            return (
              <Link
                key={child.path}
                href={child.path}
                className={`${styles.sublink} ${isChildActive ? styles.active : ""}`}
                onClick={toggleSidebar}
                aria-current={ownerNavigation && isChildActive ? "page" : undefined}
              >
                {child.icon && <child.icon className={styles.icon} />}
                <span>{child.label}</span>
                {child.notificationKey && (notificationCounts[child.notificationKey] ?? 0) > 0 ? (
                  <span
                    className={styles.itemBadge}
                    aria-label={`${notificationCounts[child.notificationKey]} notification(s)`}
                  >
                    {(notificationCounts[child.notificationKey] ?? 0) > 9
                      ? "9+"
                      : String(notificationCounts[child.notificationKey])}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
