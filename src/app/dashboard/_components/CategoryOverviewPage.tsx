"use client";

import React from "react";
import WorkspacePageShell from "./WorkspacePageShell";
import type {
  DashboardWorkspaceAction,
  DashboardWorkspaceCard,
  DashboardWorkspaceDetailSection,
  DashboardWorkspaceMetric,
} from "./DashboardWorkspace";

type CategoryOverviewTone = "owner" | "concierge" | "provider";

interface CategoryOverviewPageProps {
  tone: CategoryOverviewTone;
  eyebrow: string;
  title: string;
  description: string;
  cards: DashboardWorkspaceCard[];
  metrics?: DashboardWorkspaceMetric[];
  chips?: string[];
  actions?: DashboardWorkspaceAction[];
  detailSections?: DashboardWorkspaceDetailSection[];
  children?: React.ReactNode;
}

export default function CategoryOverviewPage({
  tone,
  eyebrow,
  title,
  description,
  cards,
  metrics,
  chips,
  actions,
  detailSections,
  children,
}: CategoryOverviewPageProps) {
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
      fallbackTone={tone}
    >
      {children}
    </WorkspacePageShell>
  );
}
