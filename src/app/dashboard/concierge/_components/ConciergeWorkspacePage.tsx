"use client";

import React from "react";
import WorkspacePageShell from "../../_components/WorkspacePageShell";
import type {
  DashboardWorkspaceAction as ConciergeWorkspaceAction,
  DashboardWorkspaceCard as ConciergeCard,
  DashboardWorkspaceDetailSection as ConciergeDetailSection,
  DashboardWorkspaceMetric as ConciergeMetric,
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
  showHeroRailLabels?: boolean;
  showMetricsIntro?: boolean;
  showCardsIntro?: boolean;
  showDetailsIntro?: boolean;
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
  showHeroRailLabels,
  showMetricsIntro,
  showCardsIntro,
  showDetailsIntro,
}: ConciergeWorkspacePageProps) {
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
      fallbackTone="concierge"
      showHeroRailLabels={showHeroRailLabels}
      showMetricsIntro={showMetricsIntro}
      showCardsIntro={showCardsIntro}
      showDetailsIntro={showDetailsIntro}
    >
      {children}
    </WorkspacePageShell>
  );
}
