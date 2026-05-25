"use client";

import React, { useCallback, useEffect, useState } from "react";
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
}

const roleLabels: Record<string, string> = {
  admin: "global",
  owner: "proprietaire",
  concierge: "concierge",
  provider: "artisan",
};

const roleThemeClasses: Record<string, string> = {
  admin: styles.adminTheme,
  owner: styles.ownerTheme,
  concierge: styles.conciergeTheme,
  provider: styles.providerTheme,
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { userType } = useUserType();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({});
  const [refreshTick, setRefreshTick] = useState(0);

  const menuItems =
    userType && sidebarConfig[userType as keyof typeof sidebarConfig]
      ? sidebarConfig[userType as keyof typeof sidebarConfig]
      : [];

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
    const mobileQuery = window.matchMedia("(max-width: 900px)");
    const syncViewport = () => setIsMobileViewport(mobileQuery.matches);

    syncViewport();
    mobileQuery.addEventListener("change", syncViewport);
    return () => mobileQuery.removeEventListener("change", syncViewport);
  }, []);

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
          className={styles.overlay}
          onClick={toggleSidebar}
          role="button"
          tabIndex={-1}
          aria-label="Fermer la sidebar"
        />
      ) : null}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${
          userType ? roleThemeClasses[userType] || "" : ""
        }`}
        aria-label="Sidebar"
      >
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
              <SidebarItem
                key={item.label}
                item={item}
                toggleSidebar={toggleSidebar}
                notificationCounts={notificationCounts}
              />
            ))
          )}
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;
