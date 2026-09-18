"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { getOwnerActivePath } from "./ownerNavigation";
import { useUserType } from "@/app/context/UserTypeContext";
import {
  getOwnerReplySignature,
  getSeenOwnerReplySignatures,
  isOwnerReplyStatus,
  OWNER_SERVICE_REPLY_SEEN_EVENT,
} from "@/app/components/dashboard/notifications/serviceRequestNotifications";
import { sidebarConfig } from "./sidebarconfig";
import SidebarItem from "./SidebarItem";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  className?: string;
  mobileBreakpoint?: number;
  conciergeBranding?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: "global",
  owner: "propriétaire",
  concierge: "concierge",
  provider: "artisan",
};

const roleThemeClasses: Record<string, string> = {
  admin: styles.adminTheme,
  owner: styles.ownerTheme,
  concierge: styles.conciergeTheme,
  provider: styles.providerTheme,
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, className = "", mobileBreakpoint = 900, conciergeBranding = false }) => {
  const { userType } = useUserType();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const navigationKey = `${pathname}?${query}`;
  const [ownerGroup, setOwnerGroup] = useState<{ key: string; label: string | null } | null>(null);
  const isConciergeWorkspace = conciergeBranding || userType?.toLowerCase().includes("concierge") || false;
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({});
  const [refreshTick, setRefreshTick] = useState(0);

  const menuItems =
    userType && sidebarConfig[userType as keyof typeof sidebarConfig]
      ? sidebarConfig[userType as keyof typeof sidebarConfig]
      : [];
  const ownerActivePath = userType === "owner" ? getOwnerActivePath(menuItems, pathname, query) : undefined;
  const activeGroup = menuItems.find(item => item.children && (item.path === ownerActivePath || item.children.some(child => child.path === ownerActivePath)))?.label;
  const openOwnerGroup = ownerGroup?.key === navigationKey ? ownerGroup.label : activeGroup;

  const loadNotificationCounts = useCallback(async () => {
    if (userType !== "concierge" && userType !== "owner") {
      setNotificationCounts({});
      return;
    }

    try {
      const endpoint =
        userType === "concierge"
          ? "/api/service-requests?view=concierge&limit=30"
          : "/api/service-requests?limit=30";
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les notifications.");
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      if (userType === "concierge") {
        const pendingCount = items.filter(
          (item: { recipient_status?: string | null }) =>
            item.recipient_status === "sent" || item.recipient_status === "viewed",
        ).length;

        setNotificationCounts({ "concierge-requests": pendingCount });
        return;
      }

      const replyCount = items
        .filter(
          (item: { id: string; recipients?: Array<{ id?: string | null; status?: string | null }> }) =>
            Array.isArray(item.recipients) &&
            item.recipients.some((recipient) => isOwnerReplyStatus(recipient.status)),
        )
        .filter((item: { id: string; recipients?: Array<{ id?: string | null; status?: string | null }> }) => {
          const seenReplySignatures = getSeenOwnerReplySignatures();
          return !seenReplySignatures.has(getOwnerReplySignature(item));
        }).length;

      setNotificationCounts({ "owner-service-replies": replyCount });
    } catch {
      setNotificationCounts({});
    }
  }, [userType]);

  useEffect(() => {
    const mobileQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    const syncViewport = () => setIsMobileViewport(mobileQuery.matches);

    syncViewport();
    mobileQuery.addEventListener("change", syncViewport);
    return () => mobileQuery.removeEventListener("change", syncViewport);
  }, [mobileBreakpoint]);

  useEffect(() => {
    if (isOpen && isMobileViewport) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobileViewport]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, toggleSidebar]);

  useEffect(() => {
    void loadNotificationCounts();

    if (userType !== "concierge" && userType !== "owner") return;
    const interval = window.setInterval(() => {
      void loadNotificationCounts();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadNotificationCounts, refreshTick, userType]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOwnerRepliesSeen = () => {
      setRefreshTick((current) => current + 1);
    };

    window.addEventListener(OWNER_SERVICE_REPLY_SEEN_EVENT, handleOwnerRepliesSeen);
    return () => {
      window.removeEventListener(OWNER_SERVICE_REPLY_SEEN_EVENT, handleOwnerRepliesSeen);
    };
  }, []);

  return (
    <>
      {isOpen && isMobileViewport ? (
        <div
          className={`${styles.overlay} ${userType === "owner" ? styles.ownerOverlay : ""}`}
          onClick={toggleSidebar}
          role="button"
          tabIndex={-1}
          aria-label="Fermer la sidebar"
        />
      ) : null}
      <aside
        className={`${styles.sidebar} ${className} ${isOpen ? styles.open : styles.closed} ${userType === "owner" && isMobileViewport ? styles.ownerDrawer : ""} ${userType ? roleThemeClasses[userType] || "" : ""
          }`}
        aria-label="Sidebar"
      >
        {isConciergeWorkspace ? (
          <div className={styles.conciergeBrand}>
            <Image src="/icons/logoCompletv2-gold.svg" alt="PlanetLS" width={132} height={42} priority />
            <span>Conciergerie</span>
          </div>
        ) : null}
        <div className={styles.header}>
          <span className={styles.title}>
            {userType ? `Espace ${roleLabels[userType] || userType}` : "Chargement..."}
          </span>
          <button
            type="button"
            onClick={toggleSidebar}
            className={styles.closeBtn}
            aria-label="Fermer la sidebar"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              className={styles.closeIcon}
            >
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
              <line x1="20" y1="4" x2="4" y2="20" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.length === 0 ? (
            <p>Aucun menu disponible</p>
          ) : (
            menuItems.map((item) => (
              <React.Fragment key={item.label}>
              {(userType === "owner" || userType === "concierge") && item.section ? <p className={styles.sectionLabel}>{item.section}</p> : null}
              <SidebarItem
                key={item.label}
                item={item}
                toggleSidebar={userType === "owner" ? () => { if (isMobileViewport) toggleSidebar(); } : toggleSidebar}
                notificationCounts={notificationCounts}
                ownerNavigation={userType === "owner" ? {
                  activePath: ownerActivePath,
                  open: openOwnerGroup === item.label,
                  onToggle: () => setOwnerGroup({ key: navigationKey, label: openOwnerGroup === item.label ? null : item.label }),
                } : undefined}
              />
              </React.Fragment>
            ))
          )}
        </nav>

        {isConciergeWorkspace ? (
          <div className={styles.conciergeSidebarBottom}>
            <div className={styles.conciergeDecoration} aria-hidden="true">
              <span>⌂</span>
            </div>
            <p>Des séjours<br />sereins,<br />des logements<br />préservés</p>
          </div>
        ) : null}

      </aside>
    </>
  );
};

export default Sidebar;
