"use client";

import React from "react";
import WorkspacePageShell from "../../_components/WorkspacePageShell";
import type {
  DashboardWorkspaceAction as ProviderWorkspaceAction,
  DashboardWorkspaceCard as ProviderCard,
  DashboardWorkspaceDetailSection as ProviderDetailSection,
  DashboardWorkspaceMetric as ProviderMetric,
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
  return (
    <WorkspacePageShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      cards={cards}
      metrics={metrics}
      chips={chips}
      actions={actions}
      detailSections={detailSections}
      fallbackTone="provider"
    >
      {children}
    </WorkspacePageShell>
  );
}
