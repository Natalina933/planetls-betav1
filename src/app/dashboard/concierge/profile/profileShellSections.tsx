"use client";

import React from "react";
import type { ConciergeTabId } from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import {
  ProfileNotifications as ConciergeNotifications,
  ProfilePageHeader as ConciergePageHeader,
  ProfilePageShell,
  type ProfileShellTab,
} from "@/app/components/dashboard/profile/ProfilePageShell";

type TabIconComponent = React.ComponentType<{ size?: number | string; className?: string }>;

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

export { ConciergeNotifications, ConciergePageHeader };

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
    <ProfilePageShell<ConciergeTabId>
      styles={styles}
      title={title}
      successMsg={successMsg}
      errorMsg={errorMsg}
      tabs={tabs as Array<ProfileShellTab<ConciergeTabId>>}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {activeTabContent}
    </ProfilePageShell>
  );
}
