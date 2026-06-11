"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./UnifiedSpotlightList.module.scss";

export interface UnifiedSpotlightItem {
  id: string;
  label: string;
  title: string;
  detail: string;
  href?: string;
  meta?: string;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "warning" | "success";
}

interface UnifiedSpotlightListProps {
  items: UnifiedSpotlightItem[];
  emptyLabel?: string;
}

export default function UnifiedSpotlightList({
  items,
  emptyLabel = "Aucune information prioritaire pour le moment.",
}: UnifiedSpotlightListProps) {
  if (items.length === 0) {
    return <div className={styles.emptyState}>{emptyLabel}</div>;
  }

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const className = [styles.card, styles[item.tone ?? "neutral"]].join(" ");

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className={className}>
              <div className={styles.topRow}>
                <span className={styles.label}>{item.label}</span>
                {item.icon ? <span className={styles.iconWrap}>{item.icon}</span> : null}
              </div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              {item.meta ? <small>{item.meta}</small> : null}
            </Link>
          );
        }

        return (
          <article key={item.id} className={className}>
            <div className={styles.topRow}>
              <span className={styles.label}>{item.label}</span>
              {item.icon ? <span className={styles.iconWrap}>{item.icon}</span> : null}
            </div>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
            {item.meta ? <small>{item.meta}</small> : null}
          </article>
        );
      })}
    </div>
  );
}
