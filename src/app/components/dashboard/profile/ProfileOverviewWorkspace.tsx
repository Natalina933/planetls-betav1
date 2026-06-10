"use client";

import React from "react";
import SimpleOverviewWorkspace from "../../../dashboard/_components/SimpleOverviewWorkspace";

type ProfileOverviewWorkspaceProps = {
  tone: "owner" | "concierge" | "provider";
  eyebrow: string;
  title: string;
  description: string;
  chips?: string[];
  actions?: Array<{
    label: string;
    href: string;
    variant?: "primary" | "secondary";
  }>;
  card: {
    title: string;
    description: string;
    percentage: number;
    completedCount: number;
    totalCount: number;
    missingItems: string[];
    actionLabel?: string;
    actionHref?: string;
  };
};

export function ProfileOverviewWorkspace({
  tone,
  eyebrow,
  title,
  description,
  chips,
  actions,
  card,
}: ProfileOverviewWorkspaceProps) {
  return (
    <SimpleOverviewWorkspace
      tone={tone}
      eyebrow={eyebrow}
      title={title}
      description={description}
      chips={chips}
      actions={actions}
      completion={card}
    />
  );
}
