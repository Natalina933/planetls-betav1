"use client";

import type { ReactNode } from "react";
import styles from "./UnifiedStatStack.module.scss";

export interface UnifiedStatItem {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "soft";
}

interface UnifiedStatStackProps {
  items: UnifiedStatItem[];
}

export default function UnifiedStatStack({ items }: UnifiedStatStackProps) {
  return (
    <div className={styles.stack}>
      {items.map((item) => (
        <article key={item.label} className={[styles.row, styles[item.tone ?? "neutral"]].join(" ")}>
          <div className={styles.copy}>
            {item.icon ? <span className={styles.iconWrap}>{item.icon}</span> : null}
            <div>
            <span>{item.label}</span>
            {item.detail ? <p>{item.detail}</p> : null}
            </div>
          </div>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
