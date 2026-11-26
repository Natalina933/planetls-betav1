"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { SidebarItem as SidebarItemType } from "./sidebarconfig";
import styles from "./Sidebar.module.scss";

interface Props {
  item: SidebarItemType;
  toggleSidebar: () => void;
  notificationCounts?: Record<string, number>;
  conciergeActive?: boolean;
  ownerNavigation?: { activePath?: string; open: boolean; onToggle: () => void };
}

const subscribeToStorage = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};
const getServerSidebarState = () => null;

const SidebarItem: React.FC<Props> = ({ item, toggleSidebar, notificationCounts = {}, ownerNavigation, conciergeActive }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groupId = `sidebar-group-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const query = searchParams.toString();
  const currentPath = `${pathname}${query ? `?${query}` : ""}`;
  const hasActiveChild = Boolean(
    item.children?.some((child) => child.path === currentPath || child.path === pathname),
  );
  const storageKey = `sidebar-${item.label}`;
  const usesLocalGroup = Boolean(item.children && !ownerNavigation);
  const savedOpen = useSyncExternalStore(
    subscribeToStorage,
    () => usesLocalGroup && localStorage.getItem(storageKey) === "true",
    getServerSidebarState,
  );
  const [localOpen, setLocalOpen] = useState<boolean | null>(null);
  const opensForActiveChild = usesLocalGroup && hasActiveChild;
  const [previousActiveChild, setPreviousActiveChild] = useState(false);
  if (opensForActiveChild !== previousActiveChild) {
    setPreviousActiveChild(opensForActiveChild);
    if (opensForActiveChild) setLocalOpen(true);
  }
  const isOpen = ownerNavigation?.open ?? localOpen ?? savedOpen ?? false;
  const isActive = ownerNavigation
    ? item.path === ownerNavigation.activePath || Boolean(item.children?.some(child => child.path === ownerNavigation.activePath))
    : conciergeActive ?? (item.path === currentPath || item.path === pathname || hasActiveChild);
  const currentItemCount = item.notificationKey ? notificationCounts[item.notificationKey] ?? 0 : 0;
  const childCount =
    item.children?.reduce((sum, child) => {
      if (!child.notificationKey) return sum;
      return sum + (notificationCounts[child.notificationKey] ?? 0);
    }, 0) ?? 0;
  const badgeCount = currentItemCount || childCount;
  const badgeLabel = badgeCount > 9 ? "9+" : String(badgeCount);

  useEffect(() => {
    if (usesLocalGroup && localOpen !== null) {
      localStorage.setItem(storageKey, String(localOpen));
    }
  }, [localOpen, storageKey, usesLocalGroup]);

  const handleParentClick = () => {
    if (item.children) {
      setLocalOpen(!isOpen);
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
          aria-current={(ownerNavigation || conciergeActive !== undefined) && isActive ? "page" : undefined}
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
