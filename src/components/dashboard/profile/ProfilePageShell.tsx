"use client";

import React from "react";
import { FiCheckCircle as FiCheckCircleOutline } from "react-icons/fi";
import { X as LucideX } from "lucide-react";

type TabIconComponent = React.ComponentType<{ size?: number | string; className?: string }>;

export interface ProfileShellTab<TTabId extends string> {
  id: TTabId;
  label: string;
  icon: TabIconComponent;
}

interface ProfileNotificationsProps {
  styles: Record<string, string>;
  successMsg: string | null;
  errorMsg: string | null;
}

interface ProfileTabNavigationProps<TTabId extends string> {
  styles: Record<string, string>;
  tabs: Array<ProfileShellTab<TTabId>>;
  activeTab: TTabId;
  onTabChange: (tabId: TTabId) => void;
}

interface ProfilePageShellProps<TTabId extends string> {
  styles: Record<string, string>;
  successMsg: string | null;
  errorMsg: string | null;
  showTabs?: boolean;
  tabs?: Array<ProfileShellTab<TTabId>>;
  activeTab?: TTabId;
  onTabChange?: (tabId: TTabId) => void;
  children: React.ReactNode;
}

export function ProfileNotifications({
  styles,
  successMsg,
  errorMsg,
}: ProfileNotificationsProps) {
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

export function ProfileTabNavigation<TTabId extends string>({
  styles,
  tabs,
  activeTab,
  onTabChange,
}: ProfileTabNavigationProps<TTabId>) {
  return (
    <div className={styles.tabs}>
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
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

export function ProfilePageShell<TTabId extends string>({
  styles,
  successMsg,
  errorMsg,
  showTabs = true,
  tabs,
  activeTab,
  onTabChange,
  children,
}: ProfilePageShellProps<TTabId>) {
  const shouldRenderTabs = Boolean(showTabs && tabs && tabs.length > 0 && activeTab && onTabChange);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ProfileNotifications
          styles={styles}
          successMsg={successMsg}
          errorMsg={errorMsg}
        />

        {shouldRenderTabs ? (
          <ProfileTabNavigation
            styles={styles}
            tabs={tabs as Array<ProfileShellTab<TTabId>>}
            activeTab={activeTab as TTabId}
            onTabChange={onTabChange as (tabId: TTabId) => void}
          />
        ) : null}

        <div className={styles.tabContent}>
          <div key={String(activeTab ?? "profile")} className={styles.tabPane} aria-live="polite">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
