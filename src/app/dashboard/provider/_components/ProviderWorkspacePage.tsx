"use client";

import React from "react";
import { useUserType } from "@/app/context/UserTypeContext";
import DashboardWorkspace, {
  type DashboardWorkspaceAction as ProviderWorkspaceAction,
  type DashboardWorkspaceCard as ProviderCard,
  type DashboardWorkspaceDetailSection as ProviderDetailSection,
  type DashboardWorkspaceMetric as ProviderMetric,
} from "../../_components/DashboardWorkspace";

interface ProviderWorkspacePageProps {
  eyebrow: string;
  title: string;
  description: string;
  cards: ProviderCard[];
  metrics?: ProviderMetric[];
  chips?: string[];
  actions?: ProviderWorkspaceAction[];
  detailSections?: ProviderDetailSection[];
  children?: React.ReactNode;
}

export default function ProviderWorkspacePage({
  eyebrow,
  title,
  description,
  cards,
  metrics,
  chips,
  actions,
  detailSections,
  children,
}: ProviderWorkspacePageProps) {
  const { userType } = useUserType();
  const tone =
    userType === "owner" ? "owner" : userType === "concierge" ? "concierge" : "provider";

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
