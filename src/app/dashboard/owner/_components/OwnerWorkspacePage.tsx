"use client";

import React from "react";
import { useUserType } from "@/app/context/UserTypeContext";
import DashboardWorkspace, {
  type DashboardWorkspaceAction as WorkspaceAction,
  type DashboardWorkspaceCard as InfoCard,
  type DashboardWorkspaceDetailSection as WorkspaceDetailSection,
  type DashboardWorkspaceMetric as WorkspaceMetric,
} from "../../_components/DashboardWorkspace";

interface OwnerWorkspacePageProps {
  eyebrow: string;
  title: string;
  description: string;
  cards: InfoCard[];
  metrics?: WorkspaceMetric[];
  chips?: string[];
  actions?: WorkspaceAction[];
  detailSections?: WorkspaceDetailSection[];
}

export default function OwnerWorkspacePage({
  eyebrow,
  title,
  description,
  cards,
  metrics,
  chips,
  actions,
  detailSections,
}: OwnerWorkspacePageProps) {
  const { userType } = useUserType();
  const tone =
    userType === "provider" ? "provider" : userType === "concierge" ? "concierge" : "owner";

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
    />
  );
}
