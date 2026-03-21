"use client";

import React from "react";
import { useUserType } from "@/app/context/UserTypeContext";
import DashboardWorkspace, {
  type DashboardWorkspaceAction,
  type DashboardWorkspaceCard,
  type DashboardWorkspaceDetailSection,
  type DashboardWorkspaceMetric,
} from "./DashboardWorkspace";

type WorkspaceTone = "owner" | "concierge" | "provider";

interface WorkspacePageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  cards: DashboardWorkspaceCard[];
  metrics?: DashboardWorkspaceMetric[];
  chips?: string[];
  actions?: DashboardWorkspaceAction[];
  detailSections?: DashboardWorkspaceDetailSection[];
  fallbackTone: WorkspaceTone;
  children?: React.ReactNode;
}

function resolveTone(
  userType: string | null | undefined,
  fallbackTone: WorkspaceTone,
): WorkspaceTone {
  if (userType === "owner" || userType === "concierge" || userType === "provider") {
    return userType;
  }

  return fallbackTone;
}

export default function WorkspacePageShell({
  eyebrow,
  title,
  description,
  cards,
  metrics,
  chips,
  actions,
  detailSections,
  fallbackTone,
  children,
}: WorkspacePageShellProps) {
  const { userType } = useUserType();
  const resolvedTone = resolveTone(userType, fallbackTone);
  const dashboardTone = resolvedTone === "provider" ? "artisan" : resolvedTone;

  return (
    <DashboardWorkspace
      eyebrow={eyebrow}
      title={title}
      description={description}
      cards={cards}
      metrics={metrics}
      chips={chips}
      actions={actions}
      detailSections={detailSections}
      tone={dashboardTone}
    >
      {children}
    </DashboardWorkspace>
  );
}
