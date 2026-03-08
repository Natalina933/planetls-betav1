"use client";

import React from "react";
import { useUserType } from "@/app/context/UserTypeContext";
import DashboardWorkspace, {
  type DashboardWorkspaceAction as ConciergeWorkspaceAction,
  type DashboardWorkspaceCard as ConciergeCard,
  type DashboardWorkspaceDetailSection as ConciergeDetailSection,
  type DashboardWorkspaceMetric as ConciergeMetric,
} from "../../_components/DashboardWorkspace";

interface ConciergeWorkspacePageProps {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: ConciergeMetric[];
  cards: ConciergeCard[];
  chips?: string[];
  actions?: ConciergeWorkspaceAction[];
  detailSections?: ConciergeDetailSection[];
  children?: React.ReactNode;
}

export default function ConciergeWorkspacePage({
  eyebrow,
  title,
  description,
  metrics,
  cards,
  chips,
  actions,
  detailSections,
  children,
}: ConciergeWorkspacePageProps) {
  const { userType } = useUserType();
  const tone =
    userType === "owner" ? "owner" : userType === "provider" ? "provider" : "concierge";

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
      tone={tone}
    >
      {children}
    </DashboardWorkspace>
  );
}
