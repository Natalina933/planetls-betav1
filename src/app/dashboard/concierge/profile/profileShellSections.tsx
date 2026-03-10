"use client";

import React from "react";
import { FiCheckCircle as FiCheckCircleOutline } from "react-icons/fi";
import { Shield, X as LucideX } from "lucide-react";
import type { ConciergeTabId } from "@/app/components/dashboard/concierge/conciergeTabsConfig";

type TabIconComponent = React.ComponentType<{ size?: number | string; className?: string }>;

interface ConciergePageHeaderProps {
  styles: Record<string, string>;
  title: string;
}

interface ConciergeProfileShellProps {
  styles: Record<string, string>;
  title: string;
  successMsg: string | null;
  errorMsg: string | null;
  tabs: Array<{
    id: ConciergeTabId;
    label: string;
    icon: TabIconComponent;
  }>;
  activeTab: ConciergeTabId;
  activeTabContent: React.ReactNode;
  onTabChange: (tabId: ConciergeTabId) => void;
}

interface ConciergeTabNavigationProps {
  styles: Record<string, string>;
  tabs: Array<{
    id: ConciergeTabId;
    label: string;
    icon: TabIconComponent;
  }>;
  activeTab: ConciergeTabId;
  onTabChange: (tabId: ConciergeTabId) => void;
}

interface ConciergeNotificationsProps {
  styles: Record<string, string>;
  successMsg: string | null;
  errorMsg: string | null;
}

export function ConciergePageHeader({ styles, title }: ConciergePageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderLeft}>
        <div className={styles.logo}>
          <Shield size={22} />
        </div>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
    </header>
  );
}

export function ConciergeNotifications({
  styles,
  successMsg,
  errorMsg,
}: ConciergeNotificationsProps) {
  return (
    <>
      {successMsg ? (
        <div className={`${styles.notification} ${styles.notificationSuccess}`}>
          <FiCheckCircleOutline size={18} />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {errorMsg ? (
        <div className={`${styles.notification} ${styles.notificationError}`}>
          <LucideX size={18} />
          <span>{errorMsg}</span>
        </div>
      ) : null}
    </>
  );
}

export function ConciergeProfileShell({
  styles,
  title,
  successMsg,
  errorMsg,
  tabs,
  activeTab,
  onTabChange,
  activeTabContent,
}: ConciergeProfileShellProps) {
  return (
    <div className={styles.page}>
      <ConciergePageHeader styles={styles} title={title} />

      <main className={styles.main}>
        <ConciergeNotifications
          styles={styles}
          successMsg={successMsg}
          errorMsg={errorMsg}
        />

        <ConciergeTabNavigation
          styles={styles}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        <div className={styles.tabContent}>
          <div key={activeTab} className={styles.tabPane} aria-live="polite">
            {activeTabContent}
          </div>
        </div>
      </main>
    </div>
  );
}

export function ConciergeTabNavigation({
  styles,
  tabs,
  activeTab,
  onTabChange,
}: ConciergeTabNavigationProps) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            style={{ "--tab-index": index } as React.CSSProperties}
          >
            <span className={styles.tabIcon}>
              <Icon />
            </span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
