"use client";

import { CompletionStatusCard } from "@/components/dashboard";

type CategoryOverviewCompletionProps = {
  title: string;
  description: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingItems: string[];
  actionLabel?: string;
  actionHref?: string;
};

export default function CategoryOverviewCompletion({
  title,
  description,
  percentage,
  completedCount,
  totalCount,
  missingItems,
  actionLabel,
  actionHref,
}: CategoryOverviewCompletionProps) {
  return (
    <CompletionStatusCard
      title={title}
      description={description}
      percentage={percentage}
      completedCount={completedCount}
      totalCount={totalCount}
      missingItems={missingItems}
      actionLabel={actionLabel}
      actionHref={actionHref}
    />
  );
}
