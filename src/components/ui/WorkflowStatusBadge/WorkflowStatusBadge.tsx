"use client";

import { AlertTriangle, CheckCircle2, Clock3, Dot, Info, Sparkle } from "lucide-react";
import { getWorkflowStatusMeta } from "@/app/lib/workflowStatus";
import styles from "./WorkflowStatusBadge.module.scss";

interface WorkflowStatusBadgeProps {
  value: string | null | undefined;
}

export default function WorkflowStatusBadge({ value }: WorkflowStatusBadgeProps) {
  const meta = getWorkflowStatusMeta(value);

  const icon =
    meta.tone === "danger" ? (
      <AlertTriangle size={14} aria-hidden="true" />
    ) : meta.tone === "success" ? (
      <CheckCircle2 size={14} aria-hidden="true" />
    ) : meta.tone === "warning" ? (
      <Clock3 size={14} aria-hidden="true" />
    ) : meta.tone === "progress" ? (
      <Sparkle size={14} aria-hidden="true" />
    ) : meta.tone === "info" ? (
      <Info size={14} aria-hidden="true" />
    ) : (
      <Dot size={14} aria-hidden="true" />
    );

  return (
    <span className={`${styles.badge} ${styles[meta.tone]}`}>
      {icon}
      <span>{meta.label}</span>
    </span>
  );
}
