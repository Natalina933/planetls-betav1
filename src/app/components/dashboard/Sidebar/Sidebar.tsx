"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { FiX } from "react-icons/fi";
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
        <div className={styles.header}>
          {userType === "owner" || isConciergeWorkspace ? (
            <div className={styles.ownerBrand} aria-label="PlanetLS - Espace propriétaire">
              <Image
                src="/logo/Logo%20PlanetLS%20_%20globe%20dor%C3%A9%20et%20%C3%A9l%C3%A9gance%20verte.png"
                alt="PlanetLS"
                width={176}
                height={59}
                className={styles.ownerBrandLogo}
                priority
              />
            </div>
          ) : (
            <span className={styles.title}>
              {userType ? `Espace ${roleLabels[userType] || userType}` : "Chargement..."}
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className={styles.closeBtn}
            aria-label="Fermer la sidebar"
          >
            <FiX className={styles.closeIcon} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.length === 0 ? (
            <p>Aucun menu disponible</p>
          ) : (
            menuItems.map((item) => {
              const isOwnerBottomItem = userType === "owner" && item.section === "En bas";

              return (
                <div
                  key={item.label}
                  className={isOwnerBottomItem ? styles.ownerBottomGroup : undefined}
                >
                  {(userType === "owner" || userType === "concierge") && item.section && !isOwnerBottomItem ? <p className={styles.sectionLabel}>{item.section}</p> : null}
                  <SidebarItem
                    item={item}
                    toggleSidebar={userType === "owner" ? () => { if (isMobileViewport) toggleSidebar(); } : toggleSidebar}
                    notificationCounts={notificationCounts}
                    ownerNavigation={userType === "owner" ? {
                      activePath: ownerActivePath,
                      open: openOwnerGroup === item.label,
                      onToggle: () => setOwnerGroup({ key: navigationKey, label: openOwnerGroup === item.label ? null : item.label }),
                    } : undefined}
                  />
                </div>
              );
            })
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
