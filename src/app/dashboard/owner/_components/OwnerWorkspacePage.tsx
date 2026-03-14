"use client";

import React from "react";
import WorkspacePageShell from "../../_components/WorkspacePageShell";
import type {
  DashboardWorkspaceAction as WorkspaceAction,
  DashboardWorkspaceCard as InfoCard,
  DashboardWorkspaceDetailSection as WorkspaceDetailSection,
  DashboardWorkspaceMetric as WorkspaceMetric,
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
  children?: React.ReactNode;
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
  children,
}: OwnerWorkspacePageProps) {
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
      fallbackTone="owner"
    >
      {children}
    </WorkspacePageShell>
  );
}
