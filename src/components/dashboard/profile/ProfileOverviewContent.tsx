"use client";

import React from "react";
import { CompletionStatusCard, type CompletionStatusCardProps } from "@/components/dashboard";

type ProfileOverviewContentProps = {
  intro: string;
  introClassName: string;
  card: CompletionStatusCardProps;
};

export function ProfileOverviewContent({
  intro,
  introClassName,
  card,
}: ProfileOverviewContentProps) {
  return (
    <>
      <p className={introClassName}>{intro}</p>
      <CompletionStatusCard {...card} />
    </>
  );
}
